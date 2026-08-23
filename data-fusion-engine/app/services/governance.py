from typing import Tuple
from app.schemas.requests import IngestComplaint

def calculate_confidence_score(complaint: IngestComplaint) -> Tuple[float, str, str]:
    """
    Calculates the confidence score (0-1) and determines the status and flag reason.
    Returns: (confidence_score, status, flag_reason)
    """
    # 1. Spatial Accuracy
    spatial = complaint.spatial_precision
    
    # 2. NLP Certainty
    nlp = complaint.nlp_certainty
    
    # 3. Metadata Completeness
    metadata_fields = [complaint.category, complaint.language]
    present_fields = sum(1 for field in metadata_fields if field is not None)
    metadata = present_fields / len(metadata_fields) if metadata_fields else 1.0
    
    # Overall Score (Equal average)
    score = (spatial + nlp + metadata) / 3.0
    
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
