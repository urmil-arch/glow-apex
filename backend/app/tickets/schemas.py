from typing import Literal

from pydantic import BaseModel


class TicketMessage(BaseModel):
    sender: Literal["user", "admin"]
    text: str
    created_at: str


class TicketResponse(BaseModel):
    id: str
    type: Literal["order_related", "payment_related", "other"]
    subject: str
    order_id: str
    status: Literal["open", "in_progress", "resolved", "closed"]
    user_id: str
    user_email: str
    user_username: str
    user_has_unread: bool
    admin_has_unread: bool
    messages: list[TicketMessage]
    created_at: str
    updated_at: str


class TicketListResponse(BaseModel):
    tickets: list[TicketResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CreateTicketRequest(BaseModel):
    type: Literal["order_related", "payment_related", "other"]
    subject: str
    message: str
    order_id: str = ""


class ReplyTicketRequest(BaseModel):
    text: str
