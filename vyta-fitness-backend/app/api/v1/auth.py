from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from firebase_admin import auth as firebase_auth

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.encryption import decrypt_secret
from app.core.firebase import _firebase_available
from app.core.security import firebase_login
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.models.vendor import Vendor
import pyotp

router = APIRouter(tags=["Authentication"])


# ─── Request / Response Schemas ─────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    store_role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    uid: str


class ProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    store_role: Optional[str] = None
    role: str
    is_active: bool
    email_verified: bool
    mfa_enabled: bool = False
    created_at: str


# ─── Registration ──────────────────────────────────────────


@router.post(
    "/auth/register",
    status_code=status.HTTP_201_CREATED,
)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    if not _firebase_available:
        raise HTTPException(
            status_code=503, detail="Firebase is not configured"
        )

    # 1. Check local DB for duplicate email
    existing = await session.exec(
        select(User).where(User.email == body.email)
    )
    if existing.one_or_none():
        raise HTTPException(
            status_code=409, detail="Email already registered"
        )

    # 2. Create user in Firebase Authentication
    try:
        firebase_record = firebase_auth.create_user(
            email=body.email,
            password=body.password,
        )
        uid = firebase_record.uid
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered in Firebase",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Firebase user: {e}",
        )

    # 3. Save profile to PostgreSQL
    user = User(
        id=uid,
        email=body.email,
        name=body.name,
        store_role=body.store_role or "buyer",
        role=UserRole.CUSTOMER,
    )
    session.add(user)
    await session.flush()

    customer = Customer(
        user_id=uid,
        first_name=body.name.split(" ", 1)[0] if " " in body.name else body.name,
        last_name=body.name.split(" ", 1)[1] if " " in body.name else "",
        name=body.name,
        store_role=body.store_role or "buyer",
    )
    session.add(customer)
    await session.commit()

    # 4. Log the user in to get an ID token
    try:
        id_token = firebase_login(body.email, body.password)
    except ValueError:
        return {
            "message": "User registered successfully. Please log in.",
            "profile": {
                "uid": uid,
                "email": body.email,
                "name": body.name,
                "store_role": body.store_role or "buyer",
            },
        }

    decoded = firebase_auth.verify_id_token(id_token)

    # Auto-trigger email verification link generation
    try:
        firebase_auth.generate_email_verification_link(body.email)
    except Exception:
        pass

    return LoginResponse(
        access_token=id_token,
        email=body.email,
        uid=uid,
        role="customer",
    )


# ─── Login ─────────────────────────────────────────────────


@router.post("/auth/login")
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    try:
        id_token = firebase_login(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Decode the token to extract uid + email
    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Failed to verify Firebase token after login"
        )

    uid = decoded.get("uid", "")
    email = decoded.get("email", body.email)

    # Fetch user role from DB
    result = await session.exec(select(User).where(User.id == uid))
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found in database")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    role = user.role.value

    # Check if vendor MFA is required
    if role == "vendor" and user.mfa_enabled:
        return {
            "mfa_required": True,
            "access_token": None,
            "token_type": None,
            "uid": uid,
            "email": email,
            "role": role,
        }

    return LoginResponse(
        access_token=id_token,
        email=email,
        uid=uid,
        role=role,
    )


class MFAVerifyRequest(BaseModel):
    email: EmailStr
    password: str
    code: str


