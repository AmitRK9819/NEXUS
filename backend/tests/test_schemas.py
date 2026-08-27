import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone, date
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, Polygon
from sqlalchemy.orm import Session

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.models.base import Base, CategoryEnum, ProjectStatusEnum, OversightStatusEnum
from backend.app.models.demographic_data import DemographicData
from backend.app.models.infrastructure_index import InfrastructureIndex
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.public_budget_plan import PublicBudgetPlan
from backend.app.models.human_oversight_queue import HumanOversightQueue
from backend.app.core.database import sync_engine, init_db


def test_database_models():
    """Verify ORM model instantiations and composite score generation."""
    poly = Polygon([(28.0, -26.0), (28.1, -26.0), (28.1, -26.1), (28.0, -26.1), (28.0, -26.0)])
    reg_id = uuid.uuid4()
    region = DemographicData(
        region_id=reg_id,
        region_name="Test Region Gauteng",
        population_density=4500.0,
        vulnerability_index=65.0,
        boundary=from_shape(poly, srid=4326),
    )
    assert region.region_id == reg_id
    assert region.region_name == "Test Region Gauteng"

    infra = InfrastructureIndex(
        region_id=reg_id,
        water_quality_score=60.0,
        road_condition_score=70.0,
        grid_reliability_score=80.0,
        digital_connectivity_score=90.0,
    )
    assert infra.composite_score == 0.75

    req = CitizenRequest(
        raw_text="Water leakage",
        category=CategoryEnum.WATER,
        language="en",
        sentiment_score=-0.5,
        location=from_shape(Point(28.05, -26.05), srid=4326),
        status="APPROVED",
        confidence_score=0.88,
    )
    assert req.category == CategoryEnum.WATER
    assert req.confidence_score == 0.88


if __name__ == "__main__":
    test_database_models()
    print("[PASS] test_database_models passed!")
