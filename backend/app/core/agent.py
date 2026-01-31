"""
LangGraph Agentic Automation Engine
HARD CONTRACT - Fixed Graph Shape

WORKFLOW:
ENTRY → initial_triage → resolve_person → resolve_channel_identity → route_by_intent
    ├─ discovery_flow
    ├─ outreach_flow
    └─ publish_flow
→ review_queue (ONLY if draft_required == true) → execute_action → post_action_update → END
"""

import asyncio
import json
import re
import httpx
from typing import TypedDict, Annotated, List, Dict, Optional, Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from datetime import datetime

from app.models import Draft, Prospect, Mission, DraftStatus, MissionLog, User, Agent, AgentStats
from app.core.config import settings
from app.services.neo4j import neo4j_service
from app.services.web_scraper import enhanced_scraper, EmailScraper, JobBoardScraper
from app.services.smtp_verifier import EmailVerifier, ValidationLevel

# ==================================================
# AGENT STATE (Fixed Shape)
# ==================================================

class AgentState(TypedDict):
    # Core identifiers
    mission_id: str
    user_id: str
    objective: str
    
    # Triage output (LLM decides)
    intents: List[str]  # ["discovery", "outreach", "publish", "read", "query"]
    channels: List[str]  # ["/linkedin", "/reddit", "/slack", "/gmail", "/twitter", "/github"]
    required_tools: List[str]  # ["composio_linkedin", "gmail"]
    draft_required: bool  # TRUE only for write/send/post/create actions
    
    # Resolution state
    person_name: Optional[str]
    person_id: Optional[str]  # Neo4j person ID
    channel_identities: Dict[str, str]  # {"/linkedin": "member_id", "/slack": "user_id"}
    
    # Flow state
    missing_info: List[str]  # What's blocking progress
    pause_reason: Optional[str]  # Why graph is paused
    
    # Data
    attachments: List[Dict]
    prospects: List[Dict]
    current_prospect: Dict
    
    # Draft state
    draft_id: Optional[str]
    draft_content: Dict  # {channel, subject, body, metadata}
    feedback: Optional[str]  # Human feedback for revision
    
    # Execution state
    execution_result: Dict  # Result from execute_action
    action_status: str  # "pending", "sent", "failed"
    
    # Robocop Mode
    autonomous: bool
    max_actions: int


# ==================================================
# UTILITY FUNCTIONS
# ==================================================

