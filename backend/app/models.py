
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
    gmail_connection_id: Optional[str] = None 
    slack_connection_id: Optional[str] = None 
    other_connections: Dict[str, str] = {} # Map tool_name -> connection_id 

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
    # Layer 1: Public Discovery
    context_source: Optional[str] = None # e.g. "Careers Page", "About Us"
    public_contact: Optional[str] = None # e.g. "careers@company.com"
    original_data: Dict = {} # Store raw firecrawl data
    
    # Layer 2: User-Driven Matching
    relevance_score: float = 0.0
    relevance_reason: Optional[str] = None # Why this person/contact appears relevant
    
    # Layer 3 is Draft/Outreach (separate model)
    scraped_data: Dict = {} # Legacy field, keeping for compatibility

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
    metadata: Dict = {} # For structured actions like "connect_tool"
    log_type: str = "action"  # "thinking", "action", "success", "error"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mission_logs"


class Agent(Document):
    user_id: str
    name: str
    description: Optional[str] = None
    status: str = "active" # active, paused, error
    workflow: Dict = {} # Stores the React Flow nodes and edges
    integrations: List[str] = [] # List of enabled integration IDs
    api_keys: Dict[str, str] = {} # Map of integration_id -> api_key
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agents"

class UserAsset(Document):
    user_id: str
    filename: str
    content_type: str  # e.g., "application/pdf"
    file_data: bytes  # Binary content of the file
    size_bytes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_assets"
