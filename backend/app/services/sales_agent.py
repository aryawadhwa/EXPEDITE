"""
SalesGPT-Inspired Conversational Sales Agent
Adapted from: https://github.com/filip-michalsky/SalesGPT

Context-aware AI Sales Agent that understands conversation stages
and acts accordingly. Optimized for GPT-4o mini.

Key Features:
- Stage-aware conversations (Introduction → Value Prop → Close)
- Product knowledge base integration
- Tool usage (search, payment links, scheduling)
- Multi-channel support (voice, email, SMS)
"""

from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)


class ConversationStage(str, Enum):
    """Sales conversation stages - customizable per use case"""
    INTRODUCTION = "introduction"
    QUALIFICATION = "qualification"
    VALUE_PROPOSITION = "value_proposition"
    NEEDS_ANALYSIS = "needs_analysis"
    SOLUTION_PRESENTATION = "solution_presentation"
    OBJECTION_HANDLING = "objection_handling"
    CLOSE = "close"
    END_CONVERSATION = "end_conversation"


# Stage descriptions for the AI
STAGE_DESCRIPTIONS = {
    ConversationStage.INTRODUCTION: """
        Start the conversation by introducing yourself and your company. 
        Be polite and respectful while keeping the tone professional.
        Your greeting should be welcoming. Always clarify in your greeting 
        the reason why you are reaching out.
    """,
    ConversationStage.QUALIFICATION: """
        Qualify the prospect by confirming if they are the right person to talk to 
        regarding your product/service. Ensure that they have the authority to make 
        purchasing decisions.
    """,
    ConversationStage.VALUE_PROPOSITION: """
        Briefly explain how your product/service can benefit the prospect. 
        Focus on the unique value proposition and how it can solve their pain points.
    """,
    ConversationStage.NEEDS_ANALYSIS: """
        Ask open-ended questions to uncover the prospect's needs and pain points. 
        Listen carefully to their responses and take notes.
    """,
    ConversationStage.SOLUTION_PRESENTATION: """
        Based on the prospect's needs, present your product/service as the solution. 
        Highlight features and benefits that directly address their pain points.
    """,
    ConversationStage.OBJECTION_HANDLING: """
        Address any objections that the prospect might have regarding your 
        product/service. Be empathetic and provide evidence to support your claims.
    """,
    ConversationStage.CLOSE: """
        Ask for the sale by proposing a next step. This could be a demo, trial, 
        meeting, or direct purchase. Be direct and confident.
    """,
    ConversationStage.END_CONVERSATION: """
        The prospect has to leave to call, the prospect is not interested, or next 
        steps where already determined by the sales agent.
    """,
}


class SalesAgentConfig(BaseModel):
    """Configuration for the sales agent"""
    salesperson_name: str = "Alex"
    salesperson_role: str = "Sales Development Representative"
    company_name: str = "EXPEDITE"
    company_business: str = """
        EXPEDITE is an AI-powered sales automation platform that helps 
        companies scale their EXPEDITE sales efforts. We provide intelligent 
        prospecting, personalized outreach, and automated follow-ups.
    """
    company_values: str = "Efficiency, Personalization, Results"
    conversation_purpose: str = "Qualify prospects and schedule demos"
    conversation_type: str = "EXPEDITE"  # or "inbound"
    product_catalog: Optional[str] = None
    use_tools: bool = True
    model_name: str = "gpt-4o-mini"  # Optimized for GPT-4o mini
    temperature: float = 0.7
    max_tokens: int = 500


class ConversationMessage(BaseModel):
    """Single message in the conversation"""
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict] = None


