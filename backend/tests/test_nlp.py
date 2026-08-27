import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.schemas.intake import IntentCategory, SeverityLevel
from backend.app.services.nlp_pipeline import structure_feedback, classify_intent, extract_location


def test_nlp_water_leak():
    text = "Big water pipe burst in Soweto causing flood on the main street."
    res = structure_feedback(text)

    assert res.intent_category == IntentCategory.WATER_SUPPLY
    assert res.intent_confidence >= 0.70
    assert res.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)
    assert res.sentiment_score < 0.0


def test_nlp_road_pothole():
    text = "Dangerous potholes on Pretoria road damaging cars."
    res = structure_feedback(text)

    assert res.intent_category == IntentCategory.ROAD_REPAIR
    assert res.intent_confidence >= 0.70
    assert "pretoria" in " ".join(res.location.raw_mentions).lower() or res.location.landmark is not None


def test_nlp_empty():
    res = structure_feedback("")
    assert res.intent_category == IntentCategory.OTHER_UNCLASSIFIED
    assert res.intent_confidence == 0.0


if __name__ == "__main__":
    test_nlp_water_leak()
    test_nlp_road_pothole()
    test_nlp_empty()
    print("[PASS] NLP unit tests passed!")
