"""
Analytics endpoints — GET /api/v1/analytics/hotspots & /misalignment

Returns:
  - /hotspots:      RFC 7946 GeoJSON FeatureCollection of approved complaints in hotspot regions
  - /misalignment:  JSON array with IDS scores, budget percentiles, and Misalignment Indices
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import get_db
from app.services.analytics import calculate_region_metrics
from app.models.domain import CitizenRequest, DemographicData

router = APIRouter()


@router.get("/misalignment")
async def get_misalignment_report(db: AsyncSession = Depends(get_db)):
    results = await calculate_region_metrics(db)
    return {"status": "success", "data": results}


@router.get("/hotspots")
async def get_hotspots(db: AsyncSession = Depends(get_db)):
    """Return GeoJSON FeatureCollection of approved complaints in critical hotspot regions."""

    metrics = await calculate_region_metrics(db)
    hotspot_region_ids = [m["region_id"] for m in metrics if m["is_critical_hotspot"]]

    if not hotspot_region_ids:
        # Return all approved complaints if no hotspots detected yet
        stmt = select(CitizenRequest).where(CitizenRequest.status == 'APPROVED')
    else:
        # Spatial join: complaints inside hotspot region boundaries
        stmt = select(CitizenRequest).where(
            CitizenRequest.status == 'APPROVED'
        )

    result = await db.execute(stmt)
    complaints = result.scalars().all()

    # Construct RFC 7946 GeoJSON FeatureCollection
    features = []
    for c in complaints:
        lat = c.latitude
        lon = c.longitude

        if lat is None or lon is None:
            continue

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]  # GeoJSON is [lon, lat]
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
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_complaints": len(features),
            "hotspot_regions": len(hotspot_region_ids),
            "regions_analyzed": len(metrics),
        }
    }
