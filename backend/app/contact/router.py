import asyncio
import logging
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.contact.repository import ContactMessageRepository
from app.contact.schemas import ContactRequest
from app.contact.utils import send_contact_emails

logger = logging.getLogger(__name__)

router = APIRouter()

RATE_LIMIT_TTL = 3600  # 1 hour window
RATE_LIMIT_MAX = 2    # messages allowed per window


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _get_redis(request: Request) -> aioredis.Redis:
    return request.app.state.redis


def _get_client_ip(request: Request) -> str:
    """Return the real client IP, respecting X-Forwarded-For when present."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_contact_message(
    payload: ContactRequest,
    request: Request,
) -> dict:
    """
    Accept a contact form submission.

    Enforces one submission per IP per hour via Redis. On success, sends a
    notification email to the site owner and a confirmation email to the sender.
    If Redis is unreachable the rate check is skipped with a warning so the
    contact form still works.
    """
    redis = _get_redis(request)
    db = _get_db(request)
    client_ip = _get_client_ip(request)
    rate_key = f"contact_ratelimit:{client_ip}"

    try:
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, RATE_LIMIT_TTL)
        if count > RATE_LIMIT_MAX:
            ttl = await redis.ttl(rate_key)
            minutes_left = max(1, (ttl + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"You can send up to {RATE_LIMIT_MAX} messages per hour. "
                    f"Please try again in {minutes_left} minute(s)."
                ),
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Redis unavailable, rate limit check skipped: %s", exc)

    try:
        await send_contact_emails(
            name=payload.name,
            email=payload.email,
            subject=payload.subject,
            message=payload.message,
            contact_type=payload.type,
        )
    except Exception as exc:
        logger.error("Contact email delivery failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send your message. Please try again later.",
        )

    asyncio.ensure_future(
        ContactMessageRepository(db).insert({
            "name": payload.name,
            "email": payload.email,
            "subject": payload.subject,
            "message": payload.message,
            "type": payload.type,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        })
    )

    return {"message": "Your message has been sent. We'll get back to you within 24 hours."}
