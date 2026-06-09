from typing import Awaitable, Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.utils.jwt_utils import decode_access_token
from app.user_management.utils.permissions import effective_permissions, is_full_admin

_bearer = HTTPBearer()


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    Decode the Bearer JWT and return the matching user document.
    Raises 401 if the token is missing, invalid, or the user no longer exists.
    """
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = await UserRepository(request.app.state.db).find_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    return user


async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require the authenticated user to be an admin. Raises 403 otherwise."""
    if not user.get("is_admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


def require_permission(permission: str) -> Callable[..., Awaitable[dict]]:
    """Build a dependency that requires the given page permission.

    The returned dependency resolves the current user, checks the permission
    against the user's effective permission set, and returns the user document.
    Raises 403 if the permission is not held.
    """

    async def _dependency(user: dict = Depends(get_current_user)) -> dict:
        if permission not in effective_permissions(user):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "You do not have access to this resource"
            )
        return user

    return _dependency


async def require_admin_role(user: dict = Depends(get_current_user)) -> dict:
    """Require the full administrator role, not merely admin-panel access.

    Used for reserved capabilities: changing user roles and managing providers.
    """
    if not is_full_admin(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator role required")
    return user
