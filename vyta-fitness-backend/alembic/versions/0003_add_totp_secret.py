"""Add totp_secret to vendors

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vendors", sa.Column("totp_secret", sa.VARCHAR(512), nullable=True))


def downgrade() -> None:
    op.drop_column("vendors", "totp_secret")
