"""
NLP Pipeline — Classification, Geocoding extraction, and Sentiment Analysis
"""

from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from backend.app.schemas.intake import IntentCategory, LocationEntity, SeverityLevel

_analyzer = SentimentIntensityAnalyzer()
_spacy_nlp = None


def _get_spacy():
    global _spacy_nlp
    if _spacy_nlp is None:
        try:
            import spacy
            _spacy_nlp = spacy.load("en_core_web_sm")
        except Exception:
            _spacy_nlp = False
    return _spacy_nlp


INTENT_KEYWORDS: dict[IntentCategory, list[str]] = {
    IntentCategory.WATER_SUPPLY: [
        "water", "pani", "pipe", "leak", "tap", "pipeline", "drainage", "sewage", "tanker", "potable",
    ],
    IntentCategory.ROAD_REPAIR: [
        "road", "pothole", "sadak", "gaddha", "tar", "traffic", "bridge", "asphalt", "highway", "pavement",
    ],
    IntentCategory.ELECTRICITY: [
        "bijli", "power", "electricity", "transformer", "wire", "current", "load shedding", "blackout", "pole", "light",
    ],
    IntentCategory.SANITATION_WASTE: [
        "kachra", "garbage", "waste", "cleaning", "drain", "gutter", "safai", "dump", "trash", "sanitation",
    ],
    IntentCategory.DIGITAL_CONNECTIVITY: [
        "internet", "wifi", "network", "signal", "tower", "broadband", "fibre", "connectivity", "telecom",
    ],
    IntentCategory.HEALTHCARE: [
        "hospital", "doctor", "clinic", "dispensary", "ambulance", "medicine", "health", "icu", "ward",
    ],
    IntentCategory.EDUCATION: [
        "school", "college", "teacher", "classroom", "books", "student", "midday meal",
    ],
}

CRITICAL_KEYWORDS = ["danger", "accident", "hospital", "collapsed", "emergency", "fatal", "flood", "hazard", "burst"]
HIGH_KEYWORDS = ["broken", "overflowing", "sparking", "blocked", "contaminated", "dirty", "stopped", "severe"]


@dataclass
class StructuringResult:
    intent_category: IntentCategory
    intent_confidence: float
    location: LocationEntity
    severity: SeverityLevel
    sentiment_score: float
    urgency_score: float
    summary: str


def classify_intent(text: str) -> tuple[IntentCategory, float]:
    lower = text.lower()
    matches: dict[IntentCategory, int] = {}
    for cat, kw_list in INTENT_KEYWORDS.items():
        hits = sum(1 for kw in kw_list if kw in lower)
        if hits > 0:
            matches[cat] = hits

    if not matches:
        return IntentCategory.OTHER_UNCLASSIFIED, 0.40

    best_cat = max(matches, key=matches.get)
    hit_count = matches[best_cat]
    confidence = min(0.95, 0.60 + 0.10 * hit_count)
    return best_cat, confidence


def extract_location(text: str) -> LocationEntity:
    nlp = _get_spacy()
    raw_mentions: list[str] = []

    if nlp:
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC", "FAC"):
                raw_mentions.append(ent.text)

    # Heuristic regex matches for common ward / sector patterns
    sector_match = re.search(r"(sector|ward|block|phase|nagar|colony|gauteng|soweto|sandton|pretoria|johannesburg|mamelodi)\s*[\w\d]+", text, re.IGNORECASE)
    if sector_match and sector_match.group(0) not in raw_mentions:
        raw_mentions.append(sector_match.group(0))

    confidence = 0.85 if raw_mentions else 0.0
    return LocationEntity(
        raw_mentions=raw_mentions,
        landmark=raw_mentions[0] if raw_mentions else None,
        confidence=confidence,
    )


def compute_sentiment_and_severity(text: str) -> tuple[float, SeverityLevel, float]:
    scores = _analyzer.polarity_scores(text)
    sentiment = float(scores["compound"])

    lower = text.lower()
    if any(k in lower for k in CRITICAL_KEYWORDS) or sentiment < -0.6:
        severity = SeverityLevel.CRITICAL
        urgency = 0.95
    elif any(k in lower for k in HIGH_KEYWORDS) or sentiment < -0.3:
        severity = SeverityLevel.HIGH
        urgency = 0.75
    elif sentiment < 0.0:
        severity = SeverityLevel.MEDIUM
        urgency = 0.50
    else:
        severity = SeverityLevel.LOW
        urgency = 0.25

    return sentiment, severity, urgency


def generate_summary(text: str, cat: IntentCategory, loc: LocationEntity) -> str:
    loc_part = f" near {loc.landmark}" if loc.landmark else ""
    first_sentence = text.split(".")[0].strip()
    if len(first_sentence) > 90:
        first_sentence = first_sentence[:87] + "..."
    return f"[{cat.value}{loc_part}] {first_sentence}"


def structure_feedback(text: str) -> StructuringResult:
    intent_cat, intent_conf = classify_intent(text)
    loc = extract_location(text)
    sentiment, severity, urgency = compute_sentiment_and_severity(text)
    summary = generate_summary(text, intent_cat, loc)

    return StructuringResult(
        intent_category=intent_cat,
        intent_confidence=intent_conf,
        location=loc,
        severity=severity,
        sentiment_score=sentiment,
        urgency_score=urgency,
        summary=summary,
    )
