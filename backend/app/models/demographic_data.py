import uuid
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKBElement
from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base


class DemographicData(Base):
    __tablename__ = "demographic_data"

    region_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    region_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    population_density: Mapped[float] = mapped_column(Float, nullable=False)
    vulnerability_index: Mapped[float] = mapped_column(Float, nullable=False)
    boundary: Mapped[WKBElement] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=False,
    )

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
