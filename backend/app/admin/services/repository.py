from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class CategoryRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["service_categories"]

    async def create_index(self) -> None:
        await self._col.create_index("name", unique=True)

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_all(self) -> list[dict]:
        cursor = self._col.find({}).sort("name", 1)
        return await cursor.to_list(length=None)

    async def find_by_id(self, category_id: str) -> dict | None:
        try:
            oid = ObjectId(category_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})

    async def find_by_name(self, name: str) -> dict | None:
        return await self._col.find_one({"name": name})

    async def delete(self, category_id: str) -> bool:
        try:
            oid = ObjectId(category_id)
        except Exception:
            return False
        result = await self._col.delete_one({"_id": oid})
        return result.deleted_count > 0


class ServiceRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["admin_services"]

    async def create_index(self) -> None:
        await self._col.create_index([("provider_id", 1), ("provider_service_id", 1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_all(self) -> list[dict]:
        cursor = self._col.find({}).sort("name", 1)
        return await cursor.to_list(length=None)

    async def find_by_id(self, service_id: str) -> dict | None:
        try:
            oid = ObjectId(service_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})

    async def update(self, service_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(service_id)
        except Exception:
            return
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def find_active_by_category_id(self, category_id: str) -> list[dict]:
        """Return all active services in a category, sorted by provider_service_id ascending.

        Numeric IDs are sorted as integers (1 before 2 before 10).
        Non-numeric IDs fall after all numeric ones, sorted lexicographically.
        """
        cursor = self._col.find({"category_id": category_id, "is_active": True})
        services = await cursor.to_list(length=None)

        def _sort_key(svc: dict) -> tuple:
            pid = svc.get("provider_service_id", "")
            try:
                return (0, int(pid), "")
            except (ValueError, TypeError):
                return (1, 0, str(pid))

        services.sort(key=_sort_key)
        return services

    async def delete(self, service_id: str) -> bool:
        try:
            oid = ObjectId(service_id)
        except Exception:
            return False
        result = await self._col.delete_one({"_id": oid})
        return result.deleted_count > 0
