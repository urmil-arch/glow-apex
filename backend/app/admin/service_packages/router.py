from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.admin.service_packages.repository import ServicePackageRepository
from app.admin.service_packages.schemas import (
    FallbackServiceCreate,
    FallbackServiceOut,
    FallbacksReorderRequest,
    RoutingReorderRequest,
    ServicePackageCreate,
    ServicePackageOut,
    ServicePackageUpdate,
)
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_SERVICES

router = APIRouter(dependencies=[Depends(require_permission(PERM_SERVICES))])


def _repo(request: Request) -> ServicePackageRepository:
    return ServicePackageRepository(request.app.state.db)


def _to_out(doc: dict) -> ServicePackageOut:
    return ServicePackageOut(
        id=doc["id"],
        service_type=doc["service_type"],
        package_type=doc["package_type"],
        quantity=doc["quantity"],
        provider_id=doc["provider_id"],
        provider_service_id=doc["provider_service_id"],
        provider_service_name=doc.get("provider_service_name", ""),
        provider_name=doc.get("provider_name", ""),
        provider_rate=doc.get("provider_rate", 0.0),
        portal_rate=doc.get("portal_rate", 0.0),
        discount_type=doc.get("discount_type", "none"),
        discount_value=doc.get("discount_value", 0.0),
        min=doc.get("min", 0),
        max=doc.get("max", 0),
        priority=doc.get("priority", 1),
        is_active=doc.get("is_active", True),
        admin_note=doc.get("admin_note", ""),
        description=doc.get("description", ""),
        service_label=doc.get("service_label", ""),
        mode=doc.get("mode", "manual"),
        start_count_type=doc.get("start_count_type", "supplier"),
        fallbacks=[FallbackServiceOut(**f) for f in doc.get("fallbacks", [])],
        created_at=doc.get("created_at", ""),
        updated_at=doc.get("updated_at", ""),
    )


# ── List all packages ─────────────────────────────────────────────────────────

@router.get("", response_model=list[ServicePackageOut])
async def list_packages(request: Request) -> list[ServicePackageOut]:
    """Return all service packages sorted by service_type / package_type / priority."""
    docs = await _repo(request).find_all()
    return [_to_out(d) for d in docs]


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=ServicePackageOut, status_code=status.HTTP_201_CREATED)
async def create_package(body: ServicePackageCreate, request: Request) -> ServicePackageOut:
    """Create a new quantity row. Priority is auto-assigned as next in slot."""
    repo = _repo(request)
    priority = await repo.next_priority(body.service_type, body.package_type)
    pkg_id = await repo.insert({
        "service_type":          body.service_type,
        "package_type":          body.package_type,
        "quantity":              body.quantity,
        "provider_id":           body.provider_id,
        "provider_service_id":   body.provider_service_id,
        "provider_service_name": body.provider_service_name,
        "provider_name":         body.provider_name,
        "provider_rate":         body.provider_rate,
        "portal_rate":           body.portal_rate,
        "discount_type":         body.discount_type,
        "discount_value":        body.discount_value,
        "min":                   body.min,
        "max":                   body.max,
        "priority":              priority,
        "is_active":             body.is_active,
        "admin_note":            body.admin_note,
        "description":           body.description,
        "service_label":         body.service_label,
        "mode":                  body.mode,
        "start_count_type":      body.start_count_type,
    })
    doc = await repo.find_by_id(pkg_id)
    return _to_out(doc)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{pkg_id}", response_model=ServicePackageOut)
