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
    WEB = "web"


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


class LocationEntity(BaseModel):
    raw_mentions: list[str] = Field(default_factory=list)
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    landmark: Optional[str] = None
    confidence: float = 0.0


class TranscriptionMeta(BaseModel):
    detected_language: Optional[str] = None
    stt_model: Optional[str] = None
    stt_confidence: Optional[float] = None
    native_text: Optional[str] = None
    translated_text: Optional[str] = None


class RawIntakeMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid4()))
    citizen_ref: str
    channel: Channel
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    media_url: Optional[str] = None
    text_body: Optional[str] = None
    consent_id: Optional[str] = None


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
    sentiment_score: float
    urgency_score: float
    summary: str
