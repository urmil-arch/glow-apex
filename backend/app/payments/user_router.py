import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request

from app.payments.ledger_repository import PaymentLedgerRepository
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

BASE_DISPLAY_ID = 100000


def _serialize(doc: dict, index: int) -> dict:
    """Convert a payments collection document to a dict safe for the API response."""
    created = doc.get("created_at", "")
    return {
        "id": str(doc["_id"]),
        "display_id": BASE_DISPLAY_ID + index + 1,
        "order_id": doc.get("order_id", ""),
        "amount": doc.get("amount", 0.0),
        "currency": doc.get("currency", "USD"),
        "method": doc.get("method", ""),
        "status": doc.get("status", ""),
        "service_name": doc.get("service_name", ""),
        "quantity": doc.get("quantity", 0),
        "memo": doc.get("memo", ""),
        # Joined order fields
        "order_status":      doc.get("order_status", ""),
        "order_link":        doc.get("order_link", ""),
        "order_provider_id": doc.get("order_provider_id", ""),
        "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
    }


@router.get("", status_code=200)
async def list_user_payments(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user),
) -> dict:
    """Return the authenticated user's payment history, newest first."""
    db = request.app.state.db
    user_id = str(user["_id"])
    docs, total = await PaymentLedgerRepository(db).find_by_user_id(user_id, page, page_size)
    offset = (page - 1) * page_size
    return {
        "payments": [_serialize(d, offset + i) for i, d in enumerate(docs)],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
