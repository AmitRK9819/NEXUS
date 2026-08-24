"""
Governance endpoints — Oversight queue management

  GET  /api/v1/governance/oversight-queue        — list flagged items
  POST /api/v1/governance/oversight-queue/{id}/approve — approve/reject
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.api.deps import get_db
from app.models.domain import CitizenRequest
from app.schemas.requests import OversightQueueItem, ApprovalRequest

router = APIRouter()


@router.get("/oversight-queue", response_model=List[OversightQueueItem])
async def get_oversight_queue(db: AsyncSession = Depends(get_db)):
    """Return all records flagged for human review (confidence < 0.85)."""
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
        )
        for item in items
    ]


@router.post("/oversight-queue/{item_id}/approve")
async def approve_oversight_item(
    item_id: str,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    """Approve or reject a flagged record, releasing it into active analytics."""
    import uuid as uuid_mod
    try:
        parsed_id = uuid_mod.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = select(CitizenRequest).where(CitizenRequest.id == parsed_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Item not found")

    if complaint.status != 'NEEDS_REVIEW':
        raise HTTPException(status_code=400, detail="Item is not in NEEDS_REVIEW status")

    if req.status not in ['APPROVED', 'REJECTED']:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'APPROVED' or 'REJECTED'")

    complaint.status = req.status
    await db.commit()

    return {"status": "success", "message": f"Item {req.status}", "id": item_id}
