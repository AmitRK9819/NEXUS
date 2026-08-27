"""
Unified Analytics Service — IDS & Misalignment Index Calculation
Formula: IDS = 0.3*V + 0.3*(1-S) + 0.2*P + 0.2*(1-I)
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from backend.app.models.demographic_data import DemographicData
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.public_budget_plan import PublicBudgetPlan
from backend.app.models.infrastructure_index import InfrastructureIndex


def calculate_percentile(values_list: list[float], val: float) -> float:
    """Calculates empirical percentile rank: (count(x <= val)) / N."""
    if not values_list:
        return 0.0
    count_le = sum(1 for x in values_list if x <= val)
    return round(count_le / len(values_list), 3)


async def calculate_region_metrics(session: AsyncSession):
    """Calculates IDS, budget percentiles, and misalignment index for all regions."""

    # 1. Complaint volume & sentiment per region boundary with proper OUTER JOIN predicate
    stmt_vol = select(
        DemographicData.region_id,
        func.count(CitizenRequest.id).label("volume"),
        func.avg(CitizenRequest.sentiment_score).label("avg_sentiment")
    ).outerjoin(
        CitizenRequest,
        and_(
            func.ST_Contains(DemographicData.boundary, CitizenRequest.location),
            CitizenRequest.status == 'APPROVED'
        )
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
            "avg_sentiment": float(row.avg_sentiment) if row.avg_sentiment is not None else 0.0,
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
    if max_pop <= 0:
        max_pop = 1.0

    raw_results = []
    ids_scores = []
    budgets_list = []

    for demo, infra in regions_data:
        r_metrics = region_metrics.get(demo.region_id, {"raw_volume": 0, "avg_sentiment": 0.0})

        # V: Normalized complaint volume (0 to 1)
        V = r_metrics["raw_volume"] / max_volume if max_volume > 0 else 0.0

        # S: Sentiment normalized [-1, 1] -> [0, 1]; S_inv = 1.0 - S
        raw_sentiment = r_metrics["avg_sentiment"]
        S = (raw_sentiment + 1.0) / 2.0
        S_inv = 1.0 - S

        # P: Normalized population density (0 to 1)
        P = demo.population_density / max_pop if max_pop > 0 else 0.0

        # I: Composite infrastructure rating (0 to 1)
        # If infra data is missing, dynamically estimate from demographic vulnerability index
        if infra and infra.composite_score is not None:
            I_score = infra.composite_score
        else:
            I_score = max(0.1, 1.0 - (demo.vulnerability_index / 100.0))
        I_inv = 1.0 - I_score

        ids = (w1 * V) + (w2 * S_inv) + (w3 * P) + (w4 * I_inv)
        ids_rounded = round(ids, 4)
        b_amount = budget_map.get(demo.region_id, 0.0)

        ids_scores.append(ids_rounded)
        budgets_list.append(b_amount)

        raw_results.append({
            "region_id": str(demo.region_id),
            "region_name": demo.region_name,
            "ids": ids_rounded,
            "budget": b_amount,
            "population_density": demo.population_density,
            "vulnerability_index": demo.vulnerability_index,
            "complaint_volume": r_metrics["raw_volume"],
            "avg_sentiment": round(raw_sentiment, 3),
            "infrastructure_score": round(I_score, 3),
        })

    # 3. Mathematically consistent percentile rank & Misalignment Index
    for res in raw_results:
        res["ids_percentile"] = calculate_percentile(ids_scores, res["ids"])
        res["budget_percentile"] = calculate_percentile(budgets_list, res["budget"])
        res["misalignment_index"] = round(res["ids_percentile"] - res["budget_percentile"], 3)
        res["is_critical_hotspot"] = res["misalignment_index"] > 0.50
        res["is_overfunded"] = res["misalignment_index"] < -0.50

    # Sort descending by IDS for prioritized reporting
    raw_results.sort(key=lambda x: x["ids"], reverse=True)
    return raw_results
