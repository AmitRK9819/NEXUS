from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

class IngestComplaint(BaseModel):
    raw_audio_id: str
    translated_text: str
    category: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sentiment: float = Field(..., ge=0, le=1) # 0 to 1 as per formula discussion
    language: Optional[str] = None
    nlp_certainty: float = Field(..., ge=0, le=1)
    spatial_precision: float = Field(..., ge=0, le=1)

class ComplaintResponse(BaseModel):
    status: str
    processed_count: int

class OversightQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    raw_audio_id: str
    translated_text: str
    confidence_score: float
    flag_reason: Optional[str] = None

class ApprovalRequest(BaseModel):
    status: str # 'APPROVED' or 'REJECTED'

