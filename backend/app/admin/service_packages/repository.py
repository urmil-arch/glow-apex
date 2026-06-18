from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def _fmt(doc: dict) -> dict:
    """Normalise a MongoDB document for API output."""
    doc["id"] = str(doc.pop("_id"))
    for dt_field in ("created_at", "updated_at"):
        val = doc.get(dt_field)
        if isinstance(val, datetime):
            doc[dt_field] = val.isoformat()
        elif val is None:
            doc[dt_field] = ""
    return doc


class ServicePackageRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["service_packages"]

    async def find_all(self) -> list[dict]:
        """Return all packages sorted by service_type, package_type, priority."""
        docs = []
        async for doc in self._col.find({}).sort([
            ("service_type", 1),
            ("package_type", 1),
            ("priority", 1),
        ]):
            docs.append(_fmt(doc))
        return docs

    async def find_by_type(self, service_type: str, package_type: str) -> list[dict]:
        """Return packages for a specific service_type + package_type, ordered by priority."""
        docs = []
        async for doc in self._col.find(
            {"service_type": service_type, "package_type": package_type}
        ).sort("priority", 1):
            docs.append(_fmt(doc))
        return docs

    async def find_by_service_and_quantity(
        self,
        service_type: str,
        quantity: int,
        package_type: str | None = None,
    ) -> dict | None:
        """
        Return the first active package matching service_type + quantity.
        If package_type is supplied, it is added to the filter.
        Results are sorted by priority so the lowest-priority number wins.
        """
        query: dict = {"service_type": service_type, "quantity": quantity, "is_active": True}
        if package_type:
            query["package_type"] = package_type
        doc = await self._col.find_one(query, sort=[("priority", 1)])
        return _fmt(doc) if doc else None

    async def find_by_id(self, pkg_id: str) -> dict | None:
        try:
            doc = await self._col.find_one({"_id": ObjectId(pkg_id)})
        except Exception:
            return None
        return _fmt(doc) if doc else None

    async def next_priority(self, service_type: str, package_type: str) -> int:
        """Return priority = count of existing packages in this slot + 1."""
        count = await self._col.count_documents(
            {"service_type": service_type, "package_type": package_type}
        )
        return count + 1

    async def insert(self, data: dict) -> str:
        now = datetime.now(timezone.utc)
        data.setdefault("fallbacks", [])
        data["created_at"] = now
        data["updated_at"] = now
        result = await self._col.insert_one(data)
        return str(result.inserted_id)

    async def update(self, pkg_id: str, updates: dict) -> bool:
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self._col.update_one(
            {"_id": ObjectId(pkg_id)}, {"$set": updates}
        )
        return result.matched_count > 0

    async def delete(self, pkg_id: str) -> bool:
        result = await self._col.delete_one({"_id": ObjectId(pkg_id)})
        return result.deleted_count > 0

    # ── Fallback helpers ──────────────────────────────────────────────────────

    async def push_fallback(self, pkg_id: str, fallback: dict) -> bool:
        result = await self._col.update_one(
            {"_id": ObjectId(pkg_id)},
            {
                "$push": {"fallbacks": fallback},
                "$set":  {"updated_at": datetime.now(timezone.utc)},
            },
        )
        return result.matched_count > 0

    async def set_fallbacks(self, pkg_id: str, fallbacks: list[dict]) -> bool:
        """Replace the entire fallbacks array (used for reorder and delete)."""
        result = await self._col.update_one(
            {"_id": ObjectId(pkg_id)},
            {
                "$set": {
                    "fallbacks":  fallbacks,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return result.matched_count > 0
