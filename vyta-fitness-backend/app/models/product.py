from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.order import OrderItem
    from app.models.vendor import Vendor


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vendor_id: uuid.UUID = Field(foreign_key="vendors.id", nullable=False)
    name: str = Field(index=True, max_length=255, nullable=False)
    description: str = Field(default="")
    price: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
    )
    stock_quantity: int = Field(default=0)
    image_url: Optional[str] = Field(default=None)
    is_available: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    vendor: Optional["Vendor"] = Relationship(back_populates="products")
    order_items: List["OrderItem"] = Relationship(back_populates="product")
