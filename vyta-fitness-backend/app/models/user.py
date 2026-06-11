from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.vendor import Vendor


class UserRole(str, PyEnum):
    ADMIN = "admin"
    VENDOR = "vendor"
    CUSTOMER = "customer"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255, nullable=False)
    password_hash: str = Field(nullable=False)
    role: UserRole = Field(
        sa_column=SAEnum(
            UserRole,
            values_callable=lambda x: [e.value for e in x],
            name="user_role",
            nullable=False,
        )
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    customer: Optional["Customer"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    vendor: Optional["Vendor"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
