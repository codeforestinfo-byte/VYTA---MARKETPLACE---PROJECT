import hashlib
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from firebase_admin import auth as firebase_auth

from app.core.config import settings
from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.core.admin_auth import create_admin_token, create_admin_temp_token, get_admin_user, hash_password, verify_password
from app.core.encryption import encrypt_secret, decrypt_secret
from app.core.firebase import _firebase_available
from app.core.security import firebase_login
from app.models.admin import AdminSession, LoginHistory
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.models.vendor import Vendor, VendorLoginHistory, VendorSession
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
async def login(body: LoginRequest, request: Request, session: AsyncSession = Depends(get_session)):
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

    ip_address = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() if request.headers.get("X-Forwarded-For") else (request.client.host if request.client else "0.0.0.0")
    user_agent = request.headers.get("User-Agent")

    # Fetch user role from DB
    result = await session.exec(select(User).where(User.id == uid))
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found in database")
    if not user.is_active:
        if user.role == UserRole.VENDOR:
            session.add(VendorLoginHistory(
                vendor_id=uid,
                ip_address=ip_address,
                user_agent=user_agent,
                success=False,
                failure_reason="Account is inactive",
            ))
            await session.commit()
        raise HTTPException(status_code=403, detail="Inactive user")

    role = user.role.value

    # Record vendor login attempt
    if role == "vendor":
        session.add(VendorLoginHistory(
            vendor_id=uid,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            failure_reason=None,
        ))
        await session.commit()

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

    # Create vendor session on successful login
    if role == "vendor":
        session.add(VendorSession(
            vendor_id=uid,
            token_hash=hashlib.sha256(uuid.uuid4().bytes).hexdigest(),
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
        ))
        await session.commit()

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
    request: Request,
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
    ip_address = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() if request.headers.get("X-Forwarded-For") else (request.client.host if request.client else "0.0.0.0")
    user_agent = request.headers.get("User-Agent")

    entry = VendorLoginHistory(
        vendor_id=uid,
        ip_address=ip_address,
        user_agent=user_agent,
        success=True,
        failure_reason=None,
    )
    session.add(entry)

    vendor_session_entry = VendorSession(
        vendor_id=uid,
        token_hash=hashlib.sha256(uuid.uuid4().bytes).hexdigest(),
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=True,
    )
    session.add(vendor_session_entry)
    await session.commit()

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


# ─── Admin Console Local Auth (no Firebase) ─────────────────


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    temp_token: Optional[str] = None
    email: str
    uid: str
    role: str
    name: str = ""
    store_role: Optional[str] = None


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


@router.post("/auth/admin-login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest, request: Request, session: AsyncSession = Depends(get_session)):
    if not settings.ADMIN_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Admin auth is not configured")

    ip_address = _get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    result = await session.exec(select(User).where(User.email == body.email))
    user = result.one_or_none()

    if not user:
        entry = LoginHistory(admin_id="unknown", ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="User not found")
        session.add(entry)
        await session.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="Account is inactive")
        session.add(entry)
        await session.commit()
        raise HTTPException(status_code=403, detail="Account is inactive")

    if user.role != UserRole.ADMIN:
        entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="Not an admin user")
        session.add(entry)
        await session.commit()
        raise HTTPException(status_code=403, detail="Not an admin user")

    if not user.password_hash:
        if _firebase_available:
            try:
                firebase_login(body.email, body.password)
            except ValueError:
                entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="Firebase auth failed")
                session.add(entry)
                await session.commit()
                raise HTTPException(status_code=401, detail="Invalid email or password")
        else:
            entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="No password set")
            session.add(entry)
            await session.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")
    elif not verify_password(body.password, user.password_hash):
        entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="Invalid password")
        session.add(entry)
        await session.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.email_verified:
        entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=False, failure_reason="Email not verified")
        session.add(entry)
        await session.commit()
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox for the verification link.")

    # Check if admin has MFA enabled
    if user.mfa_enabled:
        temp_token = create_admin_temp_token(user.id)
        return AdminLoginResponse(
            access_token=None,
            mfa_required=True,
            temp_token=temp_token,
            email=user.email,
            uid=user.id,
            role=user.role.value,
            name=user.name,
            store_role=user.store_role,
        )

    token = create_admin_token(user.id)

    entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=True, failure_reason=None)
    session.add(entry)

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    admin_session = AdminSession(admin_id=user.id, token_hash=token_hash, ip_address=ip_address, user_agent=user_agent, is_active=True)
    session.add(admin_session)
    await session.commit()

    return AdminLoginResponse(
        access_token=token,
        email=user.email,
        uid=user.id,
        role=user.role.value,
        name=user.name,
        store_role=user.store_role,
    )


# ─── Admin 2FA / MFA ───────────────────────────────────────

class AdminMFAVerifyRequest(BaseModel):
    temp_token: str
    code: str


