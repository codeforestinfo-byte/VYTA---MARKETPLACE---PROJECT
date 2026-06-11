from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.dependencies import RoleChecker, get_current_user
from app.models.consultation import ConsultationStatus, NutritionConsultation
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole
from app.models.vendor import Vendor

router = APIRouter(tags=["Customers"])


class CustomerProfileResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    shipping_address: Optional[str] = None


class CustomerUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    shipping_address: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    price_at_purchase: float


class OrderResponse(BaseModel):
    id: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]


class ConsultationCreateRequest(BaseModel):
    vendor_id: uuid.UUID
    scheduled_at: datetime


class ConsultationResponse(BaseModel):
    id: str
    vendor_id: str
    scheduled_at: datetime
    status: str
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


@router.get("/customers/me", response_model=CustomerProfileResponse)
async def get_customer_profile(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return CustomerProfileResponse(
        id=str(customer.id),
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        shipping_address=customer.shipping_address,
    )


@router.put("/customers/me", response_model=CustomerProfileResponse)
async def update_customer_profile(
    body: CustomerUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    if body.first_name is not None:
        customer.first_name = body.first_name
    if body.last_name is not None:
        customer.last_name = body.last_name
    if body.phone is not None:
        customer.phone = body.phone
    if body.shipping_address is not None:
        customer.shipping_address = body.shipping_address

    session.add(customer)
    await session.commit()
    await session.refresh(customer)

    return CustomerProfileResponse(
        id=str(customer.id),
        first_name=customer.first_name,
        last_name=customer.last_name,
        phone=customer.phone,
        shipping_address=customer.shipping_address,
    )


@router.get("/customers/orders", response_model=List[OrderResponse])
async def get_customer_orders(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    orders_result = await session.exec(
        select(Order)
        .where(Order.customer_id == customer.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    orders = orders_result.all()

    response = []
    for order in orders:
        items = [
            OrderItemResponse(
                id=str(item.id),
                product_id=str(item.product_id),
                product_name=item.product.name if item.product else "Unknown",
                quantity=item.quantity,
                price_at_purchase=float(item.price_at_purchase),
            )
            for item in order.items
        ]
        response.append(
            OrderResponse(
                id=str(order.id),
                total_amount=float(order.total_amount),
                status=order.status.value,
                created_at=order.created_at,
                items=items,
            )
        )
    return response


@router.post("/consultations", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
async def book_consultation(
    body: ConsultationCreateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    customer_result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = customer_result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    vendor_result = await session.exec(
        select(Vendor).where(Vendor.id == body.vendor_id)
    )
    vendor = vendor_result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if body.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    consultation = NutritionConsultation(
        customer_id=customer.id,
        vendor_id=vendor.id,
        scheduled_at=body.scheduled_at,
    )
    session.add(consultation)
    await session.commit()
    await session.refresh(consultation)

    return ConsultationResponse(
        id=str(consultation.id),
        vendor_id=str(consultation.vendor_id),
        scheduled_at=consultation.scheduled_at,
        status=consultation.status.value,
        meeting_link=consultation.meeting_link,
        notes=consultation.notes,
    )


@router.get("/consultations", response_model=List[ConsultationResponse])
async def list_consultations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    customer_result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = customer_result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    cons_result = await session.exec(
        select(NutritionConsultation)
        .where(NutritionConsultation.customer_id == customer.id)
        .order_by(NutritionConsultation.scheduled_at.desc())
    )
    consultations = cons_result.all()

    return [
        ConsultationResponse(
            id=str(c.id),
            vendor_id=str(c.vendor_id),
            scheduled_at=c.scheduled_at,
            status=c.status.value,
            meeting_link=c.meeting_link,
            notes=c.notes,
        )
        for c in consultations
    ]
