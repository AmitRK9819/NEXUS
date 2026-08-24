"""
Governance Service — Confidence Score & Triage Flagging
"""

from typing import Tuple
from backend.app.schemas.requests import IngestComplaint


def calculate_confidence_score(complaint: IngestComplaint) -> Tuple[float, str, str | None]:
    """
    Computes weighted confidence score (0-1) and assigns triage status.
    Threshold: score >= 0.85 -> 'APPROVED', else -> 'NEEDS_REVIEW'
    """
    spatial = complaint.spatial_precision
    nlp = complaint.nlp_certainty
    metadata_fields = [complaint.category, complaint.language]
    present_fields = sum(1 for field in metadata_fields if field is not None)
    metadata = present_fields / len(metadata_fields) if metadata_fields else 1.0

    score = (0.5 * nlp) + (0.3 * spatial) + (0.2 * metadata)

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
