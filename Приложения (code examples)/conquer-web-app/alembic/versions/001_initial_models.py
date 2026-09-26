"""Initial analysis models.

Revision ID: 001_initial_models
Revises:
Create Date: 2026-08-24 22:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_models"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "analysis_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_analysis_requests_status"),
        "analysis_requests",
        ["status"],
        unique=False,
    )

    op.create_table(
        "parsed_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("text_content", sa.Text(), nullable=True),
        sa.Column("headings", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("links", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("prices", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("contacts", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(
            ["request_id"],
            ["analysis_requests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id"),
    )
    op.create_index(
        op.f("ix_parsed_data_request_id"),
        "parsed_data",
        ["request_id"],
        unique=False,
    )

    op.create_table(
        "analysis_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column(
            "metrics",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["request_id"],
            ["analysis_requests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("request_id"),
    )
    op.create_index(
        op.f("ix_analysis_results_request_id"),
        "analysis_results",
        ["request_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analysis_results_request_id"), table_name="analysis_results")
    op.drop_table("analysis_results")
    op.drop_index(op.f("ix_parsed_data_request_id"), table_name="parsed_data")
    op.drop_table("parsed_data")
    op.drop_index(op.f("ix_analysis_requests_status"), table_name="analysis_requests")
    op.drop_table("analysis_requests")
