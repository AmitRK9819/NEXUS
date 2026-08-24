from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.api.deps import get_db
from app.models.domain import CitizenComplaint
from app.schemas.requests import OversightQueueItem, ApprovalRequest

router = APIRouter()

@router.get("/oversight-queue", response_model=List[OversightQueueItem])
async def get_oversight_queue(db: AsyncSession = Depends(get_db)):
    stmt = select(CitizenComplaint).where(CitizenComplaint.status == 'NEEDS_REVIEW')
    result = await db.execute(stmt)
    items = result.scalars().all()
    return items

@router.post("/oversight-queue/{item_id}/approve")
async def approve_oversight_item(
    item_id: int,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CitizenComplaint).where(CitizenComplaint.id == item_id)
    result = await db.execute(stmt)
    complaint = result.scalars().first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if complaint.status != 'NEEDS_REVIEW':
        raise HTTPException(status_code=400, detail="Item is not in NEEDS_REVIEW status")
        
    if req.status not in ['APPROVED', 'REJECTED']:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    complaint.status = req.status
    await db.commit()
    
    return {"status": "success", "message": f"Item {req.status}"}
