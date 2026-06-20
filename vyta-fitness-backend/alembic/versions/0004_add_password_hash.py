"""Add password_hash to users for local auth

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.VARCHAR(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
