import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base


class InfrastructureIndex(Base):
    __tablename__ = "infrastructure_index"

    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demographic_data.region_id", ondelete="CASCADE"),
        primary_key=True,
    )
    water_quality_score: Mapped[float] = mapped_column(Float, nullable=False)
    road_condition_score: Mapped[float] = mapped_column(Float, nullable=False)
    grid_reliability_score: Mapped[float] = mapped_column(Float, nullable=False)
    digital_connectivity_score: Mapped[float] = mapped_column(Float, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    region: Mapped["DemographicData"] = relationship(  # noqa: F821
        "DemographicData",
        back_populates="infrastructure",
    )

    @property
    def composite_score(self) -> float:
        """Composite infrastructure quality score normalized to 0.0 - 1.0."""
        return (
            self.water_quality_score +
            self.road_condition_score +
            self.grid_reliability_score +
            self.digital_connectivity_score
        ) / 400.0
