"""
Sales Agent API Endpoints
SalesGPT-inspired conversational AI for sales automation
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict
from pydantic import BaseModel
from app.models import User, Mission
from app.api.deps import get_current_user
from app.services.sales_agent import (
    create_sales_agent,
    SalesGPTAgent,
    ConversationStage,
    SalesAgentConfig
)
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory conversation storage (in production, use Redis or database)
active_conversations: Dict[str, SalesGPTAgent] = {}


class StartConversationRequest(BaseModel):
    mission_id: str
    prospect_name: Optional[str] = None
    prospect_company: Optional[str] = None
    prospect_title: Optional[str] = None
    prospect_context: Optional[str] = None
    salesperson_name: str = "Alex"
    conversation_purpose: str = "Qualify prospect and schedule demo"


class ConversationMessageRequest(BaseModel):
    conversation_id: str
    message: str


class AgentConfigRequest(BaseModel):
    salesperson_name: str = "Alex"
    salesperson_role: str = "Sales Development Representative"
    company_name: str = "EXPEDITE"
    conversation_purpose: str = "Qualify prospects and schedule demos"
    temperature: float = 0.7


@router.post("/conversations/start")
async def start_sales_conversation(
    request: StartConversationRequest,
    user: User = Depends(get_current_user)
):
    """
    Start a new AI sales conversation.
    
    Creates a context-aware sales agent that understands conversation stages
    and adapts its approach accordingly.
    """
    try:
        # Verify mission exists
        mission = await Mission.get(request.mission_id)
        if not mission or mission.user_id != user.clerk_id:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        # Create sales agent
        agent = create_sales_agent(
            salesperson_name=request.salesperson_name,
            conversation_purpose=request.conversation_purpose
        )
        
        # Initialize conversation
        conversation_id = f"{request.mission_id}_{datetime.utcnow().timestamp()}"
        
        prospect_info = {
            "name": request.prospect_name or "there",
            "company": request.prospect_company or "Unknown",
            "title": request.prospect_title or "Unknown",
            "context": request.prospect_context or "None"
        }
        
        agent.seed_conversation(conversation_id, prospect_info)
        
        # Generate initial greeting
        greeting = await agent.generate_response()
        
        # Store agent in memory
        active_conversations[conversation_id] = agent
        
        return {
            "success": True,
            "conversation_id": conversation_id,
            "stage": agent.conversation.stage.value,
            "message": greeting,
            "prospect_info": prospect_info
        }
        
    except Exception as e:
        logger.error(f"Failed to start conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations/message")
async def send_message_to_agent(
    request: ConversationMessageRequest,
    user: User = Depends(get_current_user)
):
    """
    Send a message to the sales agent and get a response.
    
    The agent will:
    1. Analyze the conversation stage
    2. Generate a context-appropriate response
    3. Potentially advance to the next stage
    """
    try:
        # Get agent from memory
        agent = active_conversations.get(request.conversation_id)
        
        if not agent:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or expired"
            )
        
        # Check if conversation should end
        if await agent.should_end_conversation():
            return {
                "success": True,
                "conversation_id": request.conversation_id,
                "stage": ConversationStage.END_CONVERSATION.value,
                "message": "Thank you for your time. Have a great day!",
                "should_end": True
            }
        
        # Generate response
        response = await agent.generate_response(request.message)
        
        return {
            "success": True,
            "conversation_id": request.conversation_id,
            "stage": agent.conversation.stage.value,
            "message": response,
            "should_end": False
        }
        
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}/stage")
async def get_conversation_stage(
    conversation_id: str,
    user: User = Depends(get_current_user)
):
    """Get the current stage of a conversation."""
    agent = active_conversations.get(conversation_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "stage": agent.conversation.stage.value,
        "stage_description": agent._build_system_prompt()
    }


@router.get("/conversations/{conversation_id}/summary")
async def get_conversation_summary(
    conversation_id: str,
    user: User = Depends(get_current_user)
):
    """Get a summary of the conversation for analytics."""
    agent = active_conversations.get(conversation_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    summary = agent.get_conversation_summary()
    
    return {
        "success": True,
        "summary": summary
    }


@router.post("/conversations/{conversation_id}/handle-objection")
async def handle_objection(
    conversation_id: str,
    objection: str,
    user: User = Depends(get_current_user)
):
    """
    Handle a specific objection with empathy and evidence.
    
    This endpoint allows you to explicitly trigger objection handling mode.
    """
    agent = active_conversations.get(conversation_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        response = await agent.handle_objection(objection)
        
        return {
            "success": True,
            "conversation_id": conversation_id,
            "objection": objection,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Failed to handle objection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def end_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user)
):
    """End and cleanup a conversation."""
    if conversation_id in active_conversations:
        del active_conversations[conversation_id]
        return {"success": True, "message": "Conversation ended"}
    
    raise HTTPException(status_code=404, detail="Conversation not found")


@router.get("/agent/capabilities")
async def get_agent_capabilities(user: User = Depends(get_current_user)):
    """Get information about the sales agent's capabilities."""
    return {
        "model": "gpt-4o-mini",
        "features": {
            "stage_awareness": True,
            "context_understanding": True,
            "objection_handling": True,
            "product_knowledge": True,
            "multi_channel": True,
            "personalization": True
        },
        "conversation_stages": [stage.value for stage in ConversationStage],
        "supported_channels": ["email", "sms", "voice", "chat"],
        "languages": ["English"],  # Expandable
        "max_conversation_length": 50  # messages
    }


@router.post("/agent/configure")
async def configure_agent(
    config: AgentConfigRequest,
    user: User = Depends(get_current_user)
):
    """
    Configure a custom sales agent.
    
    This allows you to create agents with different personalities,
    goals, and conversation styles.
    """
    try:
        agent_config = SalesAgentConfig(
            salesperson_name=config.salesperson_name,
            salesperson_role=config.salesperson_role,
            company_name=config.company_name,
            conversation_purpose=config.conversation_purpose,
            temperature=config.temperature,
            model_name="gpt-4o-mini"
        )
        
        return {
            "success": True,
            "message": "Agent configuration saved",
            "config": agent_config.dict()
        }
        
    except Exception as e:
        logger.error(f"Failed to configure agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))
