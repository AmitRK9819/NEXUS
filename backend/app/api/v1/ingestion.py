"""
Ingestion Endpoints — Direct Complaint Ingestion
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement
from backend.app.core.database import get_async_db
from backend.app.schemas.requests import IngestComplaint, ComplaintResponse
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.base import CategoryEnum
from backend.app.services.governance import calculate_confidence_score

router = APIRouter(prefix="/requests", tags=["ingestion"])


@router.post("/ingest", response_model=ComplaintResponse)
async def ingest_complaints(
    complaints: List[IngestComplaint],
    db: AsyncSession = Depends(get_async_db)
):
    processed = 0
    for comp in complaints:
        score, status, flag_reason = calculate_confidence_score(comp)
        point_wkt = WKTElement(f"POINT({comp.longitude} {comp.latitude})", srid=4326)

        category = CategoryEnum.OTHER
        if comp.category:
            for cat_enum in CategoryEnum:
                if cat_enum.value.lower() == comp.category.lower():
                    category = cat_enum
                    break

        new_request = CitizenRequest(
            raw_text=comp.raw_text or comp.translated_text or "Citizen Feedback",
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
                "channel": comp.channel or "web",
                "raw_audio_id": comp.raw_audio_id,
                "nlp_certainty": comp.nlp_certainty,
                "spatial_precision": comp.spatial_precision,
            },
        )
        db.add(new_request)
        processed += 1

    await db.commit()
    return ComplaintResponse(status="success", processed_count=processed)
