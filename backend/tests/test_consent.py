import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.schemas.consent import Channel, ConsentStatus
from backend.app.services.consent_service import (
    hash_phone_number,
    record_consent_request,
    process_consent_reply,
    is_processing_allowed,
)


def test_consent_lifecycle():
    phone = "+27829991234"
    ref = hash_phone_number(phone)

    # 1. Initially no consent
    assert len(ref) == 64
    assert hash_phone_number(phone) == ref  # Deterministic HMAC

    # 2. Record consent ask
    rec = record_consent_request(ref, Channel.WHATSAPP)
    assert rec.status == ConsentStatus.PENDING

    # 3. Grant consent
    granted = process_consent_reply(ref, "YES")
    assert granted is not None
    assert granted.status == ConsentStatus.GRANTED
    assert is_processing_allowed(ref) is True

    # 4. Deny consent
    denied = process_consent_reply(ref, "STOP")
    assert denied is not None
    assert denied.status == ConsentStatus.DENIED
    assert is_processing_allowed(ref) is False


if __name__ == "__main__":
    test_consent_lifecycle()
    print("[PASS] Consent unit tests passed!")
