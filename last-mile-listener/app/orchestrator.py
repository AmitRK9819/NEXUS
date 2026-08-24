"""
End-to-end pipeline orchestration.

  RawIntakeMessage
        |
        v
  [consent gate]  -- already checked by intake_gateway before this runs
        |
        v
  [STT + translation]  (only if media_url / voice note present)
        |
        v
  [NLP structuring]  (intent, location, sentiment/severity)
        |
        v
  StructuredFeedback  --> handed off to Tier 2 (Data Fusion / Ingestion)
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

import httpx

from app.consent_service import is_processing_allowed
from app.nlp_pipeline import structure_feedback
from app.schemas import RawIntakeMessage, StructuredFeedback, TranscriptionMeta, IntentCategory
from app.stt_engine import get_default_engine

logger = logging.getLogger("listener_layer.orchestrator")

# Where Tier 2 data-fusion-engine receives finished, structured records.
MEMBER_2_ENDPOINT = os.environ.get("MEMBER_2_ENDPOINT", "http://backend:8000/api/v1/requests/ingest")

_stt_engine = None

CATEGORY_MAP = {
    IntentCategory.WATER_SUPPLY.value: "Water",
    IntentCategory.ROAD_REPAIR.value: "Roads",
    IntentCategory.SANITATION_WASTE.value: "Sanitation",
    IntentCategory.DIGITAL_CONNECTIVITY.value: "Internet",
}

# Known landmark coordinates for default geocoding fallback
LOCATION_COORDS = {
    "johannesburg": (28.0473, -26.2041),
    "soweto": (27.8546, -26.2485),
    "sandton": (28.0570, -26.1076),
    "pretoria": (28.1881, -25.7479),
    "mamelodi": (28.3975, -25.7200),
}


def _get_stt_engine():
    global _stt_engine
    if _stt_engine is None:
        _stt_engine = get_default_engine()
    return _stt_engine


async def handle_new_message(message: RawIntakeMessage) -> StructuredFeedback:
    """Main entrypoint called by the intake gateway once consent is confirmed."""

    if not is_processing_allowed(message.citizen_ref):
        # Defense in depth: re-check even though the gateway already checked.
        raise PermissionError(f"Consent not granted for {message.citizen_ref}; refusing to process.")

    transcription = _run_stt_if_needed(message)
    text_for_nlp = transcription.translated_text if transcription else (message.text_body or "")

    if not text_for_nlp.strip():
        logger.warning("Empty message body for %s, skipping structuring.", message.message_id)

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

    await _handoff_to_member_2(feedback)
    return feedback


def _run_stt_if_needed(message: RawIntakeMessage) -> Optional[TranscriptionMeta]:
    if not message.media_url:
        return None

    engine = _get_stt_engine()
    result = engine.transcribe_and_translate(message.media_url)

    return TranscriptionMeta(
        detected_language=result.detected_language,
        stt_model=result.model_name,
        stt_confidence=result.confidence,
        native_text=result.native_text,
        translated_text=result.translated_text,
    )


def _resolve_coordinates(feedback: StructuredFeedback) -> tuple[float, float, float]:
    """Resolve (latitude, longitude, spatial_precision) from location entity."""
    loc_text = " ".join(feedback.location.raw_mentions + [feedback.location.city or "", feedback.location.neighborhood or ""]).lower()
    for name, (lon, lat) in LOCATION_COORDS.items():
        if name in loc_text:
            return lat, lon, 0.90
    # Default coordinates (Johannesburg region) if not matched
    return -26.2041, 28.0473, 0.60


async def _handoff_to_member_2(feedback: StructuredFeedback) -> None:
    """
    Adapts StructuredFeedback to IngestComplaint schema and POSTs
    to Tier 2 Data Fusion Engine ingestion endpoint.
    """
    raw_text = (
        feedback.transcription.native_text
        or feedback.transcription.translated_text
        or feedback.summary
    )
    translated_text = feedback.transcription.translated_text or feedback.summary
    category = CATEGORY_MAP.get(feedback.intent_category, "Other")
    lat, lon, spatial_precision = _resolve_coordinates(feedback)

    payload = [
        {
            "raw_text": raw_text,
            "translated_text": translated_text,
            "category": category,
            "latitude": lat,
            "longitude": lon,
            "sentiment": feedback.sentiment_score,
            "language": feedback.transcription.detected_language or "en",
            "nlp_certainty": feedback.intent_confidence,
            "spatial_precision": spatial_precision,
            "raw_audio_id": feedback.source_message_id,
            "channel": feedback.channel,
        }
    ]

    if not MEMBER_2_ENDPOINT:
        logger.info("MEMBER_2_ENDPOINT not set; structured feedback payload:\n%s",
                     json.dumps(payload, indent=2))
        return

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(MEMBER_2_ENDPOINT, json=payload, timeout=10.0)
            resp.raise_for_status()
            logger.info("Successfully handed off feedback %s to Data Fusion Backend (status: %d)",
                        feedback.feedback_id, resp.status_code)
        except Exception as e:
            logger.error("Failed to hand off feedback %s to Data Fusion Backend: %s",
                         feedback.feedback_id, e)
