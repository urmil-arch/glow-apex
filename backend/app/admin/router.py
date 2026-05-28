from fastapi import APIRouter, Depends

from app.admin.orders.router import router as orders_router
from app.admin.provider_config.router import router as provider_config_router
from app.admin.providers.router import router as providers_router
from app.admin.services.router import router as services_router
from app.admin.settings.router import router as settings_router
from app.admin.support.router import router as support_router
from app.admin.users.router import router as users_router
from app.user_management.utils.dependencies import get_current_admin

router = APIRouter()

router.include_router(orders_router, prefix="/orders", tags=["Admin Orders"])
router.include_router(users_router, prefix="/users", tags=["Admin Users"])
router.include_router(providers_router, prefix="/providers", tags=["Admin Providers"])
router.include_router(services_router, prefix="/services", tags=["Admin Services"])
router.include_router(settings_router, prefix="/settings", tags=["Admin Settings"])
router.include_router(provider_config_router, prefix="/routing", tags=["Admin Routing Config"])
router.include_router(support_router, prefix="/support", tags=["Admin Support"])


@router.get("/health")
async def admin_health(admin: dict = Depends(get_current_admin)) -> dict:
    """Verify admin access is working."""
    return {"status": "ok", "admin_email": admin["email"]}
