import uuid
from datetime import datetime, timezone
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import DateTime, Enum, Float, Index, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base, CategoryEnum


class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[CategoryEnum] = mapped_column(
        Enum(CategoryEnum, name="category_enum", create_constraint=True),
        nullable=False,
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    location: Mapped[WKBElement] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Governance & Triage fields
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="APPROVED")
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    flag_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_citizen_requests_category_ts", "category", "timestamp"),
    )
