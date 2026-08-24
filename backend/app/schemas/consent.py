from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4
from pydantic import BaseModel, Field
from backend.app.schemas.intake import Channel


class ConsentStatus(str, Enum):
    PENDING = "pending"
    GRANTED = "granted"
    DENIED = "denied"
    EXPIRED = "expired"


class ConsentRecord(BaseModel):
    consent_id: str = Field(default_factory=lambda: str(uuid4()))
    citizen_ref: str
    channel: Channel
    status: ConsentStatus = ConsentStatus.PENDING
    purpose_text: str = (
        "To use the message you send for civic infrastructure planning by local authorities. "
        "Your phone number is stored in hashed pseudonymous form."
    )
    asked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None
    raw_reply_text: Optional[str] = None
