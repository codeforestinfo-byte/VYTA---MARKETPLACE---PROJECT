from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.vendor import Vendor


class ConsultationStatus(str, PyEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class NutritionConsultation(SQLModel, table=True):
    __tablename__ = "nutrition_consultations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    customer_id: uuid.UUID = Field(foreign_key="customers.id", nullable=False)
    vendor_id: uuid.UUID = Field(foreign_key="vendors.id", nullable=False)
    scheduled_at: datetime = Field(nullable=False)
    status: ConsultationStatus = Field(
        default=ConsultationStatus.SCHEDULED,
        sa_column=SAEnum(
            ConsultationStatus,
            values_callable=lambda x: [e.value for e in x],
            name="consultation_status",
            nullable=False,
        ),
    )
    meeting_link: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    customer: Optional["Customer"] = Relationship(back_populates="consultations")
    vendor: Optional["Vendor"] = Relationship(back_populates="consultations")
