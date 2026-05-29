from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.schemas.auth_schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ResendOtpRequest,
    UserPublic,
    VerifyOtpRequest,
)
from app.user_management.utils.jwt_utils import create_access_token
from app.user_management.utils.otp import (
    generate_otp,
    hash_otp,
    send_otp_email,
    verify_otp_hash,
)
from app.user_management.utils.password import hash_password, verify_password


class AuthService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def register(self, data: RegisterRequest) -> dict:
        """
        Create a new unverified user and send OTP.
        If the email exists but is unverified, resend OTP.
        Raises 409 if email is already verified or username is taken.
        """
        existing_email = await self._repo.find_by_email(data.email)
        if existing_email:
            if existing_email.get("is_verified"):
                raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
            return await self._issue_new_otp(existing_email["email"], existing_email["full_name"])

        existing_username = await self._repo.find_by_username(data.username)
        if existing_username:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        document = {
            "full_name": data.full_name,
            "username": data.username.lower(),
            "email": data.email.lower(),
            "hashed_password": hash_password(data.password),
            "is_verified": False,
            "is_admin": False,
            "otp": hash_otp(otp),
            "otp_expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        }
        await self._repo.insert(document)
        await send_otp_email(data.email, data.full_name, otp)
        return {"message": "OTP sent to your email. Please verify to activate your account."}

    async def verify_otp(self, data: VerifyOtpRequest) -> AuthResponse:
        """
        Verify the OTP for the given email.
        Marks the account as verified and returns a JWT on success.
        """
        user = await self._repo.find_by_email(data.email)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

        if user.get("is_verified"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Account already verified")

        stored_otp = user.get("otp")
        expires_at: datetime | None = user.get("otp_expires_at")

        if not stored_otp or not expires_at:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No active OTP found. Request a new one.")

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP has expired. Request a new one.")

        if not verify_otp_hash(data.otp, stored_otp):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OTP")

        await self._repo.verify_user(data.email)

        user_id = str(user["_id"])
        token = create_access_token(user_id, user["email"], user["username"])
        return AuthResponse(
            access_token=token,
            user=UserPublic(
                id=user_id,
                full_name=user["full_name"],
                username=user["username"],
                email=user["email"],
                is_admin=user.get("is_admin", False),
            ),
        )

    async def resend_otp(self, data: ResendOtpRequest) -> dict:
        """Issue a fresh OTP for an unverified account."""
        user = await self._repo.find_by_email(data.email)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        if user.get("is_verified"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Account already verified")
        return await self._issue_new_otp(user["email"], user["full_name"])

    async def login(self, data: LoginRequest) -> AuthResponse:
        """
        Authenticate by email-or-username + password.
        Returns JWT on success. Raises 401 for wrong credentials, 403 for unverified accounts.
        """
        user = await self._repo.find_by_identifier(data.identifier)
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

        if not user.get("is_verified"):
            await self._issue_new_otp(user["email"], user["full_name"])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Email not verified.", "email": user["email"]},
            )

        if user.get("is_suspended"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Your account has been suspended.", "reason": "suspended"},
            )

        if not verify_password(data.password, user["hashed_password"]):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

        user_id = str(user["_id"])
        token = create_access_token(user_id, user["email"], user["username"])
        return AuthResponse(
            access_token=token,
            user=UserPublic(
                id=user_id,
                full_name=user["full_name"],
                username=user["username"],
                email=user["email"],
                is_admin=user.get("is_admin", False),
                is_suspended=user.get("is_suspended", False),
            ),
        )

    async def _issue_new_otp(self, email: str, full_name: str) -> dict:
        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        await self._repo.update_otp(email, hash_otp(otp), expires_at)
        await send_otp_email(email, full_name, otp)
        return {"message": "OTP sent to your email."}
