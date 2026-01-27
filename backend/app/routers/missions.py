from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict
from app.models import Mission, User, MissionLog
from app.api.deps import get_current_user
from app.core.agent import run_mission_agent
from pydantic import BaseModel
import asyncio

router = APIRouter()

class MissionCreate(BaseModel):
    objective: str
    attachments: Optional[List[Dict]] = []  # List of {asset_id, filename, content_type}

@router.post("/", response_model=Mission)
async def create_mission(mission_in: MissionCreate, user: User = Depends(get_current_user)):
    mission = Mission(user_id=user.clerk_id, objective=mission_in.objective)
    await mission.insert()
    
    # Save initial log entry
    attachment_msg = ""
    if mission_in.attachments:
        attachment_msg = f" with {len(mission_in.attachments)} attachment(s)"
    initial_log = MissionLog(
        mission_id=str(mission.id),
        role="system",
        content=f"Mission started: {mission_in.objective}{attachment_msg}",
        log_type="success"
    )
    await initial_log.insert()
    
    # Trigger background agent with attachments
    asyncio.create_task(run_mission_agent(str(mission.id), mission_in.objective, user.clerk_id, mission_in.attachments or []))
    
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
    from app.models import Draft, DraftStatus, Prospect, Agent
    from beanie.operators import In
    
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

    msg_lower = chat.message.lower()
    
    # CHECK FOR INTEGRATION REQUEST (Slack, Gmail, etc.)
    integration_keywords = {
        "slack": ["slack", "notify me on slack", "integrate slack"],
        "gmail": ["gmail", "connect email", "connect gmail"],
    }
    
    for tool, keywords in integration_keywords.items():
        if any(k in msg_lower for k in keywords):
            # Check if already connected
            is_connected = False
            if tool == "slack":
                is_connected = bool(user.slack_connection_id)
            elif tool == "gmail":
                is_connected = bool(user.gmail_connection_id)
            
            if not is_connected:
                tool_label = tool.title()
                prompt_msg = f"To proceed with {tool_label} integration, please connect your {tool_label} account."
                await MissionLog(
                    mission_id=mission_id, 
                    role="agent", 
                    content=prompt_msg, 
                    log_type="action",
                    metadata={"action": "connect_tool", "tool": tool}
                ).insert()
                return {
                    "message": prompt_msg,
                    "role": "agent",
                    "type": "action",
                    "metadata": {"action": "connect_tool", "tool": tool}
                }
            else:
                # Already connected
                tool_label = tool.title()
                success_msg = f"Your {tool_label} is already connected! I'll use it for notifications."
                await MissionLog(mission_id=mission_id, role="agent", content=success_msg, log_type="success").insert()
                return {"message": success_msg, "role": "agent", "type": "success"}
    
    # CHECK FOR APPROVAL INTENT
    approval_keywords = ["approve", "send it", "send the mail", "looks good", "proceed"]
    if any(k in msg_lower for k in approval_keywords):
        # Find pending draft for this mission
        # 1. Get prospects for mission
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        prospect_ids = [str(p.id) for p in prospects]
        
        # 2. Find pending draft
        if prospect_ids:
            draft = await Draft.find_one(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.PENDING)
            
            if draft:
                # APPROVE IT
                draft.status = DraftStatus.APPROVED
                await draft.save()
                
                # Create Active Agent (Workflow)
                new_agent = Agent(
                    user_id=user.clerk_id,
                    name=f"Lead Workflow: {draft.subject[:20]}...",
                    description=f"Active engagement for mission {mission_id}",
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
                
                # ATTEMPT TO SEND EMAIL
                from app.core.sender import send_email_via_composio
                send_status = "queued (no connection)"
                
                # Find prospect for email address
                prospect_map = {str(p.id): p for p in prospects}
                target_prospect = prospect_map.get(draft.prospect_id)
                recipient = target_prospect.public_contact if target_prospect else None
                
                if user.gmail_connection_id and recipient:
                    try:
                        attachments = getattr(draft, 'attachments', []) or []
                        await send_email_via_composio(
                            user.clerk_id,
                            recipient,
                            draft.subject,
                            draft.body,
                            attachments
                        )
                        send_status = "sent successfully"
                        start_msg = f"Draft approved and email sent to {recipient}!"
                    except Exception as e:
                        print(f"Send Failed: {e}")
                        send_status = f"failed to send ({str(e)})"
                        start_msg = f"Draft approved but sending failed: {str(e)}"
                else:
                    if not recipient:
                        start_msg = "Draft approved, but I couldn't find an email address for this prospect."
                    else:
                        start_msg = f"Draft approved! However, your Gmail is not connected so I couldn't send data to {recipient}."
                
                # Log success
                await MissionLog(mission_id=mission_id, role="agent", content=start_msg, log_type="success").insert()
                
                return {
                    "message": start_msg,
                    "role": "agent",
                    "type": "success"
                }
            else:
                 # Check if recently approved
                 recent = await Draft.find_one(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.APPROVED)
                 if recent:
                     return {"message": "The draft was already approved and is being processed.", "role": "agent", "type": "success"}

        # No draft found
        fail_msg = "I don't see a pending draft to send yet. The background agent works on one prospect at a time. Please wait a moment or check the Review Queue."
        await MissionLog(mission_id=mission_id, role="agent", content=fail_msg, log_type="error").insert()
        return {"message": fail_msg, "role": "agent", "type": "error"}

    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = f"""You are the Mission Control AI.
Mission Objective: {mission.objective}

GUIDELINES:
- Address the user's question about the mission.
- If they ask for status, say "Agents are active".
- Do NOT generate sample emails here.
- If they want to change the strategy, acknowledge it (but actual config update is manual for now).
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


