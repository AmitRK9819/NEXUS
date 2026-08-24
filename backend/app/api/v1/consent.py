"""
Consent Management Endpoints (DPDP Compliance)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.services.consent_service import (
    hash_phone_number,
    is_processing_allowed,
    process_consent_reply,
    record_consent_request,
)
from backend.app.schemas.consent import Channel, ConsentRecord

router = APIRouter(prefix="/consent", tags=["consent"])


class ConsentCheckRequest(BaseModel):
    phone_number: str


class ConsentAskRequest(BaseModel):
    phone_number: str
    channel: Channel = Channel.WHATSAPP


class ConsentReplyRequest(BaseModel):
    phone_number: str
    reply_text: str


@router.post("/check")
async def check_consent(req: ConsentCheckRequest):
    ref = hash_phone_number(req.phone_number)
    allowed = is_processing_allowed(ref)
    return {"phone_hashed": ref, "consent_granted": allowed}


@router.post("/request", response_model=ConsentRecord)
async def ask_consent(req: ConsentAskRequest):
    ref = hash_phone_number(req.phone_number)
    return record_consent_request(ref, req.channel)


@router.post("/reply", response_model=ConsentRecord)
async def record_reply(req: ConsentReplyRequest):
    ref = hash_phone_number(req.phone_number)
    rec = process_consent_reply(ref, req.reply_text)
    if not rec:
        raise HTTPException(status_code=400, detail="Ambiguous reply; reply YES or NO.")
    return rec
