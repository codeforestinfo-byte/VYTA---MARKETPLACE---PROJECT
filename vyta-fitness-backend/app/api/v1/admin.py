from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlmodel import select, func, or_, desc, asc, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.admin_auth import hash_password, verify_password
from app.core.database import get_session
from app.core.dependencies import RoleChecker, AdminRoleChecker
from app.core.firebase import _firebase_available
from firebase_admin import auth as firebase_auth
from app.models.admin import (
    AdminRole,
    PermissionModule,
    PermissionAction,
    AdminRolePermission,
    AdminInvitation,
    AuditLog,
    LoginHistory,
    AdminSession,
    ApprovalStatus,
    AdminApproval,
    AccountLockout,
    SessionPolicyConfig,
    AuditLogRetentionConfig,
    IPAllowlistEntry,
    ForceAction,
)
from app.models.consultation import ConsultationStatus, NutritionConsultation
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.vendor import (
    DocumentStatus,
    OnboardingStatus,
    TransactionType,
    Vendor,
    VendorDocument,
    VendorTransaction,
    VendorAuditLog,
    VendorLoginHistory,
    VendorSession,
    WithdrawalRequest,
    WithdrawalStatus,
)

router = APIRouter(tags=["Admin"])


class VendorResponse(BaseModel):
    id: str
    business_name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    full_name: Optional[str] = None
    emirates_id: Optional[str] = None
    contact_mobile: Optional[str] = None
    contact_landline: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    onboarding_status: str
    current_balance: Decimal
    created_at: datetime


class AdminVendorUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
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
    vendor_id: str
    amount: Decimal
    status: str
    bank_details: dict
    created_at: datetime
    processed_at: Optional[datetime] = None


class DocumentResponse(BaseModel):
    id: str
    vendor_id: str
    document_type: str
    document_url: str
    status: str
    uploaded_at: datetime


class OrderSummary(BaseModel):
    id: str
    customer_name: str
    total_amount: Decimal
    status: str
    created_at: datetime


class DashboardStats(BaseModel):
    total_customers: int
    total_vendors: int
    total_products: int
    total_orders: int
    total_revenue: Decimal
    pending_vendors: int
    pending_withdrawals: int
    recent_orders: List[OrderSummary]


class OrderItemResponse(BaseModel):
    product_name: str
    quantity: int
    price_at_purchase: Decimal


class OrderDetail(BaseModel):
    id: str
    customer_name: str
    customer_email: str
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemResponse]


class CustomerResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    name: Optional[str] = None
    store_role: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    is_email_verified: bool = False
    mfa_enabled: bool = False
    created_at: datetime


