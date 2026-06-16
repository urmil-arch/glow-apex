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
        """
        Return a paginated slice of a user's orders and the total count.
        For orders missing category_name (placed before that field was added),
        look it up from admin_services → service_categories so the user always
        sees a clean category name instead of the raw provider service name.
        """
        skip = (page - 1) * page_size
        base_match = {"user_id": user_id}

        # Total count (fast, no joins needed)
        total = await self._col.count_documents(base_match)

        pipeline: list[dict] = [
            {"$match": base_match},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": page_size},
            # Join admin_services by service_id (stored as string, _id is ObjectId)
            {
                "$lookup": {
                    "from": "admin_services",
                    "let": {"svc_id": "$service_id"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$svc_id"]}}},
                        {"$project": {"category_id": 1}},
                    ],
                    "as": "_svc",
                }
            },
            # Join service_categories to get the category name
            {
                "$lookup": {
                    "from": "service_categories",
                    "let": {"cat_id": {"$arrayElemAt": ["$_svc.category_id", 0]}},
                    "pipeline": [
                        {"$match": {"$expr": {
                            "$and": [
                                {"$ne": ["$$cat_id", None]},
                                {"$ne": ["$$cat_id", ""]},
                                {"$eq": [{"$toString": "$_id"}, "$$cat_id"]},
                            ]
                        }}},
                        {"$project": {"name": 1}},
                    ],
                    "as": "_cat",
                }
            },
            # Use stored category_name when present; fall back to DB lookup for old orders
            {
                "$addFields": {
                    "category_name": {
                        "$cond": {
                            "if": {"$gt": [{"$strLenCP": {"$ifNull": ["$category_name", ""]}}, 0]},
                            "then": "$category_name",
                            "else": {"$ifNull": [{"$arrayElemAt": ["$_cat.name", 0]}, ""]},
                        }
                    }
                }
            },
            {"$project": {"_svc": 0, "_cat": 0}},
        ]

        orders = await self._col.aggregate(pipeline).to_list(length=page_size)
        return orders, total

    async def update(self, order_id: str, updates: dict) -> None:
        try:
            oid = ObjectId(order_id)
        except Exception:
            return
        await self._col.update_one({"_id": oid}, {"$set": updates})

    async def find_by_stripe_session(self, session_id: str) -> dict | None:
        """Find a pending order by its Stripe session ID."""
        return await self._col.find_one({"stripe_session_id": session_id})

    async def claim_for_payment(self, order_id: str) -> bool:
        """
        Atomically mark an order as paid only if it is still pending.
        Returns True if this call won the race (order was pending and is now paid).
        Returns False if another process already claimed it.
        """
        try:
            oid = ObjectId(order_id)
        except Exception:
            return False
        result = await self._col.update_one(
            {"_id": oid, "payment_status": "pending"},
            {"$set": {"payment_status": "paid"}},
        )
        return result.modified_count == 1

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

    async def aggregate_service_stats(self) -> list[dict]:
        """
        Group orders by service_id and return total vs working order counts.
        'Working' = the provider accepted the order (status is not an error/cancel/refund).
        """
        working_statuses = [
            "Pending", "Processing", "InProgress", "In progress",
            "Completed", "Partial", "Active",
        ]
        pipeline: list[dict] = [
            {"$group": {
                "_id": "$service_id",
                "total_orders": {"$sum": 1},
                "working_orders": {
                    "$sum": {
                        "$cond": [{"$in": ["$status", working_statuses]}, 1, 0]
                    }
                },
            }},
        ]
        results = await self._col.aggregate(pipeline).to_list(length=None)
        return [
            {
                "service_id": r["_id"],
                "total_orders": r["total_orders"],
                "working_orders": r["working_orders"],
            }
            for r in results
            if r["_id"]
        ]

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
            term    = search.lstrip("#").strip()
            pattern = {"$regex": term, "$options": "i"}

            # Resolve user IDs whose username or email matches the search term.
            # user_id is stored as a string on the order so we convert _id → str.
            user_ids: list[str] = []
            async for u in self._col.database["users"].find(
                {"$or": [
                    {"username": {"$regex": term, "$options": "i"}},
                    {"email":    {"$regex": term, "$options": "i"}},
                ]},
                {"_id": 1},
            ):
                user_ids.append(str(u["_id"]))

            or_conditions: list[dict] = [
                {"link":          pattern},
                {"service_name":  pattern},
                {"category_name": pattern},
                # Short ID lookup — match the hex _id string (case-insensitive)
                {"$expr": {"$regexMatch": {
                    "input":  {"$toLower": {"$toString": "$_id"}},
                    "regex":  term.lower(),
                    "options": "",
                }}},
            ]
            if user_ids:
                or_conditions.append({"user_id": {"$in": user_ids}})

            match["$or"] = or_conditions

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
