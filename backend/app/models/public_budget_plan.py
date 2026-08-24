import uuid
from datetime import date
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import Date, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, CategoryEnum, ProjectStatusEnum


class PublicBudgetPlan(Base):
    __tablename__ = "public_budget_plans"

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demographic_data.region_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[CategoryEnum] = mapped_column(
        Enum(CategoryEnum, name="category_enum", create_constraint=True, create_type=False),
        nullable=False,
    )
    allocated_budget_usd: Mapped[float] = mapped_column(
        Numeric(precision=15, scale=2),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ProjectStatusEnum] = mapped_column(
        Enum(ProjectStatusEnum, name="project_status_enum", create_constraint=True),
        nullable=False,
        default=ProjectStatusEnum.PLANNED,
    )
    location: Mapped[WKBElement | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True, nullable=True),
        nullable=True,
    )
    boundary: Mapped[WKBElement | None] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True, nullable=True),
        nullable=True,
    )

    region: Mapped["DemographicData"] = relationship(  # noqa: F821
        "DemographicData",
        back_populates="budget_plans",
    )

    __table_args__ = (
        Index("ix_budget_plans_region_status", "region_id", "status"),
    )
