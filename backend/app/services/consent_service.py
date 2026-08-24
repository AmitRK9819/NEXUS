"""
Consent as a DPI Block — DPDP Compliant Consent Management
"""

from __future__ import annotations
import hashlib
import hmac
import os
import sqlite3
import tempfile
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from backend.app.schemas.consent import Channel, ConsentRecord, ConsentStatus
from backend.app.core.config import settings

DB_PATH = Path(os.path.join(tempfile.gettempdir(), "nexus_consent_log.sqlite3"))
CONSENT_TTL_DAYS = settings.CONSENT_TTL_DAYS
HASH_SALT = settings.CONSENT_HASH_SALT


def hash_phone_number(phone_number: str) -> str:
    """Turn a raw phone number into a stable, non-reversible hashed reference."""
    return hmac.new(
        HASH_SALT.encode("utf-8"), phone_number.strip().encode("utf-8"), hashlib.sha256
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


def init_consent_db() -> None:
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS consent_records (
                consent_id TEXT PRIMARY KEY,
                citizen_ref TEXT NOT NULL,
                channel TEXT NOT NULL,
                status TEXT NOT NULL,
                purpose_text TEXT NOT NULL,
                asked_at TEXT NOT NULL,
                responded_at TEXT,
                raw_reply_text TEXT
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS ix_consent_citizen
            ON consent_records (citizen_ref, asked_at DESC)
        """)


def record_consent_request(citizen_ref: str, channel: Channel) -> ConsentRecord:
    init_consent_db()
    rec = ConsentRecord(citizen_ref=citizen_ref, channel=channel)
    with get_db() as conn:
        conn.execute("""
            INSERT INTO consent_records (
                consent_id, citizen_ref, channel, status, purpose_text, asked_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            rec.consent_id, rec.citizen_ref, rec.channel.value,
            rec.status.value, rec.purpose_text, rec.asked_at.isoformat()
        ))
    return rec


def process_consent_reply(citizen_ref: str, raw_reply: str) -> Optional[ConsentRecord]:
    init_consent_db()
    reply_normalized = raw_reply.strip().lower()
    if reply_normalized in {"yes", "y", "haan", "ha", "1", "agree", "accept"}:
        new_status = ConsentStatus.GRANTED
    elif reply_normalized in {"no", "n", "nahi", "nah", "0", "stop", "optout"}:
        new_status = ConsentStatus.DENIED
    else:
        return None

    now = datetime.now(timezone.utc)
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM consent_records
            WHERE citizen_ref = ?
            ORDER BY asked_at DESC LIMIT 1
        """, (citizen_ref,)).fetchone()

        if not row:
            rec = ConsentRecord(
                citizen_ref=citizen_ref,
                channel=Channel.WHATSAPP,
                status=new_status,
                responded_at=now,
                raw_reply_text=raw_reply,
            )
            conn.execute("""
                INSERT INTO consent_records (
                    consent_id, citizen_ref, channel, status, purpose_text, asked_at, responded_at, raw_reply_text
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec.consent_id, rec.citizen_ref, rec.channel.value,
                rec.status.value, rec.purpose_text, rec.asked_at.isoformat(),
                now.isoformat(), raw_reply
            ))
            return rec

        conn.execute("""
            UPDATE consent_records
            SET status = ?, responded_at = ?, raw_reply_text = ?
            WHERE consent_id = ?
        """, (new_status.value, now.isoformat(), raw_reply, row["consent_id"]))

        return ConsentRecord(
            consent_id=row["consent_id"],
            citizen_ref=row["citizen_ref"],
            channel=Channel(row["channel"]),
            status=new_status,
            purpose_text=row["purpose_text"],
            asked_at=datetime.fromisoformat(row["asked_at"]),
            responded_at=now,
            raw_reply_text=raw_reply,
        )


def is_processing_allowed(citizen_ref: str) -> bool:
    init_consent_db()
    with get_db() as conn:
        row = conn.execute("""
            SELECT status, responded_at FROM consent_records
            WHERE citizen_ref = ?
            ORDER BY asked_at DESC LIMIT 1
        """, (citizen_ref,)).fetchone()

        if not row:
            return False
        if row["status"] != ConsentStatus.GRANTED.value:
            return False
        if not row["responded_at"]:
            return False

        responded_at = datetime.fromisoformat(row["responded_at"])
        if datetime.now(timezone.utc) - responded_at > timedelta(days=CONSENT_TTL_DAYS):
            return False
        return True
