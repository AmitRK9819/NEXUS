"""
Data Fusion Engine — Governance Service

Implements the 85% confidence threshold gate:
  Confidence = 0.5 * nlp_certainty + 0.5 * spatial_precision

Records below 0.85 are flagged as NEEDS_REVIEW and routed to
the Human Oversight Queue.
"""

from typing import Tuple
from app.schemas.requests import IngestComplaint


def calculate_confidence_score(complaint: IngestComplaint) -> Tuple[float, str, str]:
    """
    Calculate the confidence score (0-1) and determine status + flag reason.

    Returns: (confidence_score, status, flag_reason)
    """
    # 1. Spatial precision
    spatial = complaint.spatial_precision

    # 2. NLP certainty
    nlp = complaint.nlp_certainty

    # 3. Metadata completeness
    metadata_fields = [complaint.category, complaint.language]
    present_fields = sum(1 for field in metadata_fields if field is not None)
    metadata = present_fields / len(metadata_fields) if metadata_fields else 1.0

    # Overall score — weighted average
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
