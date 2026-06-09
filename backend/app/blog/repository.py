from datetime import datetime
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class BlogRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["blog_posts"]

    async def create_indexes(self) -> None:
        await self._col.create_index("slug", unique=True)
        await self._col.create_index([("published", 1), ("created_at", -1)])
        await self._col.create_index([("category", 1), ("published", 1)])

    def _serialize(self, doc: dict) -> dict:
        created = doc.get("created_at", "")
        updated = doc.get("updated_at", "")
        return {
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "slug": doc.get("slug", ""),
            "excerpt": doc.get("excerpt", ""),
            "content": doc.get("content", ""),
            "category": doc.get("category", ""),
            "tags": doc.get("tags", []),
            "author_name": doc.get("author_name", ""),
            "author_avatar": doc.get("author_avatar", ""),
            "read_time": doc.get("read_time", ""),
            "image_url": doc.get("image_url", ""),
            "date": doc.get("date", ""),
            "published": doc.get("published", True),
            "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
            "updated_at": updated.isoformat() if isinstance(updated, datetime) else str(updated),
        }

    async def insert(self, doc: dict) -> str:
        result = await self._col.insert_one(doc)
        return str(result.inserted_id)

    async def find_all_public(
        self,
        page: int = 1,
        page_size: int = 12,
        category: str = "",
        search: str = "",
    ) -> tuple[list[dict], int]:
        """Return paginated published posts with optional category and search filters."""
        query: dict = {"published": True}
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"excerpt": {"$regex": search, "$options": "i"}},
            ]
        skip = (page - 1) * page_size
        total = await self._col.count_documents(query)
        cursor = self._col.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        return [self._serialize(d) for d in docs], total

    async def find_by_slug_public(self, slug: str) -> Optional[dict]:
        """Return a single published post by slug."""
        doc = await self._col.find_one({"slug": slug, "published": True})
        return self._serialize(doc) if doc else None

    async def find_related(self, slug: str, limit: int = 3) -> list[dict]:
        """Return published posts sharing the slug's category, excluding the slug itself."""
        source = await self._col.find_one({"slug": slug, "published": True})
        if not source:
            return []
        cursor = (
            self._col.find(
                {
                    "published": True,
                    "category": source.get("category", ""),
                    "slug": {"$ne": slug},
                }
            )
            .sort("created_at", -1)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        return [self._serialize(d) for d in docs]

    async def find_all_admin(
        self,
        page: int = 1,
        page_size: int = 20,
        published: Optional[bool] = None,
    ) -> tuple[list[dict], int]:
        """Return all posts (including drafts) for admin use."""
        query: dict = {}
        if published is not None:
            query["published"] = published
        skip = (page - 1) * page_size
        total = await self._col.count_documents(query)
        cursor = self._col.find(query).sort("created_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        return [self._serialize(d) for d in docs], total

    async def find_by_id(self, post_id: str) -> Optional[dict]:
        try:
            doc = await self._col.find_one({"_id": ObjectId(post_id)})
        except Exception:
            return None
        return self._serialize(doc) if doc else None

    async def slug_exists(self, slug: str, exclude_id: Optional[str] = None) -> bool:
        """Check whether a slug is already taken, optionally excluding a specific post."""
        query: dict = {"slug": slug}
        if exclude_id:
            try:
                query["_id"] = {"$ne": ObjectId(exclude_id)}
            except Exception:
                pass
        return await self._col.count_documents(query) > 0

    async def update(self, post_id: str, updates: dict) -> None:
        try:
            await self._col.update_one({"_id": ObjectId(post_id)}, {"$set": updates})
        except Exception:
            pass

    async def delete(self, post_id: str) -> bool:
        try:
            result = await self._col.delete_one({"_id": ObjectId(post_id)})
            return result.deleted_count > 0
        except Exception:
            return False
