from typing import Any, Optional

import httpx

from app.common.config import settings
from app.payments.cryptomus.utils import (
    format_cryptomus_amount,
    generate_cryptomus_signature,
    map_cryptomus_status,
)

CRYPTOMUS_API_BASE = "https://api.cryptomus.com/v1"
DEFAULT_INVOICE_LIFETIME = 3600


async def _make_request(endpoint: str, data: dict[str, Any]) -> dict:
    """Send an authenticated POST request to the Cryptomus API."""
    signature = generate_cryptomus_signature(data, settings.CRYPTOMUS_API_KEY)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CRYPTOMUS_API_BASE}{endpoint}",
            json=data,
            headers={
                "Content-Type": "application/json",
                "merchant": settings.CRYPTOMUS_MERCHANT_ID,
                "sign": signature,
            },
        )
        if not response.is_success:
            raise ValueError(f"Cryptomus API error {response.status_code}: {response.text}")
        return response.json()


async def create_invoice(
    order_id: str,
    order_amount: str,
    order_currency: str,
    customer_details: dict,
    order_description: Optional[str] = None,
    return_url: Optional[str] = None,
    crypto_currency: Optional[str] = None,
    network: Optional[str] = None,
    discount_percent: Optional[int] = None,
) -> dict:
    """Create a Cryptomus payment invoice."""
    request_data: dict[str, Any] = {
        "amount": format_cryptomus_amount(float(order_amount)),
        "currency": order_currency,
        "order_id": order_id,
        "url_callback": f"{settings.BACKEND_BASE_URL}/payments/cryptomus/webhook",
        "url_return": return_url or f"{settings.BACKEND_BASE_URL}/checkout/check-status/{order_id}",
        "url_success": return_url or f"{settings.BACKEND_BASE_URL}/checkout/check-status/{order_id}",
        "lifetime": DEFAULT_INVOICE_LIFETIME,
        "additional_data": f"{customer_details.get('customer_id', '')}:{customer_details.get('customer_email', '')}",
    }

    if crypto_currency:
        request_data["to_currency"] = crypto_currency
    if network:
        request_data["network"] = network
    if discount_percent is not None:
        request_data["discount_percent"] = discount_percent

    response = await _make_request("/payment", request_data)

    if response.get("state") != 0:
        raise ValueError(response.get("message") or "Failed to create Cryptomus invoice")

    result = response.get("result")
    if not result:
        raise ValueError("Invalid response from Cryptomus API")

    return {
        "success": True,
        "payment_url": result["url"],
        "invoice_id": result["uuid"],
        "order_id": result["order_id"],
        "amount": result["amount"],
        "currency": result["currency"],
        "payer_currency": result.get("payer_currency"),
        "payer_amount": result.get("payer_amount"),
        "payment_status": result["payment_status"],
        "address": result.get("address"),
        "network": result.get("network"),
        "expired_at": result["expired_at"],
        "created_at": result["created_at"],
        "description": order_description or "BuyRealViews Order",
    }


async def verify_invoice(
    order_id: Optional[str] = None,
    invoice_id: Optional[str] = None,
) -> dict:
    """Check the status of a Cryptomus payment."""
    if not order_id and not invoice_id:
        raise ValueError("order_id or invoice_id is required")

    request_data: dict[str, Any] = {}
    if invoice_id:
        request_data["uuid"] = invoice_id
    else:
        request_data["order_id"] = order_id

    response = await _make_request("/payment/info", request_data)

    if response.get("state") != 0:
        raise ValueError(response.get("message") or "Failed to get payment status")

    info = response.get("result")
    if not info:
        raise ValueError("Invalid response from Cryptomus API")

    return {
        "order_id": info["order_id"],
        "invoice_id": info["uuid"],
        "order_status": map_cryptomus_status(info["payment_status"]),
        "order_amount": float(info["amount"]),
        "payment_method": "Cryptomus",
        "transaction_time": info.get("updated_at"),
        "cryptomus_uuid": info["uuid"],
        "currency": info["currency"],
        "payer_currency": info.get("payer_currency"),
        "payer_amount": info.get("payer_amount"),
        "network": info.get("network"),
        "address": info.get("address"),
        "txid": info.get("txid"),
        "description": "BuyRealViews Order",
        "payment_status_raw": info["payment_status"],
        "is_final": info.get("is_final"),
        "expired_at": info.get("expired_at"),
        "created_at": info.get("created_at"),
        "updated_at": info.get("updated_at"),
    }
