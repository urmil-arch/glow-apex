import asyncio
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

# Shared pipeline stages that join order details onto each payment document.
# order_id is stored as a plain string; $toString converts orders._id for matching.
_ORDER_LOOKUP: list[dict] = [
    {
        "$lookup": {
            "from": "orders",
            "let": {"oid_str": "$order_id"},
            "pipeline": [
                {
                    "$match": {
                        "$expr": {"$eq": [{"$toString": "$_id"}, "$$oid_str"]}
                    }
                },
                {
                    "$project": {
                        "status": 1,
                        "link": 1,
                        "provider_order_id": 1,
                    }
                },
            ],
            "as": "_order",
        }
    },
    {
        "$addFields": {
            "order_status":      {"$ifNull": [{"$arrayElemAt": ["$_order.status", 0]},              ""]},
            "order_link":        {"$ifNull": [{"$arrayElemAt": ["$_order.link", 0]},                ""]},
            "order_provider_id": {"$ifNull": [{"$arrayElemAt": ["$_order.provider_order_id", 0]},   ""]},
        }
    },
    {"$project": {"_order": 0}},
]


class PaymentLedgerRepository:
    """CRUD for the payments collection — separate from orders."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["payments"]

    async def create_indexes(self) -> None:
        await self._col.create_index([("user_id", 1), ("created_at", -1)])
        await self._col.create_index([("order_id", 1)])

    async def insert(self, doc: dict) -> str:
        for attempt in range(3):
            try:
                result = await self._col.insert_one(doc)
                return str(result.inserted_id)
            except Exception as exc:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.2 * (attempt + 1))
        raise RuntimeError("insert failed after retries")

    async def find_by_id(self, payment_id: str) -> dict | None:
        try:
            oid = ObjectId(payment_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid})

    async def find_by_order_id(self, order_id: str) -> dict | None:
        return await self._col.find_one({"order_id": order_id})

    async def find_by_user_id(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        """Return paginated payments for a user, with linked order details joined."""
        total = await self._col.count_documents({"user_id": user_id})
        pipeline: list[dict] = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"created_at": -1}},
            {"$skip": (page - 1) * page_size},
            {"$limit": page_size},
            *_ORDER_LOOKUP,
        ]
        docs = await self._col.aggregate(pipeline).to_list(length=page_size)
        return docs, total

    async def find_all_admin(
        self,
        page: int = 1,
        page_size: int = 50,
        method_filter: str = "",
        status_filter: str = "",
        search: str = "",
    ) -> tuple[list[dict], int]:
        """Return paginated payments for all users with order details joined. Admin only."""
        match: dict = {}
        if method_filter:
            match["method"] = {"$regex": method_filter, "$options": "i"}
        if status_filter:
            match["status"] = status_filter
        if search:
            term    = search.lstrip("#").strip()
            pattern = {"$regex": term, "$options": "i"}
            match["$or"] = [
                {"user_email":    pattern},
                {"user_username": pattern},
                {"service_name":  pattern},
                {"category_name": pattern},
                {"memo":          pattern},
                # Match by linked order_id (stored as string) or payment's own _id
                {"order_id": pattern},
                {"$expr": {"$regexMatch": {
                    "input":  {"$toLower": {"$toString": "$_id"}},
                    "regex":  term.lower(),
                    "options": "",
                }}},
            ]

        pipeline: list[dict] = [
            {"$match": match},
            {"$sort": {"created_at": -1}},
            {
                "$facet": {
                    "data": [
                        {"$skip": (page - 1) * page_size},
                        {"$limit": page_size},
                        *_ORDER_LOOKUP,
                    ],
                    "total": [{"$count": "n"}],
                }
            },
        ]
        result = await self._col.aggregate(pipeline).to_list(length=1)
        if not result:
            return [], 0
        bucket = result[0]
        return bucket["data"], (bucket["total"][0]["n"] if bucket["total"] else 0)

    async def update(self, payment_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(payment_id)
        except Exception:
            return
        updates["updated_at"] = datetime.now(timezone.utc)
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def update_by_order_id(self, order_id: str, updates: dict) -> None:
        """Update a payment record by its associated order_id."""
        updates["updated_at"] = datetime.now(timezone.utc)
        await self._col.update_one({"order_id": order_id}, {"$set": updates})

    async def claim_for_payment(self, order_id: str) -> bool:
        """
        Atomically mark a payment as paid only if it is still pending.
        Returns True if this call won the race. Returns False if already processed.
        """
        result = await self._col.update_one(
            {"order_id": order_id, "status": "pending"},
            {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count == 1

    async def delete(self, payment_id: str) -> bool:
        try:
            oid = ObjectId(payment_id)
        except Exception:
            return False
        result = await self._col.delete_one({"_id": oid})
        return result.deleted_count == 1
