"""
Governance Service — Confidence Score & Triage Flagging
"""

from typing import Tuple
from backend.app.schemas.requests import IngestComplaint


def calculate_confidence_score(complaint: IngestComplaint) -> Tuple[float, str, str | None]:
    """
    Computes weighted confidence score (0-1) and assigns triage status.
    Threshold: score >= 0.85 -> 'APPROVED', else -> 'NEEDS_REVIEW'
    Weights: 50% NLP certainty, 30% Spatial precision, 20% Metadata completeness
    """
    spatial = max(0.0, min(1.0, float(complaint.spatial_precision if complaint.spatial_precision is not None else 0.5)))
    nlp = max(0.0, min(1.0, float(complaint.nlp_certainty if complaint.nlp_certainty is not None else 0.5)))

    metadata_fields = [complaint.category, complaint.language, complaint.channel]
    present_fields = sum(1 for field in metadata_fields if field is not None and str(field).strip() != "")
    metadata = present_fields / len(metadata_fields) if metadata_fields else 1.0

    score = round((0.5 * nlp) + (0.3 * spatial) + (0.2 * metadata), 4)

    status = 'APPROVED'
    flag_reason = None

    if score < 0.85:
        status = 'NEEDS_REVIEW'
        reasons = []
        if spatial < 0.8:
            reasons.append("LOW_CONFIDENCE_LOCATION")
        if nlp < 0.8:
            reasons.append("AMBIGUOUS_CATEGORY")
        if metadata < 1.0:
            reasons.append("INCOMPLETE_METADATA")
        if not reasons:
            reasons.append("LOW_OVERALL_SCORE")
        flag_reason = ", ".join(reasons)

    return score, status, flag_reason