async def update_package(
    pkg_id: str, body: ServicePackageUpdate, request: Request
) -> ServicePackageOut:
    repo = _repo(request)
    if not await repo.find_by_id(pkg_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await repo.update(pkg_id, updates)
    return _to_out(await repo.find_by_id(pkg_id))


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{pkg_id}", status_code=status.HTTP_200_OK)
async def delete_package(pkg_id: str, request: Request) -> dict:
    deleted = await _repo(request).delete(pkg_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    return {"message": "Deleted"}


# ── Routing reorder (default + fallbacks as one stack) ───────────────────────

@router.put("/{pkg_id}/routing/reorder", response_model=ServicePackageOut)
async def reorder_routing(
    pkg_id: str, body: RoutingReorderRequest, request: Request
) -> ServicePackageOut:
    """
    Atomically replace the full routing stack.

    entries[0] becomes the new default provider service.
    entries[1:] become the new ordered fallbacks list.
    """
    repo = _repo(request)
    doc = await repo.find_by_id(pkg_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    new_default = body.entries[0]
    new_fallbacks = [e.model_dump() for e in body.entries[1:]]

    await repo.update(pkg_id, {
        "provider_id":           new_default.provider_id,
        "provider_service_id":   new_default.provider_service_id,
        "provider_service_name": new_default.provider_service_name,
        "provider_name":         new_default.provider_name,
        "provider_rate":         new_default.provider_rate,
        "min":                   new_default.min,
        "max":                   new_default.max,
        "fallbacks":             new_fallbacks,
    })
    return _to_out(await repo.find_by_id(pkg_id))


# ── Fallbacks ─────────────────────────────────────────────────────────────────

@router.post("/{pkg_id}/fallbacks", response_model=ServicePackageOut, status_code=status.HTTP_201_CREATED)
async def add_fallback(
    pkg_id: str, body: FallbackServiceCreate, request: Request
) -> ServicePackageOut:
    repo = _repo(request)
    doc = await repo.find_by_id(pkg_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    if body.provider_id == doc["provider_id"] and body.provider_service_id == doc["provider_service_id"]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This service is already the default for this package. Each provider–service pair must be unique.",
        )
    for fb in doc.get("fallbacks", []):
        if fb["provider_id"] == body.provider_id and fb["provider_service_id"] == body.provider_service_id:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "This provider–service combination is already a fallback for this package. Each provider–service pair must be unique.",
            )

    await repo.push_fallback(pkg_id, body.model_dump())
    return _to_out(await repo.find_by_id(pkg_id))


@router.put("/{pkg_id}/fallbacks/reorder", response_model=ServicePackageOut)
async def reorder_fallbacks(
    pkg_id: str, body: FallbacksReorderRequest, request: Request
) -> ServicePackageOut:
    """Replace the fallbacks array with the client-provided ordered list (drag-drop result)."""
    repo = _repo(request)
    if not await repo.find_by_id(pkg_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    await repo.set_fallbacks(pkg_id, [f.model_dump() for f in body.fallbacks])
    return _to_out(await repo.find_by_id(pkg_id))


@router.put("/{pkg_id}/fallbacks/{idx}", response_model=ServicePackageOut)
async def update_fallback(
    pkg_id: str, idx: int, body: FallbackServiceCreate, request: Request
) -> ServicePackageOut:
    repo = _repo(request)
    doc = await repo.find_by_id(pkg_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    fallbacks: list = doc.get("fallbacks", [])
    if idx < 0 or idx >= len(fallbacks):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fallback index out of range")
    fallbacks[idx] = body.model_dump()
    await repo.set_fallbacks(pkg_id, fallbacks)
    return _to_out(await repo.find_by_id(pkg_id))


@router.delete("/{pkg_id}/fallbacks/{idx}", response_model=ServicePackageOut)
async def delete_fallback(pkg_id: str, idx: int, request: Request) -> ServicePackageOut:
    repo = _repo(request)
    doc = await repo.find_by_id(pkg_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")
    fallbacks: list = doc.get("fallbacks", [])
    if idx < 0 or idx >= len(fallbacks):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fallback index out of range")
    fallbacks.pop(idx)
    await repo.set_fallbacks(pkg_id, fallbacks)
    return _to_out(await repo.find_by_id(pkg_id))
