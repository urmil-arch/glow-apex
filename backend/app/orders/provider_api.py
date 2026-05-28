import httpx


async def call_provider(provider_url: str, api_key: str, params: dict) -> dict:
    """
    POST to any SMM provider API and return parsed JSON.
    Works for all providers using the standard panel API format.
    All param values are coerced to strings as required by the API spec.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            provider_url,
            data={"key": api_key, **{k: str(v) for k, v in params.items()}},
        )
        response.raise_for_status()
        return response.json()
