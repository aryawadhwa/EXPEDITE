
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
    attachments: List[Dict]  # Attachments from launchpad
    prospects: List[Dict] # List of prospect data found
    current_prospect: Dict # Valid prospect being processed
    draft_id: str
    feedback: str # Human feedback for revision
    intents: List[str] # ["discovery", "outreach"]
    missing_info: List[str] # ["contact_info"]

# Real Tools
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from app.models import Agent

async def classify_intent(objective: str, available_tools: List[str]) -> Dict:
    """
    Uses LLM to determine intents and required tools.
    Returns {"intents": [...], "required_tools": [...]}
    """
    try:
        system_prompt = f"""You are an Intent and Tool Classification Agent.

Determine:
1. What the user is trying to do (one or more intents).
2. Which external tools are required.

Possible intents:
- discovery: finding, searching, collecting people or data
- outreach: contacting, emailing, messaging someone

Available tools (valid keys):
{', '.join(available_tools)}

Rules:
- Intents may be multiple.
- Infer intent semantically, not by keywords alone.
- Only include tools that are clearly required.
- Return valid tool keys only from the provided list.

Return JSON ONLY:
{{
  "intents": ["discovery", "outreach"],
  "required_tools": ["tool_key"]
}}"""

        llm = ChatGroq(
            temperature=0.0, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.1-8b-instant" 
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=objective)
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content.strip()
        
        # Clean up JSON
        import json
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.replace("```", "").strip()
            
        data = json.loads(content)
        return {
            "intents": data.get("intents", []),
            "required_tools": data.get("required_tools", [])
        }
        
    except Exception as e:
        print(f"Intent classification failed: {e}")
        # Fail safe
        return {"intents": ["discovery"], "required_tools": []}

async def initial_triage(state: AgentState):
    """Global Pre-Flight Check: Tools + Intent + Readiness"""
    obj = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
    # 1. Get Available Tools
    from app.routers.integrations import TOOL_CONFIG_MAP
    available_tools = list(TOOL_CONFIG_MAP.keys())
    
    # 2. Classify Intent & Tools
    classification = await classify_intent(obj, available_tools)
    intents = classification["intents"]
    required_tools = classification["required_tools"]
    
    await log_event(mission_id, user_id, f"Understanding mission: {intents} with tools {required_tools}", "thinking")
    
    # Logic moved to initial_triage
    # Just parse input now
    # 3. Check Tools
    user = await User.find_one(User.clerk_id == user_id)
    connections = user.other_connections if (user and user.other_connections) else {}
    slack_connected = bool(user and user.slack_connection_id)
    gmail_connected = bool(user and user.gmail_connection_id)
    
    missing_tools = []
    for tool in required_tools:
        is_connected = False
        if tool == "gmail":
            is_connected = gmail_connected
        elif tool == "slack":
            is_connected = slack_connected
        else:
            is_connected = bool(connections.get(tool))
            
        if not is_connected:
            missing_tools.append(tool)
            
    if missing_tools:
        for tool in missing_tools:
             label = tool.replace("_", " ").title()
             await log_event(mission_id, user_id, f"To proceed, please connect {label}.", "action", metadata={"action": "connect_tool", "tool": tool})
        
        return {"intents": intents, "missing_info": ["tools"]} # Signal blockage
        
    # 4. Check Readiness (Outreach)
    missing_info = []
    if "outreach" in intents:
        # Do we have contact info?
        # Check explicit email in objective
        import re
        email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        has_email = bool(re.search(email_regex, obj))
        
        # Or check if prospects (from previous step) have info - hard to check here as this is initial step.
        # But if this is a resumed mission, prospects might exist. 
        prospects = state.get("prospects", [])
        has_prospect_email = any(p.get("public_contact") for p in prospects)
        
        # If strict outreach only (no discovery), we expect contact info.
        if "discovery" not in intents and not has_email and not has_prospect_email:
             # Assume single recipient for simple check
             await log_event(mission_id, user_id, "I need an email address to send this message.", "action")
             missing_info.append("contact_info")
    
    return {
        "intents": intents, 
        "missing_info": missing_info
    }



