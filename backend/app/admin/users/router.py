from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.admin.users.schemas import (
    AdminCreateUserRequest,
    AdminSetPasswordRequest,
    AdminStatsResponse,
    AdminToggleSuspendRequest,
    AdminUpdateUserRequest,
    AdminUserResponse,
    AdminUsersListResponse,
    SignInLogResponse,
)
from app.user_management.repositories.sign_in_log_repository import SignInLogRepository
from app.user_management.repositories.user_repository import UserRepository
from app.user_management.utils.dependencies import get_current_admin
from app.user_management.utils.password import hash_password

router = APIRouter()


def _get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def _user_to_response(user: dict) -> AdminUserResponse:
    """Serialize a MongoDB user document to AdminUserResponse."""
    created_at = user.get("created_at")
    if isinstance(created_at, datetime):
        created_str = created_at.isoformat()
    else:
        created_str = str(created_at) if created_at else ""

    return AdminUserResponse(
        id=str(user["_id"]),
        full_name=user.get("full_name", ""),
        username=user.get("username", ""),
        email=user.get("email", ""),
        is_verified=user.get("is_verified", False),
        is_admin=user.get("is_admin", False),
        is_suspended=user.get("is_suspended", False),
        personal_discount=user.get("personal_discount", 0.0),
        created_at=created_str,
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> AdminStatsResponse:
    """Return user count stats for the admin dashboard cards."""
    stats = await UserRepository(db).admin_get_stats()
    return AdminStatsResponse(**stats)


@router.get("/export")
async def export_users(
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[AdminUserResponse]:
    """Return all users as a flat list for CSV export."""
    users = await UserRepository(db).admin_export_users()
    return [_user_to_response(u) for u in users]


@router.get("", response_model=AdminUsersListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    filter_by: str = Query("all"),
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> AdminUsersListResponse:
    """Return a paginated list of users with optional search and filter."""
    users, total = await UserRepository(db).admin_list_users(
        page=page, page_size=page_size, search=search, filter_by=filter_by
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return AdminUsersListResponse(
        users=[_user_to_response(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminCreateUserRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> AdminUserResponse:
    """Create a new user directly (no OTP step, immediately verified)."""
    repo = UserRepository(db)

    if await repo.find_by_email(body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    if await repo.find_by_username(body.username):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    user_id = await repo.insert({
        "full_name": body.full_name,
        "username": body.username,
        "email": body.email.lower(),
        "hashed_password": hash_password(body.password),
        "is_verified": True,
        "is_admin": body.is_admin,
        "is_suspended": False,
        "personal_discount": 0.0,
        "otp": None,
        "otp_expires_at": None,
        "created_at": datetime.now(timezone.utc),
    })
    user = await repo.find_by_id(user_id)
    return _user_to_response(user)


@router.get("/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> AdminUserResponse:
    user = await UserRepository(db).find_by_id(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return _user_to_response(user)


@router.patch("/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    body: AdminUpdateUserRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> AdminUserResponse:
    """Update mutable user fields. Only supplied fields are changed."""
    repo = UserRepository(db)
    user = await repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    updates: dict = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.username is not None:
        existing = await repo.find_by_username(body.username)
        if existing and str(existing["_id"]) != user_id:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
        updates["username"] = body.username
    if body.personal_discount is not None:
        updates["personal_discount"] = body.personal_discount

    if updates:
        await repo.update_profile(user_id, updates)

    refreshed = await repo.find_by_id(user_id)
    return _user_to_response(refreshed)


@router.post("/{user_id}/set-password", status_code=status.HTTP_200_OK)
async def set_password(
    user_id: str,
    body: AdminSetPasswordRequest,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Admin resets any user's password without needing the current password."""
    repo = UserRepository(db)
    if not await repo.find_by_id(user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await repo.update_password(user_id, hash_password(body.new_password))
    return {"message": "Password updated"}


@router.post("/{user_id}/suspend", status_code=status.HTTP_200_OK)
async def toggle_suspend(
    user_id: str,
    body: AdminToggleSuspendRequest,
    admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> dict:
    """Suspend or unsuspend a user. Admins cannot suspend themselves."""
    if str(admin["_id"]) == user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot suspend your own account")
    repo = UserRepository(db)
    if not await repo.find_by_id(user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await repo.admin_suspend_user(user_id, body.suspended)
    action = "suspended" if body.suspended else "unsuspended"
    return {"message": f"User {action}"}


@router.get("/{user_id}/sign-in-history", response_model=list[SignInLogResponse])
async def get_sign_in_history(
    user_id: str,
    _: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(_get_db),
) -> list[SignInLogResponse]:
    """Return the 20 most recent sign-in events for a user."""
    if not await UserRepository(db).find_by_id(user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    logs = await SignInLogRepository(db).find_by_user_id(user_id)
    return [
        SignInLogResponse(
            ip_address=log.get("ip_address", ""),
            user_agent=log.get("user_agent", ""),
            timestamp=log["timestamp"].isoformat() if isinstance(log.get("timestamp"), datetime) else str(log.get("timestamp", "")),
        )
        for log in logs
    ]
