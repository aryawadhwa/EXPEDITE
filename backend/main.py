
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import json

from app.core.config import settings
from app.models import User, Mission, Prospect, Draft, MissionLog, Agent, UserAsset, EmailThread, ContactHistory
from app.routers import missions, reviews, agents, contacts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Validate required environment variables
    if not settings.MONGODB_URI:
        raise ValueError("MONGODB_URI environment variable is required")
    
    client = AsyncIOMotorClient(settings.MONGODB_URI, tlsAllowInvalidCertificates=True)
    await init_beanie(database=client.outbound_ai, document_models=[User, Mission, Prospect, Draft, MissionLog, Agent, UserAsset, EmailThread, ContactHistory])
    yield
    # Shutdown

app = FastAPI(title="OutboundAI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(missions.router, prefix="/api/v1/missions", tags=["missions"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["contacts"])
from app.routers import integrations
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
from app.routers import assets
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
from app.routers import health
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
from app.routers import timeline
app.include_router(timeline.router, prefix="/api/v1", tags=["timeline"])
from app.routers import settings as settings_router
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["settings"])


from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Map user_id to list of websockets
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.user_connections:
            msg_str = json.dumps(message)
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_text(msg_str)
                except:
                    pass

    async def broadcast(self, message: dict):
        """Broadcast to all connected users"""
        msg_str = json.dumps(message)
        for user_id, connections in self.user_connections.items():
            for ws in connections:
                try:
                    await ws.send_text(msg_str)
                except:
                    pass

# Global manager instance
manager = ConnectionManager()

# Export for use in agent
def get_connection_manager():
    return manager

@app.websocket("/ws/brain/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, receive any client messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


