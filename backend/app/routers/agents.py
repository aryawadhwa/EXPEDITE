from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.models import Agent, User
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter()

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow: Dict = {}
    integrations: List[str] = []
    api_keys: Dict[str, str] = {}

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    workflow: Optional[Dict] = None
    integrations: Optional[List[str]] = None
    api_keys: Optional[Dict[str, str]] = None

@router.get("/")
async def get_agents(user: User = Depends(get_current_user)):
    """Get all agents for the current user with stats"""
    agents = await Agent.find(Agent.user_id == user.clerk_id).to_list()
    
    result = []
    now = datetime.utcnow()
    
    for agent in agents:
        # Calculate uptime
        uptime_delta = now - agent.created_at
        hours = int(uptime_delta.total_seconds() // 3600)
        minutes = int((uptime_delta.total_seconds() % 3600) // 60)
        uptime_str = f"{hours}h {minutes}m"
        
        # Get stats from model or defaults
        stats = agent.stats if hasattr(agent, 'stats') and agent.stats else {}
        
        result.append({
            "_id": str(agent.id),
            "id": str(agent.id),
            "name": agent.name,
            "description": agent.description,
            "agent_type": getattr(agent, 'agent_type', 'custom'),
            "status": agent.status,
            "workflow": agent.workflow,
            "integrations": agent.integrations,
            "stats": {
                "processed": getattr(stats, 'processed', 0) if hasattr(stats, 'processed') else stats.get('processed', 0),
                "queued": getattr(stats, 'queued', 0) if hasattr(stats, 'queued') else stats.get('queued', 0),
                "errors": getattr(stats, 'errors', 0) if hasattr(stats, 'errors') else stats.get('errors', 0),
            },
            "uptime": uptime_str,
            "created_at": agent.created_at.isoformat(),
            "updated_at": agent.updated_at.isoformat(),
        })
    
    return result

@router.post("/", response_model=Agent)
async def create_agent(agent_data: AgentCreate, user: User = Depends(get_current_user)):
    """Create a new agent deployment"""
    new_agent = Agent(
        user_id=user.clerk_id,
        name=agent_data.name,
        description=agent_data.description,
        workflow=agent_data.workflow,
        integrations=agent_data.integrations,
        api_keys=agent_data.api_keys
    )
    await new_agent.insert()
    return new_agent

@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Get a specific agent by ID"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != user.clerk_id:
        raise HTTPException(status_code=403, detail="Not authorized to acccess this agent")
    return agent

@router.patch("/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, update_data: AgentUpdate, user: User = Depends(get_current_user)):
    """Update an existing agent"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != user.clerk_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this agent")
    
    update_dict = update_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    await agent.set(update_dict)
    return agent

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, user: User = Depends(get_current_user)):
    """Delete an agent"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.user_id != user.clerk_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this agent")
        
    await agent.delete()
    return {"message": "Agent deleted successfully"}

class ScoutRequest(BaseModel):
    objective: str
    mission_id: str

@router.post("/scout/start")
async def start_scout(request: ScoutRequest, user: User = Depends(get_current_user)):
    """Trigger the Autonomous Scout Agent"""
    from app.agents.scout_agent import scout_app
    from app.models import MissionLog, Prospect
    import asyncio
    
    async def run_scout_task(mission_id: str, objective: str, user_id: str):
        await MissionLog(
            mission_id=mission_id,
            role="system",
            content="🚀 Scout Agent activated. Starting autonomous research...",
            log_type="thinking"
        ).insert()
        
        try:
            # Run the LangGraph
            inputs = {
                "mission_id": mission_id, 
                "objective": objective,
                "search_queries": [],
                "visited_urls": [],
                "prospect_candidates": [],
                "iteration": 0
            }
            
            result = await scout_app.ainvoke(inputs)
            
            # Process results
            candidates = result.get("prospect_candidates", [])
            saved_count = 0
            
            for cand in candidates:
                analysis = cand.get("analysis", {})
                if analysis.get("score", 0) >= 6:
                    # Save HIGH INTENT prospect
                    prospect = Prospect(
                        mission_id=mission_id,
                        name=analysis.get("company_name", cand.get("title")),
                        company=analysis.get("company_name", "Unknown"),
                        context_source=cand.get("url"),
                        relevance_score=analysis.get("score"),
                        relevance_reason=analysis.get("reason"),
                        public_contact=cand.get("url"), # Placeholder
                        original_data=cand.get("raw", {})
                    )
                    await prospect.insert()
                    saved_count += 1
                    
                    # Save DRAFT if generated
                    draft_data = cand.get("draft_data")
                    if draft_data:
                        from app.models import Draft, DraftStatus
                        draft = Draft(
                            prospect_id=str(prospect.id),
                            channel="linkedin", # Defaulting to LinkedIn for Recruiter Outreach
                            subject=draft_data.get("subject", ""),
                            body=draft_data.get("body", ""),
                            ai_reasoning=f"Context Match: {analysis.get('reason')}",
                            status=DraftStatus.PENDING
                        )
                        await draft.insert()
                        
                        # Send draft to chat via WebSocket
                        from app.core.socket import manager
                        prospect_name = analysis.get("company_name", cand.get("title", "Unknown"))
                        draft_message = f"""### 📧 Draft Generated for {prospect_name}

**Subject:** {draft.subject}

---

{draft.body}

---

*Relevance Score: {analysis.get('score', 0)}/10*
*Reason: {analysis.get('reason', 'N/A')}*
"""
                        await manager.send_to_user(
                            user.clerk_id,
                            {
                                "message": draft_message,
                                "type": "success",
                                "metadata": {
                                    "action": "draft_ready",
                                    "draft_id": str(draft.id),
                                    "prospect_name": prospect_name
                                }
                            }
                        )
            
            await MissionLog(
                mission_id=mission_id,
                role="system",
                content=f"✅ Scout finished. Found {saved_count} recruiters & generated personalized connection requests.",
                log_type="success"
            ).insert()
            
        except Exception as e:
            await MissionLog(
                mission_id=mission_id,
                role="system",
                content=f"❌ Scout failed: {str(e)}",
                log_type="error"
            ).insert()
            print(f"Scout error: {e}")

    # Run in background
    asyncio.create_task(run_scout_task(request.mission_id, request.objective, user.clerk_id))
    
    return {"status": "started", "mission_id": request.mission_id}
