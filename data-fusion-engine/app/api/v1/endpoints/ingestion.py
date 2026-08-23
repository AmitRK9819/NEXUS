from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api.deps import get_db
from app.schemas.requests import IngestComplaint, ComplaintResponse
from app.models.domain import CitizenComplaint, DemographicData
from app.services.governance import calculate_confidence_score

router = APIRouter()

@router.post("/requests/ingest", response_model=ComplaintResponse)
async def ingest_complaints(
    complaints: List[IngestComplaint],
    db: AsyncSession = Depends(get_db)
):
    processed = 0
    for comp in complaints:
        # Calculate Confidence Score
        score, status, flag_reason = calculate_confidence_score(comp)
        
        # Create PostGIS Point from lat/lon
        point_wkt = f"SRID=4326;POINT({comp.longitude} {comp.latitude})"
        
        # Async geospatial lookup using ST_Contains
        stmt = select(DemographicData).where(
            func.ST_Contains(DemographicData.boundary, func.ST_GeomFromEWKT(point_wkt))
        )
        result = await db.execute(stmt)
        region = result.scalars().first()
        
        region_id = region.id if region else None
        
        new_complaint = CitizenComplaint(
            raw_audio_id=comp.raw_audio_id,
            translated_text=comp.translated_text,
            category=comp.category,
            latitude=comp.latitude,
            longitude=comp.longitude,
            sentiment=comp.sentiment,
            language=comp.language,
            region_id=region_id,
            status=status,
            confidence_score=score,
            flag_reason=flag_reason
        )
        db.add(new_complaint)
        processed += 1
        
    await db.commit()
    
    return ComplaintResponse(status="success", processed_count=processed)
