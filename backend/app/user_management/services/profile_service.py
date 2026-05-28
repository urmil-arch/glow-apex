from fastapi import HTTPException, status

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.schemas.auth_schemas import (
    ChangePasswordRequest,
    ProfileResponse,
    UpdateProfileRequest,
)
from app.user_management.utils.password import hash_password, verify_password


class ProfileService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    def get_profile(self, user: dict) -> ProfileResponse:
        """Return a sanitised profile view of the user document."""
        return ProfileResponse(
            id=str(user["_id"]),
            full_name=user["full_name"],
            username=user["username"],
            email=user["email"],
            is_admin=user.get("is_admin", False),
        )

    async def update_profile(self, user: dict, data: UpdateProfileRequest) -> ProfileResponse:
        """
        Update full_name and/or username.
        Raises 409 if the requested username is taken by a different account.
        Returns the definitive stored state after the update.
        """
        updates: dict = {}

        if data.full_name is not None:
            updates["full_name"] = data.full_name

        if data.username is not None:
            existing = await self._repo.find_by_username(data.username)
            if existing and str(existing["_id"]) != str(user["_id"]):
                raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
            updates["username"] = data.username

        if updates:
            await self._repo.update_profile(str(user["_id"]), updates)

        refreshed = await self._repo.find_by_id(str(user["_id"]))
        return ProfileResponse(
            id=str(refreshed["_id"]),
            full_name=refreshed["full_name"],
            username=refreshed["username"],
            email=refreshed["email"],
            is_admin=refreshed.get("is_admin", False),
        )

    async def change_password(self, user: dict, data: ChangePasswordRequest) -> dict:
        """
        Verify the current password then store the new hash.
        Raises 400 if the current password does not match.
        """
        if not verify_password(data.current_password, user["hashed_password"]):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
        await self._repo.update_password(str(user["_id"]), hash_password(data.new_password))
        return {"message": "Password updated successfully"}
