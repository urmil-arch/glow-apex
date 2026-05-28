import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.contact.repository import ContactMessageRepository
from app.tickets.repository import TicketRepository
from app.tickets.router import _serialize as _serialize_ticket
from app.tickets.schemas import TicketListResponse, TicketResponse
from app.user_management.utils.dependencies import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


class ContactMessageResponse(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    message: str
    type: str
    is_read: bool
    created_at: str


class ContactMessagesListResponse(BaseModel):
    messages: list[ContactMessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminReplyRequest(BaseModel):
    text: str


class AdminChangeStatusRequest(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]


def _serialize_contact_msg(doc: dict) -> ContactMessageResponse:
    created_at = doc.get("created_at")
    if isinstance(created_at, datetime):
        created_str = created_at.isoformat()
    else:
        created_str = str(created_at) if created_at else ""
    return ContactMessageResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        email=doc.get("email", ""),
        subject=doc.get("subject", ""),
        message=doc.get("message", ""),
        type=doc.get("type", "support"),
        is_read=doc.get("is_read", False),
        created_at=created_str,
    )


# --- Contact messages ---

@router.get("/messages", response_model=ContactMessagesListResponse)
async def list_contact_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_read: str = Query(""),
    type: str = Query(""),
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> ContactMessagesListResponse:
    """Return paginated contact form messages for the admin panel."""
    messages, total = await ContactMessageRepository(db).find_all(
        page=page, page_size=page_size, is_read=is_read, type_filter=type
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return ContactMessagesListResponse(
        messages=[_serialize_contact_msg(m) for m in messages],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/messages/{message_id}/read", status_code=status.HTTP_200_OK)
async def mark_message_read(
    message_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Mark a contact form message as read."""
    await ContactMessageRepository(db).mark_read(message_id)
    return {"message": "Marked as read"}


# --- Tickets ---

@router.get("/tickets", response_model=TicketListResponse)
async def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(""),
    type_filter: str = Query(""),
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketListResponse:
    """Return paginated tickets across all users."""
    tickets, total = await TicketRepository(db).find_all_admin(
        page=page, page_size=page_size, status_filter=status_filter, type_filter=type_filter
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return TicketListResponse(
        tickets=[_serialize_ticket(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketResponse:
    """Return a single ticket by ID and clear the admin unread flag."""
    repo = TicketRepository(db)
    ticket = await repo.find_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if ticket.get("admin_has_unread"):
        await repo.set_admin_unread(ticket_id, False)
        ticket["admin_has_unread"] = False
    return _serialize_ticket(ticket)


@router.post("/tickets/{ticket_id}/reply", response_model=TicketResponse)
async def admin_reply(
    ticket_id: str,
    body: AdminReplyRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> TicketResponse:
    """Append an admin reply to a ticket. Auto-transitions open tickets to in_progress."""
    repo = TicketRepository(db)
    ticket = await repo.find_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    await repo.append_message(
        ticket_id,
        {"sender": "admin", "text": body.text, "created_at": datetime.now(timezone.utc)},
    )
    await repo.set_user_unread(ticket_id, True)
    if ticket.get("status") == "open":
        await repo.update_status(ticket_id, "in_progress")
    updated = await repo.find_by_id(ticket_id)
    return _serialize_ticket(updated)


@router.patch("/tickets/{ticket_id}/status", status_code=status.HTTP_200_OK)
async def change_ticket_status(
    ticket_id: str,
    body: AdminChangeStatusRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Change the status of a ticket."""
    repo = TicketRepository(db)
    if not await repo.find_by_id(ticket_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    await repo.update_status(ticket_id, body.status)
    return {"message": "Status updated"}
