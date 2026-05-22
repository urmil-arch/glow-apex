import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from app.payments.stripe import service as stripe_service
from app.payments.stripe.schemas import StripeCreateRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create")
async def create_order(body: StripeCreateRequest) -> dict:
    """Create a Stripe Checkout session and return the redirect URL."""
    cd = body.customer_details
    if not all([cd.customer_id, cd.customer_name, cd.customer_email, cd.customer_phone]):
        raise HTTPException(status_code=400, detail="Missing required customer details")

    try:
        return await run_in_threadpool(
            stripe_service.create_checkout_session,
            order_id=body.order_id,
            order_amount=body.order_amount,
            order_currency=body.order_currency,
            customer_details=cd.model_dump(),
            order_description=body.order_description,
            return_url=body.return_url,
            cancel_url=body.cancel_url,
        )
    except Exception as exc:
        logger.error("Error creating Stripe checkout session: %s", exc)
        error_msg = str(exc)
        if "StripeCardError" in type(exc).__name__:
            error_msg = "Card was declined. Please try a different payment method."
        elif "StripeInvalidRequestError" in type(exc).__name__:
            error_msg = "Invalid payment request. Please check your information."
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/verify")
async def verify_order(
    sessionId: Optional[str] = None,
    orderId: Optional[str] = None,
) -> dict:
    """Verify a Stripe checkout session status."""
    if not sessionId and not orderId:
        raise HTTPException(status_code=400, detail="sessionId or orderId is required")

    try:
        return await run_in_threadpool(
            stripe_service.verify_session,
            session_id=sessionId,
            order_id=orderId,
        )
    except Exception as exc:
        logger.error("Error verifying Stripe session: %s", exc)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict:
    """Handle Stripe webhook events.

    TODO: Call /smm/add-order after checkout.session.completed is verified.
    """
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    payload = await request.body()

    try:
        event = await run_in_threadpool(
            stripe_service.construct_webhook_event,
            payload=payload,
            signature=signature,
        )
    except Exception as exc:
        logger.error("Stripe webhook signature verification failed: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid signature")

    logger.info("Stripe webhook event received: %s", event.type)

    if event.type == "checkout.session.completed":
        session = event.data.object
        logger.info(
            "Stripe checkout completed — session: %s, order: %s",
            session.id,
            session.client_reference_id,
        )
    elif event.type == "checkout.session.expired":
        session = event.data.object
        logger.info("Stripe checkout expired — session: %s", session.id)
    elif event.type in ("payment_intent.succeeded", "payment_intent.payment_failed"):
        pi = event.data.object
        logger.info("Stripe payment intent %s — id: %s", event.type, pi.id)
    else:
        logger.info("Unhandled Stripe event type: %s", event.type)

    return {"status": "success", "event_type": event.type}
