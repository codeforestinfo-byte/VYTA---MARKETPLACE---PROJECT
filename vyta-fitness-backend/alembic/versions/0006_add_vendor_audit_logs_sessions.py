"""Add vendor audit logs, login history, and sessions tables

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS vendor_login_history (
            id UUID NOT NULL,
            vendor_id VARCHAR(128) NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(512),
            success BOOLEAN NOT NULL,
            failure_reason VARCHAR(255),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_vendor_login_history_vendor_id ON vendor_login_history (vendor_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS vendor_sessions (
            id UUID NOT NULL,
            vendor_id VARCHAR(128) NOT NULL,
            token_hash VARCHAR(512) NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(512),
            is_active BOOLEAN NOT NULL,
            last_activity TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_vendor_sessions_vendor_id ON vendor_sessions (vendor_id)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_vendor_sessions_token_hash ON vendor_sessions (token_hash)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS vendor_audit_logs (
            id UUID NOT NULL,
            vendor_id VARCHAR(128) NOT NULL,
            action VARCHAR(255) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id VARCHAR(255),
            details JSON,
            ip_address VARCHAR(45),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_vendor_audit_logs_vendor_id ON vendor_audit_logs (vendor_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_vendor_audit_logs_vendor_id")
    op.execute("DROP TABLE IF EXISTS vendor_audit_logs")
    op.execute("DROP INDEX IF EXISTS ix_vendor_sessions_token_hash")
    op.execute("DROP INDEX IF EXISTS ix_vendor_sessions_vendor_id")
    op.execute("DROP TABLE IF EXISTS vendor_sessions")
    op.execute("DROP INDEX IF EXISTS ix_vendor_login_history_vendor_id")
    op.execute("DROP TABLE IF EXISTS vendor_login_history")
