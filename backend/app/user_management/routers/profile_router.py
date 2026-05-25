from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.schemas.auth_schemas import (
    ChangePasswordRequest,
    ProfileResponse,
    UpdateProfileRequest,
)
from app.user_management.services.profile_service import ProfileService
from app.user_management.utils.dependencies import get_current_user

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _get_service(db: AsyncIOMotorDatabase = Depends(_get_db)) -> ProfileService:
    return ProfileService(UserRepository(db))


@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> ProfileResponse:
    return service.get_profile(current_user)


@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> ProfileResponse:
    return await service.update_profile(current_user, body)


@router.post("/change-password", status_code=200)
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    service: ProfileService = Depends(_get_service),
) -> dict:
    return await service.change_password(current_user, body)