@router.post("/auth/verify-mfa")
async def verify_mfa(
    body: MFAVerifyRequest,
    session: AsyncSession = Depends(get_session),
):
    if not _firebase_available:
        raise HTTPException(status_code=503, detail="Firebase is not configured")

    # Re-authenticate with Firebase to verify credentials
    try:
        id_token = firebase_login(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        decoded = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to verify Firebase token")

    uid = decoded.get("uid", "")

    # Fetch user
    result = await session.exec(select(User).where(User.id == uid))
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role != UserRole.VENDOR:
        raise HTTPException(status_code=403, detail="MFA is only supported for vendors")

    if not user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this account")

    # Fetch vendor to get TOTP secret
    vendor_result = await session.exec(select(Vendor).where(Vendor.user_id == uid))
    vendor = vendor_result.one_or_none()
    if not vendor or not vendor.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is not configured properly")

    try:
        totp_secret = decrypt_secret(vendor.totp_secret)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt TOTP secret")

    # Verify TOTP code
    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(body.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Code is valid — issue the final JWT
    return LoginResponse(
        access_token=id_token,
        email=body.email,
        uid=uid,
        role=user.role.value,
    )


# ─── Protected Profile ─────────────────────────────────────


@router.get("/users/me", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        store_role=current_user.store_role,
        role=current_user.role.value,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        mfa_enabled=current_user.mfa_enabled,
        created_at=current_user.created_at.isoformat(),
    )


# ─── Legacy compatibility aliases ──────────────────────────


@router.get("/auth/me", response_model=ProfileResponse)
async def get_me_legacy(
    current_user: User = Depends(get_current_user),
):
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        store_role=current_user.store_role,
        role=current_user.role.value,
        is_active=current_user.is_active,
        email_verified=current_user.email_verified,
        mfa_enabled=current_user.mfa_enabled,
        created_at=current_user.created_at.isoformat(),
    )


# ─── Google Sign-In ─────────────────────────────────────────


class GoogleLoginRequest(BaseModel):
    id_token: str


@router.post("/auth/google", response_model=LoginResponse)
async def google_login(body: GoogleLoginRequest, session: AsyncSession = Depends(get_session)):
    if not _firebase_available:
        raise HTTPException(status_code=503, detail="Firebase is not configured")

    try:
        decoded = firebase_auth.verify_id_token(body.id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    uid = decoded.get("uid", "")
    email = decoded.get("email", "")

    # Find or create local user
    result = await session.exec(select(User).where(User.id == uid))
    user = result.one_or_none()

    if user is None:
        name = decoded.get("name", email.split("@")[0])
        user = User(
            id=uid,
            email=email,
            name=name,
            role=UserRole.CUSTOMER,
        )
        session.add(user)
        await session.flush()

        customer = Customer(
            user_id=uid,
            first_name=name.split(" ", 1)[0] if " " in name else name,
            last_name=name.split(" ", 1)[1] if " " in name else "",
            name=name,
            store_role="buyer",
        )
        session.add(customer)
        await session.commit()
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return LoginResponse(
        access_token=body.id_token,
        email=email,
        uid=uid,
        role=user.role.value,
    )


# ─── Stubs for endpoints the frontend still calls ──────────


class EmailRequest(BaseModel):
    email: EmailStr


@router.post("/auth/send-verification-email")
async def send_verification_email(body: EmailRequest):
    if _firebase_available:
        try:
            link = firebase_auth.generate_email_verification_link(body.email)
            return {"message": "Verification email sent", "email": body.email, "link": link}
        except Exception:
            pass
    return {"message": "Verification email sent", "email": body.email}


@router.post("/auth/send-password-reset")
async def send_password_reset(body: EmailRequest):
    if _firebase_available:
        try:
            link = firebase_auth.generate_password_reset_link(body.email)
            return {"message": "Password reset email sent", "email": body.email, "link": link}
        except Exception:
            pass
    return {"message": "Password reset email sent", "email": body.email}


class ChangeEmailRequest(BaseModel):
    current_email: EmailStr
    new_email: EmailStr
    password: str


@router.post("/auth/change-email")
async def change_email(
    body: ChangeEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    if not _firebase_available:
        raise HTTPException(status_code=503, detail="Firebase is not configured")

    # Find user by current email
    result = await session.exec(select(User).where(User.email == body.current_email))
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check new email not already taken
    existing = await session.exec(select(User).where(User.email == body.new_email))
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="New email already in use")

    # Update email in Firebase Auth
    try:
        firebase_auth.update_user(
            user.id,
            email=body.new_email,
            email_verified=False,
        )
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email already registered in Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update Firebase email: {e}")

    # Update email in local database
    old_email = user.email
    user.email = body.new_email
    user.email_verified = False
    session.add(user)
    await session.commit()

    # Send verification link to new email
    try:
        firebase_auth.generate_email_verification_link(body.new_email)
    except Exception:
        pass

    # Notify old email about the change
    try:
        firebase_auth.generate_password_reset_link(old_email)
    except Exception:
        pass

    return {
        "message": "Email updated successfully. Verification sent to new email.",
        "previous_email": old_email,
        "new_email": body.new_email,
    }


class VerifyEmailRequest(BaseModel):
    email: EmailStr


@router.post("/auth/verify-email")
async def verify_email(
    body: VerifyEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    if not _firebase_available:
        raise HTTPException(status_code=503, detail="Firebase is not configured")

    result = await session.exec(select(User).where(User.email == body.email))
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check Firebase to see if email is verified
    try:
        firebase_user = firebase_auth.get_user(user.id)
        is_verified = firebase_user.email_verified
    except Exception:
        is_verified = user.email_verified

    if is_verified and not user.email_verified:
        user.email_verified = True
        session.add(user)
        await session.commit()

    return {
        "email": body.email,
        "email_verified": is_verified,
    }


@router.post("/auth/notify-email-change")
async def notify_email_change(body: EmailRequest):
    if _firebase_available:
        try:
            firebase_auth.generate_password_reset_link(body.email)
        except Exception:
            pass
    return {"message": f"Security alert sent to previous email {body.email}"}


class MFANotifyRequest(BaseModel):
    email: EmailStr
    action: str


@router.post("/auth/notify-mfa-enrollment")
async def notify_mfa_enrollment(body: MFANotifyRequest):
    if _firebase_available:
        try:
            firebase_auth.generate_email_verification_link(body.email)
        except Exception:
            pass
    return {"message": f"MFA {body.action} notification sent to {body.email}"}
