"""
Data contracts for the Listener Layer.

`StructuredFeedback` is the JSON object this system hands off to
Member 2 (whoever owns triage / routing / the public dashboard).
Keep this schema stable — it's the interface between the two halves
of the project.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class Channel(str, Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    USSD = "ussd"
    VOICE_CALL = "voice_call"


class IntentCategory(str, Enum):
    WATER_SUPPLY = "Water Supply"
    ROAD_REPAIR = "Road Repair"
    ELECTRICITY = "Electricity"
    SANITATION_WASTE = "Sanitation & Waste"
    DIGITAL_CONNECTIVITY = "Digital Connectivity"
    PUBLIC_SAFETY = "Public Safety"
    HEALTHCARE = "Healthcare"
    EDUCATION = "Education"
    PUBLIC_TRANSPORT = "Public Transport"
    OTHER_UNCLASSIFIED = "Other / Unclassified"


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# --------------------------------------------------------------------------
# Consent
# --------------------------------------------------------------------------

class ConsentStatus(str, Enum):
    PENDING = "pending"          # asked, no reply yet
    GRANTED = "granted"
    DENIED = "denied"
    EXPIRED = "expired"


class ConsentRecord(BaseModel):
    consent_id: str = Field(default_factory=lambda: str(uuid4()))
    citizen_ref: str  # hashed/pseudonymous phone number or channel user id
    channel: Channel
    status: ConsentStatus = ConsentStatus.PENDING
    purpose_text: str = (
        "To use the message you send (including any voice note) for the "
        "purpose of civic infrastructure planning by local authorities. "
        "Your phone number will be stored in hashed form, not in plain text."
    )
    asked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None
    raw_reply_text: Optional[str] = None


# --------------------------------------------------------------------------
# Raw intake (before NLP)
# --------------------------------------------------------------------------

class RawIntakeMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid4()))
    citizen_ref: str
    channel: Channel
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    media_url: Optional[str] = None          # voice note URL, if any
    text_body: Optional[str] = None          # SMS/typed WhatsApp text, if any
    consent_id: Optional[str] = None


# --------------------------------------------------------------------------
# Final structured output -> handed to Member 2
# --------------------------------------------------------------------------

class LocationEntity(BaseModel):
    raw_mentions: list[str] = Field(default_factory=list)
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    landmark: Optional[str] = None
    confidence: float = 0.0


class TranscriptionMeta(BaseModel):
    detected_language: Optional[str] = None   # e.g. "hi", "ta", "sw"
    stt_model: Optional[str] = None
    stt_confidence: Optional[float] = None
    native_text: Optional[str] = None         # transcript in original language
    translated_text: Optional[str] = None     # English, backend-normalized


class StructuredFeedback(BaseModel):
    feedback_id: str = Field(default_factory=lambda: str(uuid4()))
    source_message_id: str
    citizen_ref: str
    channel: Channel
    consent_id: str
    received_at: datetime

    transcription: TranscriptionMeta

    intent_category: IntentCategory
    intent_confidence: float

    location: LocationEntity

    severity: SeverityLevel
    sentiment_score: float          # -1.0 (very negative) .. +1.0 (very positive)
    urgency_score: float            # 0.0 .. 1.0, derived from sentiment + keywords

    summary: str                    # one-line auto summary for dashboards

    class Config:
        use_enum_values = True
