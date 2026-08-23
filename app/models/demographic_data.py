"""
NEXUS Platform — DemographicData Model

Represents an administrative region with its population metrics and
spatial boundary. Serves as the central entity that other models
reference via foreign key (InfrastructureIndex, PublicBudgetPlan)
or spatial join (CitizenRequest).
"""

import uuid

from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DemographicData(Base):
    __tablename__ = "demographic_data"

    # Primary Key
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --- Region Identity ---
    region_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="Human-readable region/ward name",
    )

    # --- Demographics ---
    population_density: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Population per square kilometer",
    )
    vulnerability_index: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Composite vulnerability score (0 = least vulnerable, 100 = most)",
    )

    # --- Spatial Boundary ---
    boundary: Mapped[WKBElement] = mapped_column(
        Geometry(
            geometry_type="POLYGON",
            srid=4326,
            spatial_index=True,
        ),
        nullable=False,
        comment="Administrative boundary polygon in WGS 84",
    )

    # --- Relationships ---
    infrastructure: Mapped["InfrastructureIndex"] = relationship(  # noqa: F821
        "InfrastructureIndex",
        back_populates="region",
        uselist=False,
        cascade="all, delete-orphan",
    )
    budget_plans: Mapped[list["PublicBudgetPlan"]] = relationship(  # noqa: F821
        "PublicBudgetPlan",
        back_populates="region",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        {"comment": "Administrative regions with demographic metrics and spatial boundaries"},
    )

    def __repr__(self) -> str:
        return (
            f"<DemographicData(region={self.region_name!r}, "
            f"pop_density={self.population_density}, "
            f"vuln={self.vulnerability_index})>"
        )
