import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.schemas.requests import IngestComplaint
from backend.app.services.governance import calculate_confidence_score


def test_confidence_score_approved():
    comp = IngestComplaint(
        raw_text="Water leakage",
        category="Water",
        latitude=-26.2,
        longitude=28.0,
        sentiment=-0.4,
        language="en",
        nlp_certainty=0.95,
        spatial_precision=0.90,
        channel="web",
    )
    score, status, flag_reason = calculate_confidence_score(comp)
    # score = 0.5*0.95 + 0.3*0.90 + 0.2*1.0 = 0.475 + 0.27 + 0.20 = 0.945
    assert score >= 0.85
    assert status == "APPROVED"
    assert flag_reason is None


def test_confidence_score_quarantine():
    comp = IngestComplaint(
        raw_text="Some issue somewhere",
        category=None,
        latitude=-26.2,
        longitude=28.0,
        sentiment=0.0,
        language=None,
        nlp_certainty=0.50,
        spatial_precision=0.50,
        channel=None,
    )
    score, status, flag_reason = calculate_confidence_score(comp)
    assert score < 0.85
    assert status == "NEEDS_REVIEW"
    assert flag_reason is not None
    assert "LOW_CONFIDENCE_LOCATION" in flag_reason or "AMBIGUOUS_CATEGORY" in flag_reason


if __name__ == "__main__":
    test_confidence_score_approved()
    test_confidence_score_quarantine()
    print("[PASS] Governance unit tests passed!")
