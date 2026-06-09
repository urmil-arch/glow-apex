import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.orders.schemas import (
    AdminOrderListResponse,
    AdminOrderResponse,
    ChangeStatusRequest,
    ResendOrderRequest,
    SetCountRequest,
    SetPartialRequest,
    UpdateLinkRequest,
    UpdateServiceRequest,
)
from app.admin.providers.repository import ProviderRepository
from app.admin.tasks.repository import TaskRepository
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_ORDERS

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(require_permission(PERM_ORDERS))])


def _is_error_status(s: str) -> bool:
    """Return True for any provider status that indicates a failed/errored order."""
    s = s.lower()
    return "fail" in s or "error" in s or s == "provider_error"


def _serialize(doc: dict) -> AdminOrderResponse:
    user_info = doc.get("user_info", [])
    user = user_info[0] if user_info else {}
    created = doc.get("created_at", "")
    return AdminOrderResponse(
        id=str(doc["_id"]),
        user_id=doc.get("user_id", ""),
        user_email=user.get("email", ""),
        user_username=user.get("username", ""),
        service_id=doc.get("service_id", ""),
        service_name=doc.get("service_name", ""),
        category_name=doc.get("category_name", ""),
        provider_id=doc.get("provider_id", ""),
        provider_order_id=doc.get("provider_order_id", ""),
        link=doc.get("link", ""),
        quantity=doc.get("quantity", 0),
        charge=doc.get("charge", 0.0),
        status=doc.get("status", ""),
        start_count=doc.get("start_count", ""),
        remains=doc.get("remains", ""),
        currency=doc.get("currency", "USD"),
        payment_method=doc.get("payment_method", "direct"),
        payment_status=doc.get("payment_status", ""),
        created_at=created.isoformat() if isinstance(created, datetime) else str(created),
    )


