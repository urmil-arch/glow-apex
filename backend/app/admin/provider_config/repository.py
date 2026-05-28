from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase


class RoutingConfigRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["routing_configs"]

    async def find_all(self) -> list[dict]:
        """Return all routing configurations."""
        cursor = self._col.find({})
        return await cursor.to_list(length=None)

    async def find_by_category_id(self, category_id: str) -> dict | None:
        """Return the routing config for a specific category, or None if not configured."""
        return await self._col.find_one({"category_id": category_id})

    async def upsert(
        self,
        category_id: str,
        category_name: str,
        default_service_id: str,
        fallback_service_ids: list[str],
    ) -> None:
        """Create or replace the routing config for a category."""
        await self._col.update_one(
            {"category_id": category_id},
            {
                "$set": {
                    "category_id": category_id,
                    "category_name": category_name,
                    "default_service_id": default_service_id,
                    "fallback_service_ids": fallback_service_ids,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    async def delete(self, category_id: str) -> bool:
        """Remove the routing config for a category. Returns True if a document was deleted."""
        result = await self._col.delete_one({"category_id": category_id})
        return result.deleted_count > 0
