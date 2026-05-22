from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["users"]

    async def create_indexes(self) -> None:
        """Create unique indexes on email and username."""
        await self._col.create_index("email", unique=True)
        await self._col.create_index("username", unique=True)

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self._col.find_one({"email": email.lower()})

    async def find_by_username(self, username: str) -> Optional[dict]:
        return await self._col.find_one({"username": username.lower()})

    async def find_by_identifier(self, identifier: str) -> Optional[dict]:
        """Find a user by email OR username (case-insensitive)."""
        return await self._col.find_one(
            {"$or": [{"email": identifier.lower()}, {"username": identifier.lower()}]}
        )

    async def find_by_id(self, user_id: str) -> Optional[dict]:
        return await self._col.find_one({"_id": ObjectId(user_id)})

    async def insert(self, document: dict) -> str:
        result = await self._col.insert_one(document)
        return str(result.inserted_id)

    async def update_otp(self, email: str, hashed_otp: str, expires_at: datetime) -> None:
        await self._col.update_one(
            {"email": email.lower()},
            {"$set": {"otp": hashed_otp, "otp_expires_at": expires_at}},
        )

    async def verify_user(self, email: str) -> None:
        """Mark account as verified and clear the OTP."""
        await self._col.update_one(
            {"email": email.lower()},
            {"$set": {"is_verified": True, "otp": None, "otp_expires_at": None}},
        )

    async def update_profile(self, user_id: str, updates: dict) -> None:
        """Apply a partial update to mutable profile fields by user ID."""
        await self._col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates},
        )

    async def update_password(self, user_id: str, hashed_password: str) -> None:
        """Replace the stored password hash for a user."""
        await self._col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"hashed_password": hashed_password}},
        )
