import hashlib
import hmac

import razorpay

from app.common.config import settings

# Razorpay uses INR paise — 1 USD ≈ 83 INR (hardcoded for test only)
# Production should call a live exchange-rate API
USD_TO_INR = 83.0


def _client() -> razorpay.Client:
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def to_paise(usd_amount: float) -> int:
    """Convert a USD amount to INR paise (Razorpay's unit)."""
    inr = usd_amount * USD_TO_INR
    return max(int(round(inr * 100)), 100)  # minimum 100 paise = ₹1


def create_order(amount_usd: float, order_id: str, description: str) -> dict:
    """
    Create a Razorpay order and return the response dict.
    amount_usd   — the charge in USD
    order_id     — our internal order id used as receipt for traceability
    description  — shown on the payment receipt
    """
    client = _client()
    paise = to_paise(amount_usd)
    data = {
        "amount": paise,
        "currency": "INR",
        "receipt": order_id[:40],   # Razorpay receipt max 40 chars
        "notes": {"description": description, "order_id": order_id},
    }
    return client.order.create(data=data)


def verify_signature(razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
    """
    Verify the HMAC-SHA256 signature returned by Razorpay after payment.
    The message is '{order_id}|{payment_id}' signed with the key secret.
    """
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
