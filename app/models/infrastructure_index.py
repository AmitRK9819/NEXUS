"""
NEXUS Platform — InfrastructureIndex Model

One-to-one extension of DemographicData that tracks composite
infrastructure quality scores for each region. Updated periodically
by data ingestion pipelines.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class InfrastructureIndex(Base):
    __tablename__ = "infrastructure_index"

    # Primary Key = Foreign Key (one-to-one with DemographicData)
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demographic_data.region_id", ondelete="CASCADE"),
        primary_key=True,
    )

    # --- Sector Scores (0–100 scale) ---
    water_quality_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Potable water quality index (0 = hazardous, 100 = excellent)",
    )
    road_condition_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Road surface & connectivity index (0 = impassable, 100 = pristine)",
    )
    grid_reliability_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Electrical grid uptime index (0 = no power, 100 = fully reliable)",
    )
    digital_connectivity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Broadband/mobile coverage index (0 = no signal, 100 = full coverage)",
    )

    # --- Temporal ---
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        comment="Timestamp of the most recent data refresh",
    )

    # --- Relationship ---
    region: Mapped["DemographicData"] = relationship(  # noqa: F821
        "DemographicData",
        back_populates="infrastructure",
    )

    __table_args__ = (
        {"comment": "Infrastructure quality scores per region (one-to-one with demographic_data)"},
    )

    def __repr__(self) -> str:
        return (
            f"<InfrastructureIndex(region_id={self.region_id!s:.8}, "
            f"water={self.water_quality_score}, "
            f"road={self.road_condition_score}, "
            f"grid={self.grid_reliability_score}, "
            f"digital={self.digital_connectivity_score})>"
        )
