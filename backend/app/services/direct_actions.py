"""
Direct Action Service
Handles immediate social media posts, tweets, emails without full agent workflow
Eliminates code duplication from missions.py
"""

from typing import Dict, List, Optional
from app.models import User, Mission, MissionLog, PendingAction, Draft, DraftStatus, Prospect
from app.core.config import settings
from app.core.composio_config import get_auth_config_id
import httpx

# Direct action patterns - bypass agent workflow for these
DIRECT_ACTION_PATTERNS = {
    "twitter_post": [
        "post on twitter", "tweet this", "create a tweet", "post a tweet", 
        "tweet:", "post to twitter", "send tweet", "twitter post", 
        "publish a tweet", "publish on twitter"
    ],
    "reddit_post": [
        "post on reddit", "create a reddit post", "post to reddit", 
        "post in r/", "submit to reddit", "reddit post", "post to r/", 
        "post a reddit", "publish a reddit", "publish on reddit", 
        "publish to reddit", "reddit about", "in r/", "in reddit", "on reddit"
    ],
    "linkedin_post": [
        "post on linkedin", "create a linkedin post", "share on linkedin", 
        "linkedin post", "post to linkedin", "post a linkedin", 
        "publish on linkedin", "publish a linkedin", "on linkedin"
    ],
    "slack_message": [
        "send to slack", "slack message", "post to slack", 
        "message on slack", "notify slack"
    ],
    "gmail_send": [
        "send email", "send an email", "email to", "compose email", "mail to"
    ],
}

CHANNEL_MAP = {
    "twitter_post": "twitter",
    "reddit_post": "reddit",
    "linkedin_post": "linkedin",
    "slack_message": "slack",
    "gmail_send": "email",
}


def detect_action_type(objective: str) -> Optional[str]:
    """
    Detect if objective matches a direct action pattern.
    
    Returns:
        Action type (e.g., 'twitter_post') or None
    """
    obj_lower = objective.lower()
    for action_type, patterns in DIRECT_ACTION_PATTERNS.items():
        if any(pattern in obj_lower for pattern in patterns):
            return action_type
    return None


async def create_oauth_redirect(
    user: User,
    tool: str,
    mission_id: str,
    pending_action_id: str
) -> Optional[str]:
    """
    Create Composio OAuth redirect URL for tool connection.
    
    Returns:
        Redirect URL or None on failure
    """
    auth_config_id = get_auth_config_id(tool)
    if not auth_config_id:
        return None
    
    frontend_base = "http://localhost:5173"
    redirect_url = f"{frontend_base}/chat/{mission_id}?pending_action={pending_action_id}"
    
    url = "https://backend.composio.dev/api/v3/connected_accounts"
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    payload = {
        "auth_config": {"id": auth_config_id},
        "connection": {"user_id": user.clerk_id},
        "redirectUrl": redirect_url,
        "redirect_uri": redirect_url
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=30.0)
            if resp.status_code in [200, 201, 202]:
                data = resp.json()
                composio_redirect = data.get("redirectUrl") or data.get("redirect_url")
                connection_id = data.get("id") or data.get("connection_id")
                
                # Pre-save connection ID
                if connection_id:
                    if tool == "slack":
                        user.slack_connection_id = connection_id
                    elif tool == "gmail":
                        user.gmail_connection_id = connection_id
                    else:
                        if not user.other_connections:
                            user.other_connections = {}
                        user.other_connections[tool] = connection_id
                    await user.save()
                
                return composio_redirect
    except Exception as e:
        print(f"OAuth redirect creation failed: {e}")
    
    return None


async def build_rag_context(attachments: List[Dict], max_chars: int = 6000) -> str:
    """
    Build RAG context from attachments for content generation.
    
    Returns:
        Context string or empty string
    """
    if not attachments:
        return ""
    
    from app.services.rag import rag_service
    
    asset_ids = [att.get("asset_id") for att in attachments if att.get("asset_id")]
    if not asset_ids:
        return ""
    
    return await rag_service.build_context_from_assets(asset_ids, max_chars=max_chars)


