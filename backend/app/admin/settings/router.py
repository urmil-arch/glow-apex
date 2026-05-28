from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.settings.repository import SettingsRepository
from app.admin.settings.schemas import PlatformSettings, UpdateSettingsRequest
from app.user_management.utils.dependencies import get_current_admin

router = APIRouter()

_DEFAULTS = PlatformSettings()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _merge_defaults(raw: dict) -> PlatformSettings:
    """Overlay stored values on top of defaults so missing keys always have a value."""
    return PlatformSettings(
        site_name=raw.get("site_name", _DEFAULTS.site_name),
        support_email=raw.get("support_email", _DEFAULTS.support_email),
        currency=raw.get("currency", _DEFAULTS.currency),
        maintenance_mode=raw.get("maintenance_mode", _DEFAULTS.maintenance_mode),
    )


@router.get("", response_model=PlatformSettings)
async def get_settings(
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> PlatformSettings:
    """Return current platform settings (defaults if never saved)."""
    raw = await SettingsRepository(db).get()
    return _merge_defaults(raw)


@router.patch("", response_model=PlatformSettings)
async def update_settings(
    body: UpdateSettingsRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> PlatformSettings:
    """Partial update — only supplied fields are changed."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raw = await SettingsRepository(db).get()
        return _merge_defaults(raw)
    raw = await SettingsRepository(db).upsert(updates)
    return _merge_defaults(raw)
