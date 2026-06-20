"""Add name, store_role, updated_at to customers; mfa_enabled to users

Revision ID: 0001
Revises: 
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "0001"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("name", sa.VARCHAR(255), nullable=True))
    op.add_column("customers", sa.Column("store_role", sa.VARCHAR(100), nullable=True))
    op.add_column(
        "customers",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("customers", "name")
    op.drop_column("customers", "store_role")
    op.drop_column("customers", "updated_at")
    op.drop_column("users", "mfa_enabled")