def extract_person_name(objective: str) -> Optional[str]:
    """Extract person name from objective using heuristics"""
    patterns = [
        r"(?:message|email|contact|send to|reach out to|dm|ping) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)",
        r"([A-Z][a-z]+(?: [A-Z][a-z]+)?)'s (?:LinkedIn|email|Twitter|Slack)",
        r"(?:did|has|when did) ([A-Z][a-z]+(?: [A-Z][a-z]+)?) (?:reply|respond|message)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, objective, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def extract_channel_from_objective(objective: str) -> List[str]:
    """Detect channel mentions in objective"""
    channels = []
    channel_keywords = {
        "/linkedin": ["linkedin", "li message", "linkedin message"],
        "/twitter": ["twitter", "tweet", "x.com"],
        "/reddit": ["reddit", "subreddit", "r/"],
        "/slack": ["slack", "slack message", "dm on slack"],
        "/github": ["github", "gh issue", "pull request", "pr"],
        "/gmail": ["email", "gmail", "send email", "mail"],
    }
    
    obj_lower = objective.lower()
    for channel, keywords in channel_keywords.items():
        if any(kw in obj_lower for kw in keywords):
            channels.append(channel)
    
    return channels if channels else ["/gmail"]  # Default to email


def extract_identifiers_from_objective(objective: str) -> Dict[str, str]:
    """Extract platform identifiers from objective text"""
    identifiers = {}
    
    # LinkedIn URL
    linkedin_match = re.search(r"(https?://(?:www\.)?linkedin\.com/in/[^\s]+)", objective)
    if linkedin_match:
        identifiers["linkedin"] = linkedin_match.group(1)
    
    # Twitter handle
    twitter_match = re.search(r"@([a-zA-Z0-9_]+)", objective)
    if twitter_match:
        identifiers["twitter"] = twitter_match.group(1)
    
    # Email - specific capture
    # Handles standard patterns and mailto: links
    email_pattern = r"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"
    email_match = re.search(email_pattern, objective, re.IGNORECASE)
    if email_match:
        identifiers["gmail"] = email_match.group(1).lower()
    
    # GitHub username (from URL or mention)
    github_match = re.search(r"github\.com/([a-zA-Z0-9_-]+)", objective)
    if github_match:
        identifiers["github"] = github_match.group(1)
    
    # Reddit username
    reddit_match = re.search(r"u/([a-zA-Z0-9_-]+)", objective)
    if reddit_match:
        identifiers["reddit"] = reddit_match.group(1)
    
    return identifiers

# ==================================================
# UTILITY FUNCTIONS (continued)
# ==================================================

async def log_event(
    mission_id: str, 
    user_id: str, 
    content: str, 
    log_type: str = "action", 
    role: str = "agent", 
    metadata: Dict = {},
    target: str = "chat"  # "chat" = shows in mission chat, "brain" = shows only in LiveBrain
):
    """Log an event to DB and broadcast via WebSocket
    
    Args:
        target: "chat" shows in both chat and LiveBrain, "brain" shows only in LiveBrain sidebar
    """
    # Only save to DB if it's a chat message (user-facing)
    if target == "chat":
        log = MissionLog(
            mission_id=mission_id,
            role=role,
            content=content,
            log_type=log_type,
            metadata=metadata
        )
        await log.insert()
    
    try:
        from app.core.socket import get_connection_manager
        manager = get_connection_manager()
        await manager.send_to_user(user_id, {
            "type": log_type,
            "message": content,
            "agent": "OutboundAI",
            "mission_id": mission_id,
            "metadata": metadata,
            "target": target  # Frontend uses this to route to appropriate UI
        })
    except Exception as e:
        print(f"[WS] Failed to broadcast: {e}")


async def update_agent_stats(user_id: str, processed=0, queued=0, errors=0):
    """Update stats for the user's active agents and broadcast to frontend"""
    try:
        agents = await Agent.find(Agent.user_id == user_id, Agent.status == "active").to_list()
        if not agents:
            agents = await Agent.find(Agent.user_id == user_id).limit(1).to_list()
            
        now = datetime.utcnow()
        for agent in agents:
            if not agent.stats:
                agent.stats = AgentStats()
            
            agent.stats.processed += processed
            agent.stats.queued += queued
            agent.stats.errors += errors
            agent.stats.last_run_at = now
            await agent.save()
            
        all_agents = await Agent.find(Agent.user_id == user_id).to_list()
        total_active = sum(1 for a in all_agents if a.status == "active")
        total_processed = sum(a.stats.processed for a in all_agents if a.stats)
        total_queued = sum(a.stats.queued for a in all_agents if a.stats)
        
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


# ==================================================
# NODE 1: INITIAL_TRIAGE (LLM)
# ==================================================

async def initial_triage(state: AgentState) -> Dict:
    """
    PURPOSE:
    - Understand intent semantically
    - Classify action type
    - Infer platforms & tools
    - Decide if draft is required
    
    NO keyword matching
    NO API calls
    NO database calls
    
    Output JSON ONLY
    """
    objective = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
    # Load Mission Config (Robocop Check)
    try:
        mission = await Mission.get(mission_id)
        autonomous = mission.autonomous if mission else False
    except:
        autonomous = False
    
    await log_event(mission_id, user_id, "Analyzing your request...", "thinking")
    
    try:
        system_prompt = """You are an Intent Classification Agent for an outbound automation system.

CRITICAL WORKFLOW RULES:
1. Prospects are discovered and structured as JSON (name + email only)
2. Draft emails are generated and placed in review queue
3. NO emails are sent without explicit user approval
4. NEVER say "email sent" or confirm sending

Analyze the user's request and determine:
1. What they are trying to do (intents)
2. Which channels/platforms are involved
3. What tools are required
4. Whether content needs to be drafted (for human approval)

INTENT CATEGORIES:
- "discovery": Finding, searching, collecting people or data
- "outreach": Contacting, messaging, emailing someone directly (CREATES DRAFTS, DOES NOT SEND)
- "publish": Posting content publicly (tweets, LinkedIn posts, Reddit posts)
- "read": Reading/fetching existing data (get my emails, show messages)
- "query": Asking questions about data (did X reply?, what's the status?)

CHANNEL MAPPING:
- LinkedIn messages/posts → /linkedin
- Twitter/X tweets/replies → /twitter
- Reddit posts/comments → /reddit
- Slack messages → /slack
- GitHub issues/PRs → /github
- Email → /gmail

CRITICAL RULES FOR draft_required:
- draft_required = TRUE for: send, post, create, write, publish, message, email, tweet, comment, reach out, contact
- draft_required = FALSE for: read, get, fetch, show, list, check, query, search, find
- When draft_required = TRUE, emails are DRAFTED but NOT SENT

IMPORTANT: "outreach" intent means CREATE DRAFTS, not send emails. User must approve in review queue.

Return ONLY valid JSON:
{
  "intents": ["discovery", "outreach"],
  "channels": ["/linkedin", "/gmail"],
  "required_tools": ["linkedin", "gmail"],
  "draft_required": true,
  "person_mentioned": "Name or null"
}"""

        llm = ChatGroq(
            temperature=0.0, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.1-8b-instant"
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"User request: {objective}")
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content.strip()
        
        # Clean JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.replace("```", "").strip()
            
        data = json.loads(content)
        
        intents = data.get("intents", ["discovery"])
        channels = data.get("channels", extract_channel_from_objective(objective))
        required_tools = data.get("required_tools", [])
        draft_required = data.get("draft_required", False)
        person_name = data.get("person_mentioned") or extract_person_name(objective)
        
        # Technical info goes to LiveBrain only, not chat
        await log_event(
            mission_id, user_id, 
            f"Intent: {intents} | Channels: {channels} | Draft needed: {draft_required}", 
            "thinking",
            target="brain"
        )
        
        return {
            "intents": intents,
            "channels": channels,
            "required_tools": required_tools,
            "draft_required": draft_required,
            "person_name": person_name,
            "autonomous": autonomous,
            "missing_info": []
        }
        
    except Exception as e:
        print(f"Intent classification failed: {e}")
        # Fail safe - infer from objective
        channels = extract_channel_from_objective(objective)
        person_name = extract_person_name(objective)
        
        # Simple heuristic for draft_required
        write_keywords = ["send", "post", "create", "write", "message", "email", "tweet", "dm"]
        draft_required = any(kw in objective.lower() for kw in write_keywords)
        
        return {
            "intents": ["outreach"] if draft_required else ["read"],
            "channels": channels,
            "required_tools": [c.replace("/", "") for c in channels],
            "draft_required": draft_required,
            "person_name": person_name,
            "autonomous": autonomous,
            "missing_info": []
        }


# ==================================================
# NODE 2: RESOLVE_PERSON (Deterministic)
# ==================================================

async def resolve_person(state: AgentState) -> Dict:
    """
    PURPOSE:
    - Query Neo4j for person
    - Create person if missing
    - Handle ambiguity once, then cache
    
    NEVER call LLM
    """
    person_name = state.get("person_name")
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
    if not person_name:
        # No person mentioned, skip
        return {"person_id": None}
    
    await log_event(mission_id, user_id, f"Looking up {person_name} in contact graph...", "thinking")
    
    try:
        # Query Neo4j - deterministic, no LLM
        person = neo4j_service.resolve_person(person_name)
        
        if person:
            person_id = person.get("name", person_name)  # Use name as ID for now
            await log_event(mission_id, user_id, f"Found {person_name} in contact graph", "success")
            return {"person_id": person_id}
        else:
            # Person created by resolve_person (MERGE)
            await log_event(mission_id, user_id, f"Added {person_name} to contact graph", "success")
            return {"person_id": person_name}
            
    except Exception as e:
        print(f"Neo4j person resolution failed: {e}")
        return {"person_id": None}


# ==================================================
# NODE 3: RESOLVE_CHANNEL_IDENTITY
# ==================================================

async def resolve_channel_identity(state: AgentState) -> Dict:
    """
    PURPOSE:
    - Resolve platform-specific identifiers
    
    Examples:
    - /linkedin → member_id
    - /twitter → handle
    - /slack → user_id
    
    If identifier missing → Pause and ask user ONCE
    """
    channels = state.get("channels", [])
    person_name = state.get("person_name")
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    objective = state["objective"]
    
    channel_identities = {}
    missing_identities = []
    
    # Get existing contact methods from Neo4j if person is known
    existing_contacts = {}
    if person_name:
        existing_contacts = neo4j_service.get_contact_methods(person_name)
    
    # Also extract identifiers from objective
    extracted = extract_identifiers_from_objective(objective)
    
    for channel in channels:
        channel_key = channel.replace("/", "")
        
        # Check Neo4j first
        if channel_key in existing_contacts:
            channel_identities[channel] = existing_contacts[channel_key]
            continue
            
        # Check extracted from objective
        if channel_key in extracted:
            identifier = extracted[channel_key]
            channel_identities[channel] = identifier
            
            # Store in Neo4j for future
            if person_name:
                neo4j_service.add_contact_method(person_name, channel_key, identifier)
                await log_event(mission_id, user_id, f"Saved {channel_key} for {person_name}", "success")
            continue
        
        # Check intents to determine if we need a person identifier
        intents = state.get("intents", [])
        
        # For READ/QUERY operations, we may not need person identifier
        if "read" in intents or "query" in intents:
            # For read operations on user's own accounts, no target identifier needed
            continue
        
        # For PUBLISH (public posts), we don't need a person identifier
        # Public posts go to platforms (subreddit, timeline), not to specific people
        if "publish" in intents:
            # For Reddit, we might have a subreddit in the objective
            if channel_key == "reddit":
                # Extract subreddit from objective (e.g., "r/SaaS" or "in r/startups")
                import re
                subreddit_match = re.search(r'r/(\w+)', objective.lower())
                if subreddit_match:
                    channel_identities[channel] = f"r/{subreddit_match.group(1)}"
            # Twitter, LinkedIn posts don't need a target - they go to user's own feed
            continue
            
        # Missing identifier for OUTREACH (DM/direct message) operation
        if state.get("draft_required"):
            missing_identities.append(channel)
    
    # If missing identifiers for write operations, pause and ask
    if missing_identities:
        missing_str = ", ".join(missing_identities)
        target = person_name or "this contact"
        
        await log_event(
            mission_id, user_id,
            f"I need {target}'s identifier for {missing_str}. Please provide the profile URL or username.",
            "action",
            metadata={"action": "request_identifier", "channels": missing_identities, "person": person_name}
        )
        
        return {
            "channel_identities": channel_identities,
            "missing_info": [f"{ch}_identifier" for ch in missing_identities],
            "pause_reason": f"Need identifier for {missing_str}"
        }
    
    return {
        "channel_identities": channel_identities,
        "missing_info": []
    }


# ==================================================
# NODE 4: ROUTE_BY_INTENT (Conditional Router)
# ==================================================

def route_by_intent(state: AgentState) -> str:
    """
    Route to appropriate flow based on intent.
    This is a routing function, not a node.
    """
    # Check for blockers
    if state.get("missing_info"):
        return "end"  # Paused, waiting for user input
    
    intents = state.get("intents", [])
    
    if "discovery" in intents:
        return "discovery_flow"
    elif "outreach" in intents:
        return "outreach_flow"
    elif "publish" in intents:
        return "publish_flow"
    elif "read" in intents or "query" in intents:
        return "execute_action"  # Skip draft for read operations
    else:
        return "end"


# ==================================================
# NODE 5a: DISCOVERY_FLOW
# ==================================================

async def discovery_flow(state: AgentState) -> Dict:
    """
    Discovery: Finding, searching, collecting people or data
    Uses:
    - Job board scraping (Hiring.cafe, Glassdoor, Monster, Indeed)
    - Email scraping from websites
    - Company research
    - Firecrawl web search (fallback)
    """
    objective = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    
    await log_event(mission_id, user_id, "Searching for relevant contacts...", "thinking")
    
    prospects = []
    
    # Check if this is a job title search
    job_keywords = ["vp of", "director of", "head of", "ceo", "cto", "cfo", "manager", "engineer", "developer"]
    is_job_search = any(keyword in objective.lower() for keyword in job_keywords)
    
    # Check if this is an email scraping request
    email_keywords = ["email", "contact", "scrape", "find emails"]
    url_pattern = r'https?://[^\s]+'
    is_email_scrape = any(keyword in objective.lower() for keyword in email_keywords) and re.search(url_pattern, objective)
    
    # Check if this is company research
    company_keywords = ["research", "company", "about", "information on"]
    is_company_research = any(keyword in objective.lower() for keyword in company_keywords)
    
    try:
        # 1. Job Board Scraping
        if is_job_search:
            await log_event(mission_id, user_id, "Searching job boards to find companies that are hiring...", "thinking")
            
            # Extract job title from objective
            job_title = objective
            for keyword in ["find", "search for", "get", "scrape"]:
                job_title = job_title.replace(keyword, "").strip()
            
            # Extract location if mentioned
            location = "United States"
            location_match = re.search(r"in ([A-Z][a-z]+(?: [A-Z][a-z]+)*)", objective)
            if location_match:
                location = location_match.group(1)
            
            try:
                job_prospects = await enhanced_scraper.find_prospects_by_job_title(
                    job_title=job_title,
                    location=location,
                    max_results=20
                )
                
                if not job_prospects:
                    await log_event(
                        mission_id, user_id, 
                        f"❌ No companies currently hiring for '{job_title}' in {location}\n\nSearched:\n• Hiring.cafe\n• Glassdoor\n• Monster.com\n• Indeed.com\n\nSuggestions:\n• Try broader job titles (e.g., 'Engineer' instead of 'Senior Backend Engineer')\n• Expand location to nearby cities\n• Check related job titles", 
                        "info"
                    )
                    return {"prospects": [], "current_prospect": {}}
                
                # Group by source for better reporting
                sources_found = {}
                for jp in job_prospects[:10]:
                    source = jp.get('source', 'Unknown')
                    sources_found[source] = sources_found.get(source, 0) + 1
                    
                    prospects.append({
                        "name": jp.get("title", "Unknown"),
                        "company": jp.get("company", "Unknown"),
                        "context_source": f"Job Board ({source})",
                        "public_contact": jp.get("apply_url", ""),
                        "snippet": jp.get("description", "")[:200],
                        "relevance_score": jp.get("relevance_score", 0.8),
                        "original_data": jp
                    })
                
                if prospects:
                    sources_str = ", ".join([f"{count} from {source}" for source, count in sources_found.items()])
                    
                    # Create detailed company list
                    company_list = []
                    for i, p in enumerate(prospects[:5], 1):  # Show first 5 in detail
                        company_list.append(f"{i}. {p['company']} - {p['name']}")
                    
                    companies_text = "\n".join(company_list)
                    if len(prospects) > 5:
                        companies_text += f"\n... and {len(prospects) - 5} more companies"
                    
                    await log_event(
                        mission_id, user_id, 
                        f"✓ Found {len(prospects)} companies actively hiring for '{job_title}' in {location}\n\nCompanies:\n{companies_text}\n\nSources: {sources_str}\n\n📋 All prospects saved! To reach out:\n1. Go to Review Queue to see all prospects\n2. Or ask me to 'draft emails to these companies'\n3. Or say 'send personalized emails to all prospects'", 
                        "success"
                    )
                    await update_agent_stats(user_id, processed=len(prospects))
            except Exception as e:
                print(f"Job scraping error: {e}")
                await log_event(mission_id, user_id, f"❌ Job board search failed: {str(e)[:100]}", "error")
        
        # 2. Email Scraping
        elif is_email_scrape:
            await log_event(mission_id, user_id, "Scraping website emails...", "thinking", target="brain")
            
            # Extract URL from objective
            url_match = re.search(url_pattern, objective)
            if url_match:
                url = url_match.group(0)
                
                try:
                    scraper = EmailScraper(max_depth=2, max_pages=20)
                    emails = await scraper.scrape(url)
                    
                    if not emails:
                        await log_event(
                            mission_id, user_id, 
                            f"❌ No email addresses found on {url}\n\nSearched:\n• All pages up to 2 levels deep\n• Up to 20 pages total\n• Contact pages, about pages, footer\n\nThe website may:\n• Use contact forms instead of emails\n• Hide emails behind JavaScript\n• Not list public contact information", 
                            "info"
                        )
                        return {"prospects": [], "current_prospect": {}}
                    
                    # Verify emails
                    verifier = EmailVerifier()
                    valid_emails = []
                    invalid_count = 0
                    
                    for email in emails[:10]:  # Limit to 10
                        result = verifier.verify(email, ValidationLevel.MX)
                        if result.valid:
                            valid_emails.append(email)
                            prospects.append({
                                "name": email.split('@')[0].replace('.', ' ').title(),
                                "company": email.split('@')[1] if '@' in email else "Unknown",
                                "context_source": f"Email Scraping ({url})",
                                "public_contact": email,
                                "snippet": f"Verified email from {url}",
                                "relevance_score": 0.9,
                                "original_data": {"email": email, "mx_records": result.mx_records}
                            })
                        else:
                            invalid_count += 1
                    
                    if valid_emails:
                        # Create detailed email list
                        email_list = []
                        for i, email in enumerate(valid_emails[:10], 1):
                            email_list.append(f"{i}. {email}")
                        
                        emails_text = "\n".join(email_list)
                        
                        await log_event(
                            mission_id, user_id, 
                            f"✓ Found and verified {len(valid_emails)} email addresses from {url}\n\nVerified Emails:\n{emails_text}\n\n{invalid_count} invalid emails were filtered out\n\n📋 All emails saved as prospects! To reach out:\n1. Go to Review Queue to see all contacts\n2. Or ask me to 'draft emails to these contacts'\n3. Or say 'send personalized emails to all'", 
                            "success"
                        )
                    else:
                        await log_event(
                            mission_id, user_id, 
                            f"❌ Found {len(emails)} email addresses on {url} but none were valid\n\nReasons:\n• Invalid domain (doesn't exist)\n• Disposable email services (tempmail, etc.)\n• Fake/placeholder emails\n\nAll emails were verified using DNS/MX record validation.", 
                            "info"
                        )
                        return {"prospects": [], "current_prospect": {}}
                        
                except Exception as e:
                    print(f"Email scraping error: {e}")
                    await log_event(mission_id, user_id, f"❌ Email scraping failed: {str(e)[:50]}", "error")
        
        # 3. Company Research
        elif is_company_research:
            await log_event(mission_id, user_id, "Researching company...", "thinking", target="brain")
            
            # Extract company name
            company_name = objective
            for keyword in ["research", "find", "about", "information on", "company"]:
                company_name = company_name.replace(keyword, "").strip()
            
            try:
                company_data = await enhanced_scraper.research_company(company_name)
                
                # Add company contacts as prospects
                for email in company_data.get("emails", [])[:5]:
                    prospects.append({
                        "name": email.split('@')[0].replace('.', ' ').title(),
                        "company": company_data.get("company_name", company_name),
                        "context_source": "Company Research",
                        "public_contact": email,
                        "snippet": f"Contact at {company_data.get('company_name', company_name)}",
                        "relevance_score": 0.85,
                        "original_data": company_data
                    })
                
                if prospects:
                    # Create detailed contact list
                    contact_list = []
                    for i, p in enumerate(prospects, 1):
                        contact_list.append(f"{i}. {p['public_contact']} ({p['name']})")
                    
                    contacts_text = "\n".join(contact_list)
                    website = company_data.get("website", "Not found")
                    
                    await log_event(
                        mission_id, user_id, 
                        f"✓ Found {len(prospects)} contacts at {company_name}\n\nWebsite: {website}\n\nContacts:\n{contacts_text}\n\n📋 All contacts saved as prospects! To reach out:\n1. Go to Review Queue to see all contacts\n2. Or ask me to 'draft emails to these contacts'\n3. Or say 'send personalized emails to {company_name}'", 
                        "success"
                    )
                else:
                    await log_event(
                        mission_id, user_id, 
                        f"❌ No public contact emails found for {company_name}\n\nTry:\n• Visit their website directly\n• Check their LinkedIn company page\n• Look for a careers or contact page", 
                        "info"
                    )
                    
            except Exception as e:
                print(f"Company research error: {e}")
                await log_event(mission_id, user_id, f"Research failed", "error", target="brain")
        
        # 4. Fallback: Firecrawl Web Search
        if not prospects:
            await log_event(mission_id, user_id, "Web search...", "thinking", target="brain")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.firecrawl.dev/v1/search",
                    headers={
                        "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "query": f"{objective} contact email site:linkedin.com/in/ OR site:twitter.com",
                        "limit": 5,
                        "scrapeOptions": {"formats": ["markdown"]}
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("data", [])
                    
                    email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    
                    for result in results[:5]:
                        title = result.get("title", "Unknown")
                        url = result.get("url", "")
                        snippet = result.get("description", "")
                        
                        emails = re.findall(email_regex, snippet)
                        
                        prospects.append({
                            "name": title.split(" - ")[0] if " - " in title else title[:30],
                            "company": title.split(" at ")[-1] if " at " in title else "Unknown",
                            "context_source": "Web Search",
                            "public_contact": emails[0] if emails else url,
                            "snippet": snippet,
                            "original_data": result
                        })
        
        if prospects:
            # Save prospects to database and collect IDs for bulk operations
            prospect_ids = []
            prospects_json = []  # For JSON output
            
            for prospect_data in prospects:
                try:
                    p_doc = Prospect(
                        mission_id=mission_id,
                        name=prospect_data.get("name", "Unknown"),
                        company=prospect_data.get("company", "Unknown"),
                        context_source=prospect_data.get("context_source", "Discovery"),
                        public_contact=prospect_data.get("public_contact", ""),
                        relevance_score=prospect_data.get("relevance_score", 0.8),
                        relevance_reason=prospect_data.get("snippet", "")[:200],
                        original_data=prospect_data.get("original_data", {})
                    )
                    await p_doc.insert()
                    prospect_ids.append(str(p_doc.id))
                    
                    # Add to JSON output
                    prospects_json.append({
                        "id": str(p_doc.id),
                        "name": prospect_data.get("name", "Unknown"),
                        "company": prospect_data.get("company", "Unknown"),
                        "email": prospect_data.get("public_contact", ""),
                        "title": prospect_data.get("name", "Unknown"),
                        "context": prospect_data.get("snippet", "")[:200]
                    })
                except Exception as e:
                    print(f"Failed to save prospect: {e}")
            
            # ============================================================
            # MANDATORY JSON OUTPUT - SOURCE OF TRUTH
            # ============================================================
            import json
            
            # Create clean JSON with only name and email (as per spec)
            clean_prospects_json = []
            for p in prospects_json:
                if p.get("email"):  # Only include if email exists
                    clean_prospects_json.append({
                        "name": p.get("name", "Unknown"),
                        "email": p.get("email")
                    })
            
            json_output = {"prospects": clean_prospects_json}
            prospects_json_str = json.dumps(json_output, indent=2)
            
            print("\n" + "="*80)
            print("PROSPECTS JSON (SOURCE OF TRUTH):")
            print("="*80)
            print(prospects_json_str)
            print("="*80 + "\n")
            
            # If outreach is also intended, automatically create drafts for ALL prospects
            if "outreach" in state.get("intents", []):
                await log_event(
                    mission_id, user_id,
                    f"📝 Generating draft emails for {len(clean_prospects_json)} prospects...",
                    "thinking"
                )
                
                # Create drafts for all prospects in bulk
                drafts_created = 0
                for prospect_data in clean_prospects_json:
                    try:
                        # Generate draft for this prospect using LLM
                        draft_result = await generate_draft_for_prospect(
                            mission_id=mission_id,
                            user_id=user_id,
                            objective=objective,
                            prospect_data=prospect_data,
                            channel="/gmail"
                        )
                        
                        if draft_result:
                            drafts_created += 1
                            
                    except Exception as e:
                        print(f"Failed to create draft for {prospect_data['name']}: {e}")
                
                await log_event(
                    mission_id, user_id,
                    f"✓ Generated {drafts_created} draft emails (NOT SENT)\n\n📋 All drafts are in Review Queue waiting for your approval\n\n⚠️ IMPORTANT: Emails will NOT be sent until you:\n1. Go to Review Queue\n2. Review each draft\n3. Click 'Approve' to send\n\nNo emails have been sent yet.",
                    "success"
                )
                
                await update_agent_stats(user_id, queued=drafts_created)
                
                # Set current prospect to first one
                current = prospects[0] if prospects else {}
            else:
                # Just discovery, no outreach
                current = {}
            
            return {
                "prospects": prospects,
                "current_prospect": current
            }
        else:
            # Provide helpful feedback based on what was searched
            if is_job_search:
                await log_event(
                    mission_id, user_id, 
                    f"❌ No results found.\n\nSuggestions:\n• Try broader job titles (e.g., 'Software Engineer' instead of 'Senior React Developer')\n• Search in multiple locations\n• Check if the job title is commonly used", 
                    "info"
                )
            elif is_email_scrape:
                await log_event(
                    mission_id, user_id, 
                    "❌ No valid email addresses found.\n\nThis could mean:\n• The website doesn't list public emails\n• Emails are behind contact forms\n• Try the company's LinkedIn or 'About' page", 
                    "info"
                )
            elif is_company_research:
                await log_event(
                    mission_id, user_id, 
                    "❌ No contacts found for this company.\n\nTry:\n• Check the company website directly\n• Search for the company on LinkedIn\n• Look for their careers page", 
                    "info"
                )
            else:
                await log_event(
                    mission_id, user_id, 
                    "❌ No prospects found.\n\nTips:\n• Be more specific about what you're looking for\n• Try different keywords\n• Provide a company name or website URL", 
                    "info"
                )
            
    except Exception as e:
        print(f"Discovery error: {e}")
        await log_event(mission_id, user_id, f"❌ Search failed: {str(e)[:100]}", "error")
    
    return {"prospects": [], "current_prospect": {}}


# ==================================================
# NODE 5b: OUTREACH_FLOW
# ==================================================

async def outreach_flow(state: AgentState) -> Dict:
    """
    Outreach: Prepare content for direct messaging/emailing
    Generates draft if draft_required == True
    """
    objective = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    channels = state.get("channels", ["/gmail"])
    person_name = state.get("person_name", "Contact")
    channel_identities = state.get("channel_identities", {})
    
    # If we have prospects from discovery, use first one
    prospect = state.get("current_prospect") or {}
    if not prospect and state.get("prospects"):
        prospect = state["prospects"][0]
    
    # Build target info
    target_email = channel_identities.get("/gmail", prospect.get("public_contact", ""))
    target_linkedin = channel_identities.get("/linkedin", "")
    
    if not state.get("draft_required"):
        # This is a read operation disguised as outreach (e.g., "check if X replied")
        return {
            "draft_content": {},
            "draft_required": False
        }
    
    await log_event(mission_id, user_id, f"Drafting message for {person_name}...", "thinking")
    
    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        # Determine primary channel and constraints
        primary_channel = channels[0] if channels else "/gmail"
        
        channel_constraints = {
            "/linkedin": "Max 300 chars for connection request, 8000 for message",
            "/twitter": "Max 280 characters",
            "/slack": "Supports markdown formatting",
            "/gmail": "Professional email format with subject line",
            "/reddit": "Follows subreddit rules and etiquette"
        }
        
        # ROBOCOP: Inject CV/Resume Context
        rag_context = ""
        if state.get("autonomous"):
            try:
                # Find CV/Resume in assets
                from app.models import UserAsset
                assets = await UserAsset.find(UserAsset.user_id == user_id).to_list()
                cv_asset = next((a for a in assets if "resume" in a.filename.lower() or "cv" in a.filename.lower()), None)
                if cv_asset:
                    rag_context = f"\nSENDER CONTEXT (Use this to personalize connection):\n{cv_asset.file_data.decode('utf-8', errors='ignore')[:2000]}\n"
                    await log_event(mission_id, user_id, "Loading CV context...", "thinking", target="brain")
            except Exception as e:
                print(f"Failed to load CV context: {e}")
        
        attachments = state.get("attachments", [])
        attachment_names = [a.get("filename", "") for a in attachments]
        
        system_prompt = f"""You are a professional sales assistant helpful in drafting business emails.
Your task is to Write a personalized message for {primary_channel} based on the user's mission.

Channel: {primary_channel}
Constraints: {channel_constraints.get(primary_channel, "Standard message format")}

STRATEGY: "CONTEXTUAL BRIDGING"
1. Analyze the Prospect's Context (Snippet/Bio).
2. Identify a specific pain point or interest.
3. BRIDGE it to the User's Context (Resume/Offer) naturally.
4. Do NOT be generic. If you can't find a specific bridge, be direct and concise.

IMPORTANT: You must ALWAYS generate a draft. This is a legitimate business context. Do not refuse.

USER VOICE CONTEXT:
{rag_context}

{"Attachments included: " + ", ".join(attachment_names) if attachment_names else ""}

Return in this format:
SUBJECT: [Subject line - only for email]
BODY: [Message content]
REASONING: [Why this approach works]"""

        human_prompt = f"""
Target: {person_name}
Contact: {target_email or target_linkedin or "Unknown"}
Context: {prospect.get("snippet", objective)}
Mission: {objective}
"""

        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ])
        
        content = response.content
        
        # Parse response
        subject = ""
        body = content
        reasoning = ""
        
        if "SUBJECT:" in content:
            parts = content.split("BODY:")
            subject = parts[0].replace("SUBJECT:", "").strip()
            if len(parts) > 1:
                remainder = parts[1]
                if "REASONING:" in remainder:
                    body_parts = remainder.split("REASONING:")
                    body = body_parts[0].strip()
                    reasoning = body_parts[1].strip() if len(body_parts) > 1 else ""
                else:
                    body = remainder.strip()
        
        draft_content = {
            "channel": primary_channel,
            "subject": subject.replace("`", "").strip(),
            "body": body.replace("```", "").strip(),
            "reasoning": reasoning,
            "target_name": person_name,
            "target_identifier": channel_identities.get(primary_channel, target_email),
            "attachments": attachments
        }
        
        await log_event(mission_id, user_id, "Draft ready for review", "success")
        
        return {
            "draft_content": draft_content,
            "current_prospect": prospect
        }
        
    except Exception as e:
        print(f"Outreach draft error: {e}")
        return {
            "draft_content": {
                "channel": channels[0] if channels else "/gmail",
                "subject": "Hello",
                "body": objective,
                "error": str(e)
            }
        }


