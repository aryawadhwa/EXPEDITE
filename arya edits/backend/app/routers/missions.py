
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

@router.get("/", response_model=List[dict])
async def list_missions(user: User = Depends(get_current_user)):
    missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    result = []
    from app.models import Prospect, Draft
    
    for mission in missions:
        mission_dict = mission.model_dump()
        mission_dict["id"] = str(mission.id)
        
        # Get counts
        # Note: In a real production app, use aggregations or maintain counters
        # fetching all just to count is inefficient but fine for MVP
        prospects = await Prospect.find(Prospect.mission_id == str(mission.id)).count()
        
        # For drafts, we need to find drafts linked to prospects of this mission
        # This is complex in NoSQL without aggregation framework, simplifying for MVP:
        # We'll just fetch all prospects IDs first
        prospects_list = await Prospect.find(Prospect.mission_id == str(mission.id)).to_list()
        prospect_ids = [str(p.id) for p in prospects_list]
        
        from beanie.operators import In
        drafts = await Draft.find(In(Draft.prospect_id, prospect_ids)).count()
        
        mission_dict["prospects_count"] = prospects
        mission_dict["drafts_count"] = drafts
        result.append(mission_dict)
        
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
    
    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = f"""You are an AI assistant helping with an outbound sales mission.

Mission objective: {mission.objective}

You can:
- Answer questions about the mission progress
- Provide suggestions for outreach strategies
- Explain what prospects were found
- Help refine the messaging approach

Be helpful, concise, and professional. Do NOT use emojis in your response. If asked about specific prospects or drafts, remind the user to check the Review Queue."""

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
    """Delete a mission and its logs"""
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Delete associated logs
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


