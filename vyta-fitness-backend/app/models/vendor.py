from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import Column, Enum as SAEnum, JSON, Numeric
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.consultation import NutritionConsultation
    from app.models.order import Order
    from app.models.product import Product
    from app.models.user import User


class OnboardingStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DocumentType(str, PyEnum):
    ID_PROOF = "id_proof"
    BUSINESS_LICENSE = "business_license"
    CERTIFICATION = "certification"


class DocumentStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TransactionType(str, PyEnum):
    CREDIT = "credit"
    DEBIT = "debit"


class WithdrawalStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Vendor(SQLModel, table=True):
    __tablename__ = "vendors"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, nullable=False)
    business_name: str = Field(unique=True, max_length=255, nullable=False)
    description: Optional[str] = Field(default=None)
    logo_url: Optional[str] = Field(default=None)
    onboarding_status: OnboardingStatus = Field(
        default=OnboardingStatus.PENDING,
        sa_column=SAEnum(
            OnboardingStatus,
            values_callable=lambda x: [e.value for e in x],
            name="onboarding_status",
            nullable=False,
        ),
    )
    current_balance: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False),
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="vendor")
    products: List["Product"] = Relationship(back_populates="vendor")
    documents: List["VendorDocument"] = Relationship(back_populates="vendor")
    transactions: List["VendorTransaction"] = Relationship(back_populates="vendor")
    withdrawal_requests: List["WithdrawalRequest"] = Relationship(back_populates="vendor")
    consultations: List["NutritionConsultation"] = Relationship(back_populates="vendor")


class VendorDocument(SQLModel, table=True):
    __tablename__ = "vendor_documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vendor_id: uuid.UUID = Field(foreign_key="vendors.id", nullable=False)
    document_type: DocumentType = Field(
        sa_column=SAEnum(
            DocumentType,
            values_callable=lambda x: [e.value for e in x],
            name="document_type",
            nullable=False,
        )
    )
    document_url: str = Field(nullable=False)
    status: DocumentStatus = Field(
        default=DocumentStatus.PENDING,
        sa_column=SAEnum(
            DocumentStatus,
            values_callable=lambda x: [e.value for e in x],
            name="document_status",
            nullable=False,
        ),
    )
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    vendor: Optional["Vendor"] = Relationship(back_populates="documents")


class VendorTransaction(SQLModel, table=True):
    __tablename__ = "vendor_transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vendor_id: uuid.UUID = Field(foreign_key="vendors.id", nullable=False)
    order_id: Optional[uuid.UUID] = Field(foreign_key="orders.id", default=None)
    amount: Decimal = Field(
        sa_column=Column(Numeric(12, 2), nullable=False),
    )
    type: TransactionType = Field(
        sa_column=SAEnum(
            TransactionType,
            values_callable=lambda x: [e.value for e in x],
            name="transaction_type",
            nullable=False,
        )
    )
    description: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    vendor: Optional["Vendor"] = Relationship(back_populates="transactions")
    order: Optional["Order"] = Relationship(back_populates="vendor_transactions")


class WithdrawalRequest(SQLModel, table=True):
    __tablename__ = "withdrawal_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    vendor_id: uuid.UUID = Field(foreign_key="vendors.id", nullable=False)
    amount: Decimal = Field(
        sa_column=Column(Numeric(12, 2), nullable=False),
    )
    bank_details: Dict[str, Any] = Field(sa_column=Column(JSON, nullable=False))
    status: WithdrawalStatus = Field(
        default=WithdrawalStatus.PENDING,
        sa_column=SAEnum(
            WithdrawalStatus,
            values_callable=lambda x: [e.value for e in x],
            name="withdrawal_status",
            nullable=False,
        ),
    )
    processed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    vendor: Optional["Vendor"] = Relationship(back_populates="withdrawal_requests")
