from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import RoleChecker, get_current_user
from app.core.security import create_access_token
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
    email: str
    password: str
    business_name: str
    description: Optional[str] = None
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


@router.post("/vendors/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_vendor(
    body: VendorRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    existing_user = await session.exec(select(User).where(User.email == body.email))
    if existing_user.one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_vendor = await session.exec(
        select(Vendor).where(Vendor.business_name == body.business_name)
    )
    if existing_vendor.one_or_none():
        raise HTTPException(status_code=409, detail="Business name already taken")

    from app.core.security import hash_password

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=UserRole.VENDOR,
    )
    session.add(user)
    await session.flush()

    vendor = Vendor(
        user_id=user.id,
        business_name=body.business_name,
        description=body.description,
        full_name=body.full_name,
        emirates_id=body.emirates_id,
        contact_mobile=body.contact_mobile,
        contact_landline=body.contact_landline,
        address=body.address,
    )
    session.add(vendor)
    await session.commit()
    await session.refresh(vendor)

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=60),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "id": str(vendor.id),
        "business_name": vendor.business_name,
        "onboarding_status": vendor.onboarding_status.value,
    }


@router.post("/vendors/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    body: DocumentUploadRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
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
