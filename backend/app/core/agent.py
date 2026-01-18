
import asyncio
import httpx
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.models import Draft, Prospect, Mission, DraftStatus, MissionLog
from app.core.config import settings
from datetime import datetime

# Define Agent State
class AgentState(TypedDict):
    mission_id: str
    objective: str
    user_id: str
    prospects: List[Dict] # List of prospect data found
    current_prospect: Dict # Valid prospect being processed
    draft_id: str
    feedback: str # Human feedback for revision

# Real Tools
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

async def log_event(mission_id: str, user_id: str, content: str, log_type: str = "action", role: str = "agent"):
    """Log an event to DB and broadcast via WebSocket"""
    # Save to database
    log = MissionLog(
        mission_id=mission_id,
        role=role,
        content=content,
        log_type=log_type
    )
    await log.insert()
    
    # Broadcast via WebSocket
    try:
        from main import get_connection_manager
        manager = get_connection_manager()
        await manager.send_to_user(user_id, {
            "type": log_type,
            "message": content,
            "agent": "OutboundAI",
            "mission_id": mission_id
        })
    except Exception as e:
        print(f"[WS] Failed to broadcast: {e}")

async def scout_prospects(state: AgentState):
    """Use Firecrawl to search for prospects based on the mission objective."""
    await log_event(state["mission_id"], state["user_id"], f"Scouting prospects for: {state['objective']}", "thinking")
    
    try:
        # Use Firecrawl search API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.firecrawl.dev/v1/search",
                headers={
                    "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "query": f"{state['objective']} site:linkedin.com/in/",
                    "limit": 5
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("data", [])
                
                found_prospects = []
                for result in results[:3]:  # Limit to 3 prospects
                    found_prospects.append({
                        "name": result.get("title", "Unknown").split(" - ")[0] if result.get("title") else "Unknown",
                        "company": result.get("title", "").split(" at ")[-1] if " at " in result.get("title", "") else "Unknown",
                        "linkedin": result.get("url", ""),
                        "snippet": result.get("description", ""),
                        "source": "Firecrawl Search"
                    })
                
                if found_prospects:
                    await log_event(state["mission_id"], state["user_id"], f"Found {len(found_prospects)} prospects", "success")
                    return {"prospects": found_prospects}
            
            await log_event(state["mission_id"], state["user_id"], f"Firecrawl returned status {response.status_code}", "error")
            
    except Exception as e:
        await log_event(state["mission_id"], state["user_id"], f"Error scouting: {str(e)[:100]}", "error")
    
    # Fallback mock data if API fails
    await log_event(state["mission_id"], state["user_id"], "Using fallback data", "action")
    return {"prospects": [
        {"name": "Alice Smith", "company": "TechCorp", "linkedin": "linkedin.com/in/alice", "source": "Mock"},
        {"name": "Bob Jones", "company": "StartupInc", "linkedin": "linkedin.com/in/bob", "source": "Mock"}
    ]}

async def research_prospect(state: AgentState):
    """Enrich prospect data using Firecrawl scraping."""
    prospect_data = state["prospects"][0] 
    await log_event(state["mission_id"], state["user_id"], f"Researching {prospect_data['name']}...", "action")
    
    try:
        if prospect_data.get("linkedin") and prospect_data["linkedin"].startswith("http"):
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    headers={
                        "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "url": prospect_data["linkedin"],
                        "formats": ["markdown"]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    scraped_content = data.get("data", {}).get("markdown", "")
                    enriched_data = {
                        **prospect_data, 
                        "scraped_content": scraped_content[:2000],
                        "enriched": True
                    }
                    await log_event(state["mission_id"], state["user_id"], f"Successfully enriched {prospect_data['name']}", "success")
                    return {"current_prospect": enriched_data}
                    
    except Exception as e:
        await log_event(state["mission_id"], state["user_id"], f"Research error: {str(e)[:100]}", "error")
    
    return {"current_prospect": {**prospect_data, "enriched": False}}

async def write_draft(state: AgentState):
    """Use Groq LLM to generate personalized outreach email."""
    prospect = state["current_prospect"]
    feedback = state.get("feedback")
    
    await log_event(state["mission_id"], state["user_id"], f"Writing personalized email for {prospect.get('name', 'prospect')}...", "thinking")
    
    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = """You are an expert sales development representative (SDR). 
Write a short, personalized cold outreach email that:
- Is 3-4 sentences max
- Has a compelling subject line
- References something specific about the prospect
- Has a clear, low-friction call to action
- Sounds human and conversational, not salesy

Return your response in this exact format:
SUBJECT: [your subject line]
EMAIL:
[your email body]
REASONING: [1 sentence explaining why this approach]"""

        human_prompt = f"""Prospect Information:
Name: {prospect.get('name', 'Unknown')}
Company: {prospect.get('company', 'Unknown')}
LinkedIn snippet: {prospect.get('snippet', prospect.get('scraped_content', 'No data available'))[:500]}
Mission objective: {state.get('objective', 'General outreach')}
"""
        if feedback:
            human_prompt += f"\nPrevious feedback to incorporate: {feedback}"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # Parse the response
        subject = "Quick question"
        body = content
        reasoning = "AI-generated outreach"
        
        if "SUBJECT:" in content:
            parts = content.split("EMAIL:")
            subject = parts[0].replace("SUBJECT:", "").strip()
            if len(parts) > 1:
                remaining = parts[1]
                if "REASONING:" in remaining:
                    body_parts = remaining.split("REASONING:")
                    body = body_parts[0].strip()
                    reasoning = body_parts[1].strip() if len(body_parts) > 1 else ""
                else:
                    body = remaining.strip()
        
        await log_event(state["mission_id"], state["user_id"], f"Draft ready: '{subject}' - awaiting review", "success")
        
    except Exception as e:
        print(f"[DRAFT] Error calling Groq: {e}")
        # Fallback
        subject = f"Question for {prospect.get('name', 'you')}"
        body = f"Hi {prospect.get('name', 'there')},\n\nI noticed your work at {prospect.get('company', 'your company')} and wanted to connect.\n\nWould you be open to a quick chat?\n\nBest"
        reasoning = f"Fallback template due to API error: {str(e)[:100]}"
    
    # Save/Update Draft in DB
    if state.get("draft_id"):
        draft = await Draft.get(state["draft_id"])
        if draft:
            draft.subject = subject
            draft.body = body
            draft.ai_reasoning = reasoning
            draft.status = DraftStatus.PENDING 
            await draft.save()
            return {} 
            
    # New Draft - Create Prospect first
    p_doc = Prospect(
        mission_id=state["mission_id"],
        name=prospect.get("name", "Unknown"),
        company=prospect.get("company", "Unknown"),
        scraped_data=prospect
    )
    await p_doc.insert()
    
    d_doc = Draft(
        prospect_id=str(p_doc.id),
        subject=subject,
        body=body,
        ai_reasoning=reasoning,
        status=DraftStatus.PENDING
    )
    await d_doc.insert()
    
    print(f"[DRAFT] Saved draft with ID: {d_doc.id}")
    return {"draft_id": str(d_doc.id)}

# Build Graph

workflow = StateGraph(AgentState)

workflow.add_node("scout", scout_prospects)
workflow.add_node("research", research_prospect)
workflow.add_node("draft_node", write_draft)

workflow.set_entry_point("scout")

workflow.add_edge("scout", "research")
workflow.add_edge("research", "draft_node")

# Checkpointer
memory = MemorySaver()

# Add human approval logic
def check_approval(state: AgentState):
    print("Waiting for approval...")
    pass

workflow.add_node("human_approval", check_approval)
workflow.add_edge("draft_node", "human_approval")
workflow.add_edge("human_approval", END) 

# Compile with interrupt
app = workflow.compile(checkpointer=memory, interrupt_before=["human_approval"])

# Helper runners
async def run_mission_agent(mission_id: str, objective: str, user_id: str):
    config = {"configurable": {"thread_id": mission_id}}
    inputs = {"mission_id": mission_id, "objective": objective, "user_id": user_id}
    
    async for event in app.astream(inputs, config=config):
        pass # Stream logs to websocket here later

async def resume_mission_agent(draft_prospect_id_or_thread: str, feedback: str = None):
    # Depending on how we mapped thread_id (mission_id vs draft_id)
    # If thread_id is mission_id, we need to know it.
    # For now assuming thread_id passed is correct.
    
    # We need to find the mission_id from the draft/prospect to use as thread_id
    # This complexity suggests storing thread_id on the Draft or Mission.
    
    # Placeholder logic
    config = {"configurable": {"thread_id": draft_prospect_id_or_thread}}
    
    if feedback:
        # Update state with feedback and route back to draft
        # app.update_state(config, {"feedback": feedback}) # pseudo code
        # app.invoke(Command(resume=feedback)) # if using interrupt inputs
        pass
    else:
        # Just resume
        async for event in app.astream(None, config=config):
            pass
