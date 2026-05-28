import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import CategoryRepository, ServiceRepository
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository
from app.orders.schemas import (
    OrderListResponse,
    OrderResponse,
    PlaceOrderByCategoryRequest,
    PlaceOrderRequest,
    RefillResponse,
)
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def _serialize_order(doc: dict) -> OrderResponse:
    """Convert a MongoDB order document to an OrderResponse."""
    return OrderResponse(
        id=str(doc["_id"]),
        service_id=doc["service_id"],
        service_name=doc["service_name"],
        provider_order_id=doc["provider_order_id"],
        link=doc["link"],
        quantity=doc["quantity"],
        charge=doc["charge"],
        status=doc["status"],
        start_count=doc.get("start_count", ""),
        remains=doc.get("remains", ""),
        currency=doc.get("currency", "USD"),
        created_at=doc["created_at"].isoformat() if isinstance(doc["created_at"], datetime) else doc["created_at"],
    )


async def _get_order_and_provider(
    order_id: str,
    user_id: str,
    db,
) -> tuple[dict, dict]:
    """
    Fetch the order (ensuring it belongs to the user) and its provider.
    Raises 404 if the order is not found and 503 if the provider is missing.
    """
    order = await OrderRepository(db).find_by_id(order_id, user_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    provider = await ProviderRepository(db).find_by_id(order["provider_id"])
    if not provider:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Provider not available")

    return order, provider


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    body: PlaceOrderRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> OrderResponse:
    """
    Place an order with the SMM provider and store it in the database.
    Validates quantity against service min/max bounds.
    charge = rate * quantity / 1000
    """
    db = request.app.state.db

    service = await ServiceRepository(db).find_by_id(body.service_id)
    if not service:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service not found")
    if not service.get("is_active", True):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Service is not available")

    min_qty: int = service.get("min", 1)
    max_qty: int = service.get("max", 1_000_000)
    if body.quantity < min_qty or body.quantity > max_qty:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Quantity must be between {min_qty} and {max_qty}",
        )

    category_id = service.get("category_id", "")
    candidates = (
        await ServiceRepository(db).find_active_by_category_id(category_id)
        if category_id
        else [service]
    )

    last_error = "No provider available"
    provider_result: dict | None = None
    fulfilled_provider: dict | None = None

    for candidate in candidates:
        candidate_provider = await ProviderRepository(db).find_by_id(candidate["provider_id"])
        if not candidate_provider:
            continue
        result = await call_provider(
            candidate_provider["url"],
            candidate_provider["api_key"],
            {
                "action": "add",
                "service": candidate["provider_service_id"],
                "link": body.link,
                "quantity": body.quantity,
            },
        )
        if "error" not in result:
            provider_result = result
            fulfilled_provider = candidate_provider
            break
        last_error = result["error"]
        logger.warning(
            "Provider '%s' failed for service '%s': %s",
            candidate_provider.get("name", "unknown"),
            candidate.get("name", "unknown"),
            last_error,
        )

    if provider_result is None or fulfilled_provider is None:
        logger.error("All providers exhausted for service_id=%s. Last error: %s", body.service_id, last_error)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Service is currently unavailable. Please try again later.")

    provider_order_id = str(provider_result.get("order", ""))
    charge = round(service["rate"] * body.quantity / 1000, 6)
    user_id = str(user["_id"])

    doc = {
        "user_id": user_id,
        "service_id": body.service_id,
        "service_name": service.get("name", ""),
        "provider_id": str(fulfilled_provider["_id"]),
        "provider_order_id": provider_order_id,
        "link": body.link,
        "quantity": body.quantity,
        "charge": charge,
        "status": "Pending",
        "start_count": "",
        "remains": "",
        "currency": "USD",
        "created_at": datetime.now(timezone.utc),
    }
    inserted_id = await OrderRepository(db).insert(doc)
    doc["_id"] = inserted_id

    return _serialize_order(doc)


