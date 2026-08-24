"""
National Data Endpoints — Budgets and Infrastructure Quality Indices
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_async_db
from backend.app.models.public_budget_plan import PublicBudgetPlan
from backend.app.models.infrastructure_index import InfrastructureIndex
from backend.app.models.demographic_data import DemographicData

router = APIRouter(prefix="/national-data", tags=["national-data"])


@router.get("/budgets")
async def get_national_budgets(db: AsyncSession = Depends(get_async_db)):
    stmt = select(PublicBudgetPlan)
    result = await db.execute(stmt)
    budgets = result.scalars().all()

    return [
        {
            "id": str(b.project_id),
            "region_id": str(b.region_id),
            "project_name": b.project_name,
            "category": b.category.value if hasattr(b.category, 'value') else str(b.category),
            "allocated_budget_usd": float(b.allocated_budget_usd),
            "start_date": str(b.start_date),
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
        }
        for b in budgets
    ]


@router.get("/infrastructure")
async def get_national_infrastructure(db: AsyncSession = Depends(get_async_db)):
    stmt = select(InfrastructureIndex, DemographicData).join(
        DemographicData,
        InfrastructureIndex.region_id == DemographicData.region_id,
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "region_id": str(infra.region_id),
            "region_name": demo.region_name,
            "water_quality_score": infra.water_quality_score,
            "road_condition_score": infra.road_condition_score,
            "grid_reliability_score": infra.grid_reliability_score,
            "digital_connectivity_score": infra.digital_connectivity_score,
            "composite_score": round(infra.composite_score, 3),
        }
        for infra, demo in rows
    ]
