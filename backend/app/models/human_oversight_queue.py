import uuid
from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base, OversightStatusEnum


class HumanOversightQueue(Base):
    __tablename__ = "human_oversight_queue"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    request_or_insight_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    trigger_reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[OversightStatusEnum] = mapped_column(
        Enum(OversightStatusEnum, name="oversight_status_enum", create_constraint=True),
        nullable=False,
        default=OversightStatusEnum.PENDING,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