@router.post("/auth/admin/verify-mfa")
async def admin_verify_mfa(
    body: AdminMFAVerifyRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    if not settings.ADMIN_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Admin auth is not configured")

    # Verify temp token
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(body.temp_token, settings.ADMIN_JWT_SECRET, algorithms=[settings.ADMIN_JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id or not payload.get("mfa_pending"):
            raise HTTPException(status_code=401, detail="Invalid temp token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired temp token")

    user = await session.get(User, user_id)
    if not user or not user.is_active or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    if not user.mfa_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is not enabled for this account")

    # Verify TOTP code
    try:
        totp_secret = decrypt_secret(user.totp_secret)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt TOTP secret")

    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Code valid — issue full JWT
    ip_address = _get_client_ip(request)
    user_agent = request.headers.get("User-Agent")
    token = create_admin_token(user.id)

    entry = LoginHistory(admin_id=user.id, ip_address=ip_address, user_agent=user_agent, success=True, failure_reason=None)
    session.add(entry)

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    admin_session = AdminSession(admin_id=user.id, token_hash=token_hash, ip_address=ip_address, user_agent=user_agent, is_active=True)
    session.add(admin_session)
    await session.commit()

    return AdminLoginResponse(
        access_token=token,
        email=user.email,
        uid=user.id,
        role=user.role.value,
        name=user.name,
        store_role=user.store_role,
    )


class AdminMFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_url: str


@router.post("/auth/admin/mfa/setup")
async def admin_mfa_setup(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled. Disable it first to reconfigure.")

    current_user.totp_secret = None
    session.add(current_user)

    totp_secret = pyotp.random_base32()
    encrypted = encrypt_secret(totp_secret)

    issuer = settings.TOTP_ISSUER_NAME
    provisioning_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=current_user.email,
        issuer_name=issuer,
    )

    current_user.totp_secret = encrypted
    session.add(current_user)
    await session.commit()

    return AdminMFASetupResponse(
        secret=totp_secret,
        provisioning_uri=provisioning_uri,
        qr_code_url=provisioning_uri,
    )


class AdminMFAVerifySetupRequest(BaseModel):
    code: str


@router.post("/auth/admin/mfa/verify-setup")
async def admin_mfa_verify_setup(
    body: AdminMFAVerifySetupRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated. Call setup first.")

    try:
        totp_secret = decrypt_secret(current_user.totp_secret)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt TOTP secret")

    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")

    current_user.mfa_enabled = True
    session.add(current_user)
    await session.commit()

    return {"message": "2FA enabled successfully.", "mfa_enabled": True}


@router.post("/auth/admin/mfa/disable")
async def admin_mfa_disable(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_admin_user),
):
    current_user.totp_secret = None
    current_user.mfa_enabled = False
    session.add(current_user)
    await session.commit()

    return {"message": "2FA disabled successfully.", "mfa_enabled": False}


@router.get("/auth/admin/mfa/status")
async def admin_mfa_status(
    current_user: User = Depends(get_admin_user),
):
    return {
        "mfa_enabled": current_user.mfa_enabled,
        "email": current_user.email,
    }


# ─── Admin Email Verification ─────────────────────────────

import uuid
from datetime import timedelta


class AdminSendVerificationRequest(BaseModel):
    email: EmailStr


class AdminVerifyEmailRequest(BaseModel):
    token: str


@router.post("/auth/admin/send-verification")
async def admin_send_verification(
    body: AdminSendVerificationRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(select(User).where(User.email == body.email))
    user = result.one_or_none()
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    if user.email_verified:
        return {"message": "Email is already verified"}

    token = uuid.uuid4().hex
    user.verification_token = token
    user.verification_token_expires = datetime.utcnow() + timedelta(
        hours=settings.ADMIN_VERIFICATION_TOKEN_EXPIRY_HOURS
    )
    session.add(user)
    await session.commit()

    verify_link = f"{settings.ADMIN_BASE_URL}/verify-email?token={token}"
    body_text = (
        f"Hello {user.name},\n\n"
        f"Please verify your admin email address by clicking the link below:\n\n"
        f"{verify_link}\n\n"
        f"This link expires in {settings.ADMIN_VERIFICATION_TOKEN_EXPIRY_HOURS} hours.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"VYTA Marketplace"
    )

    try:
        from app.core.email import send_email
        send_email(to=user.email, subject="Verify your VYTA admin email", body=body_text)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to send verification email")

    return {"message": "Verification email sent"}


@router.post("/auth/admin/verify-email")
async def admin_verify_email(
    body: AdminVerifyEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    now = datetime.utcnow()
    result = await session.exec(
        select(User).where(
            User.verification_token == body.token,
            User.role == UserRole.ADMIN,
        )
    )
    user = result.one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if user.verification_token_expires and user.verification_token_expires < now:
        user.verification_token = None
        user.verification_token_expires = None
        session.add(user)
        await session.commit()
        raise HTTPException(status_code=400, detail="Verification token has expired. Request a new one.")

    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    session.add(user)
    await session.commit()

    return {"message": "Email verified successfully"}


class AdminProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    store_role: Optional[str] = None
    email_verified: bool = True


@router.get("/auth/admin-me", response_model=AdminProfileResponse)
async def admin_me(current_user: User = Depends(get_admin_user)):
    return AdminProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        store_role=current_user.store_role,
        email_verified=current_user.email_verified,
    )