def sanitize_json_string(content: str) -> str:
    """
    Sanitize LLM-generated JSON by escaping control characters.
    """
    # Extract from markdown code blocks
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.replace("```", "").strip()
    
    # Escape control characters in JSON strings
    result = []
    in_string = False
    escape_next = False
    
    for char in content:
        if escape_next:
            result.append(char)
            escape_next = False
            continue
            
        if char == '\\':
            result.append(char)
            escape_next = True
            continue
            
        if char == '"':
            in_string = not in_string
            result.append(char)
            continue
        
        if in_string:
            if char == '\n':
                result.append('\\n')
            elif char == '\t':
                result.append('\\t')
            else:
                result.append(char)
        else:
            result.append(char)
    
    return ''.join(result)


async def extract_action_content(
    objective: str,
    action_type: str,
    rag_context: str = ""
) -> Dict:
    """
    Use LLM to extract structured content from objective.
    
    Returns:
        Dict with extracted content and 'ready' flag
    """
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    import json
    
    llm = ChatGroq(
        temperature=0.0,
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.1-8b-instant"
    )
    
    rag_injection = ""
    if rag_context:
        rag_injection = f"""

IMPORTANT: Use the following knowledge base content to inform your generated content:

{rag_context}

---
"""
    
    # Build prompts based on action type
    prompts = {
        "twitter_post": [
            SystemMessage(content=f"""Extract tweet content from the user's request.
Return JSON only: {{"tweet": "the tweet text", "ready": true/false}}
Set ready=true and generate the tweet. Max 280 characters.{rag_injection}"""),
            HumanMessage(content=f"User request: {objective}")
        ],
        "reddit_post": [
            SystemMessage(content=f"""Extract Reddit post details.
Return JSON only: {{"subreddit": "name", "title": "title", "body": "content", "ready": true/false}}
If subreddit is specified (r/something), set ready=true. Otherwise set ready=false.{rag_injection}"""),
            HumanMessage(content=f"User request: {objective}")
        ],
        "linkedin_post": [
            SystemMessage(content=f"""Extract LinkedIn post content.
Return JSON only: {{"content": "post text", "ready": true/false}}
Generate professional content. Set ready=true.{rag_injection}"""),
            HumanMessage(content=f"User request: {objective}")
        ],
        "slack_message": [
            SystemMessage(content=f"""Extract Slack message details.
Return JSON only: {{"channel": "channel_name", "message": "text", "ready": true/false}}
Set ready=false if channel is unclear.{rag_injection}"""),
            HumanMessage(content=f"User request: {objective}")
        ],
        "gmail_send": [
            SystemMessage(content=f"""Extract email details.
Return JSON only: {{"to": "email@example.com", "subject": "subject", "body": "body", "ready": true/false}}
Set ready=false if recipient is unclear.{rag_injection}"""),
            HumanMessage(content=f"User request: {objective}")
        ],
    }
    
    if action_type not in prompts:
        return {"ready": False, "error": "Unknown action type"}
    
    try:
        response = await llm.ainvoke(prompts[action_type])
        content_str = sanitize_json_string(response.content)
        return json.loads(content_str)
    except Exception as e:
        print(f"Content extraction failed: {e}")
        return {"ready": False, "error": str(e)}


async def create_draft_from_action(
    mission_id: str,
    action_type: str,
    action_data: Dict,
    pending_action_id: str
) -> Optional[Draft]:
    """
    Create a Draft document for the action.
    
    Returns:
        Draft object or None
    """
    channel = CHANNEL_MAP.get(action_type, "email")
    
    # For emails, create a prospect first
    prospect_id = None
    if action_type == "gmail_send":
        recipient_email = action_data.get("to", "")
        prospect = Prospect(
            mission_id=mission_id,
            name=recipient_email.split("@")[0].replace(".", " ").title(),
            company="Email Contact",
            context_source="Direct Email",
            public_contact=recipient_email,
            relevance_score=1.0,
            relevance_reason="Direct email request from mission chat"
        )
        await prospect.insert()
        prospect_id = str(prospect.id)
    
    # Create draft
    draft = Draft(
        prospect_id=prospect_id,
        channel=channel,
        subject=action_data.get("title") or action_data.get("subject", ""),
        body=(
            action_data.get("content") or 
            action_data.get("body") or 
            action_data.get("tweet") or 
            action_data.get("message", "")
        ),
        ai_reasoning="Generated from mission chat request",
        status=DraftStatus.PENDING,
        metadata={
            "subreddit": action_data.get("subreddit"),
            "slackChannel": action_data.get("channel"),
            "repo": action_data.get("repo"),
            "pending_action_id": pending_action_id
        }
    )
    await draft.insert()
    return draft
