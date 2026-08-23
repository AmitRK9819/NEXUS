"""
NEXUS Platform — HumanOversightQueue Model

Holds items flagged for human review — either citizen requests with
low NLP confidence or AI-generated insights that require validation
before publication. Implements an approval workflow with Pending,
Approved, and Flagged states.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, OversightStatusEnum


class HumanOversightQueue(Base):
    __tablename__ = "human_oversight_queue"

    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --- Reference ---
    request_or_insight_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="UUID of the CitizenRequest or analysis output under review",
    )

    # --- Review Context ---
    trigger_reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Why this item was flagged (e.g. 'Low NLP confidence', 'Anomalous sentiment')",
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Model confidence score that triggered the review (0.0–1.0)",
    )

    # --- Workflow ---
    status: Mapped[OversightStatusEnum] = mapped_column(
        Enum(OversightStatusEnum, name="oversight_status_enum", create_constraint=True),
        nullable=False,
        default=OversightStatusEnum.PENDING,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        comment="Timestamp when a reviewer picked up this item",
    )

    __table_args__ = (
        {"comment": "Items requiring human review before publication or action"},
    )

    def __repr__(self) -> str:
        return (
            f"<HumanOversightQueue(id={self.id!s:.8}, "
            f"status={self.status.value}, "
            f"confidence={self.confidence_score:.2f})>"
        )
