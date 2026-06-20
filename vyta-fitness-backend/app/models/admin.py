from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import Column, DateTime, Enum as SAEnum, JSON, String, Text
from sqlmodel import Field, Relationship, SQLModel


class AdminRole(str, PyEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPORT_AGENT = "support_agent"
    CONTENT_MANAGER = "content_manager"
    FINANCE = "finance"


class PermissionModule(str, PyEnum):
    ORDERS = "orders"
    VENDORS = "vendors"
    PRODUCTS = "products"
    WITHDRAWALS = "withdrawals"
    CONSULTATIONS = "consultations"
    CUSTOMERS = "customers"


class PermissionAction(str, PyEnum):
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"


class AdminRolePermission(SQLModel, table=True):
    __tablename__ = "admin_role_permissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: AdminRole = Field(
        sa_column=SAEnum(
            AdminRole,
            values_callable=lambda x: [e.value for e in x],
            name="admin_role_enum",
            nullable=False,
        )
    )
    module: PermissionModule = Field(
        sa_column=SAEnum(
            PermissionModule,
            values_callable=lambda x: [e.value for e in x],
            name="permission_module_enum",
            nullable=False,
        )
    )
    action: PermissionAction = Field(
        sa_column=SAEnum(
            PermissionAction,
            values_callable=lambda x: [e.value for e in x],
            name="permission_action_enum",
            nullable=False,
        )
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminInvitation(SQLModel, table=True):
    __tablename__ = "admin_invitations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=255, nullable=False, index=True)
    name: str = Field(max_length=255, nullable=False)
    role: AdminRole = Field(
        sa_column=SAEnum(
            AdminRole,
            values_callable=lambda x: [e.value for e in x],
            name="admin_invitation_role_enum",
            nullable=False,
        )
    )
    token: str = Field(max_length=512, unique=True, nullable=False, index=True)
    expires_at: datetime = Field(nullable=False)
    accepted_at: Optional[datetime] = Field(default=None)
    invited_by: str = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    action: str = Field(max_length=255, nullable=False)
    resource_type: str = Field(max_length=100, nullable=False)
    resource_id: Optional[str] = Field(default=None, max_length=255)
    details: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    ip_address: Optional[str] = Field(default=None, max_length=45)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LoginHistory(SQLModel, table=True):
    __tablename__ = "login_history"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=512)
    success: bool = Field(default=True)
    failure_reason: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminSession(SQLModel, table=True):
    __tablename__ = "admin_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    token_hash: str = Field(max_length=512, nullable=False, unique=True)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=512)
    is_active: bool = Field(default=True)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ApprovalStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AdminApproval(SQLModel, table=True):
    __tablename__ = "admin_approvals"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    requested_role: AdminRole = Field(
        sa_column=SAEnum(
            AdminRole,
            values_callable=lambda x: [e.value for e in x],
            name="admin_approval_role_enum",
            nullable=False,
        )
    )
    status: ApprovalStatus = Field(
        sa_column=SAEnum(
            ApprovalStatus,
            values_callable=lambda x: [e.value for e in x],
            name="approval_status_enum",
            nullable=False,
            default=ApprovalStatus.PENDING,
        )
    )
    approved_by: Optional[str] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AccountLockout(SQLModel, table=True):
    __tablename__ = "account_lockouts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True, unique=True)
    failed_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None)
    is_locked: bool = Field(default=False)
    last_failure_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SessionPolicyConfig(SQLModel, table=True):
    __tablename__ = "session_policy_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    idle_timeout_minutes: int = Field(default=30)
    max_concurrent_sessions: int = Field(default=5)
    enforce_for_all: bool = Field(default=True)
    updated_by: Optional[str] = Field(default=None, foreign_key="users.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLogRetentionConfig(SQLModel, table=True):
    __tablename__ = "audit_log_retention_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    retention_days: int = Field(default=365)
    auto_delete_enabled: bool = Field(default=False)
    last_cleaned_at: Optional[datetime] = Field(default=None)
    updated_by: Optional[str] = Field(default=None, foreign_key="users.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class IPAllowlistEntry(SQLModel, table=True):
    __tablename__ = "ip_allowlist_entries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ip_address: str = Field(max_length=45, nullable=False, index=True)
    description: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    created_by: str = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ForceAction(SQLModel, table=True):
    __tablename__ = "force_actions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    admin_id: str = Field(foreign_key="users.id", nullable=False, index=True)
    action_type: str = Field(max_length=50, nullable=False)  # password_reset, mfa_enrollment, email_verification
    is_completed: bool = Field(default=False)
    forced_by: str = Field(foreign_key="users.id", nullable=False)
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
