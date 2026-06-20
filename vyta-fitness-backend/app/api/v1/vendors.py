from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
import pyotp

from app.core.database import get_session
from app.core.dependencies import RequireEmailVerified, RoleChecker, get_current_user
from app.core.encryption import encrypt_secret, decrypt_secret
from app.core.firebase import _firebase_available
from app.core.security import firebase_login
from app.core.config import settings
from firebase_admin import auth as firebase_auth
from app.core.storage import storage
from app.models.user import User, UserRole
from app.models.vendor import (
    DocumentType,
    Vendor,
    VendorDocument,
    VendorTransaction,
    WithdrawalRequest,
    WithdrawalStatus,
)

router = APIRouter(tags=["Vendors"])


class VendorRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    description: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    emirates_id: Optional[str] = None
    contact_mobile: Optional[str] = None
    contact_landline: Optional[str] = None
    address: Optional[str] = None


class DocumentUploadRequest(BaseModel):
    document_type: DocumentType
    document_url: str


class WithdrawalRequestCreate(BaseModel):
    amount: Decimal
    bank_details: Dict[str, Any]


class VendorResponse(BaseModel):
    id: str
    business_name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    onboarding_status: str
    current_balance: Decimal
    full_name: Optional[str] = None
    emirates_id: Optional[str] = None
    contact_mobile: Optional[str] = None
    contact_landline: Optional[str] = None
    address: Optional[str] = None


class LedgerEntryResponse(BaseModel):
    id: str
    amount: Decimal
    type: str
    description: str
    created_at: datetime


class WithdrawalResponse(BaseModel):
    id: str
    amount: Decimal
    status: str
    bank_details: Dict[str, Any]
    created_at: datetime


class DocumentResponse(BaseModel):
    id: str
    document_type: str
    document_url: str
    status: str
    uploaded_at: datetime


