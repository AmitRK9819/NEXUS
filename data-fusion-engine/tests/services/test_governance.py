import pytest
from app.schemas.requests import IngestComplaint
from app.services.governance import calculate_confidence_score

def test_calculate_confidence_score_high_confidence():
    complaint = IngestComplaint(
        raw_audio_id="test1",
        translated_text="Pothole on main street",
        category="Infrastructure",
        latitude=40.7128,
        longitude=-74.0060,
        sentiment=0.2,
        language="en",
        nlp_certainty=0.9,
        spatial_precision=0.9
    )
    score, status, flag_reason = calculate_confidence_score(complaint)
    
    assert score > 0.85
    assert status == 'APPROVED'
    assert flag_reason is None

def test_calculate_confidence_score_low_confidence():
    complaint = IngestComplaint(
        raw_audio_id="test2",
        translated_text="Some vague issue here",
        category=None,
        latitude=40.0,
        longitude=-74.0,
        sentiment=0.5,
        language=None,
        nlp_certainty=0.6,
        spatial_precision=0.5
    )
    score, status, flag_reason = calculate_confidence_score(complaint)
    
    assert score < 0.85
    assert status == 'NEEDS_REVIEW'
    assert "LOW_CONFIDENCE_LOCATION" in flag_reason
    assert "AMBIGUOUS_CATEGORY" in flag_reason
    assert "INCOMPLETE_METADATA" in flag_reason