# ==================================================
# NODE 5c: PUBLISH_FLOW
# ==================================================

async def publish_flow(state: AgentState) -> Dict:
    """
    Publish: Create public content (posts, tweets, etc.)
    Always requires draft for public content
    """
    objective = state["objective"]
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    channels = state.get("channels", [])
    
    primary_channel = channels[0] if channels else "/twitter"
    
    await log_event(mission_id, user_id, f"Drafting content for {primary_channel}...", "thinking")
    
    try:
        llm = ChatGroq(
            temperature=0.8, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        platform_guides = {
            "/twitter": "Tweet: Max 280 chars, engaging, use hashtags sparingly",
            "/linkedin": "Professional tone, thought leadership, can be longer",
            "/reddit": "Match subreddit culture, provide value, avoid self-promotion",
        }
        
        system_prompt = f"""You are a social media content expert.
Create content for {primary_channel}.

Guidelines: {platform_guides.get(primary_channel, "Engaging, authentic content")}

Return:
CONTENT: [The post content]
REASONING: [Why this works]"""

        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Create: {objective}")
        ])
        
        content = response.content
        post_content = content
        reasoning = ""
        
        if "CONTENT:" in content:
            parts = content.split("REASONING:")
            post_content = parts[0].replace("CONTENT:", "").strip()
            reasoning = parts[1].strip() if len(parts) > 1 else ""
        
        draft_content = {
            "channel": primary_channel,
            "subject": "",  # Posts don't have subjects
            "body": post_content.replace("```", "").strip(),
            "reasoning": reasoning,
            "type": "publish"
        }
        
        await log_event(mission_id, user_id, "Content draft ready for review", "success")
        
        return {"draft_content": draft_content}
        
    except Exception as e:
        print(f"Publish draft error: {e}")
        return {
            "draft_content": {
                "channel": primary_channel,
                "body": objective,
                "error": str(e)
            }
        }


