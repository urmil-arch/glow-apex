import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.provider_config.schemas import (
    RoutingConfigResponse,
    RoutingConfigServiceInfo,
    UpsertRoutingConfigRequest,
)
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.common.redis_cache import (
    CACHE_PUBLIC_SERVICES,
    CACHE_ROUTING,
    TTL_ROUTING,
    cache_delete,
    cache_get,
    cache_set,
)
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_ROUTING

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis


async def _resolve_service_info(
    service_id: str,
    db: AsyncIOMotorDatabase,
) -> RoutingConfigServiceInfo | None:
    """Return display info for a service including provider details. Returns None if not found."""
    svc = await ServiceRepository(db).find_by_id(service_id)
    if not svc:
        return None
    provider = await ProviderRepository(db).find_by_id(svc.get("provider_id", ""))
    return RoutingConfigServiceInfo(
        service_id=service_id,
        service_name=svc.get("name", ""),
        provider_id=svc.get("provider_id", ""),
        provider_name=provider.get("name", "") if provider else "",
        provider_service_id=svc.get("provider_service_id", ""),
        rate=svc.get("rate", 0.0),
        min=svc.get("min", 0),
        max=svc.get("max", 0),
    )


async def _config_to_response(cfg: dict, db: AsyncIOMotorDatabase) -> RoutingConfigResponse:
    """Convert a routing_configs document to its response shape.

    Reads the new value_* / bulk_* fields when present; falls back to the legacy
    default_service_id / fallback_service_ids for documents not yet re-saved.
    """
    # Value config (prefer new field, fall back to legacy)
    value_default_sid = cfg.get("value_default_service_id") or cfg.get("default_service_id", "")
    value_default_info = await _resolve_service_info(value_default_sid, db) if value_default_sid else None

    value_fallback_sids = cfg.get("value_fallback_service_ids") if "value_fallback_service_ids" in cfg else cfg.get("fallback_service_ids", [])
    value_fallbacks: list[RoutingConfigServiceInfo] = []
    for sid in value_fallback_sids:
        info = await _resolve_service_info(sid, db)
        if info:
            value_fallbacks.append(info)

    # Bulk config (new fields only — no legacy fallback)
    bulk_default_sid = cfg.get("bulk_default_service_id", "")
    bulk_default_info = await _resolve_service_info(bulk_default_sid, db) if bulk_default_sid else None

    bulk_fallbacks: list[RoutingConfigServiceInfo] = []
    for sid in cfg.get("bulk_fallback_service_ids", []):
        info = await _resolve_service_info(sid, db)
        if info:
            bulk_fallbacks.append(info)

    return RoutingConfigResponse(
        category_id=cfg["category_id"],
        category_name=cfg.get("category_name", ""),
        value_default=value_default_info,
        value_fallbacks=value_fallbacks,
        bulk_default=bulk_default_info,
        bulk_fallbacks=bulk_fallbacks,
    )


@router.get("", response_model=list[RoutingConfigResponse])
async def list_routing_configs(
    request: Request,
    _: dict = Depends(require_permission(PERM_ROUTING)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[RoutingConfigResponse]:
    """Return all configured routing rules."""
    redis = _get_redis(request)
    cached = await cache_get(redis, CACHE_ROUTING)
    if cached is not None:
        return cached

    configs = await RoutingConfigRepository(db).find_all()
    result = [await _config_to_response(cfg, db) for cfg in configs]
    await cache_set(redis, CACHE_ROUTING, [r.model_dump() for r in result], TTL_ROUTING)
    return result


@router.get("/{category_id}", response_model=RoutingConfigResponse)
async def get_routing_config(
    category_id: str,
    _: dict = Depends(require_permission(PERM_ROUTING)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> RoutingConfigResponse:
    """Return the routing config for one category. Returns an empty config if none is set."""
    category = await CategoryRepository(db).find_by_id(category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    cfg = await RoutingConfigRepository(db).find_by_category_id(category_id)
    if not cfg:
        return RoutingConfigResponse(
            category_id=category_id,
            category_name=category.get("name", ""),
        )

    return await _config_to_response(cfg, db)


@router.put("/{category_id}", response_model=RoutingConfigResponse)
async def upsert_routing_config(
    category_id: str,
    body: UpsertRoutingConfigRequest,
    request: Request,
    _: dict = Depends(require_permission(PERM_ROUTING)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> RoutingConfigResponse:
    """Create or replace the routing config for a category."""
    category = await CategoryRepository(db).find_by_id(category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    if not await ServiceRepository(db).find_by_id(body.value_default_service_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Value default service not found")

    if body.bulk_default_service_id and not await ServiceRepository(db).find_by_id(body.bulk_default_service_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bulk default service not found")

    for sid in body.value_fallback_service_ids:
        if not await ServiceRepository(db).find_by_id(sid):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Value fallback service {sid} not found")

    for sid in body.bulk_fallback_service_ids:
        if not await ServiceRepository(db).find_by_id(sid):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Bulk fallback service {sid} not found")

    await RoutingConfigRepository(db).upsert(
        category_id=category_id,
        category_name=category.get("name", ""),
        value_default_service_id=body.value_default_service_id,
        value_fallback_service_ids=body.value_fallback_service_ids,
        bulk_default_service_id=body.bulk_default_service_id,
        bulk_fallback_service_ids=body.bulk_fallback_service_ids,
    )

    cfg = await RoutingConfigRepository(db).find_by_category_id(category_id)
    await cache_delete(_get_redis(request), CACHE_ROUTING, CACHE_PUBLIC_SERVICES)
    return await _config_to_response(cfg, db)


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_routing_config(
    category_id: str,
    request: Request,
    _: dict = Depends(require_permission(PERM_ROUTING)),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Remove the routing config for a category. Order routing reverts to auto-select by provider_service_id."""
    await RoutingConfigRepository(db).delete(category_id)
    await cache_delete(_get_redis(request), CACHE_ROUTING, CACHE_PUBLIC_SERVICES)
    return {"message": "Routing config removed"}
