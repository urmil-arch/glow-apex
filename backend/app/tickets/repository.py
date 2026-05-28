from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class TicketRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["tickets"]

    async def create_index(self) -> None:
        await self._col.create_index([("user_id", 1), ("updated_at", -1)])
        await self._col.create_index([("status", 1), ("updated_at", -1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_by_id(self, ticket_id: str) -> dict | None:
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})

    async def find_by_id_and_user(self, ticket_id: str, user_id: str) -> dict | None:
        """Return a ticket only if it belongs to the given user."""
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid, "user_id": user_id})

    async def find_by_user(
        self, user_id: str, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """Return a paginated list of tickets for a user."""
        query = {"user_id": user_id}
        total = await self._col.count_documents(query)
        skip = (page - 1) * page_size
        cursor = self._col.find(query).sort("updated_at", -1).skip(skip).limit(page_size)
        tickets = await cursor.to_list(length=page_size)
        return tickets, total

    async def find_all_admin(
        self,
        page: int = 1,
        page_size: int = 20,
        status_filter: str = "",
        type_filter: str = "",
    ) -> tuple[list[dict], int]:
        """Return paginated tickets for all users. Admin use only."""
        match: dict = {}
        if status_filter:
            match["status"] = status_filter
        if type_filter:
            match["type"] = type_filter

        total = await self._col.count_documents(match)
        skip = (page - 1) * page_size
        cursor = self._col.find(match).sort("updated_at", -1).skip(skip).limit(page_size)
        tickets = await cursor.to_list(length=page_size)
        return tickets, total

    async def append_message(self, ticket_id: str, message: dict) -> None:
        """Push a new message onto the messages array and bump updated_at."""
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return
        await self._col.update_one(
            {"_id": oid},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )

    async def set_user_unread(self, ticket_id: str, value: bool) -> None:
        """Set or clear the user_has_unread flag on a ticket."""
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return
        await self._col.update_one(
            {"_id": oid},
            {"$set": {"user_has_unread": value}},
        )

    async def set_admin_unread(self, ticket_id: str, value: bool) -> None:
        """Set or clear the admin_has_unread flag on a ticket."""
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return
        await self._col.update_one(
            {"_id": oid},
            {"$set": {"admin_has_unread": value}},
        )

    async def update_status(self, ticket_id: str, new_status: str) -> None:
        try:
            oid = ObjectId(ticket_id)
        except Exception:
            return
        await self._col.update_one(
            {"_id": oid},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
        )
