from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Column, Enum as SAEnum, Numeric
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.product import Product
    from app.models.vendor import VendorTransaction


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    customer_id: uuid.UUID = Field(foreign_key="customers.id", nullable=False)
    total_amount: Decimal = Field(
        sa_column=Column(Numeric(12, 2), nullable=False),
    )
    status: OrderStatus = Field(
        default=OrderStatus.PENDING,
        sa_column=SAEnum(
            OrderStatus,
            values_callable=lambda x: [e.value for e in x],
            name="order_status",
            nullable=False,
        ),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    customer: Optional["Customer"] = Relationship(back_populates="orders")
    items: List["OrderItem"] = Relationship(back_populates="order")
    vendor_transactions: List["VendorTransaction"] = Relationship(back_populates="order")


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", nullable=False)
    product_id: uuid.UUID = Field(foreign_key="products.id", nullable=False)
    quantity: int = Field(nullable=False)
    price_at_purchase: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
    )

    order: Optional["Order"] = Relationship(back_populates="items")
    product: Optional["Product"] = Relationship(back_populates="order_items")
