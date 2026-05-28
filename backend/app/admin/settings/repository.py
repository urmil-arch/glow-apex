from motor.motor_asyncio import AsyncIOMotorDatabase

SETTINGS_DOC_KEY = "platform"


class SettingsRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["platform_settings"]

    async def get(self) -> dict:
        """Return the settings document, or an empty dict if not yet created."""
        doc = await self._col.find_one({"_key": SETTINGS_DOC_KEY})
        if doc:
            doc.pop("_id", None)
            doc.pop("_key", None)
        return doc or {}

    async def upsert(self, updates: dict) -> dict:
        """Apply partial updates and return the full updated document."""
        await self._col.update_one(
            {"_key": SETTINGS_DOC_KEY},
            {"$set": updates},
            upsert=True,
        )
        return await self.get()
