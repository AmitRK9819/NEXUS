"""
NEXUS Platform — PublicBudgetPlan Model

Tracks government-allocated infrastructure projects, their budgets,
lifecycle status, and spatial extent. Foreign-keyed to DemographicData
so budget allocation can be correlated with vulnerability and
infrastructure scores for equity analysis.
"""

import uuid
from datetime import date

from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CategoryEnum, ProjectStatusEnum


class PublicBudgetPlan(Base):
    __tablename__ = "public_budget_plans"

    # Primary Key
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --- Region Link ---
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demographic_data.region_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Project Details ---
    project_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    category: Mapped[CategoryEnum] = mapped_column(
        Enum(CategoryEnum, name="category_enum", create_constraint=True, create_type=False),
        nullable=False,
        comment="Infrastructure category (shared enum with CitizenRequest)",
    )
    allocated_budget_usd: Mapped[float] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=False,
        comment="Budget allocation in USD",
    )

    # --- Timeline ---
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    status: Mapped[ProjectStatusEnum] = mapped_column(
        Enum(ProjectStatusEnum, name="project_status_enum", create_constraint=True),
        nullable=False,
        default=ProjectStatusEnum.PLANNED,
    )

    # --- Spatial (both nullable — use point OR polygon depending on project) ---
    location: Mapped[WKBElement | None] = mapped_column(
        Geometry(
            geometry_type="POINT",
            srid=4326,
            spatial_index=True,
            nullable=True,
        ),
        nullable=True,
        comment="Project site point location (e.g. a specific facility)",
    )
    boundary: Mapped[WKBElement | None] = mapped_column(
        Geometry(
            geometry_type="POLYGON",
            srid=4326,
            spatial_index=True,
            nullable=True,
        ),
        nullable=True,
        comment="Project area polygon (e.g. a road corridor or water district)",
    )

    # --- Relationship ---
    region: Mapped["DemographicData"] = relationship(  # noqa: F821
        "DemographicData",
        back_populates="budget_plans",
    )

    # --- Indexes ---
    __table_args__ = (
        Index("ix_budget_plans_region_status", "region_id", "status"),
        {"comment": "Government infrastructure project allocations"},
    )

    def __repr__(self) -> str:
        return (
            f"<PublicBudgetPlan(project={self.project_name!r}, "
            f"budget=${self.allocated_budget_usd:,.2f}, "
            f"status={self.status.value})>"
        )
