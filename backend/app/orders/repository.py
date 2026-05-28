from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class OrderRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["orders"]

    async def create_index(self) -> None:
        await self._col.create_index([("user_id", 1), ("created_at", -1)])

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_by_id(self, order_id: str, user_id: str) -> dict | None:
        """Return an order only if it belongs to the given user."""
        try:
            oid = ObjectId(order_id)
        except Exception:
            return None
        return await self._col.find_one({"_id": oid, "user_id": user_id})

    async def find_by_user_id(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        """Return a paginated slice of a user's orders and the total count."""
        query = {"user_id": user_id}
        total = await self._col.count_documents(query)
        skip = (page - 1) * page_size
        cursor = (
            self._col.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        )
        orders = await cursor.to_list(length=page_size)
        return orders, total

    async def update(self, order_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(order_id)
        except Exception:
            return
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def find_by_id_admin(self, order_id: str) -> dict | None:
        """Return a single order regardless of user. Admin use only."""
        try:
            oid = ObjectId(order_id)
        except Exception:
            return None
        pipeline = [
            {"$match": {"_id": oid}},
            {
                "$lookup": {
                    "from": "users",
                    "let": {"uid": "$user_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$uid"]}}},
                        {"$project": {"email": 1, "username": 1}},
                    ],
                    "as": "user_info",
                }
            },
        ]
        results = await self._col.aggregate(pipeline).to_list(length=1)
        return results[0] if results else None

    async def find_all_admin(
        self,
        page: int = 1,
        page_size: int = 50,
        status_filter: str = "",
        search: str = "",
    ) -> tuple[list[dict], int]:
        """Return paginated orders for all users with user_info joined. Admin use only."""
        match: dict = {}
        if status_filter:
            match["status"] = status_filter
        if search:
            pattern = {"$regex": search, "$options": "i"}
            match["$or"] = [{"link": pattern}, {"service_name": pattern}]

        pipeline: list[dict] = [
            {"$match": match},
            {"$sort": {"created_at": -1}},
            {
                "$lookup": {
                    "from": "users",
                    "let": {"uid": "$user_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$uid"]}}},
                        {"$project": {"email": 1, "username": 1}},
                    ],
                    "as": "user_info",
                }
            },
            {
                "$facet": {
                    "data": [{"$skip": (page - 1) * page_size}, {"$limit": page_size}],
                    "total": [{"$count": "n"}],
                }
            },
        ]

        result = await self._col.aggregate(pipeline).to_list(length=1)
        if not result:
            return [], 0
        bucket = result[0]
        return bucket["data"], (bucket["total"][0]["n"] if bucket["total"] else 0)
