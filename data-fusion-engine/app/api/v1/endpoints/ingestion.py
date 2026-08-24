"""
Ingestion endpoint — POST /api/v1/requests/ingest

Receives citizen complaints (from the Listener Layer or direct API),
calculates confidence scores, performs PostGIS spatial containment
mapping, and stores approved/flagged records.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from geoalchemy2.elements import WKTElement

from app.api.deps import get_db
from app.schemas.requests import IngestComplaint, ComplaintResponse
from app.models.domain import CitizenRequest, DemographicData, CategoryEnum
from app.services.governance import calculate_confidence_score

router = APIRouter()


@router.post("/requests/ingest", response_model=ComplaintResponse)
async def ingest_complaints(
    complaints: List[IngestComplaint],
    db: AsyncSession = Depends(get_db)
):
    processed = 0
    for comp in complaints:
        # Calculate governance confidence score
        score, status, flag_reason = calculate_confidence_score(comp)

        # Create PostGIS Point from lat/lon
        point_wkt = WKTElement(f"POINT({comp.longitude} {comp.latitude})", srid=4326)

        # Map category string to enum
        category = CategoryEnum.OTHER
        if comp.category:
            try:
                category = CategoryEnum(comp.category)
            except ValueError:
                category = CategoryEnum.OTHER

        new_request = CitizenRequest(
            raw_text=comp.raw_text or comp.translated_text or "",
            translated_text=comp.translated_text,
            category=category,
            language=comp.language or "en",
            sentiment_score=comp.sentiment,
            location=point_wkt,
            latitude=comp.latitude,
            longitude=comp.longitude,
            status=status,
            confidence_score=score,
            flag_reason=flag_reason,
            metadata_json={
                "channel": comp.channel or "api",
                "raw_audio_id": comp.raw_audio_id,
                "nlp_certainty": comp.nlp_certainty,
                "spatial_precision": comp.spatial_precision,
            },
        )
        db.add(new_request)
        processed += 1

    await db.commit()

    return ComplaintResponse(status="success", processed_count=processed)
