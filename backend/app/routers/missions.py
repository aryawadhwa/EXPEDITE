
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Mission, User, MissionLog
from app.api.deps import get_current_user
from app.core.agent import run_mission_agent
from pydantic import BaseModel
import asyncio

router = APIRouter()

class MissionCreate(BaseModel):
    objective: str

@router.post("/", response_model=Mission)
async def create_mission(mission_in: MissionCreate, user: User = Depends(get_current_user)):
    mission = Mission(user_id=user.clerk_id, objective=mission_in.objective)
    await mission.insert()
    
    # Save initial log entry
    initial_log = MissionLog(
        mission_id=str(mission.id),
        role="system",
        content=f"Mission started: {mission_in.objective}",
        log_type="success"
    )
    await initial_log.insert()
    
    # Trigger background agent
    asyncio.create_task(run_mission_agent(str(mission.id), mission_in.objective, user.clerk_id))
    
    return mission

@router.get("/")
async def list_missions(user: User = Depends(get_current_user)):
    from app.models import Prospect, Draft, DraftStatus
    
    missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    # Enrich with counts
    result = []
    for mission in missions:
        mission_id = str(mission.id)
        
        # Count prospects for this mission
        prospects_count = await Prospect.find(Prospect.mission_id == mission_id).count()
        
        # Count pending drafts for this mission (via prospect_id lookup)
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        prospect_ids = [str(p.id) for p in prospects]
        drafts_count = 0
        if prospect_ids:
            drafts_count = await Draft.find(
                {"prospect_id": {"$in": prospect_ids}, "status": DraftStatus.PENDING}
            ).count()
        
        result.append({
            "_id": str(mission.id),
            "id": str(mission.id),
            "user_id": mission.user_id,
            "objective": mission.objective,
            "status": mission.status,
            "created_at": mission.created_at.isoformat(),
            "prospects_count": prospects_count,
            "drafts_count": drafts_count,
        })
    
    return result

@router.get("/{mission_id}/logs")
async def get_mission_logs(mission_id: str, user: User = Depends(get_current_user)):
    """Get all logs for a mission"""
    # Verify mission belongs to user
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    logs = await MissionLog.find(MissionLog.mission_id == mission_id).sort("+timestamp").to_list()
    return [
        {
            "id": str(log.id),
            "role": log.role,
            "content": log.content,
            "type": log.log_type,
            "metadata": log.metadata,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

class ChatMessage(BaseModel):
    message: str

@router.post("/{mission_id}/chat")
async def chat_with_mission(mission_id: str, chat: ChatMessage, user: User = Depends(get_current_user)):
    """Send a chat message and get AI response"""
    from app.core.config import settings
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    
    # Verify mission belongs to user
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Save user message as log
    user_log = MissionLog(
        mission_id=mission_id,
        role="user",
        content=chat.message,
        log_type="action"
    )
    await user_log.insert()

    # CHECK FOR REAL DATA/EMAIL INTENT
    # Simple keyword match for now. In production this should be an intent classifier.
    intent_keywords = ["send", "email", "outreach", "blast", "campaign"]
    if any(k in chat.message.lower() for k in intent_keywords):
        # Check if user has connected email (mock check for now as Settings endpoint isn't fully linked to DB yet)
        # We can check the Agent model or User settings if they existed.
        # For this demo, let's assume we check for a "gmail_connected" flag or similar.
        
        # Simulating a check - asking user to confirm/connect
        # In a real app we would query: await Agent.find_one({"user_id": user.clerk_id, "integrations": "gmail"})
        
        # If we wanted to force it:
        # return {
        #     "message": "I can help with that, but first you need to connect your **Gmail** account in Settings so I can send emails on your behalf.",
        #     "role": "agent",
        #     "type": "error" # Or specific type to trigger UI action
        # }
        pass

    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = f"""You are the Mission Control AI for an outbound sales campaign.
        
Mission Objective: {mission.objective}

YOUR ROLE:
- You orchestrate the background agents.
- You do NOT write emails yourself in this chat.
- You do NOT give generic advice on how to write emails.

INTERACTION GUIDELINES:
- If the user asks to "send emails" or "find people", confirm that the **Background Agent** is already working on it.
- Direct the user to the **Review Queue** to see drafts.
- If the user provides feedback (e.g., "Make them shorter"), say "Understood, I will pass this feedback to the drafting agent for future emails." (Note: Actual feedback passing is a future feature).
- If the user asks for status, check the logs (which you can't see directly, so just say "Agents are active").

CRITICAL:
- Unless the user asks a general question, always refer them to the **Review Queue** for results.
- NEVER generate a sample email in this chat. Drafts belong in the Review Queue.
- If the user asks to "Send", remind them to **Connect their Gmail** in Settings (if not done) and then use the **Approve** button in the Review Queue.
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=chat.message)
        ]
        
        response = await llm.ainvoke(messages)
        ai_content = response.content
        
        # Save AI response as log
        ai_log = MissionLog(
            mission_id=mission_id,
            role="agent",
            content=ai_content,
            log_type="success"
        )
        await ai_log.insert()
        
        return {
            "message": ai_content,
            "role": "agent",
            "type": "success"
        }
        
    except Exception as e:
        error_msg = f"Sorry, I encountered an error: {str(e)[:100]}"
        # Save error log
        error_log = MissionLog(
            mission_id=mission_id,
            role="agent",
            content=error_msg,
            log_type="error"
        )
        await error_log.insert()
        
        return {
            "message": error_msg,
            "role": "agent",
            "type": "error"
        }

@router.delete("/{mission_id}")
async def delete_mission(mission_id: str, user: User = Depends(get_current_user)):
    """Delete a mission and its logs, drafts, and prospects"""
    from app.models import Draft, Prospect # Delayed import to avoid circular dependency
    
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Cascade Delete: Drafts -> Prospects -> Logs -> Mission
    from beanie.operators import In
    
    # Find all prospects for this mission
    prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    
    # Delete connected drafts
    if prospect_ids:
        await Draft.find(In(Draft.prospect_id, prospect_ids)).delete()
    
    # Delete prospects
    await Prospect.find(Prospect.mission_id == mission_id).delete()
    
    # Delete logs
    await MissionLog.find(MissionLog.mission_id == mission_id).delete()
    
    # Delete the mission
    await mission.delete()
    return {"status": "deleted", "mission_id": mission_id}

@router.patch("/{mission_id}/stop")
async def stop_mission(mission_id: str, user: User = Depends(get_current_user)):
    """Stop/pause a running mission"""
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission.status = "stopped"
    await mission.save()
    
    # Log the stop event
    log = MissionLog(
        mission_id=mission_id,
        role="system",
        content="Mission stopped by user",
        log_type="action"
    )
    await log.insert()
    
    return {"status": "stopped", "mission_id": mission_id}


