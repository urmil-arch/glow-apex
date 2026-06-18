import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.providers.repository import ProviderRepository
from app.admin.tasks.repository import TaskRepository
from app.notifications.repository import NotificationRepository
from app.user_management.repositories.user_repository import UserRepository
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository
from app.orders.schemas import (
    OrderListResponse,
    OrderResponse,
    RefillResponse,
)
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def _is_error_status(s: str) -> bool:
    """Return True for any provider status that indicates a failed/errored order."""
    s = s.lower()
    return "fail" in s or "error" in s or s == "provider_error"


def _serialize_order(doc: dict) -> OrderResponse:
    """Convert a MongoDB order document to an OrderResponse."""
    return OrderResponse(
        id=str(doc["_id"]),
        service_id=doc["service_id"],
        service_name=doc["service_name"],
        category_name=doc.get("category_name", ""),
        provider_order_id=doc["provider_order_id"],
        link=doc["link"],
        quantity=doc["quantity"],
        charge=doc["charge"],
        status=doc["status"],
        start_count=doc.get("start_count", ""),
        remains=doc.get("remains", ""),
        currency=doc.get("currency", "USD"),
        payment_method=doc.get("payment_method", "direct"),
        payment_status=doc.get("payment_status", "N/A"),
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

    old_status = order.get("status", "")
    if old_status.lower() in ("cancelled", "canceled", "completed"):
        return _serialize_order(order)

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

        new_status = updates["status"]
        if _is_error_status(new_status) and not _is_error_status(old_status):
            task_repo = TaskRepository(db)
            if not await task_repo.exists_for_order(order_id, "failed_order"):
                now = datetime.now(timezone.utc)
                user_doc = await UserRepository(db).find_by_id(user_id) if user_id else None
                service_label = order.get("category_name") or order.get("service_name", "Unknown")
                quantity = order.get("quantity", 0)
                await task_repo.insert({
                    "type": "failed_order",
                    "status": "open",
                    "priority": "high",
                    "title": f"Order error ({new_status}) — {service_label} × {quantity:,}",
                    "description": f"Order #{order_id[-8:]} status changed to '{new_status}' (was '{old_status}'). Detected during user status sync.",
                    "notes": "",
                    "order_id": order_id,
                    "user_id": user_id,
                    "user_email": user_doc.get("email", "") if user_doc else "",
                    "user_username": user_doc.get("username", "") if user_doc else "",
                    "order_link": order.get("link", ""),
                    "service_name": order.get("service_name", ""),
                    "category_name": order.get("category_name", ""),
                    "quantity": quantity,
                    "charge": order.get("charge"),
                    "currency": order.get("currency", "USD"),
                    "seen_by_admin": False,
                    "resolved_at": None,
                    "created_at": now,
                    "updated_at": now,
                })
                await NotificationRepository(db).insert({
                    "title": "Order Error Detected",
                    "message": (
                        f"Your order for {service_label} × {quantity:,} has encountered an error "
                        f"({new_status}). Our team has been notified and will look into it."
                    ),
                    "type": "error",
                    "target": "selective",
                    "user_ids": [user_id],
                    "read_by": [],
                    "created_by": "system",
                    "created_at": now,
                })
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

    # Auto-create a refund request task so the admin knows to process the refund manually.
    task_repo = TaskRepository(db)
    if not await task_repo.exists_for_order(order_id, "refund_request"):
        service_label = order.get("category_name") or order.get("service_name", "Unknown")
        quantity = order.get("quantity", 0)
        charge = order.get("charge", 0)
        currency = order.get("currency", "USD")
        now = datetime.now(timezone.utc)
        await task_repo.insert({
            "type": "refund_request",
            "status": "open",
            "priority": "medium",
            "title": f"Refund request — {service_label} × {quantity:,}",
            "description": f"Order #{order_id[-8:]} was cancelled by the user and confirmed by the provider. Refund of {currency} {charge:.4f} needs to be processed manually.",
            "notes": "",
            "order_id": order_id,
            "user_id": user_id,
            "user_email": user.get("email", ""),
            "user_username": user.get("username", ""),
            "order_link": order.get("link", ""),
            "service_name": order.get("service_name", ""),
            "category_name": order.get("category_name", ""),
            "quantity": quantity,
            "charge": charge,
            "currency": currency,
            "seen_by_admin": False,
            "resolved_at": None,
            "created_at": now,
            "updated_at": now,
        })
        await NotificationRepository(db).insert({
            "title": "Order Cancelled — Refund Requested",
            "message": (
                f"Your order for {service_label} × {quantity:,} has been cancelled. "
                f"A refund of {currency} {charge:.2f} will be processed by our team."
            ),
            "type": "info",
            "target": "selective",
            "user_ids": [user_id],
            "read_by": [],
            "created_by": "system",
            "created_at": now,
        })

    return {"message": "Order cancelled successfully"}


