from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class ContactMessageRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["contact_messages"]

    async def create_index(self) -> None:
        await self._col.create_index([("created_at", -1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_all(
        self,
        page: int = 1,
        page_size: int = 20,
        is_read: str = "",
        type_filter: str = "",
    ) -> tuple[list[dict], int]:
        """Return paginated contact messages. Optionally filter by is_read or type."""
        match: dict = {}
        if is_read == "unread":
            match["is_read"] = False
        elif is_read == "read":
            match["is_read"] = True
        if type_filter:
            match["type"] = type_filter

        total = await self._col.count_documents(match)
        skip = (page - 1) * page_size
        cursor = self._col.find(match).sort("created_at", -1).skip(skip).limit(page_size)
        messages = await cursor.to_list(length=page_size)
        return messages, total

    async def mark_read(self, message_id: str) -> None:
        """Mark a single contact message as read."""
        try:
            oid = ObjectId(message_id)
        except Exception:
            return
        await self._col.update_one({"_id": oid}, {"$set": {"is_read": True}})
