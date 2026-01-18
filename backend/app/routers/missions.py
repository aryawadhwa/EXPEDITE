
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

@router.get("/", response_model=List[Mission])
async def list_missions(user: User = Depends(get_current_user)):
    return await Mission.find(Mission.user_id == user.clerk_id).to_list()

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

