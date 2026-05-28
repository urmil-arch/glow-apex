from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase


class SignInLogRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["sign_in_logs"]

    async def create_index(self) -> None:
        """Index on user_id for fast per-user lookups."""
        await self._col.create_index("user_id")

    async def log(self, user_id: str, ip_address: str, user_agent: str) -> None:
        """Record a successful sign-in event."""
        await self._col.insert_one({
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.now(timezone.utc),
        })

    async def find_by_user_id(self, user_id: str, limit: int = 20) -> list[dict]:
        """Return the most recent sign-in events for a user."""
        cursor = self._col.find(
            {"user_id": user_id},
            sort=[("timestamp", -1)],
        ).limit(limit)
        return await cursor.to_list(length=limit)
