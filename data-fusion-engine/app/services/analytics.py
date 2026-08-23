from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.domain import DemographicData, CitizenComplaint, PublicBudgetPlan, InfrastructureData

async def calculate_region_metrics(session: AsyncSession):
    # Step 1: Calculate raw metrics per region
    # Volume of complaints
    stmt_vol = select(
        CitizenComplaint.region_id,
        func.count(CitizenComplaint.id).label("volume"),
        func.avg(CitizenComplaint.sentiment).label("avg_sentiment")
    ).group_by(CitizenComplaint.region_id)
    
    result_vol = await session.execute(stmt_vol)
    region_metrics = {}
    max_volume = 1
    
    for row in result_vol:
        vol = row.volume or 0
        if vol > max_volume:
            max_volume = vol
        region_metrics[row.region_id] = {
            "raw_volume": vol,
            "avg_sentiment": row.avg_sentiment if row.avg_sentiment is not None else 0.5,
        }
        
    # Step 2: Calculate IDS for all regions
    stmt_regions = select(DemographicData, PublicBudgetPlan, InfrastructureData).join(
        PublicBudgetPlan, DemographicData.id == PublicBudgetPlan.region_id, isouter=True
    ).join(
        InfrastructureData, DemographicData.id == InfrastructureData.region_id, isouter=True
    )
    
    result_regions = await session.execute(stmt_regions)
    regions_data = result_regions.all()
    
    results = []
    
    # weights
    w1, w2, w3, w4 = 0.3, 0.3, 0.2, 0.2
    
    # Gather budgets for percentile calculation
    budgets = []
    for demo, budget, infra in regions_data:
        b_amount = budget.allocated_amount if budget else 0.0
        budgets.append(b_amount)
    
    budgets.sort()
    
    for demo, budget, infra in regions_data:
        r_metrics = region_metrics.get(demo.id, {"raw_volume": 0, "avg_sentiment": 0.5})
        
        V = r_metrics["raw_volume"] / max_volume
        S = r_metrics["avg_sentiment"]
        S_inv = 1.0 - S
        
        P = demo.normalized_population_density if demo.normalized_population_density is not None else 0.0
        
        I_score = infra.infrastructure_score if infra else 1.0 # 1.0 implies perfect infrastructure if not specified
        I_inv = 1.0 - I_score
        
        ids = (w1 * V) + (w2 * S_inv) + (w3 * P) + (w4 * I_inv)
        
        b_amount = budget.allocated_amount if budget else 0.0
        
        results.append({
            "region_id": demo.id,
            "region_name": demo.region_name,
            "ids": ids,
            "budget": b_amount
        })
        
    # Step 3: Percentile ranks and Misalignment Index
    results.sort(key=lambda x: x["ids"])
    n_regions = len(results)
    
    for i, res in enumerate(results):
        res["ids_percentile"] = (i + 1) / n_regions if n_regions > 0 else 0
        
        # Budget percentile
        b_amount = res["budget"]
        # find rank of this budget
        budget_rank = next(j for j, b in enumerate(budgets) if b >= b_amount) + 1
        res["budget_percentile"] = budget_rank / n_regions if n_regions > 0 else 0
        
        res["misalignment_index"] = res["ids_percentile"] - res["budget_percentile"]
        
        res["is_critical_hotspot"] = res["ids_percentile"] >= 0.8 and res["budget_percentile"] <= 0.2
        
    return results
