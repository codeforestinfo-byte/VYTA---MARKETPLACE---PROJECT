"""Add admin management tables: roles, permissions, invitations, audit logs, sessions, login history

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types if they don't already exist (matching SQLModel naming)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE adminrole AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT_AGENT', 'CONTENT_MANAGER', 'FINANCE');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE permissionmodule AS ENUM ('ORDERS', 'VENDORS', 'PRODUCTS', 'WITHDRAWALS', 'CONSULTATIONS', 'CUSTOMERS');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE permissionaction AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # Create tables if they don't already exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_role_permissions (
            id UUID NOT NULL,
            role adminrole NOT NULL,
            module permissionmodule NOT NULL,
            action permissionaction NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_invitations (
            id UUID NOT NULL,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role adminrole NOT NULL,
            token VARCHAR(512) NOT NULL,
            expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            accepted_at TIMESTAMP WITHOUT TIME ZONE,
            invited_by VARCHAR(128) NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_admin_invitations_email ON admin_invitations (email)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_admin_invitations_token ON admin_invitations (token)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID NOT NULL,
            admin_id VARCHAR(128) NOT NULL,
            action VARCHAR(255) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id VARCHAR(255),
            details JSON,
            ip_address VARCHAR(45),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_admin_id ON audit_logs (admin_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS login_history (
            id UUID NOT NULL,
            admin_id VARCHAR(128) NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(512),
            success BOOLEAN NOT NULL,
            failure_reason VARCHAR(255),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_login_history_admin_id ON login_history (admin_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS admin_sessions (
            id UUID NOT NULL,
            admin_id VARCHAR(128) NOT NULL,
            token_hash VARCHAR(512) NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(512),
            is_active BOOLEAN NOT NULL,
            last_activity TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_admin_sessions_admin_id ON admin_sessions (admin_id)")

    # Seed default role permissions (only if table is empty)
    op.execute("""
        INSERT INTO admin_role_permissions (id, role, module, action, created_at)
        SELECT gen_random_uuid(), role, module, action, NOW()
        FROM (VALUES
            -- super_admin: all permissions on all modules
            ('SUPER_ADMIN'::adminrole, 'ORDERS'::permissionmodule, 'VIEW'::permissionaction),
            ('SUPER_ADMIN', 'ORDERS', 'CREATE'),
            ('SUPER_ADMIN', 'ORDERS', 'EDIT'),
            ('SUPER_ADMIN', 'ORDERS', 'DELETE'),
            ('SUPER_ADMIN', 'VENDORS', 'VIEW'),
            ('SUPER_ADMIN', 'VENDORS', 'CREATE'),
            ('SUPER_ADMIN', 'VENDORS', 'EDIT'),
            ('SUPER_ADMIN', 'VENDORS', 'DELETE'),
            ('SUPER_ADMIN', 'PRODUCTS', 'VIEW'),
            ('SUPER_ADMIN', 'PRODUCTS', 'CREATE'),
            ('SUPER_ADMIN', 'PRODUCTS', 'EDIT'),
            ('SUPER_ADMIN', 'PRODUCTS', 'DELETE'),
            ('SUPER_ADMIN', 'WITHDRAWALS', 'VIEW'),
            ('SUPER_ADMIN', 'WITHDRAWALS', 'CREATE'),
            ('SUPER_ADMIN', 'WITHDRAWALS', 'EDIT'),
            ('SUPER_ADMIN', 'WITHDRAWALS', 'DELETE'),
            ('SUPER_ADMIN', 'CONSULTATIONS', 'VIEW'),
            ('SUPER_ADMIN', 'CONSULTATIONS', 'CREATE'),
            ('SUPER_ADMIN', 'CONSULTATIONS', 'EDIT'),
            ('SUPER_ADMIN', 'CONSULTATIONS', 'DELETE'),
            ('SUPER_ADMIN', 'CUSTOMERS', 'VIEW'),
            ('SUPER_ADMIN', 'CUSTOMERS', 'CREATE'),
            ('SUPER_ADMIN', 'CUSTOMERS', 'EDIT'),
            ('SUPER_ADMIN', 'CUSTOMERS', 'DELETE'),
            -- admin: all permissions on all modules
            ('ADMIN', 'ORDERS', 'VIEW'),
            ('ADMIN', 'ORDERS', 'CREATE'),
            ('ADMIN', 'ORDERS', 'EDIT'),
            ('ADMIN', 'ORDERS', 'DELETE'),
            ('ADMIN', 'VENDORS', 'VIEW'),
            ('ADMIN', 'VENDORS', 'CREATE'),
            ('ADMIN', 'VENDORS', 'EDIT'),
            ('ADMIN', 'VENDORS', 'DELETE'),
            ('ADMIN', 'PRODUCTS', 'VIEW'),
            ('ADMIN', 'PRODUCTS', 'CREATE'),
            ('ADMIN', 'PRODUCTS', 'EDIT'),
            ('ADMIN', 'PRODUCTS', 'DELETE'),
            ('ADMIN', 'WITHDRAWALS', 'VIEW'),
            ('ADMIN', 'WITHDRAWALS', 'CREATE'),
            ('ADMIN', 'WITHDRAWALS', 'EDIT'),
            ('ADMIN', 'WITHDRAWALS', 'DELETE'),
            ('ADMIN', 'CONSULTATIONS', 'VIEW'),
            ('ADMIN', 'CONSULTATIONS', 'CREATE'),
            ('ADMIN', 'CONSULTATIONS', 'EDIT'),
            ('ADMIN', 'CONSULTATIONS', 'DELETE'),
            ('ADMIN', 'CUSTOMERS', 'VIEW'),
            ('ADMIN', 'CUSTOMERS', 'CREATE'),
            ('ADMIN', 'CUSTOMERS', 'EDIT'),
            ('ADMIN', 'CUSTOMERS', 'DELETE'),
            -- support_agent: view on orders, customers, consultations; edit on consultations
            ('SUPPORT_AGENT', 'ORDERS', 'VIEW'),
            ('SUPPORT_AGENT', 'CUSTOMERS', 'VIEW'),
            ('SUPPORT_AGENT', 'CONSULTATIONS', 'VIEW'),
            ('SUPPORT_AGENT', 'CONSULTATIONS', 'EDIT'),
            -- content_manager: full on products, vendors; view on orders, customers
            ('CONTENT_MANAGER', 'PRODUCTS', 'VIEW'),
            ('CONTENT_MANAGER', 'PRODUCTS', 'CREATE'),
            ('CONTENT_MANAGER', 'PRODUCTS', 'EDIT'),
            ('CONTENT_MANAGER', 'PRODUCTS', 'DELETE'),
            ('CONTENT_MANAGER', 'VENDORS', 'VIEW'),
            ('CONTENT_MANAGER', 'VENDORS', 'CREATE'),
            ('CONTENT_MANAGER', 'VENDORS', 'EDIT'),
            ('CONTENT_MANAGER', 'ORDERS', 'VIEW'),
            ('CONTENT_MANAGER', 'CUSTOMERS', 'VIEW'),
            -- finance: full on withdrawals, orders view; vendors view
            ('FINANCE', 'WITHDRAWALS', 'VIEW'),
            ('FINANCE', 'WITHDRAWALS', 'CREATE'),
            ('FINANCE', 'WITHDRAWALS', 'EDIT'),
            ('FINANCE', 'WITHDRAWALS', 'DELETE'),
            ('FINANCE', 'ORDERS', 'VIEW'),
            ('FINANCE', 'ORDERS', 'EDIT'),
            ('FINANCE', 'VENDORS', 'VIEW')
        ) AS data(role, module, action)
        WHERE NOT EXISTS (SELECT 1 FROM admin_role_permissions LIMIT 1)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_admin_sessions_admin_id")
    op.execute("DROP TABLE IF EXISTS admin_sessions")
    op.execute("DROP INDEX IF EXISTS ix_login_history_admin_id")
    op.execute("DROP TABLE IF EXISTS login_history")
    op.execute("DROP INDEX IF EXISTS ix_audit_logs_admin_id")
    op.execute("DROP TABLE IF EXISTS audit_logs")
    op.execute("DROP INDEX IF EXISTS ix_admin_invitations_token")
    op.execute("DROP INDEX IF EXISTS ix_admin_invitations_email")
    op.execute("DROP TABLE IF EXISTS admin_invitations")
    op.execute("DROP TABLE IF EXISTS admin_role_permissions")

    op.execute("DROP TYPE IF EXISTS adminrole")
    op.execute("DROP TYPE IF EXISTS permissionmodule")
    op.execute("DROP TYPE IF EXISTS permissionaction")
