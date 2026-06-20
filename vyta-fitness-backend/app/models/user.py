from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional

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

    id: str = Field(primary_key=True, max_length=128)
    email: str = Field(unique=True, index=True, max_length=255, nullable=False)
    name: str = Field(max_length=255, nullable=False)
    store_role: Optional[str] = Field(max_length=100, default=None)
    role: UserRole = Field(
        sa_column=SAEnum(
            UserRole,
            values_callable=lambda x: [e.value for e in x],
            name="user_role",
            nullable=False,
        )
    )
    password_hash: Optional[str] = Field(max_length=255, default=None, nullable=True)
    is_active: bool = Field(default=True)
    email_verified: bool = Field(default=False)
    is_super_admin: bool = Field(default=False)
    mfa_enabled: bool = Field(default=False)
    totp_secret: Optional[str] = Field(default=None, max_length=512, nullable=True)
    verification_token: Optional[str] = Field(default=None, max_length=512, nullable=True, index=True)
    verification_token_expires: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    customer: Optional["Customer"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    vendor: Optional["Vendor"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
