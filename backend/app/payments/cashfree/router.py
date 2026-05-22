import logging

from fastapi import APIRouter, HTTPException, Request

from app.payments.cashfree import service as cashfree_service
from app.payments.cashfree.schemas import CashfreeCreateRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create")
async def create_order(body: CashfreeCreateRequest) -> dict:
    """Create a new Cashfree payment order."""
    cd = body.customer_details
    if not all([cd.customer_id, cd.customer_name, cd.customer_email, cd.customer_phone]):
        raise HTTPException(status_code=400, detail="Missing required customer details")

    try:
        return await cashfree_service.create_order(
            order_id=body.order_id,
            order_amount=body.order_amount,
            order_currency=body.order_currency,
            customer_details=cd.model_dump(),
            order_meta=body.order_meta.model_dump() if body.order_meta else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error creating Cashfree order: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/verify")
async def verify_order(orderId: str) -> dict:
    """Verify a Cashfree payment order status."""
    try:
        return await cashfree_service.verify_order(orderId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error verifying Cashfree order: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def cashfree_webhook(request: Request) -> dict:
    """Cashfree payment webhook handler.

    TODO: Verify x-webhook-signature and call /smm/add-order after PAYMENT_SUCCESS.
    """
    try:
        payload = await request.json()
        logger.info("Cashfree webhook received for event: %s", payload.get("type", "unknown"))
        return {"status": "success", "message": "Webhook received"}
    except Exception as exc:
        logger.error("Error processing Cashfree webhook: %s", exc)
        raise HTTPException(status_code=500, detail="Webhook processing failed")
