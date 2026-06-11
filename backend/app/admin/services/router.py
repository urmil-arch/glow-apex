from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.admin.services.schemas import (
    CategoryResponse,
    CreateCategoryRequest,
    CreateServiceRequest,
    ServiceResponse,
    UpdateServiceRequest,
)
from app.common.redis_cache import (
    CACHE_CATEGORIES,
    CACHE_PUBLIC_SERVICES,
    CACHE_SERVICES,
    TTL_CATEGORIES,
    TTL_SERVICES,
    cache_delete,
    cache_get,
    cache_set,
)
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_SERVICES

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis


def _category_to_response(doc: dict) -> CategoryResponse:
    created_at = doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    return CategoryResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        created_at=created_str,
    )


async def _service_to_response(
    doc: dict,
    db: AsyncIOMotorDatabase,
) -> ServiceResponse:
    """Build a ServiceResponse for a single document. Uses individual DB lookups — only for single-doc endpoints."""
    created_at = doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")

    provider = await ProviderRepository(db).find_by_id(doc.get("provider_id", ""))
    provider_name = provider.get("name", "") if provider else ""

    category = await CategoryRepository(db).find_by_id(doc.get("category_id", ""))
    category_name = category.get("name", "") if category else ""

    return ServiceResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        description=doc.get("description", ""),
        service_kind=doc.get("service_kind", "service"),
        subscription_name=doc.get("subscription_name", ""),
        comments_section=doc.get("comments_section", False),
        provider_id=doc.get("provider_id", ""),
        provider_name=provider_name,
        provider_service_id=doc.get("provider_service_id", ""),
        category_id=doc.get("category_id", ""),
        category_name=category_name,
        type=doc.get("type", "Default"),
        mode=doc.get("mode", "Auto"),
        start_count_type=doc.get("start_count_type", "Catch from supplier"),
        drip_feed=doc.get("drip_feed", False),
        price_visible=doc.get("price_visible", True),
        rate=doc.get("rate", 0.0),
        overflow=doc.get("overflow", 0.0),
        downflow=doc.get("downflow", 0.0),
        min=doc.get("min", 0),
        max=doc.get("max", 0),
        provider_rate=doc.get("provider_rate", 0.0),
        provider_min=doc.get("provider_min", 0),
        provider_max=doc.get("provider_max", 0),
        is_active=doc.get("is_active", True),
        admin_note=doc.get("admin_note", ""),
        created_at=created_str,
    )


async def _build_service_responses(
    services: list[dict],
    db: AsyncIOMotorDatabase,
) -> list[ServiceResponse]:
    """Build ServiceResponse list using bulk provider/category lookups — eliminates the N+1 query problem."""
    providers = await ProviderRepository(db).find_all()
    provider_map = {str(p["_id"]): p.get("name", "") for p in providers}

    categories = await CategoryRepository(db).find_all()
    category_map = {str(c["_id"]): c.get("name", "") for c in categories}

    result = []
    for doc in services:
        created_at = doc.get("created_at")
        created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
        result.append(ServiceResponse(
            id=str(doc["_id"]),
            name=doc.get("name", ""),
            description=doc.get("description", ""),
            service_kind=doc.get("service_kind", "service"),
            subscription_name=doc.get("subscription_name", ""),
            comments_section=doc.get("comments_section", False),
            provider_id=doc.get("provider_id", ""),
            provider_name=provider_map.get(doc.get("provider_id", ""), ""),
            provider_service_id=doc.get("provider_service_id", ""),
            category_id=doc.get("category_id", ""),
            category_name=category_map.get(doc.get("category_id", ""), ""),
            type=doc.get("type", "Default"),
            mode=doc.get("mode", "Auto"),
            start_count_type=doc.get("start_count_type", "Catch from supplier"),
            drip_feed=doc.get("drip_feed", False),
            price_visible=doc.get("price_visible", True),
            rate=doc.get("rate", 0.0),
            overflow=doc.get("overflow", 0.0),
            downflow=doc.get("downflow", 0.0),
            min=doc.get("min", 0),
            max=doc.get("max", 0),
            provider_rate=doc.get("provider_rate", 0.0),
            provider_min=doc.get("provider_min", 0),
            provider_max=doc.get("provider_max", 0),
            is_active=doc.get("is_active", True),
            admin_note=doc.get("admin_note", ""),
            created_at=created_str,
        ))
    return result


# --- Categories ---

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[CategoryResponse]:
    """Return all service categories."""
    redis = _get_redis(request)
    cached = await cache_get(redis, CACHE_CATEGORIES)
    if cached is not None:
        return cached

    cats = await CategoryRepository(db).find_all()
    result = [_category_to_response(c) for c in cats]
    await cache_set(redis, CACHE_CATEGORIES, [r.model_dump() for r in result], TTL_CATEGORIES)
    return result


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CreateCategoryRequest,
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> CategoryResponse:
    """Create a new service category."""
    repo = CategoryRepository(db)
    if await repo.find_by_name(body.name):
        raise HTTPException(status.HTTP_409_CONFLICT, "Category name already exists")
    cat_id = await repo.insert({"name": body.name, "created_at": datetime.now(timezone.utc)})
    doc = await repo.find_by_id(cat_id)
    await cache_delete(_get_redis(request), CACHE_CATEGORIES)
    return _category_to_response(doc)