async def _get_order_or_404(order_id: str, db) -> dict:
    order = await OrderRepository(db).find_by_id_admin(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


async def _get_provider_or_503(provider_id: str, db) -> dict:
    provider = await ProviderRepository(db).find_by_id(provider_id)
    if not provider:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Provider not available")
    return provider


@router.get("", response_model=AdminOrderListResponse)
async def list_orders(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_filter: str = Query("", alias="status"),
    search: str = Query(""),
) -> AdminOrderListResponse:
    """Return paginated orders from all users with joined user info."""
    db = request.app.state.db
    orders, total = await OrderRepository(db).find_all_admin(page, page_size, status_filter, search)
    return AdminOrderListResponse(
        orders=[_serialize(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{order_id}", response_model=AdminOrderResponse)
async def get_order(
    order_id: str,
    request: Request,
) -> AdminOrderResponse:
    """Return a single order with a live status fetch from the provider."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)

    old_status = order.get("status", "")
    try:
        provider = await ProviderRepository(db).find_by_id(order.get("provider_id", ""))
        if provider:
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

            new_status = updates["status"]
            if _is_error_status(new_status) and not _is_error_status(old_status):
                task_repo = TaskRepository(db)
                if not await task_repo.exists_for_order(order_id, "failed_order"):
                    user_info = (order.get("user_info") or [{}])[0]
                    now = datetime.now(timezone.utc)
                    await task_repo.insert({
                        "type": "failed_order",
                        "status": "open",
                        "priority": "high",
                        "title": f"Order error ({new_status}) — {order.get('category_name') or order.get('service_name', 'Unknown')} × {order.get('quantity', 0):,}",
                        "description": f"Order #{order_id[-8:]} status changed to '{new_status}' (was '{old_status}'). Detected during admin status sync.",
                        "notes": "",
                        "order_id": order_id,
                        "user_id": order.get("user_id", ""),
                        "user_email": user_info.get("email", ""),
                        "user_username": user_info.get("username", ""),
                        "order_link": order.get("link", ""),
                        "service_name": order.get("service_name", ""),
                        "category_name": order.get("category_name", ""),
                        "quantity": order.get("quantity"),
                        "charge": order.get("charge"),
                        "currency": order.get("currency", "USD"),
                        "seen_by_admin": False,
                        "resolved_at": None,
                        "created_at": now,
                        "updated_at": now,
                    })
    except Exception as exc:
        logger.warning("Live status fetch failed for order %s: %s", order_id, exc)

    return _serialize(order)


@router.patch("/{order_id}/link", response_model=AdminOrderResponse)
async def update_link(
    order_id: str,
    body: UpdateLinkRequest,
    request: Request,
) -> AdminOrderResponse:
    """Update the link field on an order."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    await OrderRepository(db).update(order_id, {"link": body.link})
    return _serialize({**order, "link": body.link})


@router.patch("/{order_id}/service", response_model=AdminOrderResponse)
async def update_service(
    order_id: str,
    body: UpdateServiceRequest,
    request: Request,
) -> AdminOrderResponse:
    """Update the service_id and service_name on an order (admin correction only, does not re-submit to provider)."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    updates = {"service_id": body.service_id, "service_name": body.service_name}
    await OrderRepository(db).update(order_id, updates)
    return _serialize({**order, **updates})


@router.patch("/{order_id}/start-count", response_model=AdminOrderResponse)
async def set_start_count(
    order_id: str,
    body: SetCountRequest,
    request: Request,
) -> AdminOrderResponse:
    """Manually set the start_count on an order."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    await OrderRepository(db).update(order_id, {"start_count": body.value})
    return _serialize({**order, "start_count": body.value})


@router.patch("/{order_id}/remains", response_model=AdminOrderResponse)
async def set_remains(
    order_id: str,
    body: SetCountRequest,
    request: Request,
) -> AdminOrderResponse:
    """Manually set the remains on an order."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    await OrderRepository(db).update(order_id, {"remains": body.value})
    return _serialize({**order, "remains": body.value})


@router.patch("/{order_id}/partial", response_model=AdminOrderResponse)
async def set_partial(
    order_id: str,
    body: SetPartialRequest,
    request: Request,
) -> AdminOrderResponse:
    """Mark an order as Partial with a specific remains count."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    updates = {"status": "Partial", "remains": body.remains}
    await OrderRepository(db).update(order_id, updates)
    return _serialize({**order, **updates})


@router.patch("/{order_id}/status", response_model=AdminOrderResponse)
async def change_status(
    order_id: str,
    body: ChangeStatusRequest,
    request: Request,
) -> AdminOrderResponse:
    """Override the status field on an order."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    await OrderRepository(db).update(order_id, {"status": body.status})
    return _serialize({**order, "status": body.status})


@router.post("/{order_id}/cancel", response_model=AdminOrderResponse)
async def cancel_order(
    order_id: str,
    request: Request,
) -> AdminOrderResponse:
    """Cancel the order via the provider API and mark it Cancelled in DB."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    provider = await _get_provider_or_503(order.get("provider_id", ""), db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {"action": "cancel", "orders": order["provider_order_id"]},
    )
    if isinstance(result, list) and result and "error" in result[0]:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result[0]["error"])
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result["error"])

    await OrderRepository(db).update(order_id, {"status": "Cancelled"})
    return _serialize({**order, "status": "Cancelled"})


@router.post("/{order_id}/refund", response_model=AdminOrderResponse)
async def refund_order(
    order_id: str,
    request: Request,
) -> AdminOrderResponse:
    """Cancel the order via the provider API and mark it Refunded in DB."""
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    provider = await _get_provider_or_503(order.get("provider_id", ""), db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {"action": "cancel", "orders": order["provider_order_id"]},
    )
    if isinstance(result, list) and result and "error" in result[0]:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result[0]["error"])
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result["error"])

    await OrderRepository(db).update(order_id, {"status": "Refunded"})
    return _serialize({**order, "status": "Refunded"})


@router.post("/{order_id}/resend", response_model=AdminOrderResponse)
async def resend_order(
    order_id: str,
    body: ResendOrderRequest,
    request: Request,
) -> AdminOrderResponse:
    """
    Re-submit an order to a custom provider and service chosen by the admin.
    Uses the existing order's link. Updates provider_id, provider_order_id,
    quantity, and resets status to Pending.
    """
    db = request.app.state.db
    order = await _get_order_or_404(order_id, db)
    provider = await _get_provider_or_503(body.provider_id, db)

    result = await call_provider(
        provider["url"],
        provider["api_key"],
        {
            "action": "add",
            "service": body.provider_service_id,
            "link": order["link"],
            "quantity": body.quantity,
        },
    )

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, result["error"])

    provider_order_id = str(result.get("order", ""))
    updates = {
        "provider_id": body.provider_id,
        "provider_order_id": provider_order_id,
        "quantity": body.quantity,
        "status": "Pending",
        "start_count": "",
        "remains": str(body.quantity),
    }
    await OrderRepository(db).update(order_id, updates)
    logger.info(
        "Admin resent order %s to provider '%s' service '%s' qty=%s — new provider_order_id=%s",
        order_id, provider.get("name"), body.provider_service_id, body.quantity, provider_order_id,
    )
    return _serialize({**order, **updates})
