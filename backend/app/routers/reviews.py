
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Draft, DraftStatus, User, Prospect
from app.api.deps import get_current_user
from app.core.agent import resume_mission_agent  # Will implement this next
import asyncio

router = APIRouter()

@router.get("/pending")
async def get_pending_drafts(user: User = Depends(get_current_user)):
    # Fetch pending drafts and enrich with prospect info
    drafts = await Draft.find(Draft.status == DraftStatus.PENDING).to_list()
    
    result = []
    for draft in drafts:
        draft_dict = draft.model_dump()
        draft_dict["id"] = str(draft.id)
        
        # Fetch associated prospect
        if draft.prospect_id:
            prospect = await Prospect.get(draft.prospect_id)
            if prospect:
                draft_dict["name"] = prospect.name
                draft_dict["company"] = prospect.company
                draft_dict["scraped_data"] = prospect.scraped_data
        
        result.append(draft_dict)
    
    return result

@router.post("/{id}/approve")
async def approve_draft(id: str, subject: str = None, body: str = None, user: User = Depends(get_current_user)):
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    if subject:
        draft.subject = subject
    if body:
        draft.body = body
        
    draft.status = DraftStatus.APPROVED
    await draft.save()
    
    # Resume agent
    asyncio.create_task(resume_mission_agent(draft.prospect_id, feedback=None)) # Logic to find thread needed
    return {"status": "approved"}

@router.post("/{id}/reject")
async def reject_draft(id: str, feedback: str, user: User = Depends(get_current_user)):
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    draft.status = DraftStatus.REJECTED
    await draft.save()
    
    # Resume agent with feedback
    asyncio.create_task(resume_mission_agent(draft.prospect_id, feedback=feedback))
    return {"status": "rejected"}
