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
        value_default_service_id: str,
        value_fallback_service_ids: list[str],
        bulk_default_service_id: str = "",
        bulk_fallback_service_ids: list[str] | None = None,
    ) -> None:
        """Create or replace the routing config for a category.

        Keeps legacy default_service_id / fallback_service_ids in sync with the
        value config so existing order routing code continues working unchanged.
        """
        if bulk_fallback_service_ids is None:
            bulk_fallback_service_ids = []
        await self._col.update_one(
            {"category_id": category_id},
            {
                "$set": {
                    "category_id": category_id,
                    "category_name": category_name,
                    "value_default_service_id": value_default_service_id,
                    "value_fallback_service_ids": value_fallback_service_ids,
                    "bulk_default_service_id": bulk_default_service_id,
                    "bulk_fallback_service_ids": bulk_fallback_service_ids,
                    # Legacy fields kept in sync with value routing
                    "default_service_id": value_default_service_id,
                    "fallback_service_ids": value_fallback_service_ids,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    async def delete(self, category_id: str) -> bool:
        """Remove the routing config for a category. Returns True if a document was deleted."""
        result = await self._col.delete_one({"category_id": category_id})
        return result.deleted_count > 0
