from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TaskType = Literal["failed_order", "refund_request", "manual"]
TaskStatus = Literal["open", "in_progress", "resolved"]
TaskPriority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    priority: TaskPriority = "medium"


class TaskUpdate(BaseModel):
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    notes: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    title: str
    description: str
    notes: str
    order_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_username: Optional[str] = None
    order_link: Optional[str] = None
    service_name: Optional[str] = None
    category_name: Optional[str] = None
    quantity: Optional[int] = None
    charge: Optional[float] = None
    currency: str = "USD"
    seen_by_admin: bool
    resolved_at: Optional[str] = None
    created_at: str
    updated_at: str


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    page_size: int


class UnreadCountResponse(BaseModel):
    count: int
