import json
import logging
from typing import Any

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

CACHE_SERVICES = "cache:admin:services"
CACHE_CATEGORIES = "cache:admin:categories"
CACHE_PRICING = "cache:admin:pricing"
CACHE_ROUTING = "cache:admin:routing"
CACHE_PUBLIC_SERVICES = "cache:public:services"

TTL_SERVICES = 300        # 5 min
TTL_CATEGORIES = 600      # 10 min
TTL_PRICING = 300         # 5 min
TTL_ROUTING = 300         # 5 min
TTL_PUBLIC_SERVICES = 120 # 2 min


async def cache_get(redis: aioredis.Redis, key: str) -> Any | None:
    """Return the parsed JSON value for key, or None on miss or Redis error."""
    try:
        raw = await redis.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("Redis cache_get failed key=%s: %s", key, exc)
        return None


async def cache_set(redis: aioredis.Redis, key: str, value: Any, ttl: int) -> None:
    """Serialise value to JSON and store with TTL. Silently ignores errors."""
    try:
        await redis.set(key, json.dumps(value), ex=ttl)
    except Exception as exc:
        logger.warning("Redis cache_set failed key=%s: %s", key, exc)


async def cache_delete(redis: aioredis.Redis, *keys: str) -> None:
    """Delete one or more cache keys. Silently ignores errors."""
    try:
        if keys:
            await redis.delete(*keys)
    except Exception as exc:
        logger.warning("Redis cache_delete failed keys=%s: %s", keys, exc)
