from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

# Appended to any user aggregation pipeline to compute total_spent from the
# payments collection.  Sums amount where status="paid" and user_id matches.
_TOTAL_SPENT_LOOKUP: list[dict] = [
    {"$addFields": {"_id_str": {"$toString": "$_id"}}},
    {
        "$lookup": {
            "from": "payments",
            "let": {"uid": "$_id_str"},
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": ["$user_id", "$$uid"]},
                                {"$eq": ["$status", "paid"]},
                            ]
                        }
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
            ],
            "as": "_spent",
        }
    },
    {
        "$addFields": {
            "total_spent": {
                "$ifNull": [{"$arrayElemAt": ["$_spent.total", 0]}, 0.0]
            }
        }
    },
    {"$project": {"_id_str": 0, "_spent": 0}},
]


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["users"]

    async def create_indexes(self) -> None:
        """Create unique indexes on email and username."""
        await self._col.create_index("email", unique=True)
        await self._col.create_index("username", unique=True)

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self._col.find_one({"email": email.lower()})

    async def find_by_google_id(self, google_id: str) -> Optional[dict]:
        return await self._col.find_one({"google_id": google_id})

    async def insert_google_user(self, document: dict) -> str:
        result = await self._col.insert_one(document)
        return str(result.inserted_id)

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
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[dict], int]:
        """
        Return a paginated slice of users with total_spent and the total matching count.

        filter_by: all | verified | unverified | suspended
        sort_by: created_at | total_spent
        sort_order: asc | desc

        When sort_by is "total_spent" the spend lookup runs on all matching users
        before pagination so the sort is global across pages, not per-page.
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
        elif filter_by == "staff":
            query["role"] = {"$ne": "user"}

        sort_dir = 1 if sort_order == "asc" else -1
        skip = (page - 1) * page_size

        if sort_by == "total_spent":
            # Compute total_spent for every matching user first, then sort globally,
            # then paginate. More work per request but required for cross-page ordering.
            pipeline: list[dict] = [
                {"$match": query},
                *_TOTAL_SPENT_LOOKUP,
                {"$sort": {"total_spent": sort_dir, "created_at": -1}},
                {
                    "$facet": {
                        "data": [{"$skip": skip}, {"$limit": page_size}],
                        "total": [{"$count": "n"}],
                    }
                },
            ]
        else:
            # Default: sort by created_at; compute total_spent only for the current page.
            pipeline = [
                {"$match": query},
                {"$sort": {"created_at": sort_dir}},
                {
                    "$facet": {
                        "data": [
                            {"$skip": skip},
                            {"$limit": page_size},
                            *_TOTAL_SPENT_LOOKUP,
                        ],
                        "total": [{"$count": "n"}],
                    }
                },
            ]

        result = await self._col.aggregate(pipeline).to_list(length=1)
        if not result:
            return [], 0
        bucket = result[0]
        return bucket["data"], (bucket["total"][0]["n"] if bucket["total"] else 0)

    async def admin_get_stats(self) -> dict:
        """Return user counts for the admin stats cards."""
        total = await self._col.count_documents({})
        verified = await self._col.count_documents(
            {"is_verified": True, "is_suspended": {"$ne": True}}
        )
        suspended = await self._col.count_documents({"is_suspended": True})
        return {"total": total, "verified": verified, "suspended": suspended}

    async def admin_export_users(
        self,
        created_from: Optional[datetime] = None,
        created_to: Optional[datetime] = None,
    ) -> list[dict]:
        """Return all user documents with total_spent for CSV export.

        Optionally filtered to users whose created_at falls within
        [created_from, created_to] (both boundaries inclusive).
        """
        match: dict = {}
        if created_from or created_to:
            date_filter: dict = {}
            if created_from:
                date_filter["$gte"] = created_from
            if created_to:
                date_filter["$lte"] = created_to
            match["created_at"] = date_filter

        pipeline: list[dict] = [
            *([ {"$match": match} ] if match else []),
            {"$sort": {"created_at": -1}},
            *_TOTAL_SPENT_LOOKUP,
        ]
        return await self._col.aggregate(pipeline).to_list(length=None)

    async def admin_suspend_user(self, user_id: str, suspended: bool) -> None:
        """Set or clear the is_suspended flag on a user."""
        await self._col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_suspended": suspended}},
        )

    async def update_role(
        self, user_id: str, role: str, extra_permissions: list[str], is_admin: bool
    ) -> None:
        """Set a user's role, extra page permissions, and synced is_admin flag."""
        await self._col.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "role": role,
                    "extra_permissions": extra_permissions,
                    "is_admin": is_admin,
                }
            },
        )

    async def backfill_roles(self) -> None:
        """One-time backfill: assign a role to any user document missing one.

        Existing admins (is_admin true) become 'admin'; everyone else 'user'.
        Idempotent — only touches documents without a role field.
        """
        await self._col.update_many(
            {"role": {"$exists": False}, "is_admin": True},
            {"$set": {"role": "admin", "extra_permissions": []}},
        )
        await self._col.update_many(
            {"role": {"$exists": False}},
            {"$set": {"role": "user", "extra_permissions": []}},
        )

