"""
NEXUS Platform — CitizenRequest Model

Captures raw citizen feedback/complaints ingested from multiple channels
(SMS, WhatsApp, voice, web). Spatial location enables automatic routing
to the correct administrative region via PostGIS ST_Contains.
"""

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CategoryEnum


class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --- Content ---
    raw_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Original citizen input text",
    )
    translated_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Machine-translated text (populated by NLP pipeline)",
    )

    # --- Classification ---
    category: Mapped[CategoryEnum] = mapped_column(
        Enum(CategoryEnum, name="category_enum", create_constraint=True),
        nullable=False,
        comment="Infrastructure category",
    )
    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="ISO 639-1 language code (e.g. 'zu', 'af', 'en')",
    )

    # --- Sentiment ---
    sentiment_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        comment="Sentiment analysis score, range -1.0 (negative) to 1.0 (positive)",
    )

    # --- Spatial ---
    location: Mapped[WKBElement] = mapped_column(
        Geometry(
            geometry_type="POINT",
            srid=4326,
            spatial_index=True,
        ),
        nullable=False,
        comment="PostGIS Point (longitude, latitude) in WGS 84",
    )

    # --- Temporal ---
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        comment="When the request was submitted",
    )

    # --- Flexible Metadata ---
    metadata_json: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
        comment="Arbitrary metadata (channel, device, attachments, etc.)",
    )

    # --- Composite Indexes for common query patterns ---
    __table_args__ = (
        Index("ix_citizen_requests_category_ts", "category", "timestamp"),
        {"comment": "Citizen feedback/complaint records with geolocation"},
    )

    def __repr__(self) -> str:
        return (
            f"<CitizenRequest(id={self.id!s:.8}, "
            f"category={self.category.value}, "
            f"lang={self.language})>"
        )
