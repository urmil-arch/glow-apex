import base64
from typing import Optional

from app.common.config import settings
from app.payments.payeer.utils import (
    encrypt_additional_params,
    format_payeer_amount,
    generate_payeer_signature,
)


def create_payment_form(
    order_id: str,
    order_amount: str,
    order_currency: str,
    customer_details: dict,
    order_description: Optional[str] = None,
    return_url: Optional[str] = None,
) -> dict:
    """Build Payeer payment form fields, signature, and redirect URL."""
    m_amount = format_payeer_amount(float(order_amount))
    m_curr = order_currency
    m_desc = base64.b64encode((order_description or "BuyRealViews Order").encode()).decode()

    additional_params = {
        "success_url": return_url or f"{settings.BACKEND_BASE_URL}/checkout/check-status/{order_id}",
        "fail_url": f"{settings.BACKEND_BASE_URL}/checkout?status=failed",
        "status_url": f"{settings.BACKEND_BASE_URL}/payments/payeer/webhook",
        "reference": {
            "customer_id": customer_details.get("customer_id", ""),
            "customer_name": customer_details.get("customer_name", ""),
            "customer_email": customer_details.get("customer_email", ""),
            "customer_phone": customer_details.get("customer_phone", ""),
        },
    }

    m_params = encrypt_additional_params(additional_params, order_id, settings.PAYEER_ENCRYPTION_KEY)

    m_sign = generate_payeer_signature(
        merchant_id=settings.PAYEER_MERCHANT_ID,
        order_id=order_id,
        amount=m_amount,
        currency=m_curr,
        description=m_desc,
        secret_key=settings.PAYEER_SECRET_KEY,
        additional_params=m_params,
    )

    fields = {
        "m_shop": settings.PAYEER_MERCHANT_ID,
        "m_orderid": order_id,
        "m_amount": m_amount,
        "m_curr": m_curr,
        "m_desc": m_desc,
        "m_sign": m_sign,
        "m_params": m_params,
        "m_cipher_method": "AES-256-CBC-IV",
    }

    payment_url = "https://payeer.com/merchant/?" + "&".join(
        f"{k}={v}" for k, v in fields.items()
    )

    return {
        "success": True,
        "payment_form": {
            "action": "https://payeer.com/merchant/",
            "method": "POST",
            "fields": fields,
        },
        "payment_url": payment_url,
        "order_id": order_id,
        "merchant_order_id": order_id,
        "amount": m_amount,
        "currency": m_curr,
        "description": order_description or "BuyRealViews Order",
    }
