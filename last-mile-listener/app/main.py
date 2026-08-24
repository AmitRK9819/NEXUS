"""
Entrypoint: `uvicorn app.main:app --reload`

Exposes:
  POST /consent/request           - ask a citizen for consent
  POST /consent/reply             - record their YES/NO
  GET  /consent/status/{ref}      - check current consent status
  POST /intake/twilio/webhook     - Twilio SMS/WhatsApp inbound webhook
  POST /intake/ussd/webhook       - USSD aggregator inbound webhook
"""

from fastapi import FastAPI

from app.consent_service import init_db, router as consent_router
from app.intake_gateway import router as intake_router

app = FastAPI(
    title="Listener Layer — Omnichannel Intake & NLP Structuring",
    description="Member 1's system: consent, intake, STT/translation, and NLP structuring for civic feedback.",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(consent_router)
app.include_router(intake_router)
