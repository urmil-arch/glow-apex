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

    async def admin_list_users(
        self,
        page: int,
        page_size: int,
        search: str = "",
        filter_by: str = "all",
    ) -> tuple[list[dict], int]:
        """
        Return a paginated slice of users and the total matching count.
        filter_by: all | verified | unverified | suspended
        """
        query: dict = {}
        if search:
            query["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]
        if filter_by == "verified":
            query["is_verified"] = True
            query["is_suspended"] = {"$ne": True}
        elif filter_by == "unverified":
            query["is_verified"] = False
        elif filter_by == "suspended":
            query["is_suspended"] = True

        total = await self._col.count_documents(query)
        skip = (page - 1) * page_size
        cursor = self._col.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        users = await cursor.to_list(length=page_size)
        return users, total

    async def admin_get_stats(self) -> dict:
        """Return user counts for the admin stats cards."""
        total = await self._col.count_documents({})
        verified = await self._col.count_documents(
            {"is_verified": True, "is_suspended": {"$ne": True}}
        )
        suspended = await self._col.count_documents({"is_suspended": True})
        return {"total": total, "verified": verified, "suspended": suspended}

    async def admin_export_users(self) -> list[dict]:
        """Return all user documents (no pagination) for CSV export."""
        cursor = self._col.find({}).sort("created_at", -1)
        return await cursor.to_list(length=None)

    async def admin_suspend_user(self, user_id: str, suspended: bool) -> None:
        """Set or clear the is_suspended flag on a user."""
        await self._col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_suspended": suspended}},
        )

