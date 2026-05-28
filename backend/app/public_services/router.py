from fastapi import APIRouter, Request

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository

router = APIRouter()


@router.get("")
async def list_public_services(request: Request) -> list[dict]:
    """Return all active services with category names and is_default flag resolved. Public endpoint — no auth required."""
    db = request.app.state.db
    services = await ServiceRepository(db).find_all()
    categories = await CategoryRepository(db).find_all()
    cat_map = {str(c["_id"]): c.get("name", "") for c in categories}

    routing_configs = await RoutingConfigRepository(db).find_all()
    # Map service_id -> routing category name (the category the service is configured as default for)
    service_default_for: dict[str, str] = {}
    for cfg in routing_configs:
        if cfg.get("default_service_id"):
            service_default_for[cfg["default_service_id"]] = cfg.get("category_name", "")

    return [
        {
            "id": str(svc["_id"]),
            "name": svc.get("name", ""),
            "description": svc.get("description", ""),
            "service_kind": svc.get("service_kind", "service"),
            "category_id": svc.get("category_id", ""),
            "category_name": cat_map.get(svc.get("category_id", ""), "Uncategorized"),
            "type": svc.get("type", "Default"),
            "rate": svc.get("rate", 0.0),
            "min": svc.get("min", 0),
            "max": svc.get("max", 0),
            "is_default": str(svc["_id"]) in service_default_for,
            "default_for_category": service_default_for.get(str(svc["_id"])),
        }
        for svc in services
        if svc.get("is_active", True)
    ]
