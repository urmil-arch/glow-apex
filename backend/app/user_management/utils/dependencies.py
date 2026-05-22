from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.user_management.repositories.user_repository import UserRepository
from app.user_management.utils.jwt_utils import decode_access_token

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
