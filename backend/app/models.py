
from typing import Optional, List, Dict
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class DraftStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Document):
    clerk_id: Indexed(str, unique=True)
    email: str
    credits: int = 10 

    class Settings:
        name = "users"

class Mission(Document):
    user_id: str # Link to User.clerk_id or User.id
    objective: str
    status: str = "running"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "missions"

class Prospect(Document):
    mission_id: str # Link to Mission.id
    name: str
    company: str
    scraped_data: Dict = {}

    class Settings:
        name = "prospects"

class Draft(Document):
    prospect_id: str # Link to Prospect.id
    subject: str
    body: str
    ai_reasoning: str
    status: DraftStatus = DraftStatus.PENDING

    class Settings:
        name = "drafts"

class MissionLog(Document):
    mission_id: str
    role: str  # "user", "agent", "system"
    content: str
    log_type: str = "action"  # "thinking", "action", "success", "error"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mission_logs"

