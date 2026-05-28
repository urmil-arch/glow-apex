from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class AdminUserResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    is_verified: bool
    is_admin: bool
    is_suspended: bool
    personal_discount: float
    created_at: str


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
    is_admin: bool = False

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


class SignInLogResponse(BaseModel):
    ip_address: str
    user_agent: str
    timestamp: str
