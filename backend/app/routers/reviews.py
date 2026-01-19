
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Draft, DraftStatus, User, Prospect
from app.api.deps import get_current_user

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
    
    # Draft is approved - in a real app, this would trigger email sending
    return {"status": "approved", "message": "Draft approved and ready to send"}

@router.post("/{id}/reject")
async def reject_draft(id: str, feedback: str, user: User = Depends(get_current_user)):
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    draft.status = DraftStatus.REJECTED
    await draft.save()
    
    # TODO: In a future implementation, could trigger agent to regenerate with feedback
    return {"status": "rejected", "message": "Draft rejected"}

@router.post("/{id}/regenerate")
async def regenerate_draft(id: str, user: User = Depends(get_current_user)):
    """Regenerate a draft using the AI model"""
    from app.core.config import settings
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Get prospect data
    prospect_data = {}
    if draft.prospect_id:
        prospect = await Prospect.get(draft.prospect_id)
        if prospect:
            prospect_data = {
                "name": prospect.name,
                "company": prospect.company,
                "scraped_data": prospect.scraped_data
            }
    
    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = """You are an expert sales development representative (SDR). 
Write a short, personalized cold outreach email that:
- Is 3-4 sentences max
- Has a compelling subject line
- References something specific about the prospect's PROFESSIONAL work
- Has a clear, low-friction call to action
- Sounds human and conversational, not salesy
- Focus on BUSINESS VALUE, not personal interests

Return your response in this exact format:
SUBJECT: [your subject line]
EMAIL:
[your email body]
REASONING: [1 sentence explaining why this approach]"""

        human_prompt = f"""Prospect Information:
Name: {prospect_data.get('name', 'Unknown')}
Company: {prospect_data.get('company', 'Unknown')}
Data: {str(prospect_data.get('scraped_data', {}))[:500]}

Write a professional business outreach email."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # Parse the response
        subject = "Quick question"
        body = content
        reasoning = "AI-regenerated outreach"
        
        if "SUBJECT:" in content:
            parts = content.split("EMAIL:")
            subject = parts[0].replace("SUBJECT:", "").strip()
            if len(parts) > 1:
                remaining = parts[1]
                if "REASONING:" in remaining:
                    body_parts = remaining.split("REASONING:")
                    body = body_parts[0].strip()
                    reasoning = body_parts[1].strip() if len(body_parts) > 1 else ""
                else:
                    body = remaining.strip()
        
        # Update draft
        draft.subject = subject
        draft.body = body
        draft.ai_reasoning = reasoning
        draft.status = DraftStatus.PENDING
        await draft.save()
        
        return {
            "status": "regenerated",
            "subject": subject,
            "body": body,
            "ai_reasoning": reasoning
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate: {str(e)}")