@router.post("/vendors/register", status_code=status.HTTP_201_CREATED)
async def register_vendor(
    body: VendorRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    if not _firebase_available:
        raise HTTPException(status_code=503, detail="Firebase is not configured")

    existing_user = await session.exec(select(User).where(User.email == body.email))
    if existing_user.one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_vendor = await session.exec(
        select(Vendor).where(Vendor.business_name == body.business_name)
    )
    if existing_vendor.one_or_none():
        raise HTTPException(status_code=409, detail="Business name already taken")

    # Create Firebase user
    try:
        firebase_record = firebase_auth.create_user(
            email=body.email,
            password=body.password,
        )
        uid = firebase_record.uid
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email already registered in Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Firebase user: {e}")

    user = User(
        id=uid,
        email=body.email,
        name=body.business_name,
        store_role=None,
        role=UserRole.VENDOR,
    )
    session.add(user)
    await session.flush()

    vendor = Vendor(
        user_id=uid,
        business_name=body.business_name,
        description=body.description,
        first_name=body.first_name,
        last_name=body.last_name,
        full_name=body.full_name,
        emirates_id=body.emirates_id,
        contact_mobile=body.contact_mobile,
        contact_landline=body.contact_landline,
        address=body.address,
    )
    session.add(vendor)
    await session.commit()
    await session.refresh(vendor)

    # Generate verification link
    verification_link = None
    try:
        verification_link = firebase_auth.generate_email_verification_link(body.email)
    except Exception:
        pass

    # Log the user in to return an access token
    try:
        id_token = firebase_login(body.email, body.password)
        decoded = firebase_auth.verify_id_token(id_token)
        return {
            "access_token": id_token,
            "token_type": "bearer",
            "uid": uid,
            "email": body.email,
            "role": "vendor",
            "vendor_id": str(vendor.id),
            "business_name": vendor.business_name,
            "onboarding_status": vendor.onboarding_status.value,
        }
    except ValueError:
        return {
            "message": "Vendor registered successfully. Please log in.",
            "uid": uid,
            "email": body.email,
            "vendor_id": str(vendor.id),
            "business_name": vendor.business_name,
            "onboarding_status": vendor.onboarding_status.value,
        }


@router.post("/vendors/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    body: DocumentUploadRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    doc = VendorDocument(
        vendor_id=vendor.id,
        document_type=body.document_type,
        document_url=body.document_url,
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)

    return DocumentResponse(
        id=str(doc.id),
        document_type=doc.document_type.value,
        document_url=doc.document_url,
        status=doc.status.value,
        uploaded_at=doc.uploaded_at,
    )


@router.post("/vendors/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    file_ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{file_ext}"

    content = await file.read()
    document_url = await storage.upload(stored_name, content, content_type="application/pdf")

    doc = VendorDocument(
        vendor_id=vendor.id,
        document_type=DocumentType.BUSINESS_REGISTRATION,
        document_url=document_url,
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)

    return DocumentResponse(
        id=str(doc.id),
        document_type=doc.document_type.value,
        document_url=doc.document_url,
        status=doc.status.value,
        uploaded_at=doc.uploaded_at,
    )


@router.get("/vendors/documents", response_model=List[DocumentResponse])
async def list_documents(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    docs_result = await session.exec(
        select(VendorDocument).where(VendorDocument.vendor_id == vendor.id)
    )
    docs = docs_result.all()
    return [
        DocumentResponse(
            id=str(d.id),
            document_type=d.document_type.value,
            document_url=d.document_url,
            status=d.status.value,
            uploaded_at=d.uploaded_at,
        )
        for d in docs
    ]


@router.get("/vendors/ledger", response_model=List[LedgerEntryResponse])
async def get_ledger(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    txns_result = await session.exec(
        select(VendorTransaction)
        .where(VendorTransaction.vendor_id == vendor.id)
        .order_by(VendorTransaction.created_at.desc())
    )
    txns = txns_result.all()
    return [
        LedgerEntryResponse(
            id=str(t.id),
            amount=t.amount,
            type=t.type.value,
            description=t.description,
            created_at=t.created_at,
        )
        for t in txns
    ]


@router.post("/vendors/withdraw", response_model=WithdrawalResponse, status_code=status.HTTP_201_CREATED)
async def request_withdrawal(
    body: WithdrawalRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    if vendor.current_balance < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    wd = WithdrawalRequest(
        vendor_id=vendor.id,
        amount=body.amount,
        bank_details=body.bank_details,
    )
    session.add(wd)
    await session.commit()
    await session.refresh(wd)

    return WithdrawalResponse(
        id=str(wd.id),
        amount=wd.amount,
        status=wd.status.value,
        bank_details=wd.bank_details,
        created_at=wd.created_at,
    )


@router.get("/vendors/withdrawals", response_model=List[WithdrawalResponse])
async def list_withdrawals(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    wds_result = await session.exec(
        select(WithdrawalRequest)
        .where(WithdrawalRequest.vendor_id == vendor.id)
        .order_by(WithdrawalRequest.created_at.desc())
    )
    wds = wds_result.all()
    return [
        WithdrawalResponse(
            id=str(w.id),
            amount=w.amount,
            status=w.status.value,
            bank_details=w.bank_details,
            created_at=w.created_at,
        )
        for w in wds
    ]


@router.get("/vendors/me", response_model=VendorResponse)
async def get_vendor_profile(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
    _: User = Depends(RequireEmailVerified()),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    return VendorResponse(
        id=str(vendor.id),
        business_name=vendor.business_name,
        description=vendor.description,
        logo_url=vendor.logo_url,
        onboarding_status=vendor.onboarding_status.value,
        current_balance=vendor.current_balance,
        full_name=vendor.full_name,
        emirates_id=vendor.emirates_id,
        contact_mobile=vendor.contact_mobile,
        contact_landline=vendor.contact_landline,
        address=vendor.address,
    )


# ─── MFA / TOTP Endpoints ──────────────────────────────────


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_url: str


@router.post("/vendors/mfa/setup")
async def mfa_setup(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled. Disable it first to reconfigure.")

    # Clear any stale (unverified) secret before generating a new one
    vendor.totp_secret = None

    # Generate new TOTP secret
    totp_secret = pyotp.random_base32()
    encrypted = encrypt_secret(totp_secret)

    # Build provisioning URI for QR code
    issuer = settings.TOTP_ISSUER_NAME
    provisioning_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
        name=current_user.email,
        issuer_name=issuer,
    )

    # Store encrypted secret (but don't enable MFA yet — user must verify first)
    vendor.totp_secret = encrypted
    session.add(vendor)
    await session.commit()

    return MFASetupResponse(
        secret=totp_secret,
        provisioning_uri=provisioning_uri,
        qr_code_url=provisioning_uri,
    )


class MFAVerifySetupRequest(BaseModel):
    code: str


@router.post("/vendors/mfa/verify-setup")
async def mfa_verify_setup(
    body: MFAVerifySetupRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    if not vendor.totp_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated. Call /vendors/mfa/setup first.")

    try:
        totp_secret = decrypt_secret(vendor.totp_secret)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt TOTP secret")

    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(body.code):
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")

    # Enable MFA
    current_user.mfa_enabled = True
    session.add(current_user)
    await session.commit()

    return {"message": "MFA enabled successfully.", "mfa_enabled": True}


@router.post("/vendors/mfa/disable")
async def mfa_disable(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    result = await session.exec(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    vendor.totp_secret = None
    current_user.mfa_enabled = False
    session.add(vendor)
    session.add(current_user)
    await session.commit()

    return {"message": "MFA disabled successfully.", "mfa_enabled": False}


@router.get("/vendors/mfa/status")
async def mfa_status(
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    return {
        "mfa_enabled": current_user.mfa_enabled,
        "email": current_user.email,
    }