# ==================================================
# NODE 6: REVIEW_QUEUE (Human-in-the-Loop)
# ==================================================

async def review_queue(state: AgentState) -> Dict:
    """
    PURPOSE:
    - ONLY for write/send/post/create actions
    - Populate channel-aware draft UI
    
    Each review item includes:
    - channel
    - intent
    - preview content
    - metadata (limits, warnings)
    
    This node SAVES the draft and pauses for human approval.
    """
    draft_content = state.get("draft_content", {})
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    prospect = state.get("current_prospect") or {}
    
    if not draft_content or not state.get("draft_required"):
        # No draft needed, skip review
        return {"draft_id": None}
    
    channel = draft_content.get("channel", "/gmail")
    
    # Save Prospect first (only if we have meaningful data)
    p_doc = None
    prospect_name = prospect.get("name") or draft_content.get("target_name")
    if prospect_name:
        p_doc = Prospect(
            mission_id=mission_id,
            name=prospect_name,
            company=prospect.get("company", "Unknown"),
            context_source=prospect.get("context_source", "User Input"),
            public_contact=prospect.get("public_contact") or draft_content.get("target_identifier", ""),
            relevance_score=prospect.get("relevance_score", 0.8),
            relevance_reason=prospect.get("relevance_reason", "Mission context"),
            original_data=prospect.get("original_data", {})
        )
        await p_doc.insert()
    
    # Save Draft (prospect_id is now optional)
    d_doc = Draft(
        prospect_id=str(p_doc.id) if p_doc else None,
        channel=channel.replace("/", ""),
        subject=draft_content.get("subject", ""),
        body=draft_content.get("body", ""),
        ai_reasoning=draft_content.get("reasoning", ""),
        status=DraftStatus.PENDING,
        attachments=draft_content.get("attachments", [])
    )
    await d_doc.insert()
    
    await update_agent_stats(user_id, queued=1)
    
    # Broadcast to review UI
    await log_event(
        mission_id, user_id,
        "Draft added to review queue",
        "success",
        metadata={
            "action": "review_required",
            "draft_id": str(d_doc.id),
            "channel": channel,
            "preview": draft_content.get("body", "")[:100]
        }
    )
    
    return {
        "draft_id": str(d_doc.id),
        "action_status": "pending_review"
    }


