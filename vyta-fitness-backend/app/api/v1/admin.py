from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import RoleChecker
from app.core.security import hash_password
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
    WithdrawalRequest,
    WithdrawalStatus,
)

router = APIRouter(tags=["Admin"])


class VendorResponse(BaseModel):
    id: str
    business_name: str
    description: Optional[str] = None
    onboarding_status: str
    current_balance: Decimal
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
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime


class CustomerDetail(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_active: bool
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


# ─── Dashboard Stats ───────────────────────────────────────

@router.get("/admin/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    result = await session.exec(
        select(Customer, User).join(User).order_by(Customer.created_at.desc())
    )
    return [
        CustomerResponse(
            id=str(c.id), email=u.email,
            first_name=c.first_name, last_name=c.last_name,
            phone=c.phone, is_active=u.is_active,
            created_at=c.created_at,
        )
        for c, u in result.all()
    ]


@router.get("/admin/customers/{customer_id}", response_model=CustomerDetail)
async def get_customer(
    customer_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
        phone=c.phone, is_active=u.is_active if u else True,
        created_at=c.created_at, orders=orders,
    )


# ─── Vendors ────────────────────────────────────────────────

@router.get("/admin/vendors", response_model=List[VendorResponse])
async def list_vendors(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    result = await session.exec(select(Vendor).order_by(Vendor.business_name))
    vendors = result.all()
    return [
        VendorResponse(
            id=str(v.id),
            business_name=v.business_name,
            description=v.description,
            onboarding_status=v.onboarding_status.value,
            current_balance=v.current_balance,
            created_at=v.created_at,
        )
        for v in vendors
    ]


@router.get("/admin/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    vendor = await session.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return VendorResponse(
        id=str(vendor.id),
        business_name=vendor.business_name,
        description=vendor.description,
        onboarding_status=vendor.onboarding_status.value,
        current_balance=vendor.current_balance,
        created_at=vendor.created_at,
    )


@router.get("/admin/vendors/{vendor_id}/documents", response_model=List[DocumentResponse])
async def get_vendor_documents(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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

    return VendorResponse(
        id=str(vendor.id),
        business_name=vendor.business_name,
        description=vendor.description,
        onboarding_status=vendor.onboarding_status.value,
        current_balance=vendor.current_balance,
        created_at=vendor.created_at,
    )


@router.post("/admin/vendors/{vendor_id}/reject", response_model=VendorResponse)
async def reject_vendor(
    vendor_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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

    return VendorResponse(
        id=str(vendor.id),
        business_name=vendor.business_name,
        description=vendor.description,
        onboarding_status=vendor.onboarding_status.value,
        current_balance=vendor.current_balance,
        created_at=vendor.created_at,
    )


@router.post("/admin/vendors", response_model=VendorResponse, status_code=201)
async def create_vendor(
    body: AdminVendorCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    existing_user = await session.exec(select(User).where(User.email == body.email))
    if existing_user.one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_vendor = await session.exec(
        select(Vendor).where(Vendor.business_name == body.business_name)
    )
    if existing_vendor.one_or_none():
        raise HTTPException(status_code=409, detail="Business name already taken")

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
    )
    session.add(vendor)
    await session.commit()
    await session.refresh(vendor)

    return VendorResponse(
        id=str(vendor.id),
        business_name=vendor.business_name,
        description=vendor.description,
        onboarding_status=vendor.onboarding_status.value,
        current_balance=vendor.current_balance,
        created_at=vendor.created_at,
    )


# ─── Withdrawals ────────────────────────────────────────────

@router.get("/admin/withdrawals", response_model=List[WithdrawalResponse])
async def list_withdrawals(
    status_filter: Optional[WithdrawalStatus] = None,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    query = select(WithdrawalRequest).order_by(WithdrawalRequest.created_at.desc())
    if status_filter:
        query = query.where(WithdrawalRequest.status == status_filter)

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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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
    _: User = Depends(RoleChecker([UserRole.ADMIN])),
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


# ─── Admin Profile ─────────────────────────────────────────

@router.get("/admin/me", response_model=CustomerResponse)
async def get_admin_profile(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    return CustomerResponse(
        id=str(current_user.id), email=current_user.email,
        first_name="", last_name="",
        phone=None, is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.put("/admin/me", response_model=CustomerResponse)
async def update_admin_profile(
    body: AdminProfileUpdate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    session: AsyncSession = Depends(get_session),
):
    if body.email is not None:
        existing = await session.exec(select(User).where(User.email == body.email))
        if existing.one_or_none() and body.email != current_user.email:
            raise HTTPException(409, detail="Email already in use")
        current_user.email = body.email
    if body.password is not None:
        current_user.password_hash = hash_password(body.password)

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    return CustomerResponse(
        id=str(current_user.id), email=current_user.email,
        first_name="", last_name="",
        phone=None, is_active=current_user.is_active,
        created_at=current_user.created_at,
    )
