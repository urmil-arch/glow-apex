from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.providers.repository import ProviderRepository
from app.admin.providers.schemas import (
    CreateProviderRequest,
    ProviderBalanceResponse,
    ProviderResponse,
    ProviderServiceItem,
    UpdateProviderRequest,
)
from app.user_management.utils.dependencies import get_current_admin

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _provider_to_response(doc: dict) -> ProviderResponse:
    created_at = doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    return ProviderResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        url=doc.get("url", ""),
        api_key=doc.get("api_key", ""),
        created_at=created_str,
    )


@router.get("", response_model=list[ProviderResponse])
async def list_providers(
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[ProviderResponse]:
    """Return all configured providers."""
    providers = await ProviderRepository(db).find_all()
    return [_provider_to_response(p) for p in providers]


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    body: CreateProviderRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ProviderResponse:
    """Add a new SMM provider."""
    repo = ProviderRepository(db)
    if await repo.find_by_name(body.name):
        raise HTTPException(status.HTTP_409_CONFLICT, "Provider name already exists")

    provider_id = await repo.insert({
        "name": body.name,
        "url": body.url,
        "api_key": body.api_key,
        "created_at": datetime.now(timezone.utc),
    })
    doc = await repo.find_by_id(provider_id)
    return _provider_to_response(doc)


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ProviderResponse:
    doc = await ProviderRepository(db).find_by_id(provider_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")
    return _provider_to_response(doc)


@router.patch("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: str,
    body: UpdateProviderRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ProviderResponse:
    """Update provider fields. Only supplied fields are changed."""
    repo = ProviderRepository(db)
    if not await repo.find_by_id(provider_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")

    updates: dict = {}
    if body.name is not None:
        existing = await repo.find_by_name(body.name)
        if existing and str(existing["_id"]) != provider_id:
            raise HTTPException(status.HTTP_409_CONFLICT, "Provider name already exists")
        updates["name"] = body.name
    if body.url is not None:
        updates["url"] = body.url
    if body.api_key is not None:
        updates["api_key"] = body.api_key

    if updates:
        await repo.update(provider_id, updates)

    doc = await repo.find_by_id(provider_id)
    return _provider_to_response(doc)


@router.delete("/{provider_id}", status_code=status.HTTP_200_OK)
async def delete_provider(
    provider_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Delete a provider by ID."""
    deleted = await ProviderRepository(db).delete(provider_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")
    return {"message": "Provider deleted"}


@router.get("/{provider_id}/balance", response_model=ProviderBalanceResponse)
async def get_provider_balance(
    provider_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ProviderBalanceResponse:
    """Proxy a balance check to the provider API."""
    doc = await ProviderRepository(db).find_by_id(provider_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                doc["url"],
                json={"key": doc["api_key"], "action": "balance"},
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Provider request failed: {exc}") from exc

    return ProviderBalanceResponse(
        balance=str(data.get("balance", "0")),
        currency=str(data.get("currency", "USD")),
    )


@router.get("/{provider_id}/services", response_model=list[ProviderServiceItem])
async def get_provider_services(
    provider_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[ProviderServiceItem]:
    """Fetch the live service list from a provider's API."""
    doc = await ProviderRepository(db).find_by_id(provider_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Provider not found")

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                doc["url"],
                json={"key": doc["api_key"], "action": "services"},
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Provider request failed: {exc}") from exc

    if not isinstance(data, list):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Unexpected response format from provider")

    return [
        ProviderServiceItem(
            service=str(item.get("service", "")),
            name=str(item.get("name", "")),
            type=str(item.get("type", "")),
            category=str(item.get("category", "")),
            rate=str(item.get("rate", "0")),
            min=str(item.get("min", "0")),
            max=str(item.get("max", "0")),
            refill=bool(item.get("refill", False)),
            cancel=bool(item.get("cancel", False)),
        )
        for item in data
    ]