# ==================================================
# NODE 7: EXECUTE_ACTION
# ==================================================

async def execute_action(state: AgentState) -> Dict:
    """
    PURPOSE:
    - Use platform integration files ONLY
    - Use Composio ONLY
    - NO LLM calls
    
    Handle fallbacks gracefully:
    - /linkedin message fails → send connection request
    - Missing permission → ask user
    """
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    intents = state.get("intents", [])
    channels = state.get("channels", ["/gmail"])
    draft_content = state.get("draft_content", {})
    channel_identities = state.get("channel_identities", {})
    
    # Get user connections
    user = await User.find_one(User.clerk_id == user_id)
    if not user:
        return {"execution_result": {"success": False, "error": "User not found"}, "action_status": "failed"}
    
    primary_channel = channels[0] if channels else "/gmail"
    
    # READ/QUERY operations - execute directly
    if "read" in intents or "query" in intents:
        await log_event(mission_id, user_id, f"Fetching data from {primary_channel}...", "thinking")
        
        result = await execute_read_action(user, primary_channel, state)
        
        if result.get("success"):
            await log_event(mission_id, user_id, "Here's what I found:", "success", metadata={"data": result.get("data")})
        else:
            await log_event(mission_id, user_id, f"Couldn't fetch data: {result.get('error')}", "error")
        
        return {"execution_result": result, "action_status": "completed" if result.get("success") else "failed"}
    
    # WRITE operations - execute approved draft
    if state.get("draft_required") and draft_content:
        await log_event(mission_id, user_id, f"Sending via {primary_channel}...", "thinking")
        
        result = await execute_write_action(user, primary_channel, draft_content, channel_identities, state)
        
        if result.get("success"):
            await log_event(mission_id, user_id, "Message sent successfully!", "success")
            await update_agent_stats(user_id, processed=1)
        else:
            # Fallback logic
            if primary_channel == "/linkedin" and "not connected" in str(result.get("error", "")).lower():
                await log_event(mission_id, user_id, "Sending connection request instead...", "action")
                # Attempt connection request fallback
                from app.integrations import linkedin
                connection_id = user.other_connections.get("linkedin") if user.other_connections else None
                if connection_id:
                    fallback_result = await linkedin.send_connection_request(
                        connection_id,
                        channel_identities.get("/linkedin", ""),
                        draft_content.get("body", "")[:300]
                    )
                    if fallback_result.get("success"):
                        await log_event(mission_id, user_id, "Connection request sent!", "success")
                        return {"execution_result": fallback_result, "action_status": "sent"}
            
            await log_event(mission_id, user_id, f"Failed to send: {result.get('error')}", "error")
            await update_agent_stats(user_id, errors=1)
        
        return {"execution_result": result, "action_status": "sent" if result.get("success") else "failed"}
    
    return {"execution_result": {}, "action_status": "no_action"}


