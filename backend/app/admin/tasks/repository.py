from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class TaskRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["admin_tasks"]

    async def create_indexes(self) -> None:
        await self._col.create_index([("status", 1), ("created_at", -1)])
        await self._col.create_index([("type", 1), ("created_at", -1)])
        await self._col.create_index([("seen_by_admin", 1)])
        await self._col.create_index([("order_id", 1), ("type", 1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def exists_for_order(self, order_id: str, task_type: str) -> bool:
        """Return True if a task of this type already exists for the given order."""
        count = await self._col.count_documents({"order_id": order_id, "type": task_type})
        return count > 0

    async def find_all(
        self,
        page: int = 1,
        page_size: int = 50,
        task_type: str = "",
        task_status: str = "",
    ) -> tuple[list[dict], int]:
        match: dict = {}
        if task_type:
            match["type"] = task_type
        if task_status:
            match["status"] = task_status

        total = await self._col.count_documents(match)
        skip = (page - 1) * page_size
        cursor = self._col.find(match).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        return docs, total

    async def find_by_id(self, task_id: str) -> Optional[dict]:
        try:
            oid = ObjectId(task_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})

    async def update(self, task_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(task_id)
        except Exception:
            return
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def mark_all_seen(self) -> None:
        """Mark all unseen tasks as seen. Called when admin loads the tasks list."""
        await self._col.update_many(
            {"seen_by_admin": False},
            {"$set": {"seen_by_admin": True, "updated_at": datetime.now(timezone.utc)}},
        )

    async def unread_count(self) -> int:
        """Count open tasks not yet seen by admin. Used for the nav badge."""
        return await self._col.count_documents(
            {"seen_by_admin": False, "status": {"$ne": "resolved"}}
        )
