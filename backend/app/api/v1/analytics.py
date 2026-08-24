"""
Analytics Endpoints — Hotspots GeoJSON & Misalignment Analysis
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_async_db
from backend.app.services.analytics import calculate_region_metrics
from backend.app.models.citizen_request import CitizenRequest

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/misalignment")
async def get_misalignment_report(db: AsyncSession = Depends(get_async_db)):
    results = await calculate_region_metrics(db)
    return {"status": "success", "data": results}


@router.get("/hotspots")
async def get_hotspots(db: AsyncSession = Depends(get_async_db)):
    metrics = await calculate_region_metrics(db)
    hotspot_region_ids = [m["region_id"] for m in metrics if m["is_critical_hotspot"]]

    stmt = select(CitizenRequest).where(CitizenRequest.status == 'APPROVED')
    result = await db.execute(stmt)
    complaints = result.scalars().all()

    features = []
    for c in complaints:
        lat = c.latitude
        lon = c.longitude
        if lat is None or lon is None:
            continue

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "id": str(c.id),
                "category": c.category.value if hasattr(c.category, 'value') else str(c.category),
                "sentiment": c.sentiment_score,
                "confidence_score": c.confidence_score,
                "raw_text": c.raw_text[:200] if c.raw_text else None,
                "language": c.language,
                "status": c.status,
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_complaints": len(features),
            "hotspot_regions": len(hotspot_region_ids),
            "regions_analyzed": len(metrics),
        }
    }
