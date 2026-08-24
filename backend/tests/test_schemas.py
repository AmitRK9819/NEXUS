import uuid
import pytest
from datetime import datetime, timezone, date
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, Polygon
from sqlalchemy.orm import Session

from backend.app.models.base import Base, CategoryEnum, ProjectStatusEnum, OversightStatusEnum
from backend.app.models.demographic_data import DemographicData
from backend.app.models.infrastructure_index import InfrastructureIndex
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.public_budget_plan import PublicBudgetPlan
from backend.app.models.human_oversight_queue import HumanOversightQueue
from backend.app.core.database import sync_engine, init_db


def test_database_models():
    init_db()
    with Session(sync_engine) as session:
        poly = Polygon([(28.0, -26.0), (28.1, -26.0), (28.1, -26.1), (28.0, -26.1), (28.0, -26.0)])
        region = DemographicData(
            region_name=f"Test Region {uuid.uuid4().hex[:6]}",
            population_density=4500.0,
            vulnerability_index=65.0,
            boundary=from_shape(poly, srid=4326),
        )
        session.add(region)
        session.flush()
        assert region.region_id is not None

        infra = InfrastructureIndex(
            region_id=region.region_id,
            water_quality_score=60.0,
            road_condition_score=70.0,
            grid_reliability_score=80.0,
            digital_connectivity_score=90.0,
        )
        session.add(infra)
        session.flush()
        assert infra.composite_score == 0.75
