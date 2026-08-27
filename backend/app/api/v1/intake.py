"""
Omnichannel Intake Endpoints — Web, WhatsApp, SMS, and USSD webhooks
"""

from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_async_db
from backend.app.services.consent_service import hash_phone_number, is_processing_allowed, record_consent_request
from backend.app.services.orchestrator import handle_new_message
from backend.app.schemas.intake import Channel, RawIntakeMessage, StructuredFeedback

router = APIRouter(prefix="/intake", tags=["intake"])


@router.post("/message", response_model=StructuredFeedback)
async def submit_direct_message(
    phone_number: str = Form(...),
    channel: str = Form("web"),
    text_body: Optional[str] = Form(None),
    media_url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_async_db)
):
    """Interactive endpoint for submitting citizen grievance via text or voice URL."""
    clean_text = (text_body or "").strip()
    clean_media = (media_url or "").strip()

    if not clean_text and not clean_media:
        raise HTTPException(
            status_code=400,
            detail="Grievance submission requires either a text_body description or a media_url audio file."
        )

    citizen_ref = hash_phone_number(phone_number)

    # Ensure consent is granted for web simulation
    if not is_processing_allowed(citizen_ref):
        from backend.app.services.consent_service import process_consent_reply
        record_consent_request(
            citizen_ref,
            Channel(channel.lower()) if channel.lower() in [c.value for c in Channel] else Channel.WEB
        )
        process_consent_reply(citizen_ref, "YES")

    msg = RawIntakeMessage(
        citizen_ref=citizen_ref,
        channel=Channel(channel.lower()) if channel.lower() in [c.value for c in Channel] else Channel.WEB,
        text_body=clean_text if clean_text else None,
        media_url=clean_media if clean_media else None,
    )

    feedback = await handle_new_message(msg, db=db)
    return feedback


@router.post("/twilio/webhook")
async def twilio_webhook(
    From: str = Form(...),
    Body: Optional[str] = Form(None),
    MediaUrl0: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_async_db)
):
    """Webhook for Twilio SMS and WhatsApp voice/text messages."""
    channel = Channel.WHATSAPP if "whatsapp:" in From.lower() else Channel.SMS
    citizen_ref = hash_phone_number(From.replace("whatsapp:", ""))

    if not is_processing_allowed(citizen_ref):
        from backend.app.services.consent_service import process_consent_reply
        if Body and Body.strip().lower() in {"yes", "haan", "ha", "agree", "accept"}:
            process_consent_reply(citizen_ref, Body)
            return {"status": "consent_recorded", "message": "Thank you! Please send your civic grievance."}
        record_consent_request(citizen_ref, channel)
        return {
            "status": "consent_prompt_sent",
            "message": "Please reply YES to allow DPDP-compliant civic planning use of your message."
        }

    clean_text = (Body or "").strip()
    clean_media = (MediaUrl0 or "").strip()
    if not clean_text and not clean_media:
        return {"status": "ignored", "message": "Empty message received."}

    msg = RawIntakeMessage(
        citizen_ref=citizen_ref,
        channel=channel,
        text_body=clean_text if clean_text else None,
        media_url=clean_media if clean_media else None,
    )
    feedback = await handle_new_message(msg, db=db)
    return {"status": "processed", "feedback_id": feedback.feedback_id}
