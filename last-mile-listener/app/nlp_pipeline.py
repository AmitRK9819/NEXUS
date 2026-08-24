"""
Automated Structuring Pipeline.

Takes the English-translated text and extracts:
  1. Intent / Category      -> keyword+embedding-style rule matcher
                                 (swap for a fine-tuned classifier or an
                                 LLM call in production — see NOTE below)
  2. Location entities        -> spaCy NER (GPE/LOC/FAC) + regex cues
                                 like "near X", "in X"
  3. Severity / sentiment     -> VADER sentiment + urgency keyword boost

NOTE on production upgrade path:
  The rule-based intent classifier below is intentionally transparent
  and dependency-light so it runs anywhere. For higher accuracy at
  scale, replace `classify_intent()` with either:
    (a) a fine-tuned multilingual classifier (e.g. XLM-R) trained on
        your own labeled complaint corpus, or
    (b) a single structured-output call to an LLM (the translated text
        is short, so cost per message is low) asking it to return
        {category, confidence} as JSON.
  Both slot into the same function signature, so nothing else changes.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.schemas import IntentCategory, LocationEntity, SeverityLevel

_sentiment_analyzer = SentimentIntensityAnalyzer()

# Lazy-loaded spaCy model (loaded once, reused across requests)
_nlp = None


def _get_spacy_model():
    global _nlp
    if _nlp is None:
        import spacy
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


# --------------------------------------------------------------------------
# 1. Intent / Category classification
# --------------------------------------------------------------------------

_INTENT_KEYWORDS: dict[IntentCategory, list[str]] = {
    IntentCategory.WATER_SUPPLY: [
        "water", "supply", "tap", "pipeline", "leak", "drinking water",
        "no water", "water shortage", "tanker",
    ],
    IntentCategory.ROAD_REPAIR: [
        "road", "pothole", "street", "highway", "bridge", "footpath",
        "pavement", "traffic signal", "accident",
    ],
    IntentCategory.ELECTRICITY: [
        "electricity", "power cut", "power outage", "transformer",
        "streetlight", "voltage", "blackout",
    ],
    IntentCategory.SANITATION_WASTE: [
        "garbage", "trash", "waste", "sewage", "drain", "sewer",
        "toilet", "sanitation", "cleanliness", "mosquito",
    ],
    IntentCategory.DIGITAL_CONNECTIVITY: [
        "internet", "network", "signal", "broadband", "wifi", "mobile tower",
        "connectivity", "sim",
    ],
    IntentCategory.PUBLIC_SAFETY: [
        "crime", "theft", "unsafe", "danger", "harassment", "police",
        "fight", "violence",
    ],
    IntentCategory.HEALTHCARE: [
        "hospital", "clinic", "doctor", "medicine", "ambulance", "health center",
    ],
    IntentCategory.EDUCATION: [
        "school", "teacher", "classroom", "college", "education",
    ],
    IntentCategory.PUBLIC_TRANSPORT: [
        "bus", "train", "auto", "rickshaw", "transport", "station", "metro",
    ],
}


def classify_intent(translated_text: str) -> tuple[IntentCategory, float]:
    text = translated_text.lower()
    scores: dict[IntentCategory, int] = {}

    for category, keywords in _INTENT_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in text)
        if hits:
            scores[category] = hits

    if not scores:
        return IntentCategory.OTHER_UNCLASSIFIED, 0.3

    best_category = max(scores, key=scores.get)
    total_hits = sum(scores.values())
    # Simple confidence heuristic: share of matched keywords going to the
    # winning category, floored/ceilinged to a sane range.
    confidence = min(0.95, max(0.5, scores[best_category] / total_hits))
    return best_category, round(confidence, 2)


# --------------------------------------------------------------------------
# 2. Location entity extraction
# --------------------------------------------------------------------------

_LOCATION_CUE_PATTERN = re.compile(
    r"\b(?:in|near|at|around)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})"
)


def extract_location(translated_text: str) -> LocationEntity:
    raw_mentions: list[str] = []

    # spaCy NER for GPE (cities/regions) and FAC/LOC (landmarks, facilities)
    try:
        nlp = _get_spacy_model()
        doc = nlp(translated_text)
        for ent in doc.ents:
            if ent.label_ in {"GPE", "LOC", "FAC", "ORG"}:
                raw_mentions.append(ent.text)
    except Exception:
        pass  # fall back to regex-only if spaCy model isn't available

    # Regex cues catch things spaCy might miss (e.g. "near X" landmarks)
    for match in _LOCATION_CUE_PATTERN.finditer(translated_text):
        candidate = match.group(1).strip()
        if candidate not in raw_mentions:
            raw_mentions.append(candidate)

    raw_mentions = list(dict.fromkeys(raw_mentions))  # de-dupe, keep order

    city = raw_mentions[-1] if raw_mentions else None       # heuristic: last named place = broadest/city
    neighborhood = raw_mentions[0] if len(raw_mentions) > 1 else None
    landmark = raw_mentions[0] if raw_mentions and "near" in translated_text.lower() else None

    confidence = 0.0
    if raw_mentions:
        confidence = 0.85 if len(raw_mentions) >= 2 else 0.6

    return LocationEntity(
        raw_mentions=raw_mentions,
        city=city,
        neighborhood=neighborhood,
        landmark=landmark,
        confidence=confidence,
    )


# --------------------------------------------------------------------------
# 3. Severity / sentiment / urgency
# --------------------------------------------------------------------------

_URGENCY_KEYWORDS = [
    "urgent", "immediately", "emergency", "danger", "dangerous", "accident",
    "died", "death", "fire", "flooding", "collapsed", "injured", "critical",
    "please fix", "no water for", "days", "weeks",
]


def score_sentiment_and_severity(translated_text: str) -> tuple[float, float, SeverityLevel]:
    scores = _sentiment_analyzer.polarity_scores(translated_text)
    sentiment_score = scores["compound"]  # -1..+1

    text_lower = translated_text.lower()
    urgency_hits = sum(1 for kw in _URGENCY_KEYWORDS if kw in text_lower)

    # Urgency: negative sentiment + urgency keyword density, clamped to 0..1
    negativity = max(0.0, -sentiment_score)  # 0 for neutral/positive, up to 1 for very negative
    urgency_score = min(1.0, 0.5 * negativity + 0.15 * urgency_hits)

    if urgency_score >= 0.75:
        severity = SeverityLevel.CRITICAL
    elif urgency_score >= 0.5:
        severity = SeverityLevel.HIGH
    elif urgency_score >= 0.25:
        severity = SeverityLevel.MEDIUM
    else:
        severity = SeverityLevel.LOW

    return round(sentiment_score, 3), round(urgency_score, 3), severity


# --------------------------------------------------------------------------
# Orchestration for this module
# --------------------------------------------------------------------------

@dataclass
class StructuringResult:
    intent_category: IntentCategory
    intent_confidence: float
    location: LocationEntity
    sentiment_score: float
    urgency_score: float
    severity: SeverityLevel
    summary: str


def structure_feedback(translated_text: str) -> StructuringResult:
    intent, intent_conf = classify_intent(translated_text)
    location = extract_location(translated_text)
    sentiment, urgency, severity = score_sentiment_and_severity(translated_text)

    place = location.city or location.landmark or "an unspecified location"
    summary = f"[{severity.value.upper()}] {intent.value} issue reported near {place}."

    return StructuringResult(
        intent_category=intent,
        intent_confidence=intent_conf,
        location=location,
        sentiment_score=sentiment,
        urgency_score=urgency,
        severity=severity,
        summary=summary,
    )
