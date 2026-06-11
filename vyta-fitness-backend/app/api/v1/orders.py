from decimal import Decimal
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.dependencies import RoleChecker
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.vendor import Vendor, VendorTransaction, TransactionType

router = APIRouter(tags=["Orders"])


class OrderItemRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int


class CreateOrderRequest(BaseModel):
    items: List[OrderItemRequest]


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
    created_at: str
    items: List[OrderItemResponse]


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER])),
):
    customer_result = await session.exec(
        select(Customer).where(Customer.user_id == current_user.id)
    )
    customer = customer_result.one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    if not body.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    product_quantities = {}
    for item_req in body.items:
        if item_req.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Invalid quantity for product {item_req.product_id}")

        product = await session.get(Product, item_req.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_req.product_id} not found")
        if not product.is_available:
            raise HTTPException(status_code=400, detail=f"Product {product.name} is not available")
        if product.stock_quantity < item_req.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}: requested {item_req.quantity}, available {product.stock_quantity}",
            )

        if item_req.product_id in product_quantities:
            product_quantities[item_req.product_id]["quantity"] += item_req.quantity
        else:
            product_quantities[item_req.product_id] = {
                "product": product,
                "quantity": item_req.quantity,
            }

    total_amount = Decimal("0.00")
    for entry in product_quantities.values():
        total_amount += entry["product"].price * entry["quantity"]

    order = Order(
        customer_id=customer.id,
        total_amount=total_amount,
        status=OrderStatus.PENDING,
    )
    session.add(order)
    await session.flush()

    for entry in product_quantities.values():
        product = entry["product"]
        qty = entry["quantity"]

        product.stock_quantity -= qty
        session.add(product)

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            price_at_purchase=product.price,
        )
        session.add(order_item)

        vendor = await session.get(Vendor, product.vendor_id)
        if vendor:
            transaction = VendorTransaction(
                vendor_id=vendor.id,
                order_id=order.id,
                amount=product.price * qty,
                type=TransactionType.CREDIT,
                description=f"Sale: {product.name} x{qty}",
            )
            session.add(transaction)
            vendor.current_balance += product.price * qty
            session.add(vendor)

    await session.commit()

    result = await session.exec(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    saved_order = result.one()

    return OrderResponse(
        id=str(saved_order.id),
        total_amount=float(saved_order.total_amount),
        status=saved_order.status.value,
        created_at=saved_order.created_at.isoformat(),
        items=[
            OrderItemResponse(
                id=str(item.id),
                product_id=str(item.product_id),
                product_name=item.product.name if item.product else "Unknown",
                quantity=item.quantity,
                price_at_purchase=float(item.price_at_purchase),
            )
            for item in saved_order.items
        ],
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN])),
):
    result = await session.exec(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        id=str(order.id),
        total_amount=float(order.total_amount),
        status=order.status.value,
        created_at=order.created_at.isoformat(),
        items=[
            OrderItemResponse(
                id=str(item.id),
                product_id=str(item.product_id),
                product_name=item.product.name if item.product else "Unknown",
                quantity=item.quantity,
                price_at_purchase=float(item.price_at_purchase),
            )
            for item in order.items
        ],
    )


@router.get("/orders", response_model=List[OrderResponse])
async def list_orders(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    result = await session.exec(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    orders = result.all()
    return [
        OrderResponse(
            id=str(o.id),
            total_amount=float(o.total_amount),
            status=o.status.value,
            created_at=o.created_at.isoformat(),
            items=[
                OrderItemResponse(
                    id=str(item.id),
                    product_id=str(item.product_id),
                    product_name=item.product.name if item.product else "Unknown",
                    quantity=item.quantity,
                    price_at_purchase=float(item.price_at_purchase),
                )
                for item in o.items
            ],
        )
        for o in orders
    ]