@router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: str,
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Delete a category by ID."""
    deleted = await CategoryRepository(db).delete(category_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    await cache_delete(_get_redis(request), CACHE_CATEGORIES, CACHE_SERVICES, CACHE_PUBLIC_SERVICES)
    return {"message": "Category deleted"}


# --- Services ---

@router.get("", response_model=list[ServiceResponse])
async def list_services(
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[ServiceResponse]:
    """Return all admin-managed services."""
    redis = _get_redis(request)
    cached = await cache_get(redis, CACHE_SERVICES)
    if cached is not None:
        return cached

    services = await ServiceRepository(db).find_all()
    result = await _build_service_responses(services, db)
    await cache_set(redis, CACHE_SERVICES, [r.model_dump() for r in result], TTL_SERVICES)
    return result


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    body: CreateServiceRequest,
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ServiceResponse:
    """Create a new admin-managed service."""
    if not await ProviderRepository(db).find_by_id(body.provider_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")
    if not await CategoryRepository(db).find_by_id(body.category_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    svc_id = await ServiceRepository(db).insert({
        "name": body.name,
        "description": body.description,
        "service_kind": body.service_kind,
        "subscription_name": body.subscription_name,
        "comments_section": body.comments_section,
        "provider_id": body.provider_id,
        "provider_service_id": body.provider_service_id,
        "category_id": body.category_id,
        "type": body.type,
        "mode": body.mode,
        "start_count_type": body.start_count_type,
        "drip_feed": body.drip_feed,
        "price_visible": body.price_visible,
        "rate": body.rate,
        "overflow": body.overflow,
        "downflow": body.downflow,
        "min": body.min,
        "max": body.max,
        "is_active": body.is_active,
        "admin_note": body.admin_note,
        "created_at": datetime.now(timezone.utc),
    })
    doc = await ServiceRepository(db).find_by_id(svc_id)
    await cache_delete(_get_redis(request), CACHE_SERVICES, CACHE_PUBLIC_SERVICES)
    return await _service_to_response(doc, db)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ServiceResponse:
    doc = await ServiceRepository(db).find_by_id(service_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    return await _service_to_response(doc, db)


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    body: UpdateServiceRequest,
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ServiceResponse:
    """Update service fields. Only supplied fields are changed."""
    repo = ServiceRepository(db)
    if not await repo.find_by_id(service_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")

    updates: dict = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.description is not None:
        updates["description"] = body.description
    if body.service_kind is not None:
        updates["service_kind"] = body.service_kind
    if body.subscription_name is not None:
        updates["subscription_name"] = body.subscription_name
    if body.comments_section is not None:
        updates["comments_section"] = body.comments_section
    if body.mode is not None:
        updates["mode"] = body.mode
    if body.start_count_type is not None:
        updates["start_count_type"] = body.start_count_type
    if body.drip_feed is not None:
        updates["drip_feed"] = body.drip_feed
    if body.price_visible is not None:
        updates["price_visible"] = body.price_visible
    if body.overflow is not None:
        updates["overflow"] = body.overflow
    if body.downflow is not None:
        updates["downflow"] = body.downflow
    if body.admin_note is not None:
        updates["admin_note"] = body.admin_note
    if body.provider_id is not None:
        if not await ProviderRepository(db).find_by_id(body.provider_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")
        updates["provider_id"] = body.provider_id
    if body.provider_service_id is not None:
        updates["provider_service_id"] = body.provider_service_id
    if body.category_id is not None:
        if not await CategoryRepository(db).find_by_id(body.category_id):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
        updates["category_id"] = body.category_id
    if body.type is not None:
        updates["type"] = body.type
    if body.rate is not None:
        updates["rate"] = body.rate
    if body.min is not None:
        updates["min"] = body.min
    if body.max is not None:
        updates["max"] = body.max
    if body.is_active is not None:
        updates["is_active"] = body.is_active

    if updates:
        await repo.update(service_id, updates)

    doc = await repo.find_by_id(service_id)
    await cache_delete(_get_redis(request), CACHE_SERVICES, CACHE_PUBLIC_SERVICES)
    return await _service_to_response(doc, db)


@router.delete("/{service_id}", status_code=status.HTTP_200_OK)
async def delete_service(
    service_id: str,
    request: Request,
    _: dict = Depends(require_permission(PERM_SERVICES)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Delete a service by ID."""
    deleted = await ServiceRepository(db).delete(service_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    await cache_delete(_get_redis(request), CACHE_SERVICES, CACHE_PUBLIC_SERVICES)
    return {"message": "Service deleted"}
