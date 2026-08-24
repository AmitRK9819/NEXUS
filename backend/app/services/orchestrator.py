"""
End-to-End Multimodal Intake Orchestration Service
"""

from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.elements import WKTElement

from backend.app.services.consent_service import is_processing_allowed
from backend.app.services.nlp_pipeline import structure_feedback
from backend.app.services.stt_engine import get_default_engine
from backend.app.services.governance import calculate_confidence_score
from backend.app.schemas.intake import RawIntakeMessage, StructuredFeedback, TranscriptionMeta, IntentCategory
from backend.app.schemas.requests import IngestComplaint
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.base import CategoryEnum

logger = logging.getLogger("nexus.orchestrator")

CATEGORY_MAP = {
    IntentCategory.WATER_SUPPLY: CategoryEnum.WATER,
    IntentCategory.ROAD_REPAIR: CategoryEnum.ROADS,
    IntentCategory.SANITATION_WASTE: CategoryEnum.SANITATION,
    IntentCategory.DIGITAL_CONNECTIVITY: CategoryEnum.INTERNET,
}

LOCATION_COORDS = {
    "johannesburg": (28.0473, -26.2041),
    "soweto": (27.8546, -26.2485),
    "sandton": (28.0570, -26.1076),
    "pretoria": (28.1881, -25.7479),
    "mamelodi": (28.3975, -25.7200),
}


def _resolve_coordinates(feedback: StructuredFeedback) -> tuple[float, float, float]:
    loc_text = " ".join(feedback.location.raw_mentions + [feedback.location.city or "", feedback.location.neighborhood or ""]).lower()
    for name, (lon, lat) in LOCATION_COORDS.items():
        if name in loc_text:
            return lat, lon, 0.90
    return -26.2041, 28.0473, 0.60


async def handle_new_message(message: RawIntakeMessage, db: Optional[AsyncSession] = None) -> StructuredFeedback:
    """Processes raw message through consent check, STT, NLP structuring, and DB ingestion."""

    if not is_processing_allowed(message.citizen_ref):
        raise PermissionError(f"Consent not granted for {message.citizen_ref}; refusing to process.")

    # 1. STT if voice note is present
    transcription = None
    if message.media_url:
        engine = get_default_engine()
        result = engine.transcribe_and_translate(message.media_url)
        transcription = TranscriptionMeta(
            detected_language=result.detected_language,
            stt_model=result.model_name,
            stt_confidence=result.confidence,
            native_text=result.native_text,
            translated_text=result.translated_text,
        )

    text_for_nlp = transcription.translated_text if transcription else (message.text_body or "")
    structuring = structure_feedback(text_for_nlp)

    feedback = StructuredFeedback(
        source_message_id=message.message_id,
        citizen_ref=message.citizen_ref,
        channel=message.channel,
        consent_id=message.consent_id or "unknown",
        received_at=message.received_at,
        transcription=transcription or TranscriptionMeta(translated_text=text_for_nlp),
        intent_category=structuring.intent_category,
        intent_confidence=structuring.intent_confidence,
        location=structuring.location,
        severity=structuring.severity,
        sentiment_score=structuring.sentiment_score,
        urgency_score=structuring.urgency_score,
        summary=structuring.summary,
    )

    # 2. Ingest into PostGIS database if session is provided
    if db is not None:
        lat, lon, spatial_precision = _resolve_coordinates(feedback)
        category = CATEGORY_MAP.get(feedback.intent_category, CategoryEnum.OTHER)

        complaint_schema = IngestComplaint(
            raw_text=feedback.transcription.native_text or text_for_nlp,
            translated_text=feedback.transcription.translated_text or text_for_nlp,
            category=category.value,
            latitude=lat,
            longitude=lon,
            sentiment=feedback.sentiment_score,
            language=feedback.transcription.detected_language or "en",
            nlp_certainty=feedback.intent_confidence,
            spatial_precision=spatial_precision,
            raw_audio_id=feedback.source_message_id,
            channel=feedback.channel.value,
        )

        score, status, flag_reason = calculate_confidence_score(complaint_schema)
        point_wkt = WKTElement(f"POINT({lon} {lat})", srid=4326)

        db_record = CitizenRequest(
            raw_text=complaint_schema.raw_text or "",
            translated_text=complaint_schema.translated_text,
            category=category,
            language=complaint_schema.language or "en",
            sentiment_score=complaint_schema.sentiment,
            location=point_wkt,
            latitude=lat,
            longitude=lon,
            status=status,
            confidence_score=score,
            flag_reason=flag_reason,
            metadata_json={
                "channel": feedback.channel.value,
                "urgency_score": feedback.urgency_score,
                "severity": feedback.severity.value,
            },
        )
        db.add(db_record)
        await db.commit()
        logger.info("Ingested citizen request into database (id=%s, status=%s)", db_record.id, status)

    return feedback