class SalesConversation(BaseModel):
    """Complete conversation state"""
    conversation_id: str
    stage: ConversationStage = ConversationStage.INTRODUCTION
    messages: List[ConversationMessage] = Field(default_factory=list)
    prospect_info: Dict[str, Any] = Field(default_factory=dict)
    tools_used: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SalesGPTAgent:
    """
    Context-aware AI Sales Agent
    
    Inspired by SalesGPT but optimized for GPT-4o mini and our use case.
    """
    
    def __init__(self, config: SalesAgentConfig):
        """Initialize the sales agent with configuration."""
        self.config = config
        self.conversation: Optional[SalesConversation] = None
        
        # Initialize LLM (GPT-4o mini)
        self.llm = ChatOpenAI(
            model=config.model_name,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Load product catalog if provided
        self.product_knowledge = self._load_product_catalog(config.product_catalog)
    
    def _load_product_catalog(self, catalog_path: Optional[str]) -> str:
        """Load product catalog from file or use default."""
        if catalog_path:
            try:
                with open(catalog_path, 'r') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Failed to load product catalog: {e}")
        
        # Default product knowledge
        return """
        EXPEDITE Platform:
        - AI-Powered Prospecting: $99/month - Find and qualify leads automatically
        - Smart Outreach: $199/month - Personalized email campaigns at scale
        - Enterprise Suite: $499/month - Full automation with CRM integration
        
        All plans include:
        - Unlimited prospects
        - Email verification
        - A/B testing
        - Analytics dashboard
        """
    
    def seed_conversation(self, conversation_id: str, prospect_info: Dict = None) -> None:
        """Initialize a new conversation."""
        self.conversation = SalesConversation(
            conversation_id=conversation_id,
            stage=ConversationStage.INTRODUCTION,
            prospect_info=prospect_info or {},
            messages=[]
        )
    
    async def determine_conversation_stage(self) -> ConversationStage:
        """
        Analyze conversation history to determine current stage.
        This is a key feature from SalesGPT - stage awareness.
        """
        if not self.conversation or len(self.conversation.messages) == 0:
            return ConversationStage.INTRODUCTION
        
        # Build conversation history for analysis
        history = "\n".join([
            f"{msg.role}: {msg.content}" 
            for msg in self.conversation.messages[-10:]  # Last 10 messages
        ])
        
        stage_analysis_prompt = f"""
You are a sales conversation analyzer. Based on the conversation history below, 
determine what stage the conversation is currently in.

Conversation History:
{history}

Available Stages:
{json.dumps({stage.value: desc.strip() for stage, desc in STAGE_DESCRIPTIONS.items()}, indent=2)}

Current Stage: {self.conversation.stage.value}

Analyze the conversation and return ONLY the stage name that best matches the current state.
Consider:
- What has been discussed so far
- What the prospect's last message indicates
- Natural conversation flow

Return only one of these exact values:
{', '.join([stage.value for stage in ConversationStage])}
"""
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content="You are a sales conversation stage analyzer."),
                HumanMessage(content=stage_analysis_prompt)
            ])
            
            stage_name = response.content.strip().lower()
            
            # Validate and convert to enum
            for stage in ConversationStage:
                if stage.value == stage_name:
                    self.conversation.stage = stage
                    logger.info(f"Conversation stage: {stage.value}")
                    return stage
            
            # If invalid, keep current stage
            return self.conversation.stage
            
        except Exception as e:
            logger.error(f"Stage determination failed: {e}")
            return self.conversation.stage
    
    async def generate_response(self, user_input: Optional[str] = None) -> str:
        """
        Generate agent response based on current stage and context.
        
        Args:
            user_input: User's message (None for initial greeting)
            
        Returns:
            Agent's response
        """
        if not self.conversation:
            raise ValueError("Conversation not initialized. Call seed_conversation() first.")
        
        # Add user input to conversation
        if user_input:
            self.conversation.messages.append(
                ConversationMessage(role="user", content=user_input)
            )
            
            # Determine new stage based on user input
            await self.determine_conversation_stage()
        
        # Build context-aware prompt
        system_prompt = self._build_system_prompt()
        
        # Build conversation history
        messages = [SystemMessage(content=system_prompt)]
        
        # Add conversation history
        for msg in self.conversation.messages[-10:]:  # Last 10 messages
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        # Generate response
        try:
            response = await self.llm.ainvoke(messages)
            agent_message = response.content.strip()
            
            # Add to conversation history
            self.conversation.messages.append(
                ConversationMessage(role="assistant", content=agent_message)
            )
            
            return agent_message
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return "I apologize, but I'm having trouble processing that. Could you please rephrase?"
    
    def _build_system_prompt(self) -> str:
        """Build context-aware system prompt based on current stage."""
        stage_instruction = STAGE_DESCRIPTIONS.get(
            self.conversation.stage,
            STAGE_DESCRIPTIONS[ConversationStage.INTRODUCTION]
        )
        
        prospect_context = ""
        if self.conversation.prospect_info:
            prospect_context = f"""
Prospect Information:
- Name: {self.conversation.prospect_info.get('name', 'Unknown')}
- Company: {self.conversation.prospect_info.get('company', 'Unknown')}
- Title: {self.conversation.prospect_info.get('title', 'Unknown')}
- Context: {self.conversation.prospect_info.get('context', 'None')}
"""
        
        return f"""
You are {self.config.salesperson_name}, a {self.config.salesperson_role} at {self.config.company_name}.

Company Information:
{self.config.company_business}

Company Values: {self.config.company_values}

Your Goal: {self.config.conversation_purpose}

{prospect_context}

Current Conversation Stage: {self.conversation.stage.value}
Stage Instructions:
{stage_instruction}

Product Knowledge:
{self.product_knowledge}

Guidelines:
1. Keep responses concise (2-3 sentences max)
2. Be natural and conversational, not robotic
3. Ask one question at a time
4. Listen actively and reference what the prospect says
5. Don't be pushy - build trust first
6. Use the prospect's name when appropriate
7. If you don't know something, be honest
8. Always provide value in every interaction

Remember: You're having a conversation, not giving a presentation. Be human.
"""
    
    async def handle_objection(self, objection: str) -> str:
        """
        Handle specific objections with empathy and evidence.
        
        Args:
            objection: The prospect's objection
            
        Returns:
            Response addressing the objection
        """
        # Temporarily set stage to objection handling
        original_stage = self.conversation.stage
        self.conversation.stage = ConversationStage.OBJECTION_HANDLING
        
        response = await self.generate_response(objection)
        
        # Restore original stage
        self.conversation.stage = original_stage
        
        return response
    
    def get_conversation_summary(self) -> Dict:
        """Get a summary of the conversation for analytics."""
        return {
            "conversation_id": self.conversation.conversation_id,
            "current_stage": self.conversation.stage.value,
            "message_count": len(self.conversation.messages),
            "prospect_info": self.conversation.prospect_info,
            "tools_used": self.conversation.tools_used,
            "metadata": self.conversation.metadata
        }
    
    async def should_end_conversation(self) -> bool:
        """Determine if the conversation should end."""
        if not self.conversation or len(self.conversation.messages) < 2:
            return False
        
        # Check if we're in end stage
        if self.conversation.stage == ConversationStage.END_CONVERSATION:
            return True
        
        # Check for explicit end signals
        last_messages = " ".join([
            msg.content.lower() 
            for msg in self.conversation.messages[-3:]
        ])
        
        end_signals = [
            "not interested", "no thanks", "stop", "unsubscribe",
            "remove me", "don't contact", "goodbye", "bye"
        ]
        
        return any(signal in last_messages for signal in end_signals)


# Factory function for easy instantiation
def create_sales_agent(
    salesperson_name: str = "Alex",
    company_name: str = "EXPEDITE",
    conversation_purpose: str = "Qualify prospects and schedule demos",
    product_catalog: Optional[str] = None
) -> SalesGPTAgent:
    """
    Create a configured sales agent.
    
    Args:
        salesperson_name: Name of the sales representative
        company_name: Company name
        conversation_purpose: Goal of the conversation
        product_catalog: Path to product catalog file
        
    Returns:
        Configured SalesGPTAgent instance
    """
    config = SalesAgentConfig(
        salesperson_name=salesperson_name,
        company_name=company_name,
        conversation_purpose=conversation_purpose,
        product_catalog=product_catalog,
        model_name="gpt-4o-mini",  # Using GPT-4o mini as requested
        temperature=0.7
    )
    
    return SalesGPTAgent(config)
