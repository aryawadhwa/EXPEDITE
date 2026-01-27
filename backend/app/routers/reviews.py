
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Draft, DraftStatus, User, Prospect, ContactHistory
from datetime import datetime
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

@router.delete("/pending")
async def clear_all_pending_drafts(user: User = Depends(get_current_user)):
    """Delete all pending drafts for the user"""
    from app.models import Mission, Prospect
    from beanie.operators import In
    
    # 1. Get all missions for this user
    missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    mission_ids = [str(m.id) for m in missions]
    
    if not mission_ids:
        print(f"Clear All: No missions found for user {user.clerk_id}")
        return {"status": "cleared", "count": 0}
        
    # 2. Get all prospects for these missions
    prospects = await Prospect.find(In(Prospect.mission_id, mission_ids)).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    
    if not prospect_ids:
        print(f"Clear All: No prospects found for missions {mission_ids}")
        return {"status": "cleared", "count": 0}
         
    # 3. Delete pending drafts for these prospects
    result = await Draft.find(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.PENDING).delete()
    
    count = result.deleted_count if result else 0
    print(f"Clear All: Deleted {count} drafts for user {user.clerk_id}")
    return {"status": "cleared", "count": count}

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
    
    # 1. Create Active Agent (Workflow)
    from app.models import Agent
    new_agent = Agent(
        user_id=user.clerk_id,
        name=f"Lead: {subject[:20] if subject else 'New Lead'}...",
        description=f"Active engagement workflow for draft {id}",
        status="active",
        workflow={
            "nodes": [
                {"id": "1", "type": "trigger", "data": {"label": "Draft Approved"}, "position": {"x": 50, "y": 50}},
                {"id": "2", "type": "action", "data": {"label": "Email Sent"}, "position": {"x": 50, "y": 150}},
                {"id": "3", "type": "wait", "data": {"label": "Wait for Reply"}, "position": {"x": 50, "y": 250}}
            ], 
            "edges": [
                {"id": "e1-2", "source": "1", "target": "2"},
                {"id": "e2-3", "source": "2", "target": "3"}
            ]
        }
    )
    await new_agent.insert()


    # 2.5 Record in Contact History (The "Fix" for missing contacts)
    if draft.prospect_id:
        prospect = await Prospect.get(draft.prospect_id)
        if prospect and prospect.public_contact:
            # Check for existing contact
            email = prospect.public_contact.lower().strip()
            existing_contact = await ContactHistory.find_one(
                ContactHistory.user_id == user.clerk_id,
                ContactHistory.prospect_email == email
            )
            
            if existing_contact:
                existing_contact.last_contacted_at = datetime.utcnow()
                existing_contact.last_mission_id = prospect.mission_id
                existing_contact.total_emails_sent += 1
                await existing_contact.save()
            else:
                new_contact = ContactHistory(
                    user_id=user.clerk_id,
                    prospect_email=email,
                    prospect_name=prospect.name,
                    first_mission_id=prospect.mission_id,
                    last_mission_id=prospect.mission_id,
                    total_emails_sent=1
                )
                await new_contact.insert()

    # 2. Attempt to Send Email via Composio (if connected)
    if user.gmail_connection_id:
        try:
             # Placeholder for actual Composio Action execution
             # In a full implementation, we would POST to /actions/execute with "GMAIL_SEND_EMAIL"
             # For now, we log it.
             print(f"Approved: Ready to send email via connection {user.gmail_connection_id}")
             # FUTURE: await execute_composio_action("GMAIL_SEND_EMAIL", params={...})
        except Exception as e:
            print(f"Failed to trigger email send: {e}")

    return {
        "status": "approved", 
        "message": "Draft approved. Workflow started.",
        "workflow_created": True,
        "agent_id": str(new_agent.id)
    }

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

