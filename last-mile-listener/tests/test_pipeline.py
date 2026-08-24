"""
Runnable smoke test for the whole Listener Layer pipeline, using the
MockSTTEngine so it works without downloading real model weights.

Run with:  python3 -m tests.test_pipeline   (from project root)
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import orchestrator
from app.consent_service import (
    init_db, request_consent, record_consent_reply,
    ConsentRequestIn, ConsentReplyIn,
)
from app.consent_service import hash_phone_number
from app.schemas import Channel, RawIntakeMessage
from app.stt_engine import MockSTTEngine


async def main():
    init_db()

    # Force the mock STT engine so this runs anywhere (no model download).
    orchestrator._stt_engine = MockSTTEngine()

    test_cases = [
        ("+919820011111", "sample_data/voice_note_hi_water.wav"),
        ("+919820022222", "sample_data/voice_note_ta_road.wav"),
    ]

    for phone_number, voice_note_path in test_cases:
        print(f"\n{'='*70}\nCitizen: {phone_number}  |  Voice note: {voice_note_path}\n{'='*70}")

        # 1) Consent as a DPI block — must happen before any content is touched
        consent = request_consent(ConsentRequestIn(phone_number=phone_number, channel=Channel.WHATSAPP))
        print(f"[consent] requested -> status={consent.status}")

        citizen_ref = hash_phone_number(phone_number)
        consent = record_consent_reply(ConsentReplyIn(citizen_ref=citizen_ref, reply_text="YES"))
        print(f"[consent] citizen replied YES -> status={consent.status}")

        # 2) Build the raw intake message (as the gateway would after consent)
        message = RawIntakeMessage(
            citizen_ref=citizen_ref,
            channel=Channel.WHATSAPP,
            media_url=voice_note_path,
            consent_id=consent.consent_id,
        )

        # 3) Run the full pipeline: STT -> translate -> structure -> JSON
        feedback = await orchestrator.handle_new_message(message)

        print("\n--- Structured JSON handed to Member 2 ---")
        print(json.dumps(json.loads(feedback.model_dump_json()), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
