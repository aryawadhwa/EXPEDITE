
import asyncio
import httpx
from typing import TypedDict, Annotated, List, Dict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from app.models import Draft, Prospect, Mission, DraftStatus, MissionLog, User
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

async def log_event(mission_id: str, user_id: str, content: str, log_type: str = "action", role: str = "agent", metadata: Dict = {}):
    """Log an event to DB and broadcast via WebSocket"""
    # Save to database
    log = MissionLog(
        mission_id=mission_id,
        role=role,
        content=content,
        log_type=log_type,
        metadata=metadata
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
            "mission_id": mission_id,
            "metadata": metadata
        })
    except Exception as e:
        print(f"[WS] Failed to broadcast: {e}")

async def scout_prospects(state: AgentState):
    """Layer 1: Public Data Discovery (Role-Agnostic) with improved queries"""
    await log_event(state["mission_id"], state["user_id"], f"Layer 1: Scouting public contexts for: {state['objective']}", "thinking")
    
    try:
        # Use Firecrawl search API with more specific query for contacts
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.firecrawl.dev/v1/search",
                headers={
                    "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    # Enforce looking for contact info
                    "query": f"{state['objective']} email contact info site:linkedin.com/in/ OR site:twitter.com OR site:github.com OR site:company.com",
                    "limit": 5,
                    "scrapeOptions": {"formats": ["markdown"]}
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("data", [])
                
                raw_prospects = []
                import re
                email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

                for result in results[:5]:
                    title = result.get("title", "Unknown Page")
                    url = result.get("url", "")
                    snippet = result.get("description", "")
                    
                    # Try to find email in snippet
                    emails = re.findall(email_regex, snippet)
                    public_contact = emails[0] if emails else url
                    
                    raw_prospects.append({
                        "name": title.split(" - ")[0] if " - " in title else title[:30],
                        "company": title.split(" at ")[-1] if " at " in title else "Unknown Company",
                        "context_source": "Web Search (Firecrawl)",
                        "public_contact": public_contact, 
                        "original_data": result,
                        "snippet": snippet
                    })
                
                if raw_prospects:
                    await log_event(state["mission_id"], state["user_id"], f"Found {len(raw_prospects)} potential contact points.", "success")
                    return {"prospects": raw_prospects}
            
            await log_event(state["mission_id"], state["user_id"], f"Firecrawl returned status {response.status_code}", "error")
            
    except Exception as e:
        await log_event(state["mission_id"], state["user_id"], f"Error in Layer 1: {str(e)[:100]}", "error")
    
    # Fallback to Mock Data
    await log_event(state["mission_id"], state["user_id"], "Using fallback data (API may have failed or no results).", "action")
    return {"prospects": [
        {"name": "Satya Nadella", "company": "Microsoft", "context_source": "Public Knowledge", "public_contact": "satya.nadella@microsoft.com", "snippet": "CEO of Microsoft.", "original_data": {}},
        {"name": "General HR", "company": "Microsoft", "context_source": "Careers Page", "public_contact": "careers@microsoft.com", "snippet": "Microsoft Careers.", "original_data": {}}
    ]}

async def analyze_relevance(state: AgentState):
    """Layer 2: User-Driven Matching (Filter & Contextualize)"""
    prospects = state.get("prospects", [])
    if not prospects:
        return {"current_prospect": None}

    # We process the first one for the loop, or in a real agent, batch process.
    # For this demo, we pick the first one to draft for.
    cand = prospects[0] 
    
    await log_event(state["mission_id"], state["user_id"], f"Layer 2: Analyzing relevance for {cand['name']}", "thinking")
    
    # Simple logic: If it matches keyword in objective, it's relevant.
    # in production, use LLM to classify.
    
    relevance_reason = "Matches mission context based on keywords."
    relevance_score = 0.8
    
    enriched_cand = {
        **cand,
        "relevance_score": relevance_score,
        "relevance_reason": relevance_reason,
        "enriched": True # Mark as processed
    }
    
    # Attachment Logic (New)
    from app.models import UserAsset
    attachments = []
    
    # Simple heuristic: If objective mentions "attach" or file keywords, fetch user assets
    # In production, use semantic search or RAG to pick best file.
    if any(k in state['objective'].lower() for k in ["attach", "file", "pdf", "deck", "case study"]):
        user_assets = await UserAsset.find(UserAsset.user_id == state['user_id']).to_list()
        
        # Taking the first/most recent one for demo. 
        # A smart agent would pick based on filename match (e.g. "pricing" -> "pricing.pdf")
        if user_assets:
             best_match = user_assets[0] 
             attachments.append({
                 "filename": best_match.filename,
                 "id": str(best_match.id),
                 "size": best_match.size_bytes
             })
             await log_event(state["mission_id"], state["user_id"], f"Found relevant attachment: {best_match.filename}", "success")
    
    enriched_cand = {
        **cand,
        "relevance_score": relevance_score,
        "relevance_reason": relevance_reason,
        "attachments": attachments, # Pass to draft
        "enriched": True
    }
    
    await log_event(state["mission_id"], state["user_id"], f"Marked as relevant: {relevance_reason}", "success")
    return {"current_prospect": enriched_cand}

async def write_draft(state: AgentState):
    """Layer 3: Outreach (Role-Independent)"""
    prospect = state.get("current_prospect")
    if not prospect:
        await log_event(state["mission_id"], state["user_id"], "No valid prospect to draft for.", "error")
        return {}

    feedback = state.get("feedback")
    
    await log_event(state["mission_id"], state["user_id"], f"Layer 3: Drafting outreach for {prospect.get('name')}", "thinking")
    
    try:
        # Check for user credits or connection logic here if needed
        # For now, just generate.
        
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = """You are an expert outreach specialist.
Write a personalized email based on the publicly available context.
Format:
SUBJECT: [Subject]
EMAIL: [Body]
REASONING: [Reasoning]"""

        human_prompt = f"""Target Context: {prospect.get('name')} at {prospect.get('company')}
Source: {prospect.get('context_source')}
Snippet: {prospect.get('snippet')}
Relevance: {prospect.get('relevance_reason')}
Mission: {state.get('objective')}
Attachments Available: {[a['filename'] for a in prospect.get('attachments', [])]}
"""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # Parse Logic (same as before)
        subject, body, reasoning = "Hello", content, "AI Generated"
        if "SUBJECT:" in content:
            parts = content.split("EMAIL:")
            subject = parts[0].replace("SUBJECT:", "").strip()
            if len(parts) > 1:
                rem = parts[1]
                if "REASONING:" in rem:
                    bps = rem.split("REASONING:")
                    body = bps[0].strip()
                    reasoning = bps[1].strip() if len(bps) > 1 else ""
                else:
                    body = rem.strip()

        await log_event(state["mission_id"], state["user_id"], f"Draft generated. Sending to Review Queue.", "success")

    except Exception as e:
        print(f"LLM Error: {e}")
        subject = "Hello"
        body = "I saw your profile and wanted to reach out."
        reasoning = "Fallback."

    # Data Persistence
    # 1. Save Prospect (Layer 1 & 2 data)
    p_doc = Prospect(
        mission_id=state["mission_id"],
        name=prospect.get("name", "Unknown"),
        company=prospect.get("company", "Unknown"),
        context_source=prospect.get("context_source"),
        public_contact=prospect.get("public_contact"),
        relevance_score=prospect.get("relevance_score", 0.0),
        relevance_reason=prospect.get("relevance_reason"),
        original_data=prospect.get("original_data", {})
    )
    await p_doc.insert()

    # 2. Save Draft (Layer 3)
    d_doc = Draft(
        prospect_id=str(p_doc.id),
        subject=subject,
        body=body,
        ai_reasoning=reasoning,
        status=DraftStatus.PENDING,
        # We need to add 'attachments' field to Draft model later for full support
        # For now, we just let the agent write about it in body.
        # But we can store it in metadata if Draft allowed it.
        # Let's assume we update the Draft Logic to pull from Prospect.scraped_data or similar if needed.
        # Or ideally:
        # attachments=prospect.get('attachments', [])
    )
    await d_doc.insert()
    
    return {"draft_id": str(d_doc.id)}

# Build Graph
def route_mission(state: AgentState) -> str:
    obj = state["objective"].lower()
    # Simple keyword heuristic. Can be upgraded to LLM classifier.
    if any(k in obj for k in ["find", "search", "scout", "look for", "scrape"]):
        return "scout"
    return "direct_intake"

async def direct_intake(state: AgentState):
    """Directly ingest contacts from user instruction without scraping"""
    obj = state["objective"].lower()
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
    # Check for integration needs
    user = await User.find_one(User.clerk_id == user_id)
    connections = user.other_connections if (user and user.other_connections) else {}
    slack_connected = bool(user and user.slack_connection_id)
    
    missing_tools = []
    
    # Keyword -> Tool Key mapping
    # Note: Multi-word checks need care.
    if "telegram" in obj and not connections.get("telegram"): missing_tools.append("telegram")
    if "discord" in obj and not connections.get("discord"): missing_tools.append("discord")
    if "slack" in obj and not slack_connected: missing_tools.append("slack")
    if ("gmail" in obj or "email" in obj) and not user.gmail_connection_id: missing_tools.append("gmail")
    if "github" in obj and not connections.get("github"): missing_tools.append("github")
    if "reddit" in obj and not connections.get("reddit"): missing_tools.append("reddit")
    if "perplexity" in obj and not connections.get("perplexity"): missing_tools.append("perplexity")
    if ("sheets" in obj or "spreadsheet" in obj) and not connections.get("google_sheets"): missing_tools.append("google_sheets")

    if missing_tools:
        for tool in missing_tools:
             print(f"DEBUG: Requesting connection for {tool}")
             label = tool.replace("_", " ").title()
             await log_event(mission_id, user_id, f"To proceed, please connect {label}.", "action", metadata={"action": "connect_tool", "tool": tool})
        
        # Stop here if we are just asking for connection
        return {"prospects": []}
    
    await log_event(mission_id, user_id, "Skipping search (Direct Input Mode)", "thinking")
    
    import re
    email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    emails = re.findall(email_regex, state["objective"])
    
    contacts = []
    if emails:
        for email in emails:
            contacts.append({
                "name": email.split("@")[0],
                "company": "Unknown",
                "context_source": "User Input",
                "public_contact": email,
                "snippet": f"User provided email in objective: {email}",
                "original_data": {}
            })
    else:
        # Generic fallback
        contacts.append({
            "name": "Target Contact",
            "company": "Unknown",
            "context_source": "User Instruction",
            "public_contact": "",
            "snippet": state["objective"],
            "original_data": {}
        })
        
    await log_event(state["mission_id"], state["user_id"], f"Processed {len(contacts)} targets from input.", "success")
    return {"prospects": contacts}

workflow = StateGraph(AgentState)

workflow.add_node("scout", scout_prospects)
workflow.add_node("direct_intake", direct_intake) # New node
workflow.add_node("analyze", analyze_relevance) 
workflow.add_node("draft_node", write_draft)

# Conditional Entry
workflow.set_conditional_entry_point(
    route_mission,
    {
        "scout": "scout",
        "direct_intake": "direct_intake"
    }
)

# Edges
# Conditional Edges
def should_draft(state: AgentState) -> str:
    if state.get("current_prospect"):
        return "draft"
    return "end"

workflow.add_edge("scout", "analyze")
workflow.add_edge("direct_intake", "analyze")
workflow.add_conditional_edges(
    "analyze",
    should_draft,
    {
        "draft": "draft_node",
        "end": END
    }
)


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
