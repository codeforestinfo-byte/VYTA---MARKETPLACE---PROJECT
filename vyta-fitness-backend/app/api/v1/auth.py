from datetime import timedelta
from decimal import Decimal
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.firebase import verify_google_token
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.models.vendor import Vendor

router = APIRouter(tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.CUSTOMER
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    business_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    existing = await session.exec(select(User).where(User.email == body.email))
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    if body.role == UserRole.VENDOR and not body.business_name:
        raise HTTPException(status_code=400, detail="business_name is required for vendor registration")

    if body.role == UserRole.CUSTOMER and (not body.first_name or not body.last_name):
        raise HTTPException(status_code=400, detail="first_name and last_name are required for customer registration")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    session.add(user)
    await session.flush()

    if body.role == UserRole.CUSTOMER:
        customer = Customer(
            user_id=user.id,
            first_name=body.first_name,
            last_name=body.last_name,
        )
        session.add(customer)

    elif body.role == UserRole.VENDOR:
        vendor = Vendor(
            user_id=user.id,
            business_name=body.business_name,
        )
        session.add(vendor)

    await session.commit()

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=60),
    )
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(User).where(User.email == body.email))
    user = result.one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=60),
    )
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/auth/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest, session: AsyncSession = Depends(get_session)):
    try:
        decoded = verify_google_token(body.id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    name = decoded.get("name", "").split(" ", 1)
    first_name = name[0] if name else ""
    last_name = name[1] if len(name) > 1 else ""

    existing = await session.exec(select(User).where(User.email == email))
    user = existing.one_or_none()

    if user:
        if user.role != UserRole.CUSTOMER:
            raise HTTPException(
                status_code=403,
                detail="This email is registered as a vendor/admin. Please use email login.",
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")
    else:
        user = User(
            email=email,
            password_hash=hash_password(str(uuid.uuid4())),
            role=UserRole.CUSTOMER,
            is_active=True,
        )
        session.add(user)
        await session.flush()

        customer = Customer(
            user_id=user.id,
            first_name=first_name or "Google",
            last_name=last_name or "User",
        )
        session.add(customer)
        await session.commit()

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=60),
    )
    return TokenResponse(access_token=token, role=user.role.value)


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role.value,
        is_active=current_user.is_active,
    )
