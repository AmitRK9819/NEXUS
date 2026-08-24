"""
Omnichannel Intake Gateway.

Receives inbound messages from Twilio (SMS / WhatsApp / voice) and
USSD aggregators, normalizes them into a RawIntakeMessage, fires the
consent flow if needed, and — once consent is granted — hands the
message to the orchestrator.

Voice notes are prioritized: if a message includes media (a voice
note), the gateway downloads it and routes it straight to the STT
engine, since that's the most accessible input format for low-literacy
/ low-bandwidth users.

In production:
  - Verify Twilio's X-Twilio-Signature header on every webhook
    (twilio.request_validator.RequestValidator) — omitted here for
    brevity but MUST be added before going live.
  - Use the WhatsApp Business API (via Twilio or Meta directly) for
    WhatsApp; Twilio Programmable SMS/Voice for SMS/voice; an
    aggregator (e.g. Africa's Talking, Beem, or a telco partner) for
    USSD, since USSD has no native "send us a file" capability and is
    text/menu driven.
"""

from __future__ import annotations

import os
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException

from app.consent_service import hash_phone_number, is_processing_allowed
from app.orchestrator import handle_new_message
from app.schemas import Channel, RawIntakeMessage

router = APIRouter(prefix="/intake", tags=["intake"])

VOICE_STORAGE_DIR = os.environ.get("VOICE_STORAGE_DIR", "incoming_voice_notes")
os.makedirs(VOICE_STORAGE_DIR, exist_ok=True)

CONSENT_PROMPT_TEMPLATE = (
    "Namaste! We'd like to use your message to help plan local infrastructure "
    "improvements. Your phone number will be stored securely and never shared "
    "publicly. Reply YES to consent, or NO to opt out."
)


async def _download_media(media_url: str, dest_filename: str) -> str:
    """Downloads a voice note from the provider's media URL and saves it locally."""
    dest_path = os.path.join(VOICE_STORAGE_DIR, dest_filename)
    async with httpx.AsyncClient() as client:
        resp = await client.get(media_url, timeout=30.0)
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            f.write(resp.content)
    return dest_path


@router.post("/twilio/webhook")
async def twilio_webhook(
    background_tasks: BackgroundTasks,
    From: str = Form(...),                    # Twilio sends E.164 phone number
    Body: Optional[str] = Form(None),          # text body, if any
    NumMedia: int = Form(0),
    MediaUrl0: Optional[str] = Form(None),     # first media attachment (voice note)
    MediaContentType0: Optional[str] = Form(None),
    WaId: Optional[str] = Form(None),          # present for WhatsApp messages
):
    """
    Single webhook endpoint for both SMS and WhatsApp — Twilio routes both
    through the same shape, distinguished by the presence of WaId.
    """
    channel = Channel.WHATSAPP if WaId else Channel.SMS
    citizen_ref = hash_phone_number(From)

    # --- Consent gate -----------------------------------------------------
    # A reply of YES/NO to a pending consent prompt is handled here first.
    if Body and Body.strip().upper() in {"YES", "NO", "Y", "N"}:
        from app.consent_service import record_consent_reply, ConsentReplyIn
        record_consent_reply(ConsentReplyIn(citizen_ref=citizen_ref, reply_text=Body))
        # (send a confirmation back to the user via Twilio's API in production)
        return {"status": "consent_recorded"}

    if not is_processing_allowed(citizen_ref):
        from app.consent_service import request_consent, ConsentRequestIn
        request_consent(ConsentRequestIn(phone_number=From, channel=channel))
        # In production: actually SEND `CONSENT_PROMPT_TEMPLATE` back to the
        # user via the Twilio Messages API here.
        return {"status": "consent_requested", "prompt": CONSENT_PROMPT_TEMPLATE}

    # --- Consent already granted: build the raw message and process -------
    media_path = None
    if NumMedia and MediaUrl0:
        filename = f"{citizen_ref}_{os.urandom(4).hex()}.ogg"
        media_path = await _download_media(MediaUrl0, filename)

    message = RawIntakeMessage(
        citizen_ref=citizen_ref,
        channel=channel,
        media_url=media_path,   # prioritized: voice notes go straight to STT
        text_body=Body,
    )

    # Process asynchronously so the webhook returns fast (Twilio expects a
    # quick 200 response) while STT/NLP run in the background.
    background_tasks.add_task(handle_new_message, message)

    return {"status": "accepted", "message_id": message.message_id}


@router.post("/ussd/webhook")
async def ussd_webhook(
    background_tasks: BackgroundTasks,
    phone_number: str = Form(...),
    text: str = Form(""),  # USSD aggregators send the full menu-navigation string
):
    """
    USSD is menu-driven and has no media support, so voice notes aren't
    possible here — it's the text-only fallback channel for the most
    connectivity-constrained users.
    """
    citizen_ref = hash_phone_number(phone_number)

    if not is_processing_allowed(citizen_ref):
        from app.consent_service import request_consent, ConsentRequestIn
        request_consent(ConsentRequestIn(phone_number=phone_number, channel=Channel.USSD))
        return {
            "response": f"CON {CONSENT_PROMPT_TEMPLATE}\n1. YES\n2. NO"
        }

    message = RawIntakeMessage(
        citizen_ref=citizen_ref,
        channel=Channel.USSD,
        text_body=text,
    )
    background_tasks.add_task(handle_new_message, message)

    return {"response": "END Thank you. Your report has been received."}
