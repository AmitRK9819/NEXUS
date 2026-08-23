from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api.deps import get_db
from app.services.analytics import calculate_region_metrics
from app.models.domain import CitizenComplaint, DemographicData
import json

router = APIRouter()

@router.get("/misalignment")
async def get_misalignment_report(db: AsyncSession = Depends(get_db)):
    results = await calculate_region_metrics(db)
    return {"status": "success", "data": results}

@router.get("/hotspots")
async def get_hotspots(db: AsyncSession = Depends(get_db)):
    # Get regions flagged as hotspots from our analytics service
    metrics = await calculate_region_metrics(db)
    hotspot_region_ids = [m["region_id"] for m in metrics if m["is_critical_hotspot"]]
    
    # Fetch complaints ONLY if they are APPROVED
    stmt = select(CitizenComplaint).where(
        CitizenComplaint.region_id.in_(hotspot_region_ids),
        CitizenComplaint.status == 'APPROVED'
    )
    result = await db.execute(stmt)
    complaints = result.scalars().all()
    
    # Construct GeoJSON FeatureCollection
    features = []
    for c in complaints:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c.longitude, c.latitude] # GeoJSON is [lon, lat]
            },
            "properties": {
                "category": c.category,
                "sentiment": c.sentiment,
                "confidence_score": c.confidence_score
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
