from fastapi import APIRouter, Request

from app.admin.pricing.schemas import PricingPackage, ServicePricingResponse

router = APIRouter()

_DISPLAY_NAMES: dict[str, str] = {
    "youtube_views":        "YouTube Views",
    "youtube_likes":        "YouTube Likes",
    "youtube_subscribers":  "YouTube Subscribers",
    "youtube_comments":     "YouTube Comments",
    "youtube_shorts_views": "YouTube Shorts Views",
    "youtube_shorts_likes": "YouTube Shorts Likes",
}


@router.get("", response_model=list[ServicePricingResponse])
async def get_public_pricing(request: Request) -> list[ServicePricingResponse]:
    """
    Return active quantity packages grouped by service type for buy pages.
    Reads from service_packages (admin-configured). Public — no auth required.
    """
    col = request.app.state.db["service_packages"]
    docs = await col.find({"is_active": True}).sort([
        ("service_type", 1),
        ("package_type", 1),
        ("priority", 1),
    ]).to_list(None)

    grouped: dict[str, dict[str, list[PricingPackage]]] = {}
    for doc in docs:
        stype = doc["service_type"]
        if stype not in grouped:
            grouped[stype] = {"value": [], "bulk": []}
        ptype = doc.get("package_type", "value")
        if ptype not in ("value", "bulk"):
            continue
        grouped[stype][ptype].append(
            PricingPackage(
                quantity=doc["quantity"],
                portal_rate=doc.get("portal_rate", 0.0),
                discount_type=doc.get("discount_type", "none"),
                discount_value=doc.get("discount_value", 0.0),
                is_active=True,
            )
        )

    return [
        ServicePricingResponse(
            service_type=stype,
            display_name=_DISPLAY_NAMES.get(stype, stype),
            price_per_1000=0.0,
            value_packages=pkgs["value"],
            bulk_packages=pkgs["bulk"],
            is_active=True,
        )
        for stype, pkgs in grouped.items()
    ]