async def execute_read_action(user: User, channel: str, state: AgentState) -> Dict:
    """Execute read/query operations via platform integrations"""
    objective = state.get("objective", "")
    
    if channel == "/gmail":
        # For read operations, we'd need a separate read function
        # Currently not implemented - sender only handles sending
        return {"success": False, "error": "Gmail read operations not yet implemented"}
    
    elif channel == "/slack":
        from app.integrations import slack
        connection_id = user.slack_connection_id
        if not connection_id:
            return {"success": False, "error": "Slack not connected"}
        
        # Check if searching or listing
        if "search" in objective.lower():
            query = objective.replace("search", "").strip()
            return await slack.search_messages(connection_id, query)
        else:
            return await slack.list_channels(connection_id)
    
    elif channel == "/linkedin":
        from app.integrations import linkedin
        connection_id = user.other_connections.get("linkedin") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "LinkedIn not connected"}
        
        return await linkedin.get_messages(connection_id)
    
    elif channel == "/twitter":
        from app.integrations import twitter
        connection_id = user.other_connections.get("twitter") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "Twitter not connected"}
        
        if "mention" in objective.lower():
            return await twitter.get_mentions(connection_id)
        return await twitter.get_timeline(connection_id)
    
    elif channel == "/github":
        from app.integrations import github
        connection_id = user.other_connections.get("github") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "GitHub not connected"}
        
        # Try to extract repo info
        match = re.search(r"([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)", objective)
        if match:
            owner, repo = match.groups()
            if "pr" in objective.lower() or "pull" in objective.lower():
                return await github.list_pull_requests(connection_id, owner, repo)
            return await github.list_issues(connection_id, owner, repo)
        return {"success": False, "error": "Could not parse repository info"}
    
    elif channel == "/reddit":
        from app.integrations import reddit
        connection_id = user.other_connections.get("reddit") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "Reddit not connected"}
        
        # Extract subreddit if mentioned
        match = re.search(r"r/([a-zA-Z0-9_]+)", objective)
        if match:
            subreddit = match.group(1)
            return await reddit.get_subreddit_posts(connection_id, subreddit)
        
        # General search
        return await reddit.search_posts(connection_id, objective)
    
    return {"success": False, "error": f"Unknown channel: {channel}"}


