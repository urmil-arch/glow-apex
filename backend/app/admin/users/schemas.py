from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.user_management.utils.permissions import ALL_PERMISSIONS, ALL_ROLES


class AdminUserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    is_verified: bool
    is_admin: bool
    is_suspended: bool
    personal_discount: float
    role: str = "user"
    extra_permissions: list[str] = []
    created_at: str
    total_spent: float = 0.0


class AdminUsersListResponse(BaseModel):
    users: list[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminStatsResponse(BaseModel):
    total: int
    verified: int
    suspended: int


class AdminCreateUserRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: str = "user"
    extra_permissions: list[str] = []

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name is required")
        return v.strip()

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        import re
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_known(cls, v: str) -> str:
        if v not in ALL_ROLES:
            raise ValueError(f"Unknown role: {v}")
        return v

    @field_validator("extra_permissions")
    @classmethod
    def permissions_known(cls, v: list[str]) -> list[str]:
        unknown = [p for p in v if p not in ALL_PERMISSIONS]
        if unknown:
            raise ValueError(f"Unknown permissions: {', '.join(unknown)}")
        return sorted(set(v))


class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    personal_discount: Optional[float] = None

    @field_validator("personal_discount")
    @classmethod
    def discount_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Personal discount must be between 0 and 100")
        return v


class AdminSetPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class AdminToggleSuspendRequest(BaseModel):
    suspended: bool


class AdminUpdateRoleRequest(BaseModel):
    role: str
    extra_permissions: list[str] = []

    @field_validator("role")
    @classmethod
    def role_known(cls, v: str) -> str:
        if v not in ALL_ROLES:
            raise ValueError(f"Unknown role: {v}")
        return v

    @field_validator("extra_permissions")
    @classmethod
    def permissions_known(cls, v: list[str]) -> list[str]:
        unknown = [p for p in v if p not in ALL_PERMISSIONS]
        if unknown:
            raise ValueError(f"Unknown permissions: {', '.join(unknown)}")
        return sorted(set(v))


class SignInLogResponse(BaseModel):
    ip_address: str
    user_agent: str
    timestamp: str
