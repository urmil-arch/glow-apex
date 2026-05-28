from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.common.crypto import decrypt_value, encrypt_value


class ProviderRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["providers"]

    async def create_index(self) -> None:
        await self._col.create_index("name", unique=True)

    def _decrypt_doc(self, doc: dict) -> dict:
        """Return a copy of the document with the api_key decrypted."""
        if doc and "api_key" in doc:
            doc = {**doc, "api_key": decrypt_value(doc["api_key"])}
        return doc

    async def insert(self, doc: dict) -> str:
        stored = {**doc, "api_key": encrypt_value(doc["api_key"])}
        result = await self._col.insert_one(stored)
        return str(result.inserted_id)

    async def find_all(self) -> list[dict]:
        cursor = self._col.find({}).sort("name", 1)
        docs = await cursor.to_list(length=None)
        return [self._decrypt_doc(d) for d in docs]

    async def find_by_id(self, provider_id: str) -> dict | None:
        try:
            oid = ObjectId(provider_id)
        except Exception:
            return None
        doc = await self._col.find_one({"_id": oid})
        return self._decrypt_doc(doc) if doc else None

    async def find_by_name(self, name: str) -> dict | None:
        doc = await self._col.find_one({"name": name})
        return self._decrypt_doc(doc) if doc else None

    async def update(self, provider_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(provider_id)
        except Exception:
            return
        if "api_key" in updates:
            updates = {**updates, "api_key": encrypt_value(updates["api_key"])}
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def delete(self, provider_id: str) -> bool:
        try:
            oid = ObjectId(provider_id)
        except Exception:
            return False
        result = await self._col.delete_one({"_id": oid})
        return result.deleted_count > 0
