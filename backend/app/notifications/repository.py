from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class NotificationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["notifications"]

    async def create_indexes(self) -> None:
        await self._col.create_index([("created_at", -1)])
        await self._col.create_index([("target", 1)])
        await self._col.create_index([("user_ids", 1)])
        await self._col.create_index([("read_by", 1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_all_admin(self, page: int, page_size: int) -> tuple[list[dict], int]:
        total = await self._col.count_documents({})
        skip = (page - 1) * page_size
        cursor = self._col.find({}).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        return docs, total

    async def find_for_user(
        self,
        user_id: str,
        user_created_at: datetime,
        page: int,
        page_size: int,
        is_staff: bool = False,
    ) -> tuple[list[dict], int]:
        or_clauses: list[dict] = [
            {"target": "all", "created_at": {"$gte": user_created_at}},
            {"user_ids": user_id},
        ]
        if is_staff:
            or_clauses.append({"target": "staff"})
        match: dict = {"$or": or_clauses}
        total = await self._col.count_documents(match)
        skip = (page - 1) * page_size
        cursor = self._col.find(match).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        return docs, total

    async def unread_count_for_user(
        self, user_id: str, user_created_at: datetime, is_staff: bool = False
    ) -> int:
        or_clauses: list[dict] = [
            {"target": "all", "created_at": {"$gte": user_created_at}},
            {"user_ids": user_id},
        ]
        if is_staff:
            or_clauses.append({"target": "staff"})
        return await self._col.count_documents(
            {"$or": or_clauses, "read_by": {"$ne": user_id}}
        )

    async def mark_read(self, notification_id: str, user_id: str) -> None:
        try:
            oid = ObjectId(notification_id)
        except Exception:
            return
        await self._col.update_one(
            {"_id": oid},
            {"$addToSet": {"read_by": user_id}},
        )

    async def mark_all_read_for_user(
        self, user_id: str, user_created_at: datetime, is_staff: bool = False
    ) -> None:
        or_clauses: list[dict] = [
            {"target": "all", "created_at": {"$gte": user_created_at}},
            {"user_ids": user_id},
        ]
        if is_staff:
            or_clauses.append({"target": "staff"})
        match: dict = {"$or": or_clauses, "read_by": {"$ne": user_id}}
        await self._col.update_many(match, {"$addToSet": {"read_by": user_id}})

    async def delete(self, notification_id: str) -> bool:
        try:
            oid = ObjectId(notification_id)
        except Exception:
            return False
        result = await self._col.delete_one({"_id": oid})
        return result.deleted_count > 0

    async def find_by_id(self, notification_id: str) -> Optional[dict]:
        try:
            oid = ObjectId(notification_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})
