import httpx

from app.common.config import settings

POSTLIKES_API_URL = "https://postlikes.com/api/v2"


async def get_services(api_key: str | None = None) -> dict:
    """Fetch available services from Postlikes SMM panel."""
    key = api_key or settings.POSTLIKES_API_KEY
    if not key:
        raise ValueError("API key is required")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            POSTLIKES_API_URL,
            json={"key": key, "action": "services"},
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        return response.json()


async def add_order(
    service_id: str,
    link: str,
    quantity: int,
    api_key: str | None = None,
) -> dict:
    """Place an order with Postlikes SMM panel.

    The original Next.js implementation sent serviceId as both 'service' and 'link'.
    This implementation correctly passes the YouTube URL as 'link'.
    """
    key = api_key or settings.POSTLIKES_API_KEY
    if not key:
        raise ValueError("API key is required")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            POSTLIKES_API_URL,
            json={
                "key": key,
                "action": "add",
                "service": service_id,
                "link": link,
                "quantity": quantity,
            },
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        return response.json()
