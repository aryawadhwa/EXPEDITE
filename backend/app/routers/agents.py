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
