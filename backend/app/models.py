
from typing import Optional, List, Dict
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class DraftStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class UserSettings(BaseModel):
    """User preferences that persist"""
    email_notifications: bool = True
    daily_digest_time: str = "9am"
    auto_approve_low_risk: bool = False
    personalization_threshold: int = 80
    daily_sending_limit: int = 50

class User(Document):
    clerk_id: Indexed(str, unique=True)
    email: str
    credits: int = 10 
    gmail_connection_id: Optional[str] = None 
    slack_connection_id: Optional[str] = None 
    other_connections: Dict[str, str] = {} # Map tool_name -> connection_id
    settings: UserSettings = Field(default_factory=UserSettings)

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
    attachments: List[Dict] = []  # List of {"filename": str, "content_type": str, "asset_id": str}

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


class AgentStats(BaseModel):
    """Real-time agent statistics"""
    processed: int = 0
    queued: int = 0
    errors: int = 0
    last_run_at: Optional[datetime] = None

class Agent(Document):
    user_id: str
    name: str
    description: Optional[str] = None
    agent_type: str = "custom"  # scout, writer, enricher, custom
    status: str = "idle"  # active, idle, paused, error
    workflow: Dict = {}  # Stores the React Flow nodes and edges
    integrations: List[str] = []  # List of enabled integration IDs
    api_keys: Dict[str, str] = {}  # Map of integration_id -> api_key
    stats: AgentStats = Field(default_factory=AgentStats)
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

class EmailEventType(str, Enum):
    SENT = "sent"
    REPLY_RECEIVED = "reply_received"
    FOLLOW_UP = "follow_up"
    OPENED = "opened"
    CLICKED = "clicked"

class EmailEvent(BaseModel):
    """Individual email event in a thread"""
    type: EmailEventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    email_id: str  # Gmail message ID
    subject: Optional[str] = None
    preview: Optional[str] = None  # First 100 chars of body
    from_email: str
    to_email: str
    metadata: Dict = {}  # Additional data (opened_at, clicked_link, etc.)

class ThreadStatus(str, Enum):
    ACTIVE = "active"
    WAITING_REPLY = "waiting_reply"
    REPLIED = "replied"
    CLOSED = "closed"

class EmailThread(Document):
    """Tracks complete email conversation timeline"""
    user_id: str  # Link to User.clerk_id
    mission_id: str  # Link to Mission.id
    prospect_id: str  # Link to Prospect.id
    thread_id: str  # Gmail thread ID
    
    # Timeline of all events
    events: List[EmailEvent] = []
    
    # Current status
    status: ThreadStatus = ThreadStatus.WAITING_REPLY
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    # Quick access fields
    first_sent_at: Optional[datetime] = None
    last_reply_at: Optional[datetime] = None
    reply_count: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "email_threads"


class ContactHistory(Document):
    """Track all email communications to prevent duplicates"""
    user_id: str  # Link to User.clerk_id
    prospect_email: str  # Email address (normalized/lowercase)
    prospect_name: Optional[str] = None
    
    # First contact info
    first_contacted_at: datetime = Field(default_factory=datetime.utcnow)
    first_mission_id: str  # Mission that first contacted this person
    
    # Latest contact info
    last_contacted_at: datetime = Field(default_factory=datetime.utcnow)
    last_mission_id: str
    
    # Contact count
    total_emails_sent: int = 1
    
    # Email thread tracking
    thread_ids: List[str] = []  # All Gmail thread IDs
    
    # Response tracking
    has_replied: bool = False
    last_reply_at: Optional[datetime] = None
    
    # Status
    status: str = "contacted"  # contacted, replied, bounced, unsubscribed
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "contact_history"
        indexes = [
            [("user_id", 1), ("prospect_email", 1)],  # Unique per user+email
        ]
