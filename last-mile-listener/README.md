# Listener Layer — Omnichannel Intake & NLP Structuring

Member 1's system for the civic-feedback DPI project: collects fragmented,
multilingual citizen feedback over SMS / USSD / WhatsApp, gates it behind
explicit consent, transcribes and translates voice notes, and structures
everything into a clean JSON contract that gets handed off to Member 2.

## Architecture

```
Citizen (WhatsApp/SMS/USSD, often a voice note in a local language)
        |
        v
[intake_gateway.py]  --  Twilio/WhatsApp Business API + USSD webhook
        |
        v
[consent_service.py] --  "Consent as a DPI Block"
        |                 - explicit YES/NO prompt before ANY processing
        |                 - phone numbers stored as salted hashes only
        |                 - immutable audit log (SQLite here; swap for
        |                   Postgres/managed DB in production)
        |                 - consent expires after CONSENT_TTL_DAYS
        v  (only if granted)
[stt_engine.py]       --  Whisper large-v3 (faster-whisper) or Canary-Qwen 2.5B
        |                 - transcribes native-language audio
        |                 - translates to English (backend language)
        v
[nlp_pipeline.py]     --  structuring pipeline
        |                 - intent/category classification
        |                 - location entity extraction (spaCy NER + regex)
        |                 - sentiment (VADER) + urgency/severity scoring
        v
[orchestrator.py]     --  assembles StructuredFeedback JSON, POSTs it to
        |                 Member 2's ingestion endpoint (MEMBER_2_ENDPOINT)
        v
   Member 2's system (triage / routing / public dashboard)
```

## Quickstart

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Run the smoke test (uses MockSTTEngine, no model download needed):
python -m tests.test_pipeline

# Run the real API server:
export MEMBER_2_ENDPOINT="https://member2-service.example.com/ingest"
export CONSENT_HASH_SALT="a-real-random-secret"
uvicorn app.main:app --reload
```

## Wiring up real channels

1. **Twilio (SMS + WhatsApp)**: point your Twilio phone number / WhatsApp
   sender's webhook at `POST /intake/twilio/webhook`. Set `TWILIO_AUTH_TOKEN`
   and add signature verification in `intake_gateway.py` before going live
   (`twilio.request_validator.RequestValidator`) — this is stubbed out in the
   prototype and must not be skipped in production.
2. **USSD**: most USSD works through a telco/aggregator (e.g. Africa's
   Talking) that POSTs `phone_number` + `text` to your webhook and expects a
   `CON`/`END` prefixed response. `POST /intake/ussd/webhook` already speaks
   that protocol.
3. **STT model**: `app/stt_engine.py` defaults to `WhisperSTTEngine`
   (faster-whisper, `large-v3`, 99+ languages) and falls back to a
   deterministic `MockSTTEngine` if the model isn't available (e.g. no GPU /
   no internet to download weights, as in this sandbox). For max accuracy on
   supported languages, swap in Canary-Qwen 2.5B via NVIDIA NeMo — just
   implement the same `STTEngine` interface.

## The JSON contract handed to Member 2

Every processed message produces a `StructuredFeedback` object
(`app/schemas.py`), e.g.:

```json
{
  "feedback_id": "...",
  "citizen_ref": "<salted hash, never raw phone number>",
  "channel": "whatsapp",
  "consent_id": "...",
  "transcription": {
    "detected_language": "hi",
    "native_text": "पिछले तीन दिनों से ... पानी नहीं आ रहा है ...",
    "translated_text": "There has been no water supply ... for three days ..."
  },
  "intent_category": "Water Supply",
  "intent_confidence": 0.75,
  "location": { "raw_mentions": ["Sadar Bazaar"], "city": "Sadar Bazaar", "confidence": 0.6 },
  "severity": "high",
  "sentiment_score": -0.38,
  "urgency_score": 0.64,
  "summary": "[HIGH] Water Supply issue reported near Sadar Bazaar."
}
```

This is posted to `MEMBER_2_ENDPOINT`. Keep this schema stable — it's the
interface between the two halves of the project. If you need new fields,
add them as optional so Member 2's consumer doesn't break.

## Production hardening checklist (not yet done in this prototype)

- [ ] Verify Twilio webhook signatures
- [ ] Move consent log from SQLite to a managed DB with backups
- [ ] Rotate/secure `CONSENT_HASH_SALT` via a secrets manager
- [ ] Rate-limit and authenticate the webhook endpoints
- [ ] Replace the keyword-based intent classifier with a fine-tuned model
      or a structured-output LLM call once you have labeled data
- [ ] Add retry/dead-letter handling for the Member-2 handoff POST
- [ ] Add structured logging + monitoring (message volume, STT latency,
      consent opt-out rate)
- [ ] Data retention policy: auto-delete raw audio after N days once
      transcribed, per your DPI's privacy policy
