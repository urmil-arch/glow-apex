from typing import Optional

import httpx

from app.common.config import settings


async def create_order(
    order_id: str,
    order_amount: str,
    order_currency: str,
    customer_details: dict,
    order_meta: Optional[dict] = None,
) -> dict:
    """Create a Cashfree payment order."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.CASHFREE_BASE_URL}/orders",
            headers={
                "X-Client-Id": settings.CASHFREE_CLIENT_ID,
                "X-Client-Secret": settings.CASHFREE_CLIENT_SECRET,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "order_id": order_id,
                "order_amount": order_amount,
                "order_currency": order_currency,
                "customer_details": customer_details,
                "order_meta": order_meta,
            },
        )
        data = response.json()
        if not response.is_success:
            raise ValueError(f"Cashfree API error: {data}")
        return data


async def verify_order(order_id: str) -> dict:
    """Retrieve Cashfree order status and return a standardized response."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.CASHFREE_BASE_URL}/orders/{order_id}",
            headers={
                "X-Client-Id": settings.CASHFREE_CLIENT_ID,
                "X-Client-Secret": settings.CASHFREE_CLIENT_SECRET,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        data = response.json()
        if not response.is_success:
            raise ValueError(f"Cashfree verification error: {data}")

        payments = data.get("payments") or []
        payment_method = payments[0].get("payment_method", "Credit Card") if payments else "Credit Card"

        return {
            "order_id": data.get("order_id"),
            "order_status": data.get("order_status"),
            "order_amount": data.get("order_amount"),
            "payment_method": payment_method,
            "transaction_time": data.get("created_at"),
            "cf_order_id": data.get("cf_order_id"),
            "payment_gateway": "cashfree",
            "verification_source": "cashfree_api",
        }