class CustomerDetail(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    name: Optional[str] = None
    store_role: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    is_email_verified: bool = False
    mfa_enabled: bool = False
    shipping_address: Optional[str] = None
    created_at: datetime
    orders: List[OrderSummary]


class ProductResponse(BaseModel):
    id: str
    vendor_business_name: str
    name: str
    price: Decimal
    stock_quantity: int
    is_available: bool
    created_at: datetime


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None


class ConsultationResponse(BaseModel):
    id: str
    customer_name: str
    vendor_business_name: str
    scheduled_at: datetime
    status: str
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class ConsultationUpdate(BaseModel):
    status: ConsultationStatus
    notes: Optional[str] = None


class AdminProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class AdminProductCreate(BaseModel):
    vendor_id: uuid.UUID
    name: str
    description: Optional[str] = ""
    price: Decimal
    stock_quantity: int = 0
    image_url: Optional[str] = None


class AdminVendorCreate(BaseModel):
    email: str
    password: str
    business_name: str
    description: Optional[str] = None


class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: str
    store_role: Optional[str] = None
    role: str
    is_active: bool
    email_verified: bool
    is_super_admin: bool = False
    mfa_enabled: bool
    last_login: Optional[datetime] = None
    created_at: datetime


class AdminUserListResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int
    skip: int
    limit: int


class AdminUserCreate(BaseModel):
    email: str
    password: str
    name: str
    store_role: AdminRole = AdminRole.ADMIN


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    store_role: Optional[AdminRole] = None
    is_active: Optional[bool] = None


class AdminInvitationResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    token: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    invited_by: str
    created_at: datetime


class AuditLogResponse(BaseModel):
    id: str
    admin_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime


class LoginHistoryResponse(BaseModel):
    id: str
    admin_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    failure_reason: Optional[str] = None
    created_at: datetime


class AdminSessionResponse(BaseModel):
    id: str
    admin_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    last_activity: datetime
    created_at: datetime


class VendorAuditLogResponse(BaseModel):
    id: str
    vendor_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime


class VendorLoginHistoryResponse(BaseModel):
    id: str
    vendor_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    failure_reason: Optional[str] = None
    created_at: datetime


class VendorSessionResponse(BaseModel):
    id: str
    vendor_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    last_activity: datetime
    created_at: datetime


# ─── Role & Permission Schemas ──────────────────────────

class PermissionResponse(BaseModel):
    id: str
    role: str
    module: str
    action: str
    created_at: datetime


class PermissionCreate(BaseModel):
    role: AdminRole
    module: PermissionModule
    action: PermissionAction


class PermissionsByRoleResponse(BaseModel):
    role: str
    permissions: List[dict]


# ─── Invitation Schemas ────────────────────────────────

class InvitationCreate(BaseModel):
    email: str
    name: str
    role: AdminRole = AdminRole.ADMIN


class InvitationListResponse(BaseModel):
    items: List[AdminInvitationResponse]
    total: int
    skip: int
    limit: int


# ─── Admin Profile Schemas ─────────────────────────────

class AdminProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    store_role: Optional[str] = None
    role: str
    is_active: bool
    email_verified: bool
    is_super_admin: bool = False
    mfa_enabled: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AdminProfileUpdateExtended(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


# ─── Force Action Schemas ────────────────────────────

class ForceActionResponse(BaseModel):
    id: str
    admin_id: str
    action_type: str
    is_completed: bool
    forced_by: str
    completed_at: Optional[datetime] = None
    created_at: datetime


# ─── Account Lockout Schemas ──────────────────────────

class AccountLockoutResponse(BaseModel):
    id: str
    admin_id: str
    admin_name: str
    admin_email: str
    failed_attempts: int
    locked_until: Optional[datetime] = None
    is_locked: bool
    last_failure_at: Optional[datetime] = None
    created_at: datetime


class LockoutConfigResponse(BaseModel):
    max_attempts: int
    lockout_duration_minutes: int


# ─── Approval Schemas ─────────────────────────────────

class AdminApprovalResponse(BaseModel):
    id: str
    admin_id: str
    admin_name: str
    admin_email: str
    requested_role: str
    status: str
    approved_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class ApprovalReview(BaseModel):
    notes: Optional[str] = None


# ─── Timeline Schemas ─────────────────────────────────

class TimelineEvent(BaseModel):
    id: str
    event_type: str  # audit, login, session
    action: str
    description: str
    admin_id: str
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime


# ─── Audit Log Retention Schemas ──────────────────────

class RetentionConfigResponse(BaseModel):
    retention_days: int
    auto_delete_enabled: bool
    last_cleaned_at: Optional[datetime] = None


class RetentionConfigUpdate(BaseModel):
    retention_days: Optional[int] = None
    auto_delete_enabled: Optional[bool] = None


# ─── Session Policy Schemas ───────────────────────────

class SessionPolicyResponse(BaseModel):
    idle_timeout_minutes: int
    max_concurrent_sessions: int
    enforce_for_all: bool


class SessionPolicyUpdate(BaseModel):
    idle_timeout_minutes: Optional[int] = None
    max_concurrent_sessions: Optional[int] = None
    enforce_for_all: Optional[bool] = None


# ─── IP Allowlist Schemas ────────────────────────────

class IPAllowlistEntryResponse(BaseModel):
    id: str
    ip_address: str
    description: Optional[str] = None
    is_active: bool
    created_by: str
    created_at: datetime


class IPAllowlistCreate(BaseModel):
    ip_address: str
    description: Optional[str] = None


# ─── Bulk Import Schemas ─────────────────────────────

class BulkImportItem(BaseModel):
    email: str
    name: str
    password: str
    store_role: AdminRole = AdminRole.ADMIN


class BulkImportRequest(BaseModel):
    users: List[BulkImportItem]


class BulkImportResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    errors: List[dict]


# ─── Audit Log Helper ─────────────────────────────────────

async def _create_audit_log(
    session: AsyncSession,
    admin_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
):
    log = AuditLog(
        admin_id=admin_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=request.client.host if request and request.client else None,
    )
    session.add(log)


# ─── Dashboard Stats ───────────────────────────────────────

@router.get("/admin/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    cust_count = (await session.exec(select(func.count(Customer.id)))).one()
    vend_count = (await session.exec(select(func.count(Vendor.id)))).one()
    prod_count = (await session.exec(select(func.count(Product.id)))).one()
    order_count = (await session.exec(select(func.count(Order.id)))).one()

    revenue_result = await session.exec(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        )
    )
    total_revenue = revenue_result.one()

    pending_v = (await session.exec(
        select(func.count(Vendor.id)).where(Vendor.onboarding_status == OnboardingStatus.PENDING)
    )).one()
    pending_w = (await session.exec(
        select(func.count(WithdrawalRequest.id)).where(WithdrawalRequest.status == WithdrawalStatus.PENDING)
    )).one()

    recent = await session.exec(
        select(Order).order_by(Order.created_at.desc()).limit(5)
    )
    recent_orders = []
    for o in recent.all():
        c = await session.get(Customer, o.customer_id)
        name = f"{c.first_name} {c.last_name}" if c else "Unknown"
        recent_orders.append(OrderSummary(
            id=str(o.id), customer_name=name,
            total_amount=o.total_amount, status=o.status.value,
            created_at=o.created_at,
        ))

    return DashboardStats(
        total_customers=cust_count,
        total_vendors=vend_count,
        total_products=prod_count,
        total_orders=order_count,
        total_revenue=total_revenue,
        pending_vendors=pending_v,
        pending_withdrawals=pending_w,
        recent_orders=recent_orders,
    )


# ─── Orders ────────────────────────────────────────────────

@router.get("/admin/orders", response_model=List[OrderSummary])
async def list_orders(
    status_filter: Optional[OrderStatus] = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(Order).order_by(Order.created_at.desc())
    if status_filter:
        query = query.where(Order.status == status_filter)
    result = await session.exec(query)
    orders = []
    for o in result.all():
        c = await session.get(Customer, o.customer_id)
        name = f"{c.first_name} {c.last_name}" if c else "Unknown"
        orders.append(OrderSummary(
            id=str(o.id), customer_name=name,
            total_amount=o.total_amount, status=o.status.value,
            created_at=o.created_at,
        ))
    return orders


@router.get("/admin/orders/{order_id}", response_model=OrderDetail)
async def get_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(404, detail="Order not found")

    c = await session.get(Customer, order.customer_id)
    customer_email = ""
    customer_name = "Unknown"
    if c:
        u = await session.get(User, c.user_id)
        customer_email = u.email if u else ""
        customer_name = f"{c.first_name} {c.last_name}"

    items_result = await session.exec(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = []
    for item in items_result.all():
        p = await session.get(Product, item.product_id)
        items.append(OrderItemResponse(
            product_name=p.name if p else "Unknown",
            quantity=item.quantity,
            price_at_purchase=item.price_at_purchase,
        ))

    return OrderDetail(
        id=str(order.id), customer_name=customer_name,
        customer_email=customer_email, total_amount=order.total_amount,
        status=order.status.value, created_at=order.created_at,
        items=items,
    )


# ─── Customers ─────────────────────────────────────────────

@router.get("/admin/customers", response_model=List[CustomerResponse])
async def list_customers(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(
        select(Customer, User).join(User).order_by(Customer.created_at.desc())
    )
    return [
        CustomerResponse(
            id=str(c.id), email=u.email,
            first_name=c.first_name, last_name=c.last_name,
            name=c.name, store_role=c.store_role,
            phone=c.phone, is_active=u.is_active,
            is_email_verified=u.email_verified, mfa_enabled=u.mfa_enabled,
            created_at=c.created_at,
        )
        for c, u in result.all()
    ]


@router.get("/admin/customers/{customer_id}", response_model=CustomerDetail)
async def get_customer(
    customer_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    c = await session.get(Customer, customer_id)
    if not c:
        raise HTTPException(404, detail="Customer not found")
    u = await session.get(User, c.user_id)

    orders_result = await session.exec(
        select(Order).where(Order.customer_id == customer_id).order_by(Order.created_at.desc())
    )
    orders = [
        OrderSummary(
            id=str(o.id), customer_name=f"{c.first_name} {c.last_name}",
            total_amount=o.total_amount, status=o.status.value,
            created_at=o.created_at,
        )
        for o in orders_result.all()
    ]

    return CustomerDetail(
        id=str(c.id), email=u.email if u else "",
        first_name=c.first_name, last_name=c.last_name,
        name=c.name, store_role=c.store_role,
        phone=c.phone, is_active=u.is_active if u else True,
        is_email_verified=u.email_verified if u else False,
        mfa_enabled=u.mfa_enabled if u else False,
        shipping_address=c.shipping_address,
        created_at=c.created_at, orders=orders,
    )


# ─── Vendors ────────────────────────────────────────────────

async def _vendor_to_response(v: Vendor, email: Optional[str] = None) -> VendorResponse:
    return VendorResponse(
        id=str(v.id),
        business_name=v.business_name,
        description=v.description,
        logo_url=v.logo_url,
        full_name=v.full_name,
        emirates_id=v.emirates_id,
        contact_mobile=v.contact_mobile,
        contact_landline=v.contact_landline,
        address=v.address,
        email=email,
        onboarding_status=v.onboarding_status.value,
        current_balance=v.current_balance,
        created_at=v.created_at,
    )


@router.get("/admin/vendors", response_model=List[VendorResponse])
async def list_vendors(
    search: Optional[str] = Query(None, description="Search by business name, full name, or email"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending, approved, rejected"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    base_query = select(Vendor)

    if status_filter:
        status_val = OnboardingStatus(status_filter)
        base_query = base_query.where(Vendor.onboarding_status == status_val)

    result = await session.exec(base_query)
    vendors = result.all()

    # Resolve emails
    user_ids = [v.user_id for v in vendors]
    email_map: dict[str, str] = {}
    if user_ids:
        users_result = await session.exec(select(User).where(User.id.in_(user_ids)))
        for u in users_result.all():
            email_map[u.id] = u.email

    # Build response list
    enriched = []
    for v in vendors:
        enriched.append(await _vendor_to_response(v, email_map.get(v.user_id)))

    # Client-side search filter (since SQLite may not support ILIKE on joined fields well)
    if search:
        q = search.lower()
        enriched = [
            e for e in enriched
            if q in e.business_name.lower()
            or (e.full_name and q in e.full_name.lower())
            or (e.email and q in e.email.lower())
        ]

    # Sort
    sort_reverse = sort_order == "desc"
    if sort_by == "business_name":
        enriched.sort(key=lambda e: e.business_name.lower(), reverse=sort_reverse)
    elif sort_by == "onboarding_status":
        enriched.sort(key=lambda e: e.onboarding_status, reverse=sort_reverse)
    elif sort_by == "current_balance":
        enriched.sort(key=lambda e: e.current_balance, reverse=sort_reverse)
    elif sort_by == "email":
        enriched.sort(key=lambda e: e.email or "", reverse=sort_reverse)
    else:
        enriched.sort(key=lambda e: e.created_at, reverse=sort_reverse)

    total = len(enriched)
    paginated = enriched[skip:skip + limit]

    return paginated


@router.get("/admin/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    user = await session.get(User, vendor.user_id)
    return await _vendor_to_response(vendor, user.email if user else None)


@router.get("/admin/vendors/{vendor_id}/documents", response_model=List[DocumentResponse])
async def get_vendor_documents(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await session.exec(
        select(VendorDocument).where(VendorDocument.vendor_id == vendor_id)
    )
    docs = result.all()
    return [
        DocumentResponse(
            id=str(d.id),
            vendor_id=str(d.vendor_id),
            document_type=d.document_type.value,
            document_url=d.document_url,
            status=d.status.value,
            uploaded_at=d.uploaded_at,
        )
        for d in docs
    ]


@router.post("/admin/vendors/{vendor_id}/verify", response_model=VendorResponse)
async def verify_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.onboarding_status != OnboardingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Vendor already processed")

    vendor.onboarding_status = OnboardingStatus.APPROVED
    session.add(vendor)

    docs_result = await session.exec(
        select(VendorDocument).where(VendorDocument.vendor_id == vendor_id)
    )
    for doc in docs_result.all():
        doc.status = DocumentStatus.APPROVED
        session.add(doc)

    await session.commit()
    await session.refresh(vendor)

    user = await session.get(User, vendor.user_id)
    return await _vendor_to_response(vendor, user.email if user else None)


@router.post("/admin/vendors/{vendor_id}/reject", response_model=VendorResponse)
async def reject_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.onboarding_status != OnboardingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Vendor already processed")

    vendor.onboarding_status = OnboardingStatus.REJECTED
    session.add(vendor)

    docs_result = await session.exec(
        select(VendorDocument).where(VendorDocument.vendor_id == vendor_id)
    )
    for doc in docs_result.all():
        doc.status = DocumentStatus.REJECTED
        session.add(doc)

    await session.commit()
    await session.refresh(vendor)

    user = await session.get(User, vendor.user_id)
    return await _vendor_to_response(vendor, user.email if user else None)


@router.post("/admin/vendors", response_model=VendorResponse, status_code=201)
async def create_vendor(
    body: AdminVendorCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
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

    # Create local user profile
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
    )
    session.add(vendor)
    await session.commit()
    await session.refresh(vendor)

    return await _vendor_to_response(vendor, body.email)


# ─── Vendor Update / Delete ─────────────────────────────────

@router.put("/admin/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    body: AdminVendorUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if body.business_name is not None:
        vendor.business_name = body.business_name
    if body.description is not None:
        vendor.description = body.description
    if body.full_name is not None:
        vendor.full_name = body.full_name
    if body.emirates_id is not None:
        vendor.emirates_id = body.emirates_id
    if body.contact_mobile is not None:
        vendor.contact_mobile = body.contact_mobile
    if body.contact_landline is not None:
        vendor.contact_landline = body.contact_landline
    if body.address is not None:
        vendor.address = body.address

    session.add(vendor)
    await session.commit()
    await session.refresh(vendor)

    user = await session.get(User, vendor.user_id)
    return await _vendor_to_response(vendor, user.email if user else None)


@router.delete("/admin/vendors/{vendor_id}/hard", status_code=204)
async def hard_delete_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Delete related records
    docs = await session.exec(
        select(VendorDocument).where(VendorDocument.vendor_id == vendor_id)
    )
    for d in docs.all():
        await session.delete(d)

    txns = await session.exec(
        select(VendorTransaction).where(VendorTransaction.vendor_id == vendor_id)
    )
    for t in txns.all():
        await session.delete(t)

    wds = await session.exec(
        select(WithdrawalRequest).where(WithdrawalRequest.vendor_id == vendor_id)
    )
    for w in wds.all():
        await session.delete(w)

    user = await session.get(User, vendor.user_id)
    if user:
        await session.delete(user)

    await session.delete(vendor)
    await session.commit()


# ─── Vendor Ledger ──────────────────────────────────────────

@router.get("/admin/vendors/{vendor_id}/ledger", response_model=List[LedgerEntryResponse])
async def get_vendor_ledger(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await session.exec(
        select(VendorTransaction)
        .where(VendorTransaction.vendor_id == vendor_id)
        .order_by(VendorTransaction.created_at.desc())
    )
    return [
        LedgerEntryResponse(
            id=str(t.id),
            amount=t.amount,
            type=t.type.value,
            description=t.description,
            created_at=t.created_at,
        )
        for t in result.all()
    ]


# ─── Vendor Withdrawals ─────────────────────────────────────

@router.get("/admin/vendors/{vendor_id}/withdrawals", response_model=List[WithdrawalResponse])
async def get_vendor_withdrawals(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await session.exec(
        select(WithdrawalRequest)
        .where(WithdrawalRequest.vendor_id == vendor_id)
        .order_by(WithdrawalRequest.created_at.desc())
    )
    return [
        WithdrawalResponse(
            id=str(w.id),
            vendor_id=str(w.vendor_id),
            amount=w.amount,
            status=w.status.value,
            bank_details=w.bank_details,
            created_at=w.created_at,
            processed_at=w.processed_at,
        )
        for w in result.all()
    ]


# ─── Vendor Products ────────────────────────────────────────

@router.get("/admin/vendors/{vendor_id}/products", response_model=List[ProductResponse])
async def get_vendor_products(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    result = await session.exec(
        select(Product)
        .where(Product.vendor_id == vendor_id)
        .order_by(Product.created_at.desc())
    )
    return [
        ProductResponse(
            id=str(p.id),
            vendor_business_name=vendor.business_name,
            name=p.name,
            price=p.price,
            stock_quantity=p.stock_quantity,
            is_available=p.is_available,
            created_at=p.created_at,
        )
        for p in result.all()
    ]


# ─── Withdrawals ────────────────────────────────────────────

@router.get("/admin/withdrawals", response_model=List[WithdrawalResponse])
async def list_withdrawals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending, approved, rejected"),
    vendor_id: Optional[uuid.UUID] = Query(None, description="Filter by vendor"),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(WithdrawalRequest).order_by(WithdrawalRequest.created_at.desc())
    if status_filter:
        status_val = WithdrawalStatus(status_filter)
        query = query.where(WithdrawalRequest.status == status_val)
    if vendor_id:
        query = query.where(WithdrawalRequest.vendor_id == vendor_id)

    result = await session.exec(query)
    wds = result.all()
    return [
        WithdrawalResponse(
            id=str(w.id),
            vendor_id=str(w.vendor_id),
            amount=w.amount,
            status=w.status.value,
            bank_details=w.bank_details,
            created_at=w.created_at,
            processed_at=w.processed_at,
        )
        for w in wds
    ]


@router.post("/admin/withdrawals/{withdrawal_id}/approve", response_model=WithdrawalResponse)
async def approve_withdrawal(
    withdrawal_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    wd = await session.get(WithdrawalRequest, withdrawal_id)
    if not wd:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if wd.status != WithdrawalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Withdrawal already processed")

    vendor = await session.get(Vendor, wd.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if vendor.current_balance < wd.amount:
        raise HTTPException(status_code=400, detail="Insufficient vendor balance")

    vendor.current_balance -= wd.amount
    session.add(vendor)

    transaction = VendorTransaction(
        vendor_id=vendor.id,
        order_id=None,
        amount=wd.amount,
        type=TransactionType.DEBIT,
        description=f"Withdrawal: request {wd.id}",
    )
    session.add(transaction)

    wd.status = WithdrawalStatus.APPROVED
    wd.processed_at = datetime.utcnow()
    session.add(wd)

    await session.commit()
    await session.refresh(wd)

    return WithdrawalResponse(
        id=str(wd.id),
        vendor_id=str(wd.vendor_id),
        amount=wd.amount,
        status=wd.status.value,
        bank_details=wd.bank_details,
        created_at=wd.created_at,
        processed_at=wd.processed_at,
    )


@router.post("/admin/withdrawals/{withdrawal_id}/reject", response_model=WithdrawalResponse)
async def reject_withdrawal(
    withdrawal_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    wd = await session.get(WithdrawalRequest, withdrawal_id)
    if not wd:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    if wd.status != WithdrawalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Withdrawal already processed")

    wd.status = WithdrawalStatus.REJECTED
    wd.processed_at = datetime.utcnow()
    session.add(wd)

    await session.commit()
    await session.refresh(wd)

    return WithdrawalResponse(
        id=str(wd.id),
        vendor_id=str(wd.vendor_id),
        amount=wd.amount,
        status=wd.status.value,
        bank_details=wd.bank_details,
        created_at=wd.created_at,
        processed_at=wd.processed_at,
    )


# ─── Products ──────────────────────────────────────────────

@router.get("/admin/products", response_model=List[ProductResponse])
async def list_products(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(
        select(Product).order_by(Product.created_at.desc())
    )
    products = []
    for p in result.all():
        v = await session.get(Vendor, p.vendor_id)
        products.append(ProductResponse(
            id=str(p.id), vendor_business_name=v.business_name if v else "Unknown",
            name=p.name, price=p.price, stock_quantity=p.stock_quantity,
            is_available=p.is_available, created_at=p.created_at,
        ))
    return products


@router.put("/admin/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    p = await session.get(Product, product_id)
    if not p:
        raise HTTPException(404, detail="Product not found")

    if body.name is not None:
        p.name = body.name
    if body.description is not None:
        p.description = body.description
    if body.price is not None:
        p.price = body.price
    if body.stock_quantity is not None:
        p.stock_quantity = body.stock_quantity
    if body.is_available is not None:
        p.is_available = body.is_available

    session.add(p)
    await session.commit()
    await session.refresh(p)

    v = await session.get(Vendor, p.vendor_id)
    return ProductResponse(
        id=str(p.id), vendor_business_name=v.business_name if v else "Unknown",
        name=p.name, price=p.price, stock_quantity=p.stock_quantity,
        is_available=p.is_available, created_at=p.created_at,
    )


@router.post("/admin/products", response_model=ProductResponse, status_code=201)
async def create_product(
    body: AdminProductCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    v = await session.get(Vendor, body.vendor_id)
    if not v:
        raise HTTPException(404, detail="Vendor not found")

    p = Product(
        vendor_id=v.id,
        name=body.name,
        description=body.description or "",
        price=body.price,
        stock_quantity=body.stock_quantity,
        image_url=body.image_url,
    )
    session.add(p)
    await session.commit()
    await session.refresh(p)

    return ProductResponse(
        id=str(p.id), vendor_business_name=v.business_name,
        name=p.name, price=p.price, stock_quantity=p.stock_quantity,
        is_available=p.is_available, created_at=p.created_at,
    )


@router.delete("/admin/products/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    p = await session.get(Product, product_id)
    if not p:
        raise HTTPException(404, detail="Product not found")
    await session.delete(p)
    await session.commit()


# ─── Consultations ─────────────────────────────────────────

@router.get("/admin/consultations", response_model=List[ConsultationResponse])
async def list_consultations(
    status_filter: Optional[ConsultationStatus] = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(NutritionConsultation).order_by(NutritionConsultation.scheduled_at.desc())
    if status_filter:
        query = query.where(NutritionConsultation.status == status_filter)
    result = await session.exec(query)
    consultations = []
    for c in result.all():
        cust = await session.get(Customer, c.customer_id)
        v = await session.get(Vendor, c.vendor_id)
        cust_name = f"{cust.first_name} {cust.last_name}" if cust else "Unknown"
        vend_name = v.business_name if v else "Unknown"
        consultations.append(ConsultationResponse(
            id=str(c.id), customer_name=cust_name,
            vendor_business_name=vend_name,
            scheduled_at=c.scheduled_at, status=c.status.value,
            meeting_link=c.meeting_link, notes=c.notes,
            created_at=c.created_at,
        ))
    return consultations


@router.put("/admin/consultations/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: uuid.UUID,
    body: ConsultationUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    c = await session.get(NutritionConsultation, consultation_id)
    if not c:
        raise HTTPException(404, detail="Consultation not found")

    c.status = body.status
    if body.notes is not None:
        c.notes = body.notes
    session.add(c)
    await session.commit()
    await session.refresh(c)

    cust = await session.get(Customer, c.customer_id)
    v = await session.get(Vendor, c.vendor_id)
    cust_name = f"{cust.first_name} {cust.last_name}" if cust else "Unknown"
    vend_name = v.business_name if v else "Unknown"

    return ConsultationResponse(
        id=str(c.id), customer_name=cust_name,
        vendor_business_name=vend_name,
        scheduled_at=c.scheduled_at, status=c.status.value,
        meeting_link=c.meeting_link, notes=c.notes,
        created_at=c.created_at,
    )


# ─── Admin User Management ──────────────────────────────

@router.get("/admin/users", response_model=AdminUserListResponse)
async def list_admin_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role_filter: Optional[AdminRole] = Query(None, alias="role", description="Filter by admin role"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: active, inactive"),
    created_after: Optional[datetime] = Query(None, description="Filter users created after this date"),
    created_before: Optional[datetime] = Query(None, description="Filter users created before this date"),
    sort_by: str = Query("created_at", description="Sort field: name, email, created_at, store_role"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    base_query = select(User).where(User.role == UserRole.ADMIN)

    if search:
        base_query = base_query.where(
            or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
        )
    if role_filter:
        base_query = base_query.where(User.store_role == role_filter.value)
    if status_filter == "active":
        base_query = base_query.where(User.is_active == True)
    elif status_filter == "inactive":
        base_query = base_query.where(User.is_active == False)
    if created_after:
        base_query = base_query.where(User.created_at >= created_after)
    if created_before:
        base_query = base_query.where(User.created_at <= created_before)

    total = (await session.exec(select(func.count()).select_from(base_query.subquery()))).one()

    sort_column = getattr(User, sort_by, User.created_at)
    order_fn = desc if sort_order == "desc" else asc
    ordered_query = base_query.order_by(order_fn(sort_column)).offset(skip).limit(limit)
    result = await session.exec(ordered_query)
    users = result.all()

    items = []
    for u in users:
        last_login_result = await session.exec(
            select(LoginHistory.created_at)
            .where(LoginHistory.admin_id == u.id, LoginHistory.success == True)
            .order_by(LoginHistory.created_at.desc())
            .limit(1)
        )
        last_login = last_login_result.one_or_none()

        items.append(AdminUserResponse(
            id=u.id, email=u.email, name=u.name,
            store_role=u.store_role, role=u.role.value,
            is_active=u.is_active, email_verified=u.email_verified,
            is_super_admin=u.is_super_admin, mfa_enabled=u.mfa_enabled,
            last_login=last_login,
            created_at=u.created_at,
        ))

    return AdminUserListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/admin/users/export/csv")
async def export_admin_users_csv(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role_filter: Optional[AdminRole] = Query(None, alias="role"),
    status_filter: Optional[str] = Query(None, alias="status"),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(User).where(User.role == UserRole.ADMIN).order_by(User.created_at.desc())

    if search:
        query = query.where(
            or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
        )
    if role_filter:
        query = query.where(User.store_role == role_filter.value)
    if status_filter == "active":
        query = query.where(User.is_active == True)
    elif status_filter == "inactive":
        query = query.where(User.is_active == False)

    result = await session.exec(query)
    users = result.all()

    header = "Name,Email,Role,Status,MFA,Created At\n"
    rows = "\n".join(
        f"{u.name},{u.email},{u.store_role or 'admin'},{'Active' if u.is_active else 'Inactive'},{'Yes' if u.mfa_enabled else 'No'},{u.created_at.isoformat()}"
        for u in users
    )
    csv_content = header + rows

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=admin_users.csv"},
    )


@router.get("/admin/users/{user_id}", response_model=AdminUserResponse)
async def get_admin_user_detail(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    last_login_result = await session.exec(
        select(LoginHistory.created_at)
        .where(LoginHistory.admin_id == user.id, LoginHistory.success == True)
        .order_by(LoginHistory.created_at.desc())
        .limit(1)
    )
    last_login = last_login_result.one_or_none()

    return AdminUserResponse(
        id=user.id, email=user.email, name=user.name,
        store_role=user.store_role, role=user.role.value,
        is_active=user.is_active, email_verified=user.email_verified,
        is_super_admin=user.is_super_admin, mfa_enabled=user.mfa_enabled,
        last_login=last_login,
        created_at=user.created_at,
    )


@router.post("/admin/users", response_model=AdminUserResponse, status_code=201)
async def create_admin_user(
    body: AdminUserCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    existing = await session.exec(select(User).where(User.email == body.email))
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    if _firebase_available:
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
    else:
        uid = str(uuid.uuid4())

    if body.store_role == AdminRole.SUPER_ADMIN:
        current_user_role = None
        for r in AdminRole:
            if r.value == current_user.store_role:
                current_user_role = r
                break
        if current_user_role != AdminRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only super admins can create other super admins")

    user = User(
        id=uid,
        email=body.email,
        name=body.name,
        store_role=body.store_role.value,
        role=UserRole.ADMIN,
        password_hash=hash_password(body.password) if not _firebase_available else None,
        email_verified=True,
    )
    session.add(user)

    token = str(uuid.uuid4())
    invitation = AdminInvitation(
        email=body.email,
        name=body.name,
        role=body.store_role,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=48),
        invited_by=current_user.id,
        accepted_at=datetime.utcnow(),
    )
    session.add(invitation)

    await _create_audit_log(
        session, current_user.id, "create", "admin_user",
        resource_id=uid,
        details={"email": body.email, "name": body.name, "role": body.store_role.value},
        request=request,
    )

    await session.commit()
    await session.refresh(user)

    return AdminUserResponse(
        id=user.id, email=user.email, name=user.name,
        store_role=user.store_role, role=user.role.value,
        is_active=user.is_active, email_verified=user.email_verified,
        is_super_admin=user.is_super_admin, mfa_enabled=user.mfa_enabled, created_at=user.created_at,
    )


@router.put("/admin/users/{user_id}", response_model=AdminUserResponse)
async def update_admin_user(
    user_id: str,
    body: AdminUserUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    changed = {}
    if body.name is not None and body.name != user.name:
        changed["name"] = {"from": user.name, "to": body.name}
        user.name = body.name
    if body.store_role is not None and body.store_role.value != user.store_role:
        if body.store_role == AdminRole.SUPER_ADMIN or user.store_role == AdminRole.SUPER_ADMIN.value:
            current_user_role = None
            for r in AdminRole:
                if r.value == current_user.store_role:
                    current_user_role = r
                    break
            if current_user_role != AdminRole.SUPER_ADMIN:
                raise HTTPException(status_code=403, detail="Only super admins can change super admin role")
        changed["store_role"] = {"from": user.store_role, "to": body.store_role.value}
        user.store_role = body.store_role.value
    if body.is_active is not None and body.is_active != user.is_active:
        changed["is_active"] = {"from": user.is_active, "to": body.is_active}
        user.is_active = body.is_active

    if changed:
        await _create_audit_log(
            session, current_user.id, "update", "admin_user",
            resource_id=user_id,
            details={"changes": changed},
            request=request,
        )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return AdminUserResponse(
        id=user.id, email=user.email, name=user.name,
        store_role=user.store_role, role=user.role.value,
        is_active=user.is_active, email_verified=user.email_verified,
        is_super_admin=user.is_super_admin, mfa_enabled=user.mfa_enabled, created_at=user.created_at,
    )


@router.delete("/admin/users/{user_id}", status_code=204)
async def deactivate_admin_user(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")
    user.is_active = False
    session.add(user)

    await _create_audit_log(
        session, current_user.id, "deactivate", "admin_user",
        resource_id=user_id,
        details={"email": user.email, "name": user.name},
        request=request,
    )
    await session.commit()


@router.put("/admin/users/{user_id}/reactivate", response_model=AdminUserResponse)
async def reactivate_admin_user(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")
    user.is_active = True
    session.add(user)

    await _create_audit_log(
        session, current_user.id, "reactivate", "admin_user",
        resource_id=user_id,
        details={"email": user.email, "name": user.name},
        request=request,
    )
    await session.commit()
    await session.refresh(user)

    return AdminUserResponse(
        id=user.id, email=user.email, name=user.name,
        store_role=user.store_role, role=user.role.value,
        is_active=user.is_active, email_verified=user.email_verified,
        is_super_admin=user.is_super_admin, mfa_enabled=user.mfa_enabled, created_at=user.created_at,
    )


@router.delete("/admin/users/{user_id}/hard", status_code=204)
async def hard_delete_admin_user(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot hard delete yourself")

    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    await _create_audit_log(
        session, current_user.id, "hard_delete", "admin_user",
        resource_id=user_id,
        details={"email": user.email, "name": user.name, "deleted_by_super_admin": True},
        request=request,
    )

    await session.exec(text("DELETE FROM login_history WHERE admin_id = :uid"), params={"uid": user_id})
    await session.exec(text("DELETE FROM admin_sessions WHERE admin_id = :uid"), params={"uid": user_id})
    await session.exec(text("DELETE FROM audit_logs WHERE admin_id = :uid"), params={"uid": user_id})
    await session.exec(text("DELETE FROM force_actions WHERE admin_id = :uid"), params={"uid": user_id})
    await session.exec(text("DELETE FROM admin_approvals WHERE admin_id = :uid"), params={"uid": user_id})

    await session.delete(user)
    await session.commit()


# ─── Audit Logs ────────────────────────────────────────

@router.get("/admin/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    admin_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if admin_id:
        query = query.where(AuditLog.admin_id == admin_id)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    logs = result.all()
    return [
        AuditLogResponse(
            id=str(log.id), admin_id=log.admin_id,
            action=log.action, resource_type=log.resource_type,
            resource_id=log.resource_id, details=log.details,
            ip_address=log.ip_address, created_at=log.created_at,
        )
        for log in logs
    ]


# ─── Login History ─────────────────────────────────────

@router.get("/admin/login-history", response_model=List[LoginHistoryResponse])
async def list_login_history(
    admin_id: Optional[str] = Query(None),
    success: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(LoginHistory).order_by(LoginHistory.created_at.desc())
    if admin_id:
        query = query.where(LoginHistory.admin_id == admin_id)
    if success is not None:
        query = query.where(LoginHistory.success == success)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    entries = result.all()
    return [
        LoginHistoryResponse(
            id=str(entry.id), admin_id=entry.admin_id,
            ip_address=entry.ip_address, user_agent=entry.user_agent,
            success=entry.success, failure_reason=entry.failure_reason,
            created_at=entry.created_at,
        )
        for entry in entries
    ]


# ─── Session Management ────────────────────────────────────

@router.get("/admin/sessions", response_model=List[AdminSessionResponse])
async def list_admin_sessions(
    admin_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AdminSession).order_by(AdminSession.last_activity.desc())
    if admin_id:
        query = query.where(AdminSession.admin_id == admin_id)
    if active_only:
        query = query.where(AdminSession.is_active == True)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    sessions = result.all()
    return [
        AdminSessionResponse(
            id=str(s.id), admin_id=s.admin_id,
            ip_address=s.ip_address, user_agent=s.user_agent,
            is_active=s.is_active, last_activity=s.last_activity,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.post("/admin/sessions/{session_id}/revoke", status_code=200)
async def revoke_admin_session(
    session_id: uuid.UUID,
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    admin_session = await db_session.get(AdminSession, session_id)
    if not admin_session:
        raise HTTPException(status_code=404, detail="Session not found")
    admin_session.is_active = False
    db_session.add(admin_session)
    await db_session.commit()
    return {"detail": "Session revoked successfully"}


# ─── Role & Permissions Manager ────────────────────────────

@router.get("/admin/role-permissions", response_model=List[PermissionResponse])
async def list_role_permissions(
    role: Optional[AdminRole] = Query(None),
    module: Optional[PermissionModule] = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AdminRolePermission).order_by(AdminRolePermission.role, AdminRolePermission.module)
    if role:
        query = query.where(AdminRolePermission.role == role)
    if module:
        query = query.where(AdminRolePermission.module == module)
    result = await session.exec(query)
    perms = result.all()
    return [
        PermissionResponse(
            id=str(p.id), role=p.role.value, module=p.module.value,
            action=p.action.value, created_at=p.created_at,
        )
        for p in perms
    ]


@router.get("/admin/permissions-by-role", response_model=List[PermissionsByRoleResponse])
async def get_permissions_by_role(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(select(AdminRolePermission).order_by(AdminRolePermission.role))
    perms = result.all()
    grouped: dict = {}
    for p in perms:
        role_key = p.role.value
        if role_key not in grouped:
            grouped[role_key] = {}
        mod = p.module.value
        if mod not in grouped[role_key]:
            grouped[role_key][mod] = []
        grouped[role_key][mod].append(p.action.value)
    return [
        PermissionsByRoleResponse(role=r, permissions=[{"module": m, "actions": a} for m, a in mods.items()])
        for r, mods in grouped.items()
    ]


@router.post("/admin/role-permissions", response_model=PermissionResponse, status_code=201)
async def create_role_permission(
    body: PermissionCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    existing = await session.exec(
        select(AdminRolePermission).where(
            AdminRolePermission.role == body.role,
            AdminRolePermission.module == body.module,
            AdminRolePermission.action == body.action,
        )
    )
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="Permission already exists")

    perm = AdminRolePermission(role=body.role, module=body.module, action=body.action)
    session.add(perm)

    await _create_audit_log(
        session, current_user.id, "create", "role_permission",
        details={"role": body.role.value, "module": body.module.value, "action": body.action.value},
        request=request,
    )
    await session.commit()
    await session.refresh(perm)

    return PermissionResponse(
        id=str(perm.id), role=perm.role.value, module=perm.module.value,
        action=perm.action.value, created_at=perm.created_at,
    )


@router.delete("/admin/role-permissions/{permission_id}", status_code=204)
async def delete_role_permission(
    permission_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    perm = await session.get(AdminRolePermission, permission_id)
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    await _create_audit_log(
        session, current_user.id, "delete", "role_permission",
        resource_id=str(permission_id),
        details={"role": perm.role.value, "module": perm.module.value, "action": perm.action.value},
        request=request,
    )
    await session.delete(perm)
    await session.commit()


# ─── Invitation Management ──────────────────────────────

@router.get("/admin/invitations", response_model=InvitationListResponse)
async def list_invitations(
    status: Optional[str] = Query(None, description="pending, accepted, expired"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AdminInvitation).order_by(AdminInvitation.created_at.desc())
    now = datetime.utcnow()
    if status == "pending":
        query = query.where(AdminInvitation.accepted_at.is_(None), AdminInvitation.expires_at > now)
    elif status == "accepted":
        query = query.where(AdminInvitation.accepted_at.isnot(None))
    elif status == "expired":
        query = query.where(AdminInvitation.accepted_at.is_(None), AdminInvitation.expires_at <= now)

    total = (await session.exec(select(func.count()).select_from(query.subquery()))).one()
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    invites = result.all()
    return InvitationListResponse(
        items=[
            AdminInvitationResponse(
                id=str(inv.id), email=inv.email, name=inv.name,
                role=inv.role.value, token=inv.token,
                expires_at=inv.expires_at, accepted_at=inv.accepted_at,
                invited_by=inv.invited_by, created_at=inv.created_at,
            )
            for inv in invites
        ],
        total=total, skip=skip, limit=limit,
    )


@router.post("/admin/invitations", response_model=AdminInvitationResponse, status_code=201)
async def create_invitation(
    body: InvitationCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    existing = await session.exec(select(User).where(User.email == body.email))
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="User with this email already exists")

    token = str(uuid.uuid4())
    invitation = AdminInvitation(
        email=body.email,
        name=body.name,
        role=body.role,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=48),
        invited_by=current_user.id,
    )
    session.add(invitation)

    await _create_audit_log(
        session, current_user.id, "invite", "admin_user",
        details={"email": body.email, "name": body.name, "role": body.role.value},
        request=request,
    )
    await session.commit()
    await session.refresh(invitation)

    return AdminInvitationResponse(
        id=str(invitation.id), email=invitation.email, name=invitation.name,
        role=invitation.role.value, token=invitation.token,
        expires_at=invitation.expires_at, accepted_at=invitation.accepted_at,
        invited_by=invitation.invited_by, created_at=invitation.created_at,
    )


@router.post("/admin/invitations/{invitation_id}/resend", response_model=AdminInvitationResponse)
async def resend_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    invitation = await session.get(AdminInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.accepted_at:
        raise HTTPException(status_code=400, detail="Invitation already accepted")

    invitation.token = str(uuid.uuid4())
    invitation.expires_at = datetime.utcnow() + timedelta(hours=48)
    session.add(invitation)

    await _create_audit_log(
        session, current_user.id, "resend_invite", "admin_user",
        resource_id=str(invitation_id),
        details={"email": invitation.email},
        request=request,
    )
    await session.commit()
    await session.refresh(invitation)

    return AdminInvitationResponse(
        id=str(invitation.id), email=invitation.email, name=invitation.name,
        role=invitation.role.value, token=invitation.token,
        expires_at=invitation.expires_at, accepted_at=invitation.accepted_at,
        invited_by=invitation.invited_by, created_at=invitation.created_at,
    )


@router.delete("/admin/invitations/{invitation_id}", status_code=204)
async def cancel_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    invitation = await session.get(AdminInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    await _create_audit_log(
        session, current_user.id, "cancel_invite", "admin_user",
        resource_id=str(invitation_id),
        details={"email": invitation.email},
        request=request,
    )
    await session.delete(invitation)
    await session.commit()


# ─── Admin Profile (Self-Service) ────────────────────────

@router.get("/admin/me", response_model=AdminProfileResponse)
async def get_admin_profile_extended(
    current_user: User = Depends(AdminRoleChecker()),
    session: AsyncSession = Depends(get_session),
):
    last_login_result = await session.exec(
        select(LoginHistory.created_at)
        .where(LoginHistory.admin_id == current_user.id, LoginHistory.success == True)
        .order_by(LoginHistory.created_at.desc())
        .limit(1)
    )
    last_login = last_login_result.one_or_none()
    return AdminProfileResponse(
        id=current_user.id, email=current_user.email, name=current_user.name,
        store_role=current_user.store_role, role=current_user.role.value,
        is_active=current_user.is_active, email_verified=current_user.email_verified,
        is_super_admin=current_user.is_super_admin,
        mfa_enabled=current_user.mfa_enabled, last_login=last_login,
        created_at=current_user.created_at, updated_at=current_user.updated_at,
    )


@router.put("/admin/me", response_model=AdminProfileResponse)
async def update_admin_profile_extended(
    body: AdminProfileUpdateExtended,
    current_user: User = Depends(AdminRoleChecker()),
    session: AsyncSession = Depends(get_session),
):
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None and body.email != current_user.email:
        existing = await session.exec(select(User).where(User.email == body.email))
        if existing.one_or_none():
            raise HTTPException(status_code=409, detail="Email already in use")
        current_user.email = body.email

    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not current_user.password_hash:
            raise HTTPException(status_code=400, detail="Password change not available for this account")
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.password_hash = hash_password(body.new_password)

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    return AdminProfileResponse(
        id=current_user.id, email=current_user.email, name=current_user.name,
        store_role=current_user.store_role, role=current_user.role.value,
        is_active=current_user.is_active, email_verified=current_user.email_verified,
        is_super_admin=current_user.is_super_admin,
        mfa_enabled=current_user.mfa_enabled, last_login=None,
        created_at=current_user.created_at, updated_at=current_user.updated_at,
    )


@router.get("/admin/me/sessions", response_model=List[AdminSessionResponse])
async def get_my_sessions(
    current_user: User = Depends(AdminRoleChecker()),
    session: AsyncSession = Depends(get_session),
):
    result = await session.exec(
        select(AdminSession)
        .where(AdminSession.admin_id == current_user.id)
        .order_by(AdminSession.last_activity.desc())
    )
    sessions = result.all()
    return [
        AdminSessionResponse(
            id=str(s.id), admin_id=s.admin_id,
            ip_address=s.ip_address, user_agent=s.user_agent,
            is_active=s.is_active, last_activity=s.last_activity,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.post("/admin/me/sessions/{session_id}/revoke", status_code=200)
async def revoke_my_session(
    session_id: uuid.UUID,
    current_user: User = Depends(AdminRoleChecker()),
    db_session: AsyncSession = Depends(get_session),
):
    admin_session = await db_session.get(AdminSession, session_id)
    if not admin_session or admin_session.admin_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    admin_session.is_active = False
    db_session.add(admin_session)
    await db_session.commit()
    return {"detail": "Session revoked successfully"}


# ─── Force Actions ────────────────────────────────────

@router.get("/admin/users/{user_id}/force-actions", response_model=List[ForceActionResponse])
async def list_force_actions(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    result = await session.exec(
        select(ForceAction)
        .where(ForceAction.admin_id == user_id)
        .order_by(ForceAction.created_at.desc())
    )
    actions = result.all()
    return [
        ForceActionResponse(
            id=str(a.id), admin_id=a.admin_id, action_type=a.action_type,
            is_completed=a.is_completed, forced_by=a.forced_by,
            completed_at=a.completed_at, created_at=a.created_at,
        )
        for a in actions
    ]


@router.post("/admin/users/{user_id}/force-password-reset", status_code=200)
async def force_password_reset(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    action = ForceAction(
        admin_id=user_id,
        action_type="password_reset",
        forced_by=current_user.id,
    )
    session.add(action)

    await _create_audit_log(
        session, current_user.id, "force_password_reset", "admin_user",
        resource_id=user_id, details={"email": user.email},
        request=request,
    )
    await session.commit()
    return {"detail": "Password reset forced successfully"}


@router.post("/admin/users/{user_id}/force-mfa-enrollment", status_code=200)
async def force_mfa_enrollment(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    action = ForceAction(
        admin_id=user_id,
        action_type="mfa_enrollment",
        forced_by=current_user.id,
    )
    session.add(action)

    await _create_audit_log(
        session, current_user.id, "force_mfa_enrollment", "admin_user",
        resource_id=user_id, details={"email": user.email},
        request=request,
    )
    await session.commit()
    return {"detail": "MFA enrollment forced successfully"}


@router.post("/admin/users/{user_id}/force-email-verification", status_code=200)
async def force_email_verification(
    user_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    user = await session.get(User, user_id)
    if not user or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Admin user not found")

    action = ForceAction(
        admin_id=user_id,
        action_type="email_verification",
        forced_by=current_user.id,
    )
    session.add(action)

    await _create_audit_log(
        session, current_user.id, "force_email_verification", "admin_user",
        resource_id=user_id, details={"email": user.email},
        request=request,
    )
    await session.commit()
    return {"detail": "Email verification forced successfully"}


# ─── Account Lockout Tracking ───────────────────────────

@router.get("/admin/lockouts", response_model=List[AccountLockoutResponse])
async def list_account_lockouts(
    locked_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AccountLockout).order_by(AccountLockout.updated_at.desc())
    if locked_only:
        query = query.where(AccountLockout.is_locked == True)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    lockouts = result.all()

    items = []
    for lock in lockouts:
        admin = await session.get(User, lock.admin_id)
        items.append(AccountLockoutResponse(
            id=str(lock.id), admin_id=lock.admin_id,
            admin_name=admin.name if admin else "Unknown",
            admin_email=admin.email if admin else "Unknown",
            failed_attempts=lock.failed_attempts,
            locked_until=lock.locked_until,
            is_locked=lock.is_locked,
            last_failure_at=lock.last_failure_at,
            created_at=lock.created_at,
        ))
    return items


@router.post("/admin/lockouts/{admin_id}/unlock", status_code=200)
async def unlock_account(
    admin_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(
        select(AccountLockout).where(AccountLockout.admin_id == admin_id)
    )
    lockout = result.one_or_none()
    if not lockout:
        raise HTTPException(status_code=404, detail="Lockout record not found")

    lockout.is_locked = False
    lockout.failed_attempts = 0
    lockout.locked_until = None
    session.add(lockout)

    await _create_audit_log(
        session, current_user.id, "unlock_account", "admin_user",
        resource_id=admin_id, details={},
        request=request,
    )
    await session.commit()
    return {"detail": "Account unlocked successfully"}


# ─── Approval Workflow ─────────────────────────────────

@router.get("/admin/approvals", response_model=List[AdminApprovalResponse])
async def list_approvals(
    status: Optional[ApprovalStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AdminApproval).order_by(AdminApproval.created_at.desc())
    if status:
        query = query.where(AdminApproval.status == status)
    query = query.offset(skip).limit(limit)
    result = await session.exec(query)
    approvals = result.all()

    items = []
    for appr in approvals:
        admin = await session.get(User, appr.admin_id)
        items.append(AdminApprovalResponse(
            id=str(appr.id), admin_id=appr.admin_id,
            admin_name=admin.name if admin else "Unknown",
            admin_email=admin.email if admin else "Unknown",
            requested_role=appr.requested_role.value,
            status=appr.status.value,
            approved_by=appr.approved_by,
            reviewed_at=appr.reviewed_at,
            notes=appr.notes,
            created_at=appr.created_at,
        ))
    return items


@router.post("/admin/approvals/{approval_id}/approve", status_code=200)
async def approve_admin_request(
    approval_id: uuid.UUID,
    body: ApprovalReview = ApprovalReview(),
    request: Request = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    approval = await session.get(AdminApproval, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    approval.status = ApprovalStatus.APPROVED
    approval.approved_by = current_user.id
    approval.reviewed_at = datetime.utcnow()
    if body.notes:
        approval.notes = body.notes
    session.add(approval)

    user = await session.get(User, approval.admin_id)
    if user:
        user.store_role = approval.requested_role.value
        user.is_active = True
        session.add(user)

    await _create_audit_log(
        session, current_user.id, "approve_admin", "admin_user",
        resource_id=approval.admin_id, details={"role": approval.requested_role.value},
        request=request,
    )
    await session.commit()
    return {"detail": "Admin request approved successfully"}


@router.post("/admin/approvals/{approval_id}/reject", status_code=200)
async def reject_admin_request(
    approval_id: uuid.UUID,
    body: ApprovalReview = ApprovalReview(),
    request: Request = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    approval = await session.get(AdminApproval, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    approval.status = ApprovalStatus.REJECTED
    approval.approved_by = current_user.id
    approval.reviewed_at = datetime.utcnow()
    if body.notes:
        approval.notes = body.notes
    session.add(approval)

    await _create_audit_log(
        session, current_user.id, "reject_admin", "admin_user",
        resource_id=approval.admin_id, details={"role": approval.requested_role.value},
        request=request,
    )
    await session.commit()
    return {"detail": "Admin request rejected successfully"}


# ─── Enhanced Activity Timeline ──────────────────────────

@router.get("/admin/users/{user_id}/timeline", response_model=List[TimelineEvent])
async def get_user_timeline(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    events = []

    audit_result = await session.exec(
        select(AuditLog)
        .where(AuditLog.admin_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    for log in audit_result.all():
        events.append(TimelineEvent(
            id=str(log.id), event_type="audit", action=log.action,
            description=f"{log.action} {log.resource_type}",
            admin_id=log.admin_id, details=log.details,
            ip_address=log.ip_address, created_at=log.created_at,
        ))

    login_result = await session.exec(
        select(LoginHistory)
        .where(LoginHistory.admin_id == user_id)
        .order_by(LoginHistory.created_at.desc())
        .limit(limit)
    )
    for entry in login_result.all():
        action = "login_success" if entry.success else "login_failed"
        desc = f"Login {'successful' if entry.success else 'failed'}"
        if entry.failure_reason:
            desc += f" ({entry.failure_reason})"
        events.append(TimelineEvent(
            id=str(entry.id), event_type="login", action=action,
            description=desc,
            admin_id=entry.admin_id, details=None,
            ip_address=entry.ip_address, created_at=entry.created_at,
        ))

    session_result = await session.exec(
        select(AdminSession)
        .where(AdminSession.admin_id == user_id)
        .order_by(AdminSession.created_at.desc())
        .limit(limit)
    )
    for s in session_result.all():
        events.append(TimelineEvent(
            id=str(s.id), event_type="session", action="session_created",
            description=f"Session {'active' if s.is_active else 'ended'}",
            admin_id=s.admin_id, details={"is_active": s.is_active},
            ip_address=s.ip_address, created_at=s.created_at,
        ))

    events.sort(key=lambda e: e.created_at, reverse=True)
    return events[:limit]


# ─── Audit Log Export & Retention ────────────────────────

@router.get("/admin/audit-logs/export/csv")
async def export_audit_logs_csv(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    result = await session.exec(query)
    logs = result.all()

    header = "Admin ID,Action,Resource Type,Resource ID,IP Address,Timestamp\n"
    rows = "\n".join(
        f"{log.admin_id},{log.action},{log.resource_type},{log.resource_id or ''},{log.ip_address or ''},{log.created_at.isoformat()}"
        for log in logs
    )
    csv_content = header + rows

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )


@router.get("/admin/audit-logs/retention-config", response_model=RetentionConfigResponse)
async def get_retention_config(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(select(AuditLogRetentionConfig).limit(1))
    config = result.one_or_none()
    if not config:
        config = AuditLogRetentionConfig()
        session.add(config)
        await session.commit()
        await session.refresh(config)
    return RetentionConfigResponse(
        retention_days=config.retention_days,
        auto_delete_enabled=config.auto_delete_enabled,
        last_cleaned_at=config.last_cleaned_at,
    )


@router.put("/admin/audit-logs/retention-config", response_model=RetentionConfigResponse)
async def update_retention_config(
    body: RetentionConfigUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    result = await session.exec(select(AuditLogRetentionConfig).limit(1))
    config = result.one_or_none()
    if not config:
        config = AuditLogRetentionConfig()
        session.add(config)

    if body.retention_days is not None:
        config.retention_days = body.retention_days
    if body.auto_delete_enabled is not None:
        config.auto_delete_enabled = body.auto_delete_enabled
    config.updated_by = current_user.id
    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)

    return RetentionConfigResponse(
        retention_days=config.retention_days,
        auto_delete_enabled=config.auto_delete_enabled,
        last_cleaned_at=config.last_cleaned_at,
    )


@router.post("/admin/audit-logs/cleanup", status_code=200)
async def cleanup_old_audit_logs(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    result = await session.exec(select(AuditLogRetentionConfig).limit(1))
    config = result.one_or_none()
    if not config or not config.auto_delete_enabled:
        raise HTTPException(status_code=400, detail="Auto-delete is not enabled")

    cutoff = datetime.utcnow() - timedelta(days=config.retention_days)
    delete_query = select(AuditLog).where(AuditLog.created_at < cutoff)
    to_delete = await session.exec(delete_query)
    deleted = 0
    for log in to_delete.all():
        await session.delete(log)
        deleted += 1

    config.last_cleaned_at = datetime.utcnow()
    config.updated_by = current_user.id
    session.add(config)
    await session.commit()

    return {"detail": f"Deleted {deleted} audit log(s) older than {config.retention_days} days"}


# ─── Session Policies ──────────────────────────────────

@router.get("/admin/session-policy", response_model=SessionPolicyResponse)
async def get_session_policy(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(select(SessionPolicyConfig).limit(1))
    policy = result.one_or_none()
    if not policy:
        policy = SessionPolicyConfig()
        session.add(policy)
        await session.commit()
        await session.refresh(policy)
    return SessionPolicyResponse(
        idle_timeout_minutes=policy.idle_timeout_minutes,
        max_concurrent_sessions=policy.max_concurrent_sessions,
        enforce_for_all=policy.enforce_for_all,
    )


@router.put("/admin/session-policy", response_model=SessionPolicyResponse)
async def update_session_policy(
    body: SessionPolicyUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    result = await session.exec(select(SessionPolicyConfig).limit(1))
    policy = result.one_or_none()
    if not policy:
        policy = SessionPolicyConfig()
        session.add(policy)

    if body.idle_timeout_minutes is not None:
        policy.idle_timeout_minutes = body.idle_timeout_minutes
    if body.max_concurrent_sessions is not None:
        policy.max_concurrent_sessions = body.max_concurrent_sessions
    if body.enforce_for_all is not None:
        policy.enforce_for_all = body.enforce_for_all
    policy.updated_by = current_user.id
    policy.updated_at = datetime.utcnow()
    session.add(policy)
    await session.commit()
    await session.refresh(policy)

    return SessionPolicyResponse(
        idle_timeout_minutes=policy.idle_timeout_minutes,
        max_concurrent_sessions=policy.max_concurrent_sessions,
        enforce_for_all=policy.enforce_for_all,
    )


@router.post("/admin/sessions/revoke-all/{admin_id}", status_code=200)
async def revoke_all_admin_sessions(
    admin_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    result = await session.exec(
        select(AdminSession).where(AdminSession.admin_id == admin_id, AdminSession.is_active == True)
    )
    revoked = 0
    for s in result.all():
        s.is_active = False
        session.add(s)
        revoked += 1

    await _create_audit_log(
        session, current_user.id, "revoke_all_sessions", "admin_user",
        resource_id=admin_id, details={"revoked": revoked},
        request=request,
    )
    await session.commit()
    return {"detail": f"Revoked {revoked} session(s)"}


# ─── Bulk Import Users ─────────────────────────────────

@router.post("/admin/users/bulk-import", response_model=BulkImportResponse, status_code=201)
async def bulk_import_users(
    body: BulkImportRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    succeeded = 0
    failed = 0
    errors = []

    for item in body.users:
        try:
            existing = await session.exec(select(User).where(User.email == item.email))
            if existing.one_or_none():
                failed += 1
                errors.append({"email": item.email, "error": "Email already exists"})
                continue

            if _firebase_available:
                try:
                    firebase_record = firebase_auth.create_user(email=item.email, password=item.password)
                    uid = firebase_record.uid
                except Exception as e:
                    failed += 1
                    errors.append({"email": item.email, "error": f"Firebase error: {str(e)}"})
                    continue
            else:
                uid = str(uuid.uuid4())

            user = User(
                id=uid, email=item.email, name=item.name,
                store_role=item.store_role.value, role=UserRole.ADMIN,
                password_hash=hash_password(item.password) if not _firebase_available else None,
                email_verified=True,
            )
            session.add(user)
            succeeded += 1
        except Exception as e:
            failed += 1
            errors.append({"email": item.email, "error": str(e)})

    if succeeded > 0:
        await _create_audit_log(
            session, current_user.id, "bulk_import", "admin_user",
            details={"succeeded": succeeded, "failed": failed},
            request=request,
        )

    await session.commit()
    return BulkImportResponse(total=len(body.users), succeeded=succeeded, failed=failed, errors=errors)


# ─── IP Allowlist ──────────────────────────────────────

@router.get("/admin/ip-allowlist", response_model=List[IPAllowlistEntryResponse])
async def list_ip_allowlist(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    result = await session.exec(
        select(IPAllowlistEntry).order_by(IPAllowlistEntry.created_at.desc())
    )
    entries = result.all()
    return [
        IPAllowlistEntryResponse(
            id=str(e.id), ip_address=e.ip_address, description=e.description,
            is_active=e.is_active, created_by=e.created_by, created_at=e.created_at,
        )
        for e in entries
    ]


@router.post("/admin/ip-allowlist", response_model=IPAllowlistEntryResponse, status_code=201)
async def add_ip_allowlist_entry(
    body: IPAllowlistCreate,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    existing = await session.exec(
        select(IPAllowlistEntry).where(IPAllowlistEntry.ip_address == body.ip_address)
    )
    if existing.one_or_none():
        raise HTTPException(status_code=409, detail="IP address already in allowlist")

    entry = IPAllowlistEntry(
        ip_address=body.ip_address,
        description=body.description,
        created_by=current_user.id,
    )
    session.add(entry)

    await _create_audit_log(
        session, current_user.id, "add_ip_allowlist", "admin_config",
        details={"ip_address": body.ip_address},
        request=request,
    )
    await session.commit()
    await session.refresh(entry)

    return IPAllowlistEntryResponse(
        id=str(entry.id), ip_address=entry.ip_address, description=entry.description,
        is_active=entry.is_active, created_by=entry.created_by, created_at=entry.created_at,
    )


@router.delete("/admin/ip-allowlist/{entry_id}", status_code=204)
async def remove_ip_allowlist_entry(
    entry_id: uuid.UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    entry = await session.get(IPAllowlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    await _create_audit_log(
        session, current_user.id, "remove_ip_allowlist", "admin_config",
        details={"ip_address": entry.ip_address},
        request=request,
    )
    await session.delete(entry)
    await session.commit()


@router.put("/admin/ip-allowlist/{entry_id}/toggle", response_model=IPAllowlistEntryResponse)
async def toggle_ip_allowlist_entry(
    entry_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker(min_role=AdminRole.SUPER_ADMIN)),
):
    entry = await session.get(IPAllowlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.is_active = not entry.is_active
    session.add(entry)
    await session.commit()
    await session.refresh(entry)

    return IPAllowlistEntryResponse(
        id=str(entry.id), ip_address=entry.ip_address, description=entry.description,
        is_active=entry.is_active, created_by=entry.created_by, created_at=entry.created_at,
    )


# ─── Vendor Audit Log Helper ─────────────────────────────────


async def _create_vendor_audit_log(
    db_session: AsyncSession,
    vendor_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
):
    ip_address = None
    if request:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        elif request.client:
            ip_address = request.client.host
    log = VendorAuditLog(
        vendor_id=vendor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
    )
    db_session.add(log)
    await db_session.commit()


# ─── Vendor Audit Logs ──────────────────────────────────


@router.get("/admin/vendors/{vendor_id}/audit-logs", response_model=List[VendorAuditLogResponse])
async def list_vendor_audit_logs(
    vendor_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = (
        select(VendorAuditLog)
        .where(VendorAuditLog.vendor_id == vendor_id)
        .order_by(VendorAuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db_session.exec(query)
    logs = result.all()
    return [
        VendorAuditLogResponse(
            id=str(log.id), vendor_id=log.vendor_id,
            action=log.action, resource_type=log.resource_type,
            resource_id=log.resource_id, details=log.details,
            ip_address=log.ip_address, created_at=log.created_at,
        )
        for log in logs
    ]


# ─── Vendor Login History ──────────────────────────────


@router.get("/admin/vendors/{vendor_id}/login-history", response_model=List[VendorLoginHistoryResponse])
async def list_vendor_login_history(
    vendor_id: str,
    success: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = (
        select(VendorLoginHistory)
        .where(VendorLoginHistory.vendor_id == vendor_id)
        .order_by(VendorLoginHistory.created_at.desc())
    )
    if success is not None:
        query = query.where(VendorLoginHistory.success == success)
    query = query.offset(skip).limit(limit)
    result = await db_session.exec(query)
    entries = result.all()
    return [
        VendorLoginHistoryResponse(
            id=str(entry.id), vendor_id=entry.vendor_id,
            ip_address=entry.ip_address, user_agent=entry.user_agent,
            success=entry.success, failure_reason=entry.failure_reason,
            created_at=entry.created_at,
        )
        for entry in entries
    ]


# ─── Vendor Sessions ────────────────────────────────────


@router.get("/admin/vendors/{vendor_id}/sessions", response_model=List[VendorSessionResponse])
async def list_vendor_sessions(
    vendor_id: str,
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = (
        select(VendorSession)
        .where(VendorSession.vendor_id == vendor_id)
        .order_by(VendorSession.last_activity.desc())
    )
    if active_only:
        query = query.where(VendorSession.is_active == True)
    query = query.offset(skip).limit(limit)
    result = await db_session.exec(query)
    sessions = result.all()
    return [
        VendorSessionResponse(
            id=str(s.id), vendor_id=s.vendor_id,
            ip_address=s.ip_address, user_agent=s.user_agent,
            is_active=s.is_active, last_activity=s.last_activity,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.post("/admin/vendors/{vendor_id}/sessions/{session_id}/revoke", status_code=200)
async def revoke_vendor_session(
    vendor_id: str,
    session_id: uuid.UUID,
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    vendor_session = await db_session.get(VendorSession, session_id)
    if not vendor_session:
        raise HTTPException(status_code=404, detail="Session not found")
    if vendor_session.vendor_id != vendor_id:
        raise HTTPException(status_code=404, detail="Session not found")
    vendor_session.is_active = False
    db_session.add(vendor_session)
    await db_session.commit()
    return {"detail": "Session revoked successfully"}


# ─── All Vendor Audit Logs (page-level) ──────────────────


@router.get("/admin/vendor-audit-logs", response_model=List[VendorAuditLogResponse])
async def list_all_vendor_audit_logs(
    vendor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(VendorAuditLog).order_by(VendorAuditLog.created_at.desc())
    if vendor_id:
        query = query.where(VendorAuditLog.vendor_id == vendor_id)
    if action:
        query = query.where(VendorAuditLog.action == action)
    if resource_type:
        query = query.where(VendorAuditLog.resource_type == resource_type)
    query = query.offset(skip).limit(limit)
    result = await db_session.exec(query)
    logs = result.all()
    return [
        VendorAuditLogResponse(
            id=str(log.id), vendor_id=log.vendor_id,
            action=log.action, resource_type=log.resource_type,
            resource_id=log.resource_id, details=log.details,
            ip_address=log.ip_address, created_at=log.created_at,
        )
        for log in logs
    ]


# ─── All Vendor Login History (page-level) ──────────────


@router.get("/admin/vendor-login-history", response_model=List[VendorLoginHistoryResponse])
async def list_all_vendor_login_history(
    vendor_id: Optional[str] = Query(None),
    success: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(VendorLoginHistory).order_by(VendorLoginHistory.created_at.desc())
    if vendor_id:
        query = query.where(VendorLoginHistory.vendor_id == vendor_id)
    if success is not None:
        query = query.where(VendorLoginHistory.success == success)
    query = query.offset(skip).limit(limit)
    result = await db_session.exec(query)
    entries = result.all()
    return [
        VendorLoginHistoryResponse(
            id=str(entry.id), vendor_id=entry.vendor_id,
            ip_address=entry.ip_address, user_agent=entry.user_agent,
            success=entry.success, failure_reason=entry.failure_reason,
            created_at=entry.created_at,
        )
        for entry in entries
    ]


# ─── All Vendor Sessions (page-level) ────────────────────


@router.get("/admin/vendor-sessions", response_model=List[VendorSessionResponse])
async def list_all_vendor_sessions(
    vendor_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db_session: AsyncSession = Depends(get_session),
    _: User = Depends(AdminRoleChecker()),
):
    query = select(VendorSession).order_by(VendorSession.last_activity.desc())
    if vendor_id:
        query = query.where(VendorSession.vendor_id == vendor_id)
    if active_only:
        query = query.where(VendorSession.is_active == True)
    query = query.offset(skip).limit(limit)
    result = await db_session.exec(query)
    sessions = result.all()
    return [
        VendorSessionResponse(
            id=str(s.id), vendor_id=s.vendor_id,
            ip_address=s.ip_address, user_agent=s.user_agent,
            is_active=s.is_active, last_activity=s.last_activity,
            created_at=s.created_at,
        )
        for s in sessions
    ]
