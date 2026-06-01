import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from app.admin.provider_config.repository import RoutingConfigRepository
from app.admin.providers.repository import ProviderRepository
from app.admin.services.repository import ServiceRepository
from app.orders.provider_api import call_provider
from app.orders.repository import OrderRepository
from app.payments.ledger_repository import PaymentLedgerRepository
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
        order_id: str = session.client_reference_id or ""
        logger.info("Stripe checkout completed — session: %s, order: %s", session.id, order_id)

        if not order_id:
            logger.warning("Stripe webhook: no client_reference_id in session %s", session.id)
            return {"status": "success", "event_type": event.type}

        db = request.app.state.db
        repo = OrderRepository(db)
        ledger = PaymentLedgerRepository(db)

        # Atomically claim via the payments collection — only one webhook wins the race
        claimed = await ledger.claim_for_payment(order_id)
        if not claimed:
            logger.info("Stripe webhook: order %s already processed or not found, skipping", order_id)
            return {"status": "success", "event_type": event.type}

        order = await repo.find_by_id_admin(order_id)
        if not order:
            logger.error("Stripe webhook: order %s vanished after claim", order_id)
            return {"status": "success", "event_type": event.type}

        # Reflect payment success on the order document
        await repo.update(order_id, {"payment_status": "paid"})

        # ── Place the SMM order ──────────────────────────────────────────────
        service_id = order.get("service_id", "")
        logger.info("[ORDER %s] Resolving service_id=%s", order_id, service_id)
        service = await ServiceRepository(db).find_by_id(service_id) if service_id else None

        if not service:
            logger.error("[ORDER %s] Service %s not found — cannot place SMM order", order_id, service_id)
            await repo.update(order_id, {"status": "failed"})
            return {"status": "success", "event_type": event.type}

        logger.info("[ORDER %s] Service resolved: '%s' (category_id=%s)", order_id, service.get("name"), service.get("category_id"))

        category_id = service.get("category_id", "")

        # Use the routing config (default + fallbacks in priority order)
        routing_config = await RoutingConfigRepository(db).find_by_category_id(category_id) if category_id else None
        if routing_config:
            service_ids: list[str] = []
            if routing_config.get("default_service_id"):
                service_ids.append(routing_config["default_service_id"])
            service_ids.extend(routing_config.get("fallback_service_ids", []))
            candidates = []
            for sid in service_ids:
                svc = await ServiceRepository(db).find_by_id(sid)
                if svc and svc.get("is_active", True):
                    candidates.append(svc)
            logger.info(
                "[ORDER %s] Routing config found — default: %s, fallbacks: %s",
                order_id,
                routing_config.get("default_service_id"),
                routing_config.get("fallback_service_ids", []),
            )
        else:
            candidates = (
                await ServiceRepository(db).find_active_by_category_id(category_id)
                if category_id
                else [service]
            )
            logger.info("[ORDER %s] No routing config — using all active services in category", order_id)

        logger.info("[ORDER %s] Found %d provider candidate(s) in priority order", order_id, len(candidates))

        placed = False
        for attempt, candidate in enumerate(candidates, start=1):
            label = "DEFAULT" if attempt == 1 else f"FALLBACK #{attempt - 1}"
            provider = await ProviderRepository(db).find_by_id(candidate.get("provider_id", ""))
            if not provider:
                logger.warning("[ORDER %s] [%s] Provider not found for service '%s', skipping", order_id, label, candidate.get("name"))
                continue

            logger.info(
                "[ORDER %s] [%s] Calling provider '%s' — service '%s' (provider_service_id=%s) qty=%s link=%s",
                order_id, label, provider.get("name"), candidate.get("name"),
                candidate.get("provider_service_id"), order["quantity"], order["link"],
            )
            try:
                result = await call_provider(
                    provider["url"],
                    provider["api_key"],
                    {
                        "action": "add",
                        "service": candidate["provider_service_id"],
                        "link": order["link"],
                        "quantity": order["quantity"],
                    },
                )
            except Exception as exc:
                logger.warning("[ORDER %s] [%s] Provider '%s' raised exception: %s", order_id, label, provider.get("name"), exc)
                continue

            if "error" not in result:
                provider_order_id = str(result.get("order", ""))
                smm_status = result.get("status", "Pending")
                await repo.update(order_id, {
                    "provider_id": str(provider["_id"]),
                    "provider_order_id": provider_order_id,
                    "status": smm_status,
                })
                logger.info(
                    "[ORDER %s] [%s] SUCCESS — provider '%s' accepted order. provider_order_id=%s status=%s",
                    order_id, label, provider.get("name"), provider_order_id, smm_status,
                )
                placed = True
                break

            logger.warning(
                "[ORDER %s] [%s] Provider '%s' rejected: %s — %s",
                order_id, label, provider.get("name"), result.get("error"),
                "trying next fallback..." if attempt < len(candidates) else "no more candidates",
            )

        if not placed:
            logger.error("[ORDER %s] All %d provider(s) failed — payment received but SMM order needs manual review", order_id, len(candidates))
            await repo.update(order_id, {"status": "provider_error"})

    elif event.type == "checkout.session.expired":
        session = event.data.object
        order_id = session.client_reference_id or ""
        logger.info("Stripe checkout expired — session: %s, order: %s", session.id, order_id)
        if order_id:
            db = request.app.state.db
            await OrderRepository(db).update(order_id, {"status": "failed"})
            await PaymentLedgerRepository(db).update_by_order_id(order_id, {"status": "failed"})
            logger.info("Stripe webhook: order %s marked failed (session expired)", order_id)

    elif event.type in ("payment_intent.succeeded", "payment_intent.payment_failed"):
        pi = event.data.object
        logger.info("Stripe payment intent %s — id: %s", event.type, pi.id)
    else:
        logger.info("Unhandled Stripe event type: %s", event.type)

    return {"status": "success", "event_type": event.type}