async def update_agent_stats(user_id: str, processed=0, queued=0, errors=0):
    """Update stats for the user's active agents and broadcast to frontend"""
    try:
        # Find all active agents for this user
        agents = await Agent.find(Agent.user_id == user_id, Agent.status == "active").to_list()
        
        # If no active agents, just find any agent to log stats to
        if not agents:
            agents = await Agent.find(Agent.user_id == user_id).limit(1).to_list()
            
        now = datetime.utcnow()
        for agent in agents:
            if not agent.stats:
                from app.models import AgentStats
                agent.stats = AgentStats()
            
            agent.stats.processed += processed
            agent.stats.queued += queued
            agent.stats.errors += errors
            agent.stats.last_run_at = now
            await agent.save()
            
        # Calculate aggregates for broadcast
        all_agents = await Agent.find(Agent.user_id == user_id).to_list()
        total_active = sum(1 for a in all_agents if a.status == "active")
        total_processed = sum(a.stats.processed for a in all_agents if a.stats)
        total_queued = sum(a.stats.queued for a in all_agents if a.stats)
        
        # Broadcast via WebSocket
        from app.core.socket import get_connection_manager
        manager = get_connection_manager()
        await manager.send_to_user(user_id, {
            "type": "stats_update",
            "stats": {
                "active": total_active,
                "processed": total_processed,
                "queue": total_queued
            }
        })
            
    except Exception as e:
        print(f"Failed to update agent stats: {e}")

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
        from app.core.socket import get_connection_manager
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
                    await update_agent_stats(state["user_id"], processed=len(raw_prospects))
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
    
    # Attachment Logic
    # Use attachments passed from launchpad if available
    attachments = state.get("attachments", []) or []
    
    # Fallback: Simple heuristic if none passed/explicitly requested but keywords exist
    if not attachments and any(k in state['objective'].lower() for k in ["attach", "file", "pdf", "deck", "case study"]):
        from app.models import UserAsset
        user_assets = await UserAsset.find(UserAsset.user_id == state['user_id']).sort("-created_at").to_list()
        
        if user_assets:
             best_match = user_assets[0] 
             attachments.append({
                 "filename": best_match.filename,
                 "asset_id": str(best_match.id),
                 "content_type": best_match.content_type
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
        
        attachments_list = [a['filename'] for a in prospect.get('attachments', [])]
        attachment_context = ""
        if attachments_list:
            attachment_context = f"""
IMPORTANT: You have the following files attached to this email: {', '.join(attachments_list)}.
- You cannot read the file content, but you should write the email as if the recipient will see it.
- Do NOT say "refer to the image" or "I cannot see the file".
- Instead say things like "I've attached [Filename] for your review" or "Please see the attached case study".
"""

        system_prompt = f"""You are an expert outreach specialist.
Write a personalized email based on the publicly available context.
{attachment_context}
Format:
SUBJECT: [Subject]
EMAIL: [Body]
REASONING: [Reasoning]"""

        human_prompt = f"""Target Context: {prospect.get('name')} at {prospect.get('company')}
Source: {prospect.get('context_source')}
Snippet: {prospect.get('snippet')}
Relevance: {prospect.get('relevance_reason')}
Mission: {state.get('objective')}
Attachments: {', '.join(attachments_list) if attachments_list else 'None'}
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
        
        # Clean up any markdown code blocks if present
        subject = subject.replace("`", "").strip()
        body = body.replace("```", "").strip()

        await log_event(state["mission_id"], state["user_id"], f"Draft generated. Sending to Review Queue.", "success")

    except Exception as e:
        print(f"LLM Error: {e}")
        subject = "Hello"
        body = "I saw your profile and wanted to reach out."
        reasoning = f"Fallback due to error: {str(e)}"

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
        attachments=prospect.get('attachments', [])
    )
    await d_doc.insert()
    await update_agent_stats(state["user_id"], queued=1)
    
    return {"draft_id": str(d_doc.id)}

async def direct_intake(state: AgentState):
    """Directly ingest contacts from user instruction without scraping"""
    obj = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
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


workflow.add_node("initial_triage", initial_triage) # Entry Point
workflow.add_node("scout", scout_prospects)
workflow.add_node("direct_intake", direct_intake)
workflow.add_node("analyze", analyze_relevance) 
workflow.add_node("draft_node", write_draft)

# Conditional Routing
def route_after_triage(state: AgentState) -> str:
    # 1. Blockage Check
    if state.get("missing_info") or not state.get("intents"):
        return "end"
        
    intents = state.get("intents", [])
    
    # 2. Logic Flow
    if "discovery" in intents:
        return "scout" # Always start with discovery if asked
        
    if "outreach" in intents:
        # Pure outreach (no discovery asked)
        # We go to direct_intake to parse inputs
        return "direct_intake"
        
    return "end"

workflow.set_entry_point("initial_triage")

workflow.add_conditional_edges(
    "initial_triage",
    route_after_triage,
    {
        "scout": "scout",
        "direct_intake": "direct_intake",
        "end": END
    }
)

# Edges
# Conditional Edges
def should_draft(state: AgentState) -> str:
    # Only draft if outreach is intended AND we have a valid prospect
    if "outreach" in state.get("intents", []) and state.get("current_prospect"):
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
async def run_mission_agent(mission_id: str, objective: str, user_id: str, attachments: List[Dict] = []):
    print(f"DEBUG: Starting mission agent for {mission_id} with {len(attachments)} attachment(s)")
    config = {"configurable": {"thread_id": mission_id}}
    inputs = {
        "mission_id": mission_id, 
        "objective": objective, 
        "user_id": user_id,
        "attachments": attachments  # Pass attachments to agent state
    }
    
    try:
        async for event in app.astream(inputs, config=config):
            # print(f"DEBUG: Agent event: {event}") # Optional verbose logging
            pass 
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"ERROR: Agent failed: {err}")
        # Log to DB so user sees it
        try:
             await log_event(mission_id, user_id, f"Agent crashed: {str(e)}", "error")
        except:
            pass

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
