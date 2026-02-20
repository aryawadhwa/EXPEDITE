
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import json

from app.core.config import settings
from app.models import User, Mission, Prospect, Draft, MissionLog, Agent, UserAsset, EmailThread, ContactHistory, PendingAction
from app.routers import missions, reviews, agents, contacts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Validate required environment variables
    if not settings.MONGODB_URI:
        raise ValueError("MONGODB_URI environment variable is required")
    
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        tlsAllowInvalidCertificates=True,
        maxPoolSize=50,  # Connection pooling
        minPoolSize=10
    )
    await init_beanie(database=client.expedite, document_models=[User, Mission, Prospect, Draft, MissionLog, Agent, UserAsset, EmailThread, ContactHistory, PendingAction])
    
    # Validate all integrations
    from app.core.healthcheck import startup_validation
    await startup_validation()
    
    yield
    # Shutdown

app = FastAPI(title="EXPEDITE", lifespan=lifespan)

# CORS Configuration - Environment-based
from app.core.config import settings

# Determine allowed origins based on environment
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
]

# Add production frontend URL if configured
if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Global OPTIONS handler - MUST be registered BEFORE routers
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests for all routes"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
    )

app.include_router(missions.router, prefix="/api/v1/missions", tags=["missions"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["contacts"])
from app.routers import integrations
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
from app.routers import users
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
from app.routers import assets
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
from app.routers import health
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
from app.routers import timeline
app.include_router(timeline.router, prefix="/api/v1", tags=["timeline"])
from app.routers import settings as settings_router
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["settings"])
from app.routers import scraper
app.include_router(scraper.router, prefix="/api/v1/scraper", tags=["scraper"])
from app.routers import sales_agent
app.include_router(sales_agent.router, prefix="/api/v1/sales-agent", tags=["sales-agent"])


from app.core.socket import manager

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



# Healthcheck endpoint
@app.get("/health")
async def healthcheck_endpoint():
    """Check health of all integrations"""
    from app.core.healthcheck import validate_all_integrations
    from datetime import datetime
    
    health = await validate_all_integrations()
    all_ok = all('OK' in v for v in health.values())
    
    return {
        "status": "healthy" if all_ok else "degraded",
        "services": health,
        "timestamp": datetime.utcnow().isoformat()
    }
