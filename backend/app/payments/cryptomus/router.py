import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request

from app.payments.cryptomus import service as cryptomus_service
from app.payments.cryptomus.schemas import CryptomusCreateRequest
from app.payments.cryptomus.utils import map_cryptomus_status, verify_cryptomus_webhook_signature
from app.common.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create")
async def create_order(body: CryptomusCreateRequest) -> dict:
    """Create a Cryptomus payment invoice."""
    cd = body.customer_details
    if not all([cd.customer_id, cd.customer_name, cd.customer_email, cd.customer_phone]):
        raise HTTPException(status_code=400, detail="Missing required customer details")

    try:
        return await cryptomus_service.create_invoice(
            order_id=body.order_id,
            order_amount=body.order_amount,
            order_currency=body.order_currency,
            customer_details=cd.model_dump(),
            order_description=body.order_description,
            return_url=body.return_url,
            crypto_currency=body.crypto_currency,
            network=body.network,
            discount_percent=body.discount_percent,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error creating Cryptomus invoice: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/verify")
async def verify_order(
    orderId: Optional[str] = None,
    invoiceId: Optional[str] = None,
) -> dict:
    """Verify a Cryptomus payment invoice status."""
    if not orderId and not invoiceId:
        raise HTTPException(status_code=400, detail="orderId or invoiceId is required")

    try:
        return await cryptomus_service.verify_invoice(
            order_id=orderId,
            invoice_id=invoiceId,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Error verifying Cryptomus invoice: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def cryptomus_webhook(request: Request) -> dict:
    """Handle Cryptomus payment webhook events.

    TODO: Call /smm/add-order after payment status maps to PAID.
    """
    try:
        payload: dict = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not payload.get("uuid") or not payload.get("order_id") or not payload.get("sign"):
        raise HTTPException(status_code=400, detail="Missing required webhook fields")

    received_sign = payload.pop("sign")
    is_valid = verify_cryptomus_webhook_signature(payload, received_sign, settings.CRYPTOMUS_API_KEY)
    if not is_valid:
        logger.error("Cryptomus webhook signature verification failed for order %s", payload.get("order_id"))
        raise HTTPException(status_code=400, detail="Invalid signature")

    status = map_cryptomus_status(payload.get("payment_status", ""))
    logger.info(
        "Cryptomus webhook — order: %s, raw_status: %s, mapped: %s",
        payload.get("order_id"),
        payload.get("payment_status"),
        status,
    )

    return {"status": "success", "message": "Webhook processed successfully"}
