import logging
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.payments.cashfree import service as cashfree_service
from app.payments.cryptomus import service as cryptomus_service
from app.payments.stripe import service as stripe_service
from fastapi.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/verify")
async def unified_verify(
    method: str = "cashfree",
    orderId: Optional[str] = None,
    sessionId: Optional[str] = None,
    invoiceId: Optional[str] = None,
) -> dict:
    """Unified payment verification endpoint — routes to the correct gateway.

    Query parameters:
    - method: cashfree | stripe | cryptomus | payeer
    - orderId: order ID (all gateways)
    - sessionId: Stripe checkout session ID
    - invoiceId: Cryptomus invoice UUID
    """
    gateway = method.lower()

    if gateway == "stripe":
        return await _verify_stripe(session_id=sessionId, order_id=orderId)
    elif gateway == "cryptomus":
        return await _verify_cryptomus(order_id=orderId, invoice_id=invoiceId)
    elif gateway == "payeer":
        return _verify_payeer(order_id=orderId)
    else:
        return await _verify_cashfree(order_id=orderId)


async def _verify_stripe(
    session_id: Optional[str],
    order_id: Optional[str],
) -> dict:
    try:
        result = await run_in_threadpool(
            stripe_service.verify_session,
            session_id=session_id,
            order_id=order_id,
        )
        return {**result, "payment_gateway": "stripe", "verification_source": "stripe_api"}
    except Exception as exc:
        logger.error("Stripe verification error in unified endpoint: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to verify Stripe payment",
                "order_id": order_id or "unknown",
                "order_status": "VERIFICATION_FAILED",
                "payment_gateway": "stripe",
            },
        )


async def _verify_cryptomus(
    order_id: Optional[str],
    invoice_id: Optional[str],
) -> dict:
    try:
        result = await cryptomus_service.verify_invoice(
            order_id=order_id,
            invoice_id=invoice_id,
        )
        return {**result, "payment_gateway": "cryptomus", "verification_source": "cryptomus_api"}
    except Exception as exc:
        logger.error("Cryptomus verification error in unified endpoint: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to verify Cryptomus payment",
                "order_id": order_id or "unknown",
                "order_status": "VERIFICATION_FAILED",
                "payment_gateway": "cryptomus",
            },
        )


def _verify_payeer(order_id: Optional[str]) -> dict:
    return {
        "order_id": order_id or "unknown",
        "order_status": "PENDING",
        "payment_method": "Payeer",
        "payment_gateway": "payeer",
        "verification_source": "payeer_api",
        "message": "Payeer does not provide a real-time status API.",
    }


async def _verify_cashfree(order_id: Optional[str]) -> dict:
    if not order_id:
        raise HTTPException(status_code=400, detail="orderId is required for Cashfree verification")

    try:
        result = await cashfree_service.verify_order(order_id)
        return {**result, "payment_gateway": "cashfree", "verification_source": "cashfree_api"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Cashfree verification error in unified endpoint: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to verify Cashfree payment",
                "order_id": order_id,
                "order_status": "VERIFICATION_FAILED",
                "payment_gateway": "cashfree",
            },
        )
