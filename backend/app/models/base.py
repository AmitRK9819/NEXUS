"""
NEXUS Platform — SQLAlchemy Base & Shared Types
"""

import enum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all NEXUS ORM models."""
    pass


class CategoryEnum(str, enum.Enum):
    """Infrastructure category classification."""
    ROADS = "Roads"
    WATER = "Water"
    SANITATION = "Sanitation"
    INTERNET = "Internet"
    OTHER = "Other"


class ProjectStatusEnum(str, enum.Enum):
    """Lifecycle status of a public budget project."""
    PLANNED = "Planned"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class OversightStatusEnum(str, enum.Enum):
    """Review status in the human oversight queue."""
    PENDING = "Pending"
    APPROVED = "Approved"
    FLAGGED = "Flagged"
    REJECTED = "Rejected"
