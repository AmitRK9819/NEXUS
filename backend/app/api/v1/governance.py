"""
Governance Endpoints — Human Oversight Queue Triage
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.app.core.database import get_async_db
from backend.app.models.citizen_request import CitizenRequest
from backend.app.schemas.requests import OversightQueueItem, ApprovalRequest

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get("/oversight-queue", response_model=List[OversightQueueItem])
async def get_oversight_queue(db: AsyncSession = Depends(get_async_db)):
    """Returns quarantined records scoring below 85% confidence for review."""
    stmt = select(CitizenRequest).where(CitizenRequest.status == 'NEEDS_REVIEW')
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
    """Approves, rejects, or flags a quarantined record."""
    try:
        parsed_id = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = select(CitizenRequest).where(CitizenRequest.id == parsed_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Item not found")

    if req.status not in ['APPROVED', 'REJECTED', 'FLAGGED']:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'APPROVED', 'REJECTED', or 'FLAGGED'")

    complaint.status = req.status
    await db.commit()

    return {"status": "success", "message": f"Item {req.status}", "id": item_id}
