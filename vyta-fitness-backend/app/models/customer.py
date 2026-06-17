from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.consultation import NutritionConsultation
    from app.models.order import Order
    from app.models.user import User


class CustomerStoreRole(str, PyEnum):
    BUYER = "buyer"
    ACQUIRE_BARBELL_PLATES = "acquire_barbell_plates_apparel_snacks"


class Customer(SQLModel, table=True):
    __tablename__ = "customers"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(foreign_key="users.id", unique=True, nullable=False)
    first_name: str = Field(max_length=255, nullable=False)
    last_name: str = Field(max_length=255, nullable=False)
    name: Optional[str] = Field(max_length=255, default=None)
    store_role: Optional[str] = Field(max_length=100, default=None)
    phone: Optional[str] = Field(max_length=20, default=None)
    shipping_address: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="customer")
    orders: List["Order"] = Relationship(back_populates="customer")
    consultations: List["NutritionConsultation"] = Relationship(back_populates="customer")
