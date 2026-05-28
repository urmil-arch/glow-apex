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
from app.user_management.utils.dependencies import get_current_admin

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


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
    """Convert a routing_configs document to its response shape."""
    default_info = None
    if cfg.get("default_service_id"):
        default_info = await _resolve_service_info(cfg["default_service_id"], db)

    fallbacks: list[RoutingConfigServiceInfo] = []
    for sid in cfg.get("fallback_service_ids", []):
        info = await _resolve_service_info(sid, db)
        if info:
            fallbacks.append(info)

    return RoutingConfigResponse(
        category_id=cfg["category_id"],
        category_name=cfg.get("category_name", ""),
        default=default_info,
        fallbacks=fallbacks,
    )


@router.get("", response_model=list[RoutingConfigResponse])
async def list_routing_configs(
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[RoutingConfigResponse]:
    """Return all configured routing rules."""
    configs = await RoutingConfigRepository(db).find_all()
    return [await _config_to_response(cfg, db) for cfg in configs]


@router.get("/{category_id}", response_model=RoutingConfigResponse)
async def get_routing_config(
    category_id: str,
    _: dict = Depends(get_current_admin),
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
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> RoutingConfigResponse:
    """Create or replace the routing config for a category."""
    category = await CategoryRepository(db).find_by_id(category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    if not await ServiceRepository(db).find_by_id(body.default_service_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Default service not found")

    for sid in body.fallback_service_ids:
        if not await ServiceRepository(db).find_by_id(sid):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Fallback service {sid} not found")

    await RoutingConfigRepository(db).upsert(
        category_id=category_id,
        category_name=category.get("name", ""),
        default_service_id=body.default_service_id,
        fallback_service_ids=body.fallback_service_ids,
    )

    cfg = await RoutingConfigRepository(db).find_by_category_id(category_id)
    return await _config_to_response(cfg, db)


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_routing_config(
    category_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Remove the routing config for a category. Order routing reverts to auto-select by provider_service_id."""
    await RoutingConfigRepository(db).delete(category_id)
    return {"message": "Routing config removed"}
