import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.tickets.repository import TicketRepository
from app.tickets.schemas import (
    CreateTicketRequest,
    ReplyTicketRequest,
    TicketListResponse,
    TicketResponse,
)
from app.user_management.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _serialize(doc: dict) -> TicketResponse:
    """Convert a MongoDB ticket document to TicketResponse."""
    def _fmt(dt: object) -> str:
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt) if dt else ""

    messages = [
        {
            "sender": m.get("sender", "user"),
            "text": m.get("text", ""),
            "created_at": _fmt(m.get("created_at")),
        }
        for m in doc.get("messages", [])
    ]

    return TicketResponse(
        id=str(doc["_id"]),
        type=doc.get("type", "other"),
        subject=doc.get("subject", ""),
        order_id=doc.get("order_id", ""),
        status=doc.get("status", "open"),
        user_id=doc.get("user_id", ""),
        user_email=doc.get("user_email", ""),
        user_username=doc.get("user_username", ""),
        user_has_unread=doc.get("user_has_unread", False),
        admin_has_unread=doc.get("admin_has_unread", False),
        messages=messages,
        created_at=_fmt(doc.get("created_at")),
        updated_at=_fmt(doc.get("updated_at")),
    )


@router.get("", response_model=TicketListResponse)
async def list_my_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketListResponse:
    """Return the current user's tickets, newest-updated first."""
    tickets, total = await TicketRepository(db).find_by_user(
        user_id=str(user["_id"]), page=page, page_size=page_size
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return TicketListResponse(
        tickets=[_serialize(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    body: CreateTicketRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketResponse:
    """Create a new support ticket with the first user message."""
    now = datetime.now(timezone.utc)
    doc = {
        "type": body.type,
        "subject": body.subject,
        "order_id": body.order_id or "",
        "status": "open",
        "user_id": str(user["_id"]),
        "user_email": user.get("email", ""),
        "user_username": user.get("username", ""),
        "user_has_unread": False,
        "admin_has_unread": True,
        "messages": [
            {
                "sender": "user",
                "text": body.message,
                "created_at": now,
            }
        ],
        "created_at": now,
        "updated_at": now,
    }
    repo = TicketRepository(db)
    ticket_id = await repo.insert(doc)
    created = await repo.find_by_id(ticket_id)
    return _serialize(created)


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_my_ticket(
    ticket_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketResponse:
    """Return a single ticket belonging to the current user and clear the unread flag."""
    repo = TicketRepository(db)
    ticket = await repo.find_by_id_and_user(
        ticket_id=ticket_id, user_id=str(user["_id"])
    )
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if ticket.get("user_has_unread"):
        await repo.set_user_unread(ticket_id, False)
        ticket["user_has_unread"] = False
    return _serialize(ticket)


@router.post("/{ticket_id}/reply", response_model=TicketResponse)
async def reply_to_ticket(
    ticket_id: str,
    body: ReplyTicketRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketResponse:
    """Append a user reply to an existing open ticket."""
    repo = TicketRepository(db)
    ticket = await repo.find_by_id_and_user(
        ticket_id=ticket_id, user_id=str(user["_id"])
    )
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if ticket.get("status") in ("resolved", "closed"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Cannot reply to a resolved or closed ticket",
        )
    await repo.append_message(
        ticket_id,
        {"sender": "user", "text": body.text, "created_at": datetime.now(timezone.utc)},
    )
    await repo.set_admin_unread(ticket_id, True)
    updated = await repo.find_by_id(ticket_id)
    return _serialize(updated)
