from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.models import Agent
from datetime import datetime

router = APIRouter(tags=["agents"])

class AgentCreate(BaseModel):
    user_id: str
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

@router.get("/", response_model=List[Agent])
async def get_agents(user_id: str):
    """Get all agents for a specific user"""
    return await Agent.find(Agent.user_id == user_id).to_list()

@router.post("/", response_model=Agent)
async def create_agent(agent: AgentCreate):
    """Create a new agent deployment"""
    new_agent = Agent(
        user_id=agent.user_id,
        name=agent.name,
        description=agent.description,
        workflow=agent.workflow,
        integrations=agent.integrations,
        api_keys=agent.api_keys
    )
    await new_agent.insert()
    return new_agent

@router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    """Get a specific agent by ID"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.patch("/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, update_data: AgentUpdate):
    """Update an existing agent"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_dict = update_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    await agent.set(update_dict)
    return agent

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    agent = await Agent.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await agent.delete()
    return {"message": "Agent deleted successfully"}
