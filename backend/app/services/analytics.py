"""
Unified Analytics Service — IDS & Misalignment Index Calculation
Formula: IDS = 0.3*V + 0.3*(1-S) + 0.2*P + 0.2*(1-I)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from backend.app.models.demographic_data import DemographicData
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.public_budget_plan import PublicBudgetPlan
from backend.app.models.infrastructure_index import InfrastructureIndex


async def calculate_region_metrics(session: AsyncSession):
    """Calculates IDS, budget percentiles, and misalignment index for all regions."""

    # 1. Complaint volume & sentiment per region boundary
    stmt_vol = select(
        DemographicData.region_id,
        func.count(CitizenRequest.id).label("volume"),
        func.avg(CitizenRequest.sentiment_score).label("avg_sentiment")
    ).outerjoin(
        CitizenRequest,
        func.ST_Contains(DemographicData.boundary, CitizenRequest.location)
    ).where(
        (CitizenRequest.status == 'APPROVED') | (CitizenRequest.id.is_(None))
    ).group_by(DemographicData.region_id)

    result_vol = await session.execute(stmt_vol)
    region_metrics = {}
    max_volume = 1

    for row in result_vol:
        vol = row.volume or 0
        if vol > max_volume:
            max_volume = vol
        region_metrics[row.region_id] = {
            "raw_volume": vol,
            "avg_sentiment": row.avg_sentiment if row.avg_sentiment is not None else 0.0,
        }

    # 2. Fetch demographic & infrastructure records
    stmt_regions = select(
        DemographicData,
        InfrastructureIndex,
    ).outerjoin(
        InfrastructureIndex,
        DemographicData.region_id == InfrastructureIndex.region_id,
    )

    result_regions = await session.execute(stmt_regions)
    regions_data = result_regions.all()

    # Get budget sums per region
    stmt_budgets = select(
        PublicBudgetPlan.region_id,
        func.sum(PublicBudgetPlan.allocated_budget_usd).label("total_budget")
    ).group_by(PublicBudgetPlan.region_id)

    result_budgets = await session.execute(stmt_budgets)
    budget_map = {row.region_id: float(row.total_budget or 0) for row in result_budgets}

    w1, w2, w3, w4 = 0.3, 0.3, 0.2, 0.2
    max_pop = max((d.population_density for d, _ in regions_data), default=1.0)

    results = []
    budgets_list = []

    for demo, infra in regions_data:
        r_metrics = region_metrics.get(demo.region_id, {"raw_volume": 0, "avg_sentiment": 0.0})

        # V: Normalized complaint volume
        V = r_metrics["raw_volume"] / max_volume

        # S: Sentiment normalized [-1, 1] -> [0, 1]
        raw_sentiment = r_metrics["avg_sentiment"]
        S = (raw_sentiment + 1.0) / 2.0
        S_inv = 1.0 - S

        # P: Normalized population density
        P = demo.population_density / max_pop if max_pop > 0 else 0.0

        # I: Composite infrastructure rating (0-1)
        I_score = infra.composite_score if infra else 1.0
        I_inv = 1.0 - I_score

        ids = (w1 * V) + (w2 * S_inv) + (w3 * P) + (w4 * I_inv)
        b_amount = budget_map.get(demo.region_id, 0.0)
        budgets_list.append(b_amount)

        results.append({
            "region_id": str(demo.region_id),
            "region_name": demo.region_name,
            "ids": round(ids, 4),
            "budget": b_amount,
            "population_density": demo.population_density,
            "vulnerability_index": demo.vulnerability_index,
            "complaint_volume": r_metrics["raw_volume"],
            "avg_sentiment": round(raw_sentiment, 3),
            "infrastructure_score": round(I_score, 3) if infra else None,
        })

    # 3. Percentile rank & Misalignment Index
    results.sort(key=lambda x: x["ids"])
    budgets_list.sort()
    n_regions = len(results)

    for i, res in enumerate(results):
        res["ids_percentile"] = round((i + 1) / n_regions, 3) if n_regions > 0 else 0
        b_amount = res["budget"]
        budget_rank = next((j for j, b in enumerate(budgets_list) if b >= b_amount), n_regions - 1) + 1
        res["budget_percentile"] = round(budget_rank / n_regions, 3) if n_regions > 0 else 0

        res["misalignment_index"] = round(res["ids_percentile"] - res["budget_percentile"], 3)
        res["is_critical_hotspot"] = res["misalignment_index"] > 0.50
        res["is_overfunded"] = res["misalignment_index"] < -0.50

    return results