@router.post("/by-category", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order_by_category(
    body: PlaceOrderByCategoryRequest,
    request: Request,
    user: dict = Depends(get_current_user),
) -> OrderResponse:
    """
    Place an order by category name.
    The backend auto-selects the first active service in the category by provider_service_id
    (ascending numeric order) and falls back to subsequent services on failure.
    charge = winning_service.rate * quantity / 1000
    """
    db = request.app.state.db

    category = await CategoryRepository(db).find_by_name(body.category_name)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    routing_config = await RoutingConfigRepository(db).find_by_category_id(str(category["_id"]))

    if routing_config:
        service_ids: list[str] = []
        if routing_config.get("default_service_id"):
            service_ids.append(routing_config["default_service_id"])
        service_ids.extend(routing_config.get("fallback_service_ids", []))

        candidates: list[dict] = []
        for sid in service_ids:
            svc = await ServiceRepository(db).find_by_id(sid)
            if svc and svc.get("is_active", True):
                candidates.append(svc)
    else:
        candidates = await ServiceRepository(db).find_active_by_category_id(str(category["_id"]))

    if not candidates:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "No services available in this category")

    last_error = "No provider available"
    provider_result: dict | None = None
    fulfilled_provider: dict | None = None
    fulfilled_service: dict | None = None

    for candidate in candidates:
        candidate_provider = await ProviderRepository(db).find_by_id(candidate["provider_id"])
        if not candidate_provider:
            continue
        result = await call_provider(
            candidate_provider["url"],
            candidate_provider["api_key"],
            {
                "action": "add",
                "service": candidate["provider_service_id"],
                "link": body.link,
                "quantity": body.quantity,
            },
        )
        if "error" not in result:
            provider_result = result
            fulfilled_provider = candidate_provider
            fulfilled_service = candidate
            break
        last_error = result["error"]
        logger.warning(
            "Provider '%s' failed for service '%s' (category '%s'): %s",
            candidate_provider.get("name", "unknown"),
            candidate.get("name", "unknown"),
            body.category_name,
            last_error,
        )

    if provider_result is None or fulfilled_provider is None or fulfilled_service is None:
        logger.error("All providers exhausted for category='%s'. Last error: %s", body.category_name, last_error)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Service is currently unavailable. Please try again later.")

    provider_order_id = str(provider_result.get("order", ""))
    charge = round(fulfilled_service["rate"] * body.quantity / 1000, 6)
    user_id = str(user["_id"])

    doc = {
        "user_id": user_id,
        "service_id": str(fulfilled_service["_id"]),
        "service_name": fulfilled_service.get("name", ""),
        "provider_id": str(fulfilled_provider["_id"]),
        "provider_order_id": provider_order_id,
        "link": body.link,
        "quantity": body.quantity,
        "charge": charge,
        "status": "Pending",
        "start_count": "",
        "remains": "",
        "currency": "USD",
        "created_at": datetime.now(timezone.utc),
    }
    inserted_id = await OrderRepository(db).insert(doc)
    doc["_id"] = inserted_id

    return _serialize_order(doc)


@router.get("", response_model=OrderListResponse)
async def list_orders(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
) -> OrderListResponse:
    """Return a paginated list of the authenticated user's orders, newest first."""
    db = request.app.state.db
    user_id = str(user["_id"])
    orders, total = await OrderRepository(db).find_by_user_id(user_id, page, page_size)
    return OrderListResponse(
        orders=[_serialize_order(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
) -> OrderResponse:
    """
    Return a single order with a live status fetch from the provider.
    Persists the updated status, start_count, and remains to the database.
    """
    db = request.app.state.db
    user_id = str(user["_id"])
    order, provider = await _get_order_and_provider(order_id, user_id, db)

    try:
        live = await call_provider(
            provider["url"],
            provider["api_key"],
            {"action": "status", "order": order["provider_order_id"]},
        )
        updates = {
            "status": live.get("status", order["status"]),
            "start_count": str(live.get("start_count", order.get("start_count", ""))),
            "remains": str(live.get("remains", order.get("remains", ""))),
        }
        await OrderRepository(db).update(order_id, updates)
        order = {**order, **updates}
    except Exception:
        pass

    return _serialize_order(order)


@router.post("/{order_id}/refill", response_model=RefillResponse)
async def refill_order(
    order_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
) -> RefillResponse:
    """Request a refill for an order from the SMM provider."""
    db = request.app.state.db
    user_id = str(user["_id"])
    order, provider = await _get_order_and_provider(order_id, user_id, db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {"action": "refill", "order": order["provider_order_id"]},
    )

    if "error" in result:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result["error"])

    refill_id = str(result.get("refill", ""))
    return RefillResponse(refill_id=refill_id)


@router.get("/{order_id}/refill-status")
async def refill_status(
    order_id: str,
    refill_id: str = Query(...),
    request: Request = None,
    user: dict = Depends(get_current_user),
) -> dict:
    """Check the status of a previously created refill."""
    db = request.app.state.db
    user_id = str(user["_id"])
    order, provider = await _get_order_and_provider(order_id, user_id, db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {"action": "refill_status", "refill": refill_id},
    )

    if "error" in result:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result["error"])

    return {"refill_id": refill_id, "status": result.get("status", "")}


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
) -> dict:
    """Cancel an order via the SMM provider and mark it as Cancelled in the database."""
    db = request.app.state.db
    user_id = str(user["_id"])
    order, provider = await _get_order_and_provider(order_id, user_id, db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {"action": "cancel", "orders": order["provider_order_id"]},
    )

    if isinstance(result, list) and result and "error" in result[0]:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result[0]["error"])

    await OrderRepository(db).update(order_id, {"status": "Cancelled"})
    return {"message": "Order cancelled successfully"}
