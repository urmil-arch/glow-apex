import logging
from datetime import datetime, timezone

_EPOCH = datetime(2000, 1, 1, tzinfo=timezone.utc)


def _registered_at(user: dict) -> datetime:
    """Return the user's created_at as a UTC-aware datetime.

    Falls back to a distant past epoch so that if the field is missing
    all notifications are shown (safe default rather than hiding everything).
    """
    ts = user.get("created_at")
    if not isinstance(ts, datetime):
        return _EPOCH
    return ts if ts.tzinfo is not None else ts.replace(tzinfo=timezone.utc)

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.notifications.repository import NotificationRepository
from app.notifications.schemas import (
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.user_management.utils.dependencies import get_current_user, require_permission
from app.user_management.utils.permissions import PERM_NOTIFICATIONS, effective_permissions

logger = logging.getLogger(__name__)


def _is_staff(user: dict) -> bool:
    return bool(user.get("is_admin")) or bool(effective_permissions(user))

admin_router = APIRouter(dependencies=[Depends(require_permission(PERM_NOTIFICATIONS))])
user_router = APIRouter()


def _serialize_admin(doc: dict) -> NotificationResponse:
    created = doc.get("created_at", "")
    return NotificationResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        message=doc["message"],
        type=doc.get("type", "info"),
        target=doc.get("target", "all"),
        user_ids=doc.get("user_ids", []),
        read_count=len(doc.get("read_by", [])),
        created_by=doc.get("created_by", ""),
        created_at=created.isoformat() if isinstance(created, datetime) else str(created),
    )


def _serialize_user(doc: dict, user_id: str) -> NotificationResponse:
    created = doc.get("created_at", "")
    return NotificationResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        message=doc["message"],
        type=doc.get("type", "info"),
        target=doc.get("target", "all"),
        user_ids=doc.get("user_ids", []),
        read_count=len(doc.get("read_by", [])),
        created_by=doc.get("created_by", ""),
        created_at=created.isoformat() if isinstance(created, datetime) else str(created),
        is_read=user_id in doc.get("read_by", []),
    )


# ── Admin endpoints ─────────────────────────────────────────────────────────


@admin_router.get("", response_model=NotificationListResponse)
async def list_notifications(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> NotificationListResponse:
    """Return all sent notifications, newest first."""
    docs, total = await NotificationRepository(request.app.state.db).find_all_admin(page, page_size)
    return NotificationListResponse(
        notifications=[_serialize_admin(d) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
    )


@admin_router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    body: NotificationCreate,
    request: Request,
    user: dict = Depends(get_current_user),
) -> NotificationResponse:
    """Send a notification to all users, a selection, or a specific user."""
    if body.target not in ("all", "staff") and not body.user_ids:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Provide user_ids when target is 'selective' or 'personal'",
        )
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title.strip(),
        "message": body.message.strip(),
        "type": body.type,
        "target": body.target,
        "user_ids": body.user_ids,
        "read_by": [],
        "created_by": user.get("email", str(user["_id"])),
        "created_at": now,
    }
    doc_id = await NotificationRepository(request.app.state.db).insert(doc)
    doc["_id"] = doc_id
    logger.info(
        "Notification sent: target=%s recipients=%s by=%s",
        body.target, len(body.user_ids), doc["created_by"],
    )
    return _serialize_admin(doc)


@admin_router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(notification_id: str, request: Request) -> None:
    """Permanently delete a notification."""
    deleted = await NotificationRepository(request.app.state.db).delete(notification_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    logger.info("Notification deleted: id=%s", notification_id)


# ── User endpoints ──────────────────────────────────────────────────────────


@user_router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    request: Request,
    user: dict = Depends(get_current_user),
) -> UnreadCountResponse:
    """Return the count of unread admin notifications for the current user."""
    count = await NotificationRepository(request.app.state.db).unread_count_for_user(
        str(user["_id"]), _registered_at(user), is_staff=_is_staff(user)
    )
    return UnreadCountResponse(count=count)


@user_router.get("", response_model=NotificationListResponse)
async def list_user_notifications(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user),
) -> NotificationListResponse:
    """Return notifications visible to the current user, newest first."""
    user_id = str(user["_id"])
    docs, total = await NotificationRepository(request.app.state.db).find_for_user(
        user_id, _registered_at(user), page, page_size, is_staff=_is_staff(user)
    )
    return NotificationListResponse(
        notifications=[_serialize_user(d, user_id) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
    )


@user_router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    request: Request,
    user: dict = Depends(get_current_user),
) -> None:
    """Mark all visible notifications as read for the current user."""
    await NotificationRepository(request.app.state.db).mark_all_read_for_user(
        str(user["_id"]), _registered_at(user), is_staff=_is_staff(user)
    )


@user_router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_read(
    notification_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
) -> None:
    """Mark a single notification as read for the current user."""
    await NotificationRepository(request.app.state.db).mark_read(
        notification_id, str(user["_id"])
    )
