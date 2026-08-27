"""
Governance Endpoints — Human Oversight Queue Triage
"""

import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_async_db
from backend.app.models.citizen_request import CitizenRequest
from backend.app.models.human_oversight_queue import HumanOversightQueue
from backend.app.models.base import OversightStatusEnum
from backend.app.schemas.requests import OversightQueueItem, ApprovalRequest

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get("/oversight-queue", response_model=List[OversightQueueItem])
async def get_oversight_queue(db: AsyncSession = Depends(get_async_db)):
    """Returns quarantined records scoring below 85% confidence for human review."""
    stmt = select(CitizenRequest).where(CitizenRequest.status == 'NEEDS_REVIEW').order_by(CitizenRequest.timestamp.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()

    return [
        OversightQueueItem(
            id=str(item.id),
            raw_text=item.raw_text,
            translated_text=item.translated_text,
            confidence_score=item.confidence_score,
            flag_reason=item.flag_reason,
            category=item.category.value if hasattr(item.category, "value") else str(item.category),
        )
        for item in items
    ]


@router.post("/oversight-queue/{item_id}/approve")
async def approve_oversight_item(
    item_id: str,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """Approves, rejects, or flags a quarantined record, synchronizing both tables."""
    try:
        parsed_id = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    normalized_status = req.status.upper().strip()
    if normalized_status not in ['APPROVED', 'REJECTED', 'FLAGGED']:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'APPROVED', 'REJECTED', or 'FLAGGED'")

    # 1. Update CitizenRequest record
    stmt = select(CitizenRequest).where(CitizenRequest.id == parsed_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Item not found")

    complaint.status = normalized_status

    # 2. Synchronize HumanOversightQueue record if present
    stmt_q = select(HumanOversightQueue).where(HumanOversightQueue.request_or_insight_id == parsed_id)
    res_q = await db.execute(stmt_q)
    queue_item = res_q.scalars().first()

    enum_status = OversightStatusEnum.APPROVED if normalized_status == 'APPROVED' else (
        OversightStatusEnum.REJECTED if normalized_status == 'REJECTED' else OversightStatusEnum.FLAGGED
    )

    if queue_item:
        queue_item.status = enum_status
        queue_item.assigned_at = datetime.now(timezone.utc)
    else:
        # Create corresponding oversight record
        new_q = HumanOversightQueue(
            request_or_insight_id=parsed_id,
            trigger_reason=complaint.flag_reason or "MANUAL_DECISION",
            confidence_score=complaint.confidence_score or 0.0,
            status=enum_status,
            assigned_at=datetime.now(timezone.utc),
        )
        db.add(new_q)

    await db.commit()
    return {"status": "success", "message": f"Item {normalized_status}", "id": item_id}