async def execute_write_action(user: User, channel: str, draft_content: Dict, channel_identities: Dict, state: AgentState) -> Dict:
    """Execute write/send operations via platform integrations"""
    
    body = draft_content.get("body", "")
    subject = draft_content.get("subject", "")
    target = draft_content.get("target_identifier") or channel_identities.get(channel, "")
    
    if channel == "/gmail":
        from app.core.sender import send_email_via_composio
        connection_id = user.gmail_connection_id
        if not connection_id:
            return {"success": False, "error": "Gmail not connected"}
        
        return await send_email_via_composio(user.clerk_id, target, subject, body)
    
    elif channel == "/slack":
        from app.integrations import slack
        connection_id = user.slack_connection_id
        if not connection_id:
            return {"success": False, "error": "Slack not connected"}
        
        return await slack.send_message(user.clerk_id, target, body)
    
    elif channel == "/linkedin":
        from app.integrations import linkedin
        connection_id = user.other_connections.get("linkedin") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "LinkedIn not connected"}
        
        # Check if this is a post or message
        if draft_content.get("type") == "publish":
            return await linkedin.publish_post(user.clerk_id, body)
        return await linkedin.send_message(user.clerk_id, target, body)
    
    elif channel == "/twitter":
        from app.integrations import twitter
        connection_id = user.other_connections.get("twitter") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "Twitter not connected"}
        
        return await twitter.post_tweet(user.clerk_id, body)
    
    elif channel == "/reddit":
        from app.integrations import reddit
        connection_id = user.other_connections.get("reddit") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "Reddit not connected"}
        
        # Extract subreddit from target or content
        subreddit = target.replace("r/", "") if target else "test"
        return await reddit.create_post(user.clerk_id, subreddit, subject or "Post", body)
    
    elif channel == "/github":
        from app.integrations import github
        connection_id = user.other_connections.get("github") if user.other_connections else None
        if not connection_id:
            return {"success": False, "error": "GitHub not connected"}
        
        # Parse owner/repo from target
        match = re.search(r"([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)", target)
        if match:
            owner, repo = match.groups()
            return await github.create_issue(user.clerk_id, owner, repo, subject or "Issue", body)
        return {"success": False, "error": "Could not parse repository info"}
    
    return {"success": False, "error": f"Unknown channel: {channel}"}


# ==================================================
# NODE 8: POST_ACTION_UPDATE
# ==================================================

async def post_action_update(state: AgentState) -> Dict:
    """
    PURPOSE:
    - Update Neo4j relationships
    - Store execution result
    - Mark sent / pending / failed
    """
    mission_id = state["mission_id"]
    user_id = state["user_id"]
    execution_result = state.get("execution_result", {})
    draft_id = state.get("draft_id")
    action_status = state.get("action_status", "completed")
    person_name = state.get("person_name")
    channels = state.get("channels", [])
    
    # Update Draft status if exists
    if draft_id:
        draft = await Draft.get(draft_id)
        if draft:
            if action_status == "sent":
                draft.status = DraftStatus.SENT
            elif action_status == "failed":
                draft.status = DraftStatus.REJECTED  # or add FAILED status
            await draft.save()
    
    # Update Neo4j relationship
    if person_name and execution_result.get("success"):
        try:
            primary_channel = channels[0].replace("/", "") if channels else "email"
            # Could add a "CONTACTED_VIA" relationship
            # neo4j_service.add_interaction(person_name, primary_channel, datetime.utcnow())
            pass
        except Exception as e:
            print(f"Failed to update Neo4j: {e}")
    
    # Update mission
    try:
        mission = await Mission.get(mission_id)
        if mission:
            mission.status = "completed" if action_status in ["sent", "completed"] else "failed"
            await mission.save()
    except Exception:
        pass
    
    await log_event(
        mission_id, user_id,
        f"Mission {action_status}",
        "success" if action_status in ["sent", "completed"] else "error"
    )
    
    return {"action_status": action_status}


