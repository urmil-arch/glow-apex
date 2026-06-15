from fastapi import APIRouter, Request

from app.admin.settings.repository import SettingsRepository
from app.admin.settings.schemas import PlatformSettings

router = APIRouter()

_DEFAULTS = PlatformSettings()


@router.get("", status_code=200)
async def get_public_settings(request: Request) -> dict:
    """Return publicly-safe site settings. No authentication required.

    Exposes only the fields the frontend needs without admin context:
    maintenance mode, which payment gateways are active, and social links.
    """
    raw = await SettingsRepository(request.app.state.db).get()
    return {
        "maintenance_mode": raw.get("maintenance_mode", _DEFAULTS.maintenance_mode),
        "payment_stripe_enabled": raw.get("payment_stripe_enabled", _DEFAULTS.payment_stripe_enabled),
        "payment_razorpay_enabled": raw.get("payment_razorpay_enabled", _DEFAULTS.payment_razorpay_enabled),
        "payment_cryptomus_enabled": raw.get("payment_cryptomus_enabled", _DEFAULTS.payment_cryptomus_enabled),
        "social_twitter": raw.get("social_twitter", ""),
        "social_instagram": raw.get("social_instagram", ""),
        "social_youtube": raw.get("social_youtube", ""),
        "social_facebook": raw.get("social_facebook", ""),
    }
