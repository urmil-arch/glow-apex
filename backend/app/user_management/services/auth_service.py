import re
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status

from app.common.config import settings
from app.user_management.repositories.user_repository import UserRepository
from app.user_management.schemas.auth_schemas import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    ResendOtpRequest,
    UserPublic,
    VerifyOtpRequest,
)
from app.user_management.utils.jwt_utils import create_access_token
from app.user_management.utils.permissions import ROLE_USER, effective_permissions
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
            await self._issue_new_otp(existing_email["email"], existing_email["full_name"])
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "This email is already registered but not yet verified. A new verification code has been sent to your inbox.",
                    "email": existing_email["email"],
                    "reason": "pending_verification",
                },
            )

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
            "role": ROLE_USER,
            "extra_permissions": [],
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
                personal_discount=float(user.get("personal_discount", 0) or 0),
                role=user.get("role", ROLE_USER),
                permissions=sorted(effective_permissions(user)),
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

    async def google_auth(self, data: GoogleAuthRequest) -> AuthResponse:
        """
        Verify a Google id_token, then create or log in the user.

        First-time: creates a verified account (no OTP needed) with auth_provider="google".
        Returning user: finds by google_id or email and returns a JWT.
        Raises 403 if the email belongs to a manually-registered account.
        """
        token_info = await self._verify_google_token(data.credential)

        google_id: str = token_info["sub"]
        email: str = token_info["email"].lower()
        full_name: str = token_info.get("name") or email.split("@")[0]

        # Fast path: user already linked to this Google account
        user = await self._repo.find_by_google_id(google_id)

        if not user:
            # Check if the email belongs to a manually-registered account
            existing = await self._repo.find_by_email(email)
            if existing and existing.get("auth_provider") != "google":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "message": "An account with this email already exists. Please sign in with your password.",
                        "reason": "password_login_required",
                    },
                )

            if existing:
                # Existing google account found by email (google_id may have changed — rare)
                user = existing
            else:
                # New user — create a verified account
                username = await self._generate_unique_username(email)
                document = {
                    "full_name": full_name,
                    "username": username,
                    "email": email,
                    "hashed_password": None,
                    "auth_provider": "google",
                    "google_id": google_id,
                    "is_verified": True,
                    "is_admin": False,
                    "role": ROLE_USER,
                    "extra_permissions": [],
                    "created_at": datetime.now(timezone.utc),
                }
                inserted_id = await self._repo.insert_google_user(document)
                user = await self._repo.find_by_id(inserted_id)

        if user.get("is_suspended"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Your account has been suspended.", "reason": "suspended"},
            )

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
                personal_discount=float(user.get("personal_discount", 0) or 0),
                role=user.get("role", ROLE_USER),
                permissions=sorted(effective_permissions(user)),
            ),
        )

    async def login(self, data: LoginRequest) -> AuthResponse:
        """
        Authenticate by email-or-username + password.
        Returns JWT on success. Raises 401 for wrong credentials, 403 for unverified or google-only accounts.
        """
        user = await self._repo.find_by_identifier(data.identifier)
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

        # Account registered via Google — has no password
        if user.get("auth_provider") == "google":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": "This account uses Google Sign-In. Please use the 'Sign in with Google' button.",
                    "reason": "google_login_required",
                },
            )

        # Validate password before any other check — wrong password is always rejected
        if not verify_password(data.password, user["hashed_password"]):
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
                personal_discount=float(user.get("personal_discount", 0) or 0),
                role=user.get("role", ROLE_USER),
                permissions=sorted(effective_permissions(user)),
            ),
        )

    async def _issue_new_otp(self, email: str, full_name: str) -> dict:
        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        await self._repo.update_otp(email, hash_otp(otp), expires_at)
        await send_otp_email(email, full_name, otp)
        return {"message": "OTP sent to your email."}

    async def _verify_google_token(self, credential: str) -> dict:
        """Verify a Google id_token via Google's tokeninfo endpoint and return its claims."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
                timeout=10,
            )
        if resp.status_code != 200:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")

        token_info: dict = resp.json()

        if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google token audience mismatch")

        if not token_info.get("email_verified") in (True, "true"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google email is not verified")

        return token_info

    async def _generate_unique_username(self, email: str) -> str:
        """Derive a unique username from the email prefix, appending a counter if needed."""
        base = re.sub(r"[^a-z0-9_]", "_", email.split("@")[0].lower())
        if len(base) < 3:
            base = base.ljust(3, "_")
        candidate = base
        counter = 1
        while await self._repo.find_by_username(candidate):
            candidate = f"{base}{counter}"
            counter += 1
        return candidate
