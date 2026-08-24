from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class IngestComplaint(BaseModel):
    """Payload for ingesting a citizen complaint."""
    raw_text: Optional[str] = None
    translated_text: Optional[str] = None
    category: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sentiment: float = Field(0.0, ge=-1.0, le=1.0)
    language: Optional[str] = "en"
    nlp_certainty: float = Field(0.85, ge=0, le=1)
    spatial_precision: float = Field(0.85, ge=0, le=1)
    raw_audio_id: Optional[str] = None
    channel: Optional[str] = "web"


class ComplaintResponse(BaseModel):
    status: str
    processed_count: int


class OversightQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    raw_text: str
    translated_text: Optional[str] = None
    confidence_score: Optional[float] = None
    flag_reason: Optional[str] = None
    category: Optional[str] = None


class ApprovalRequest(BaseModel):
    status: str  # 'APPROVED', 'REJECTED', or 'FLAGGED'
