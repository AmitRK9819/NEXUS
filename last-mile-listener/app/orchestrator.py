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
  StructuredFeedback  --> handed off to Member 2 (triage/dashboard/routing)
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

import httpx

from app.consent_service import is_processing_allowed
from app.nlp_pipeline import structure_feedback
from app.schemas import RawIntakeMessage, StructuredFeedback, TranscriptionMeta
from app.stt_engine import get_default_engine

logger = logging.getLogger("listener_layer.orchestrator")

# Where Member 2's system receives finished, structured records.
# Point this at their real ingestion endpoint.
MEMBER_2_ENDPOINT = os.environ.get("MEMBER_2_ENDPOINT")

_stt_engine = None


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


async def _handoff_to_member_2(feedback: StructuredFeedback) -> None:
    """
    POSTs the finished JSON record to Member 2's ingestion endpoint.
    If no endpoint is configured (e.g. local dev), just logs it —
    this makes the module runnable standalone for testing.
    """
    payload = json.loads(feedback.model_dump_json())

    if not MEMBER_2_ENDPOINT:
        logger.info("MEMBER_2_ENDPOINT not set; structured feedback:\n%s",
                     json.dumps(payload, indent=2))
        return

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(MEMBER_2_ENDPOINT, json=payload, timeout=10.0)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error("Failed to hand off feedback %s to Member 2: %s",
                         feedback.feedback_id, e)
