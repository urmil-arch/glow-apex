import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.payments.schemas import (
    CreateManualPaymentRequest,
    PaymentListResponse,
    PaymentResponse,
)
from app.user_management.repositories.user_repository import UserRepository
from app.payments.ledger_repository import PaymentLedgerRepository
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_PAYMENTS

logger = logging.getLogger(__name__)
router = APIRouter()

BASE_DISPLAY_ID = 100000


def _serialize(doc: dict, index: int) -> PaymentResponse:
    """Serialize a payments document to the admin response model."""
    created = doc.get("created_at", "")
    updated = doc.get("updated_at", "")
    return PaymentResponse(
        id=str(doc["_id"]),
        display_id=BASE_DISPLAY_ID + index + 1,
        order_id=doc.get("order_id", ""),
        user_id=doc.get("user_id", ""),
        user_email=doc.get("user_email", ""),
        user_username=doc.get("user_username", ""),
        user_balance=doc.get("user_balance", 0.0),
        amount=doc.get("amount", 0.0),
        currency=doc.get("currency", "USD"),
        method=doc.get("method", ""),
        type=doc.get("type", "credit"),
        status=doc.get("status", ""),
        service_name=doc.get("service_name", ""),
        category_name=doc.get("category_name", ""),
        quantity=doc.get("quantity", 0),
        memo=doc.get("memo", ""),
        order_status=doc.get("order_status", ""),
        order_link=doc.get("order_link", ""),
        order_provider_id=doc.get("order_provider_id", ""),
        created_at=created.isoformat() if isinstance(created, datetime) else str(created),
        updated_at=updated.isoformat() if isinstance(updated, datetime) else str(updated),
    )


@router.get("", response_model=PaymentListResponse)
async def list_payments(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    method_filter: str = Query(""),
    status_filter: str = Query(""),
    search: str = Query(""),
    _admin: dict = Depends(require_permission(PERM_PAYMENTS)),
) -> PaymentListResponse:
    """Return all payment records with optional filtering. Admin only."""
    db = request.app.state.db
    docs, total = await PaymentLedgerRepository(db).find_all_admin(
        page=page,
        page_size=page_size,
        method_filter=method_filter,
        status_filter=status_filter,
        search=search,
    )
    offset = (page - 1) * page_size
    return PaymentListResponse(
        payments=[_serialize(d, offset + i) for i, d in enumerate(docs)],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_manual_payment(
    body: CreateManualPaymentRequest,
    request: Request,
    _admin: dict = Depends(require_permission(PERM_PAYMENTS)),
) -> dict:
    """Manually add a payment record to a user's account. Admin only."""
    db = request.app.state.db

    user = await UserRepository(db).find_by_id(body.user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    now = datetime.now(timezone.utc)
    doc = {
        "order_id": "",
        "user_id": body.user_id,
        "user_email": user.get("email", ""),
        "user_username": user.get("username", ""),
        "user_balance": 0.0,
        "amount": body.amount,
        "currency": "USD",
        "method": "Manual",
        "type": body.type,
        "status": body.status,
        "service_name": "",
        "quantity": 0,
        "memo": body.memo or "",
        "created_at": now,
        "updated_at": now,
    }
    payment_id = await PaymentLedgerRepository(db).insert(doc)
    logger.info("Manual payment %s created for user %s by admin", payment_id, body.user_id)
    return {"id": payment_id, "message": "Payment record created"}


@router.delete("/{payment_id}", status_code=status.HTTP_200_OK)
async def delete_payment(
    payment_id: str,
    request: Request,
    _admin: dict = Depends(require_permission(PERM_PAYMENTS)),
) -> dict:
    """Delete a payment record. Admin only."""
    db = request.app.state.db
    deleted = await PaymentLedgerRepository(db).delete(payment_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")
    logger.info("Payment %s deleted by admin", payment_id)
    return {"message": "Payment deleted"}
