import pytest
import uuid
from datetime import datetime, timezone, date
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, Polygon
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models.base import Base, CategoryEnum, ProjectStatusEnum, OversightStatusEnum
from app.models.demographic_data import DemographicData
from app.models.infrastructure_index import InfrastructureIndex
from app.models.citizen_request import CitizenRequest
from app.models.public_budget_plan import PublicBudgetPlan
from app.models.human_oversight_queue import HumanOversightQueue
from app.database import engine, init_db

def test_database_models_and_spatial_mapping():
    """Verify all 5 SQLAlchemy models, PostGIS Point/Polygon mappings, and FK constraints."""
    init_db()
    with Session(engine) as session:
        # 1. Create DemographicData with Polygon
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

        # 2. Create InfrastructureIndex (1-to-1 with DemographicData)
        infra = InfrastructureIndex(
            region_id=region.region_id,
            water_quality_score=60.0,
            road_condition_score=70.0,
            grid_reliability_score=80.0,
            digital_connectivity_score=90.0,
        )
        session.add(infra)
        session.flush()

        # 3. Create CitizenRequest with Point
        pt = Point(28.05, -26.05)
        request = CitizenRequest(
            raw_text="Burst water pipe on Main Road",
            translated_text="Burst water pipe on Main Road",
            category=CategoryEnum.WATER,
            language="en",
            sentiment_score=-0.8,
            location=from_shape(pt, srid=4326),
            timestamp=datetime.now(timezone.utc),
            metadata_json={"source": "whatsapp"}
        )
        session.add(request)
        session.flush()
        assert request.id is not None

        # 4. Create PublicBudgetPlan
        budget = PublicBudgetPlan(
            region_id=region.region_id,
            project_name="Water Treatment Plant Upgrade",
            category=CategoryEnum.WATER,
            allocated_budget_usd=1500000.00,
            start_date=date(2026, 1, 1),
            status=ProjectStatusEnum.IN_PROGRESS,
            location=from_shape(pt, srid=4326),
            boundary=from_shape(poly, srid=4326),
        )
        session.add(budget)
        session.flush()
        assert budget.project_id is not None

        # 5. Create HumanOversightQueue
        queue_item = HumanOversightQueue(
            request_or_insight_id=request.id,
            trigger_reason="Low NLP classification confidence",
            confidence_score=0.45,
            status=OversightStatusEnum.PENDING,
        )
        session.add(queue_item)
        session.commit()

        # Query back and verify relations
        fetched_region = session.get(DemographicData, region.region_id)
        assert fetched_region is not None
        assert fetched_region.infrastructure.water_quality_score == 60.0
        assert len(fetched_region.budget_plans) >= 1
        assert fetched_region.budget_plans[0].project_name == "Water Treatment Plant Upgrade"

        fetched_req = session.get(CitizenRequest, request.id)
        assert fetched_req is not None
        assert fetched_req.category == CategoryEnum.WATER

        fetched_queue = session.get(HumanOversightQueue, queue_item.id)
        assert fetched_queue is not None
        assert fetched_queue.confidence_score == 0.45
        assert fetched_queue.status == OversightStatusEnum.PENDING
