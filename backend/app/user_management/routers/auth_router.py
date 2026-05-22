from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.schemas.auth_schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ResendOtpRequest,
    VerifyOtpRequest,
)
from app.user_management.services.auth_service import AuthService

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _get_service(db: AsyncIOMotorDatabase = Depends(_get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/register", status_code=200)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(_get_service),
) -> dict:
    return await service.register(body)


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    body: VerifyOtpRequest,
    service: AuthService = Depends(_get_service),
) -> AuthResponse:
    return await service.verify_otp(body)


@router.post("/resend-otp", status_code=200)
async def resend_otp(
    body: ResendOtpRequest,
    service: AuthService = Depends(_get_service),
) -> dict:
    return await service.resend_otp(body)


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    service: AuthService = Depends(_get_service),
) -> AuthResponse:
    return await service.login(body)
