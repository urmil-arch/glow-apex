from motor.motor_asyncio import AsyncIOMotorDatabase


class PricingRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["service_pricing"]

    async def create_index(self) -> None:
        """Unique index on service_type."""
        await self._col.create_index("service_type", unique=True)

    async def find_all(self) -> list[dict]:
        return await self._col.find({}).to_list(None)

    async def find_by_service_type(self, service_type: str) -> dict | None:
        return await self._col.find_one({"service_type": service_type})

    async def upsert(self, service_type: str, data: dict) -> dict:
        """Create or fully replace the pricing document for a service type."""
        await self._col.update_one(
            {"service_type": service_type},
            {"$set": data},
            upsert=True,
        )
        return await self._col.find_one({"service_type": service_type})
