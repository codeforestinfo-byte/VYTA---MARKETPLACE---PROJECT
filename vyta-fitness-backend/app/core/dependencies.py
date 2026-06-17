from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from firebase_admin import auth as firebase_auth
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.firebase import _firebase_available
from app.models.user import User, UserRole

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: str = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not _firebase_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase is not configured",
        )

    id_token = credentials.credentials

    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    uid = decoded.get("uid")
    if uid is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await session.exec(select(User).where(User.id == uid))
    user = result.one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user


class RequireEmailVerified:
    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email before accessing this resource.",
            )
        return current_user