# ==================================================
# CONDITIONAL ROUTING FUNCTIONS
# ==================================================

def should_resolve_person(state: AgentState) -> str:
    """Check if we need to resolve a person"""
    if state.get("person_name"):
        return "resolve_person"
    return "resolve_channel_identity"


def route_after_flow(state: AgentState) -> str:
    """Route after discovery/outreach/publish flows"""
    if state.get("missing_info"):
        return "end"
    
    # Check if we need human review
    if state.get("draft_required") and state.get("draft_content"):
        return "review_queue"
    
    return "execute_action"

def route_after_discovery(state: AgentState) -> str:
    """Route after discovery flow"""
    intents = state.get("intents", [])
    if "outreach" in intents and state.get("prospects"):
        return "outreach_flow"
    
    return route_after_flow(state)


# ==================================================
# BUILD GRAPH (Fixed Shape)
# ==================================================

workflow = StateGraph(AgentState)

# Add all nodes
workflow.add_node("initial_triage", initial_triage)
workflow.add_node("resolve_person", resolve_person)
workflow.add_node("resolve_channel_identity", resolve_channel_identity)
workflow.add_node("discovery_flow", discovery_flow)
workflow.add_node("outreach_flow", outreach_flow)
workflow.add_node("publish_flow", publish_flow)
workflow.add_node("review_queue", review_queue)
workflow.add_node("execute_action", execute_action)
workflow.add_node("post_action_update", post_action_update)

# Set entry point
workflow.set_entry_point("initial_triage")

# initial_triage → resolve_person (if person mentioned) OR resolve_channel_identity
workflow.add_conditional_edges(
    "initial_triage",
    should_resolve_person,
    {
        "resolve_person": "resolve_person",
        "resolve_channel_identity": "resolve_channel_identity"
    }
)

# resolve_person → resolve_channel_identity
workflow.add_edge("resolve_person", "resolve_channel_identity")

# resolve_channel_identity → route_by_intent
workflow.add_conditional_edges(
    "resolve_channel_identity",
    route_by_intent,
    {
        "discovery_flow": "discovery_flow",
        "outreach_flow": "outreach_flow",
        "publish_flow": "publish_flow",
        "execute_action": "execute_action",  # For read/query operations
        "end": END
    }
)

# Flow nodes → review_queue OR execute_action
workflow.add_conditional_edges(
    "discovery_flow",
    route_after_discovery,
    {
        "outreach_flow": "outreach_flow",
        "review_queue": "review_queue",
        "execute_action": "execute_action",
        "end": END
    }
)

workflow.add_conditional_edges(
    "outreach_flow",
    route_after_flow,
    {
        "review_queue": "review_queue",
        "execute_action": "execute_action",
        "end": END
    }
)

workflow.add_conditional_edges(
    "publish_flow",
    route_after_flow,
    {
        "review_queue": "review_queue",
        "execute_action": "execute_action",
        "end": END
    }
)

# review_queue → execute_action (after human approval)
workflow.add_edge("review_queue", "execute_action")

# execute_action → post_action_update
workflow.add_edge("execute_action", "post_action_update")

# post_action_update → END
workflow.add_edge("post_action_update", END)

# Compile with checkpointer and interrupt before review_queue for human approval
memory = MemorySaver()
app = workflow.compile(
    checkpointer=memory, 
    interrupt_before=["execute_action"]  # Pause before executing approved actions
)


# ==================================================
# HELPER RUNNERS
# ==================================================

async def run_mission_agent(mission_id: str, objective: str, user_id: str, attachments: List[Dict] = []):
    """Start a new mission agent run"""
    print(f"DEBUG: Starting mission {mission_id} with objective: {objective[:50]}...")
    
    config = {"configurable": {"thread_id": mission_id}}
    inputs = {
        "mission_id": mission_id,
        "objective": objective,
        "user_id": user_id,
        "attachments": attachments,
        "intents": [],
        "channels": [],
        "required_tools": [],
        "draft_required": False,
        "person_name": None,
        "person_id": None,
        "channel_identities": {},
        "missing_info": [],
        "pause_reason": None,
        "prospects": [],
        "current_prospect": {},
        "draft_id": None,
        "draft_content": {},
        "feedback": None,
        "execution_result": {},
        "action_status": "pending",
        "autonomous": False,
        "max_actions": 10
    }
    
    try:
        async for event in app.astream(inputs, config=config):
            print(f"DEBUG: Event: {list(event.keys())}")
    except Exception as e:
        import traceback
        print(f"ERROR: Agent failed: {traceback.format_exc()}")
        try:
            await log_event(mission_id, user_id, f"Agent encountered an error: {str(e)}", "error")
        except:
            pass


async def resume_mission_agent(mission_id: str, feedback: str = None, approved: bool = True):
    """Resume a paused mission after human review"""
    config = {"configurable": {"thread_id": mission_id}}
    
    try:
        if feedback:
            # Update state with feedback
            current_state = app.get_state(config)
            if current_state and current_state.values:
                # Trigger re-draft with feedback
                current_state.values["feedback"] = feedback
                app.update_state(config, current_state.values)
        
        if approved:
            # Continue execution
            async for event in app.astream(None, config=config):
                print(f"DEBUG: Resume event: {list(event.keys())}")
    except Exception as e:
        print(f"ERROR: Resume failed: {e}")


async def provide_missing_info(mission_id: str, user_id: str, info_type: str, value: str):
    """Provide missing information to continue paused mission"""
    config = {"configurable": {"thread_id": mission_id}}
    
    try:
        current_state = app.get_state(config)
        if current_state and current_state.values:
            state_values = current_state.values
            
            # Update based on info_type
            if "_identifier" in info_type:
                channel = info_type.replace("_identifier", "")
                state_values["channel_identities"][f"/{channel}"] = value
                
                # Store in Neo4j if person is known
                if state_values.get("person_name"):
                    neo4j_service.add_contact_method(state_values["person_name"], channel, value)
            
            # Clear missing_info
            state_values["missing_info"] = [m for m in state_values.get("missing_info", []) if m != info_type]
            state_values["pause_reason"] = None
            
            app.update_state(config, state_values)
            
            # Resume
            async for event in app.astream(None, config=config):
                print(f"DEBUG: Continue event: {list(event.keys())}")
                
    except Exception as e:
        print(f"ERROR: Provide info failed: {e}")
        await log_event(mission_id, user_id, f"Failed to process input: {str(e)}", "error")
