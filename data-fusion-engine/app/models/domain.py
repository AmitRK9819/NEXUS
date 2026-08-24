"""
Data Fusion Engine — Unified Domain Models

These models align with the canonical NEXUS root `app/models/` schema
so that both the seeder and the data-fusion engine operate on the same
PostgreSQL tables.

Key design decisions:
  - UUID primary keys (matching root models)
  - Table names match root: demographic_data, citizen_requests,
    public_budget_plans, infrastructure_index, human_oversight_queue
  - Column names match root models exactly
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Date, Numeric, Enum as SAEnum
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
from geoalchemy2 import Geometry
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()


# ── Shared Enums (must match root app/models/base.py) ─────────

class CategoryEnum(str, enum.Enum):
    ROADS = "Roads"
    WATER = "Water"
    SANITATION = "Sanitation"
    INTERNET = "Internet"
    OTHER = "Other"


class ProjectStatusEnum(str, enum.Enum):
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class OversightStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    FLAGGED = "Flagged"


# ── DemographicData ────────────────────────────────────────────

class DemographicData(Base):
    __tablename__ = 'demographic_data'

    region_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_name = Column(String(255), unique=True, index=True, nullable=False)
    population_density = Column(Float, nullable=False)
    vulnerability_index = Column(Float, nullable=False)
    boundary = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=False)

    # Relationships
    infrastructure = relationship("InfrastructureIndex", back_populates="region", uselist=False)
    budget_plans = relationship("PublicBudgetPlan", back_populates="region")


# ── InfrastructureIndex ────────────────────────────────────────

class InfrastructureIndex(Base):
    __tablename__ = 'infrastructure_index'

    region_id = Column(
        UUID(as_uuid=True),
        ForeignKey('demographic_data.region_id', ondelete='CASCADE'),
        primary_key=True,
    )
    water_quality_score = Column(Float, nullable=False)
    road_condition_score = Column(Float, nullable=False)
    grid_reliability_score = Column(Float, nullable=False)
    digital_connectivity_score = Column(Float, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

    region = relationship("DemographicData", back_populates="infrastructure")

    @property
    def composite_score(self) -> float:
        """Average of 4 infrastructure scores, normalized to 0-1 scale."""
        return (
            self.water_quality_score +
            self.road_condition_score +
            self.grid_reliability_score +
            self.digital_connectivity_score
        ) / 400.0


# ── CitizenRequest ─────────────────────────────────────────────

class CitizenRequest(Base):
    __tablename__ = 'citizen_requests'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Content
    raw_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)

    # Classification
    category = Column(
        SAEnum(CategoryEnum, name='category_enum', create_constraint=True, create_type=False),
        nullable=False,
    )
    language = Column(String(10), nullable=False)

    # Sentiment (-1.0 to 1.0)
    sentiment_score = Column(Float, nullable=False, default=0.0)

    # Spatial
    location = Column(
        Geometry(geometry_type='POINT', srid=4326),
        nullable=False,
    )

    # Temporal
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Flexible metadata
    metadata_json = Column(JSON, nullable=True)

    # ── Governance fields (used by data-fusion analytics) ──
    # These are computed by the ingestion endpoint
    status = Column(String, default='APPROVED')  # APPROVED, NEEDS_REVIEW, REJECTED
    confidence_score = Column(Float, nullable=True)
    flag_reason = Column(String, nullable=True)

    # Ingestion-specific fields (latitude/longitude extracted from location)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


# ── PublicBudgetPlan ───────────────────────────────────────────

class PublicBudgetPlan(Base):
    __tablename__ = 'public_budget_plans'

    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    region_id = Column(
        UUID(as_uuid=True),
        ForeignKey('demographic_data.region_id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )

    project_name = Column(String(255), nullable=False)
    category = Column(
        SAEnum(CategoryEnum, name='category_enum', create_constraint=True, create_type=False),
        nullable=False,
    )
    allocated_budget_usd = Column(Numeric(precision=15, scale=2), nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(
        SAEnum(ProjectStatusEnum, name='project_status_enum', create_constraint=True),
        nullable=False,
    )

    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    boundary = Column(Geometry(geometry_type='POLYGON', srid=4326), nullable=True)

    region = relationship("DemographicData", back_populates="budget_plans")


# ── HumanOversightQueue ───────────────────────────────────────

class HumanOversightQueue(Base):
    __tablename__ = 'human_oversight_queue'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_or_insight_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    trigger_reason = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    status = Column(
        SAEnum(OversightStatusEnum, name='oversight_status_enum', create_constraint=True),
        nullable=False,
        default=OversightStatusEnum.PENDING,
    )
    assigned_at = Column(DateTime(timezone=True), nullable=True)
