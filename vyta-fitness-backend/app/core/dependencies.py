from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from firebase_admin import auth as firebase_auth
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.admin_auth import get_admin_user
from app.core.database import get_session
from app.core.firebase import _firebase_available
from app.models.admin import AdminRole
from app.models.user import User, UserRole

security_scheme = HTTPBearer()

# Role hierarchy: higher number = more privileges
ROLE_LEVELS = {
    AdminRole.FINANCE: 1,
    AdminRole.CONTENT_MANAGER: 2,
    AdminRole.SUPPORT_AGENT: 3,
    AdminRole.ADMIN: 4,
    AdminRole.SUPER_ADMIN: 5,
}


def _get_admin_role(user: User) -> Optional[AdminRole]:
    for role in AdminRole:
        if role.value == user.store_role:
            return role
    return None


def _get_role_level(user: User) -> int:
    admin_role = _get_admin_role(user)
    if admin_role is None:
        return ROLE_LEVELS.get(AdminRole.ADMIN, 4)
    return ROLE_LEVELS.get(admin_role, 0)


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


class AdminRoleChecker:
    def __init__(self, min_role: AdminRole = AdminRole.ADMIN):
        self.min_role = min_role

    async def __call__(self, current_user: User = Depends(get_admin_user)) -> User:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        user_level = _get_role_level(current_user)
        required_level = ROLE_LEVELS.get(self.min_role, 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation",
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
