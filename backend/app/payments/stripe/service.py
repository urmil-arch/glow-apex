from typing import Optional

import stripe

from app.common.config import settings

ZERO_DECIMAL_CURRENCIES = {
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
    "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
}


def _to_stripe_amount(amount: float, currency: str) -> int:
    """Convert a decimal amount to Stripe's integer unit (cents or equivalent)."""
    if currency.lower() in ZERO_DECIMAL_CURRENCIES:
        return int(amount)
    return int(round(amount * 100))


def _from_stripe_amount(amount_cents: int, currency: str) -> float:
    """Convert Stripe's integer unit back to a decimal amount."""
    if currency.lower() in ZERO_DECIMAL_CURRENCIES:
        return float(amount_cents)
    return amount_cents / 100.0


def _map_stripe_status(status: Optional[str]) -> str:
    """Map Stripe session status to internal standardized status."""
    mapping = {
        "open": "PENDING",
        "complete": "PAID",
        "expired": "FAILED",
    }
    return mapping.get(status or "", "PENDING")


def create_checkout_session(
    order_id: str,
    order_amount: str,
    order_currency: str,
    customer_details: dict,
    order_description: Optional[str] = None,
    return_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> dict:
    """Create a Stripe Checkout session.

    Uses the order_currency from the request — fixes the original bug where
    the session was hardcoded to INR regardless of the user's selected currency.
    """
    stripe.api_key = settings.STRIPE_SECRET_KEY
    amount = float(order_amount)
    currency = order_currency.lower()

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {
                        "name": order_description or "Glow-Apex Order",
                    },
                    "unit_amount": _to_stripe_amount(amount, currency),
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=return_url or f"{settings.BACKEND_BASE_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=cancel_url or f"{settings.BACKEND_BASE_URL}/checkout/cancel?session_id={{CHECKOUT_SESSION_ID}}",
        client_reference_id=order_id,
        customer_email=customer_details.get("customer_email"),
        metadata={"order_id": order_id},
    )

    return {
        "success": True,
        "session_id": session.id,
        "checkout_url": session.url or "",
        "order_id": order_id,
        "amount": amount,
        "currency": order_currency,
        "payment_status": session.status or "open",
        "expires_at": session.expires_at or 0,
        "created_at": session.created,
        "description": order_description or "Glow-Apex Order",
    }


def verify_session(
    session_id: Optional[str] = None,
    order_id: Optional[str] = None,
) -> dict:
    """Retrieve a Stripe checkout session and return standardized status."""
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if not session_id:
        return {
            "order_id": order_id or "unknown",
            "order_status": "PENDING",
            "message": "Session ID is required for verification.",
        }

    session = stripe.checkout.Session.retrieve(session_id)

    amount = _from_stripe_amount(session.amount_total or 0, session.currency or "usd")
    order_status = _map_stripe_status(session.status)

    payment_intent_id = None
    if session.payment_intent and isinstance(session.payment_intent, str):
        payment_intent_id = session.payment_intent

    receipt_url = None
    if session.status == "complete":
        receipt_url = f"https://pay.stripe.com/receipts/{session.id}"

    return {
        "order_id": session.client_reference_id or order_id or "unknown",
        "session_id": session.id,
        "order_status": order_status,
        "order_amount": amount,
        "payment_method": "Stripe",
        "transaction_time": str(session.created),
        "stripe_session_id": session.id,
        "currency": (session.currency or "usd").upper(),
        "payment_intent_id": payment_intent_id,
        "checkout_url": session.url,
        "receipt_url": receipt_url,
        "description": "Glow-Apex Order",
        "expires_at": session.expires_at,
        "created_at": session.created,
        "payment_status_raw": session.status,
        "customer_email": session.customer_email,
    }


def construct_webhook_event(payload: bytes, signature: str) -> stripe.Event:
    """Verify Stripe webhook signature and return the parsed event."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
