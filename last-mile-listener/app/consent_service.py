"""
Consent as a DPI Block.

This is a standalone, callable microservice. Nothing downstream (STT,
NLP, structuring) is allowed to run on a citizen's message until this
service reports status == "granted" for that citizen_ref.

Design choices:
- citizen_ref is stored as a SALTED HASH of the phone number, never
  the raw number, so the consent log itself isn't a PII leak.
- Every state transition (asked -> granted/denied/expired) is appended
  to an immutable log table, not overwritten, so it's auditable.
- Consent expires after CONSENT_TTL_DAYS and must be re-asked, so an
  old "yes" from a year ago can't be used to justify processing new data.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas import Channel, ConsentRecord, ConsentStatus

DB_PATH = Path(os.environ.get("CONSENT_DB_PATH", "consent_log.sqlite3"))
CONSENT_TTL_DAYS = int(os.environ.get("CONSENT_TTL_DAYS", "180"))
# In production, load this from a secrets manager, not a hardcoded default.
HASH_SALT = os.environ.get("CONSENT_HASH_SALT", "change-me-in-production")

router = APIRouter(prefix="/consent", tags=["consent"])


def hash_phone_number(phone_number: str) -> str:
    """Turn a raw phone number into a stable, non-reversible reference."""
    return hmac.new(
        HASH_SALT.encode("utf-8"), phone_number.encode("utf-8"), hashlib.sha256
    ).hexdigest()


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS consent_log (
                consent_id TEXT PRIMARY KEY,
                citizen_ref TEXT NOT NULL,
                channel TEXT NOT NULL,
                status TEXT NOT NULL,
                purpose_text TEXT NOT NULL,
                asked_at TEXT NOT NULL,
                responded_at TEXT,
                raw_reply_text TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_citizen_ref ON consent_log(citizen_ref)"
        )


class ConsentRequestIn(BaseModel):
    phone_number: str
    channel: Channel


class ConsentReplyIn(BaseModel):
    citizen_ref: str
    reply_text: str  # e.g. "YES", "NO", "1", "haan", "nahi" ...


AFFIRMATIVE_TOKENS = {
    "yes", "y", "1", "haan", "han", "ha", "ok", "okay", "sure",
    "accept", "agree", "confirm", "confirmed",
}
NEGATIVE_TOKENS = {
    "no", "n", "0", "nahi", "nahin", "cancel", "deny", "decline", "stop",
}


def _interpret_reply(reply_text: str) -> Optional[bool]:
    token = reply_text.strip().lower()
    if token in AFFIRMATIVE_TOKENS:
        return True
    if token in NEGATIVE_TOKENS:
        return False
    return None  # ambiguous reply — treat as still pending, ask again


@router.post("/request", response_model=ConsentRecord)
def request_consent(payload: ConsentRequestIn) -> ConsentRecord:
    """
    Step 1: called by the intake gateway BEFORE any message content is
    processed. Creates a 'pending' consent record and returns the exact
    text that should be sent back to the citizen asking for permission.
    """
    citizen_ref = hash_phone_number(payload.phone_number)
    record = ConsentRecord(citizen_ref=citizen_ref, channel=payload.channel)

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO consent_log
                (consent_id, citizen_ref, channel, status, purpose_text, asked_at, responded_at, raw_reply_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.consent_id,
                record.citizen_ref,
                record.channel.value,
                record.status.value,
                record.purpose_text,
                record.asked_at.isoformat(),
                None,
                None,
            ),
        )
    return record


@router.post("/reply", response_model=ConsentRecord)
def record_consent_reply(payload: ConsentReplyIn) -> ConsentRecord:
    """
    Step 2: called when the citizen replies to the consent prompt
    (e.g. "YES" over SMS/WhatsApp). Updates the most recent pending
    record for that citizen.
    """
    decision = _interpret_reply(payload.reply_text)

    with get_db() as conn:
        row = conn.execute(
            """
            SELECT * FROM consent_log
            WHERE citizen_ref = ? AND status = 'pending'
            ORDER BY asked_at DESC LIMIT 1
            """,
            (payload.citizen_ref,),
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=404,
                detail="No pending consent request found for this citizen_ref.",
            )

        if decision is None:
            # Ambiguous reply: leave as pending, caller should re-prompt.
            return ConsentRecord(
                consent_id=row["consent_id"],
                citizen_ref=row["citizen_ref"],
                channel=Channel(row["channel"]),
                status=ConsentStatus.PENDING,
                purpose_text=row["purpose_text"],
                asked_at=datetime.fromisoformat(row["asked_at"]),
                raw_reply_text=payload.reply_text,
            )

        new_status = ConsentStatus.GRANTED if decision else ConsentStatus.DENIED
        responded_at = datetime.now(timezone.utc)

        conn.execute(
            """
            UPDATE consent_log
            SET status = ?, responded_at = ?, raw_reply_text = ?
            WHERE consent_id = ?
            """,
            (new_status.value, responded_at.isoformat(), payload.reply_text, row["consent_id"]),
        )

        return ConsentRecord(
            consent_id=row["consent_id"],
            citizen_ref=row["citizen_ref"],
            channel=Channel(row["channel"]),
            status=new_status,
            purpose_text=row["purpose_text"],
            asked_at=datetime.fromisoformat(row["asked_at"]),
            responded_at=responded_at,
            raw_reply_text=payload.reply_text,
        )


@router.get("/status/{citizen_ref}", response_model=ConsentRecord)
def get_consent_status(citizen_ref: str) -> ConsentRecord:
    """
    Gate used by every downstream service: 'is it OK to process this
    citizen's data right now?' Applies TTL expiry automatically.
    """
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT * FROM consent_log
            WHERE citizen_ref = ?
            ORDER BY asked_at DESC LIMIT 1
            """,
            (citizen_ref,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="No consent record for this citizen_ref.")

    asked_at = datetime.fromisoformat(row["asked_at"])
    status = ConsentStatus(row["status"])

    if status == ConsentStatus.GRANTED:
        age = datetime.now(timezone.utc) - asked_at
        if age > timedelta(days=CONSENT_TTL_DAYS):
            status = ConsentStatus.EXPIRED

    return ConsentRecord(
        consent_id=row["consent_id"],
        citizen_ref=row["citizen_ref"],
        channel=Channel(row["channel"]),
        status=status,
        purpose_text=row["purpose_text"],
        asked_at=asked_at,
        responded_at=datetime.fromisoformat(row["responded_at"]) if row["responded_at"] else None,
        raw_reply_text=row["raw_reply_text"],
    )


def is_processing_allowed(citizen_ref: str) -> bool:
    """Convenience helper the orchestrator calls before touching any content."""
    try:
        record = get_consent_status(citizen_ref)
    except HTTPException:
        return False
    return record.status == ConsentStatus.GRANTED
