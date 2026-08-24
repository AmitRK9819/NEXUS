from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.api.deps import get_db
from app.models.domain import PublicBudgetPlan, InfrastructureData

router = APIRouter()

@router.get("/national-data/budgets")
async def get_national_budgets(db: AsyncSession = Depends(get_db)):
    # RESTful Wrapper around legacy/mock tables
    stmt = select(PublicBudgetPlan)
    result = await db.execute(stmt)
    budgets = result.scalars().all()
    
    return [
        {
            "id": b.id,
            "region_id": b.region_id,
            "allocated_amount": b.allocated_amount
        } for b in budgets
    ]

@router.get("/national-data/infrastructure")
async def get_national_infrastructure(db: AsyncSession = Depends(get_db)):
    # RESTful Wrapper around legacy/mock tables
    stmt = select(InfrastructureData)
    result = await db.execute(stmt)
    infra = result.scalars().all()
    
    return [
        {
            "id": i.id,
            "region_id": i.region_id,
            "infrastructure_score": i.infrastructure_score
        } for i in infra
    ]
