import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.admin.tasks.repository import TaskRepository
from app.admin.tasks.schemas import (
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
    UnreadCountResponse,
)
from app.user_management.utils.dependencies import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(get_current_admin)])


def _serialize(doc: dict) -> TaskResponse:
    """Convert a MongoDB task document to a TaskResponse."""
    resolved = doc.get("resolved_at")
    created = doc.get("created_at", datetime.now(timezone.utc))
    updated = doc.get("updated_at", created)
    return TaskResponse(
        id=str(doc["_id"]),
        type=doc["type"],
        status=doc["status"],
        priority=doc.get("priority", "medium"),
        title=doc["title"],
        description=doc.get("description", ""),
        notes=doc.get("notes", ""),
        order_id=doc.get("order_id"),
        user_id=doc.get("user_id"),
        user_email=doc.get("user_email"),
        user_username=doc.get("user_username"),
        order_link=doc.get("order_link"),
        service_name=doc.get("service_name"),
        category_name=doc.get("category_name"),
        quantity=doc.get("quantity"),
        charge=doc.get("charge"),
        currency=doc.get("currency", "USD"),
        seen_by_admin=doc.get("seen_by_admin", False),
        resolved_at=resolved.isoformat() if isinstance(resolved, datetime) else resolved,
        created_at=created.isoformat() if isinstance(created, datetime) else str(created),
        updated_at=updated.isoformat() if isinstance(updated, datetime) else str(updated),
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(request: Request) -> UnreadCountResponse:
    """Return the count of unseen open tasks for the nav badge."""
    count = await TaskRepository(request.app.state.db).unread_count()
    return UnreadCountResponse(count=count)


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    task_type: str = Query("", alias="type"),
    task_status: str = Query("", alias="status"),
) -> TaskListResponse:
    """Return paginated tasks, newest first. Marks all as seen on load."""
    db = request.app.state.db
    repo = TaskRepository(db)
    tasks, total = await repo.find_all(page, page_size, task_type, task_status)
    await repo.mark_all_seen()
    return TaskListResponse(
        tasks=[_serialize(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskCreate, request: Request) -> TaskResponse:
    """Admin creates a manual task."""
    now = datetime.now(timezone.utc)
    doc = {
        "type": "manual",
        "status": "open",
        "priority": body.priority,
        "title": body.title,
        "description": body.description,
        "notes": "",
        "order_id": None,
        "user_id": None,
        "user_email": None,
        "user_username": None,
        "order_link": None,
        "service_name": None,
        "category_name": None,
        "quantity": None,
        "charge": None,
        "currency": "USD",
        "seen_by_admin": True,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    }
    inserted_id = await TaskRepository(request.app.state.db).insert(doc)
    doc["_id"] = inserted_id
    return _serialize(doc)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, body: TaskUpdate, request: Request) -> TaskResponse:
    """Update task status, priority, or admin notes."""
    db = request.app.state.db
    repo = TaskRepository(db)

    task = await repo.find_by_id(task_id)
    if not task:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

    now = datetime.now(timezone.utc)
    updates: dict = {"updated_at": now}

    if body.status is not None:
        updates["status"] = body.status
        if body.status == "resolved":
            updates["resolved_at"] = now
    if body.priority is not None:
        updates["priority"] = body.priority
    if body.notes is not None:
        updates["notes"] = body.notes

    await repo.update(task_id, updates)
    return _serialize({**task, **updates})
