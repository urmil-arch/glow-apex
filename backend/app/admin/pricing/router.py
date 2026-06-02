import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.admin.pricing.repository import PricingRepository
from app.admin.pricing.schemas import ServicePricingRequest, ServicePricingResponse
from app.user_management.utils.dependencies import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(get_current_admin)])

SERVICE_TYPES = [
    "youtube_views",
    "youtube_likes",
    "youtube_subscribers",
    "youtube_comments",
    "youtube_shorts_views",
    "youtube_shorts_likes",
    "country_targeted_subscribers",
]


def _serialize(doc: dict) -> ServicePricingResponse:
    return ServicePricingResponse(
        service_type=doc["service_type"],
        display_name=doc.get("display_name", ""),
        price_per_1000=doc.get("price_per_1000", 0.0),
        value_packages=doc.get("value_packages", []),
        bulk_packages=doc.get("bulk_packages", []),
        is_active=doc.get("is_active", True),
    )


@router.get("", response_model=list[ServicePricingResponse])
async def list_pricing(request: Request) -> list[ServicePricingResponse]:
    """Return pricing config for all service types."""
    db = request.app.state.db
    docs = await PricingRepository(db).find_all()
    return [_serialize(d) for d in docs]


@router.get("/{service_type}", response_model=ServicePricingResponse)
async def get_pricing(service_type: str, request: Request) -> ServicePricingResponse:
    """Return pricing config for a single service type."""
    if service_type not in SERVICE_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown service type: {service_type}")
    db = request.app.state.db
    doc = await PricingRepository(db).find_by_service_type(service_type)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pricing not configured for this service type")
    return _serialize(doc)


@router.put("/{service_type}", response_model=ServicePricingResponse)
async def upsert_pricing(
    service_type: str,
    body: ServicePricingRequest,
    request: Request,
) -> ServicePricingResponse:
    """Create or fully replace pricing config for a service type."""
    if service_type not in SERVICE_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown service type: {service_type}")
    db = request.app.state.db
    data = {
        "service_type": service_type,
        "display_name": body.display_name,
        "price_per_1000": body.price_per_1000,
        "value_packages": [p.model_dump() for p in body.value_packages],
        "bulk_packages": [p.model_dump() for p in body.bulk_packages],
        "is_active": body.is_active,
    }
    doc = await PricingRepository(db).upsert(service_type, data)
    logger.info("Pricing updated for service_type=%s", service_type)
    return _serialize(doc)
