from fastapi import APIRouter, Request

from app.admin.pricing.repository import PricingRepository
from app.admin.pricing.schemas import ServicePricingResponse

router = APIRouter()


@router.get("", response_model=list[ServicePricingResponse])
async def get_public_pricing(request: Request) -> list[ServicePricingResponse]:
    """Return all active service pricing configs. Public — no auth required."""
    db = request.app.state.db
    docs = await PricingRepository(db).find_all()
    return [
        ServicePricingResponse(
            service_type=d["service_type"],
            display_name=d.get("display_name", ""),
            price_per_1000=d.get("price_per_1000", 0.0),
            value_packages=d.get("value_packages", []),
            bulk_packages=d.get("bulk_packages", []),
            is_active=d.get("is_active", True),
        )
        for d in docs
        if d.get("is_active", True)
    ]
