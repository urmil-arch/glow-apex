from typing import Literal

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)
    type: Literal["info", "success", "warning"] = "info"
    target: Literal["all", "selective", "personal"] = "all"
    user_ids: list[str] = []


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    target: str
    user_ids: list[str]
    read_count: int
    created_by: str
    created_at: str
    is_read: bool = False


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    count: int
