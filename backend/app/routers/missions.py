from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict
from app.models import Mission, User, MissionLog, PendingAction
from app.api.deps import get_current_user
from app.core.agent import run_mission_agent
from app.core.config import settings
from pydantic import BaseModel
import asyncio

router = APIRouter()

class MissionCreate(BaseModel):
    objective: str
    attachments: Optional[List[Dict]] = []  # List of {asset_id, filename, content_type}

# Direct action patterns - bypass agent workflow for these
DIRECT_ACTION_PATTERNS = {
    "twitter_post": ["post on twitter", "tweet this", "create a tweet", "post a tweet", "tweet:", "post to twitter", "send tweet", "twitter post"],
    "reddit_post": ["post on reddit", "create a reddit post", "post to reddit", "post in r/", "submit to reddit", "reddit post", "post to r/"],
    "linkedin_post": ["post on linkedin", "create a linkedin post", "share on linkedin", "linkedin post", "post to linkedin"],
    "slack_message": ["send to slack", "slack message", "post to slack", "message on slack", "notify slack"],
    "gmail_send": ["send email", "send an email", "email to", "compose email", "mail to"],
}

async def detect_and_execute_direct_action(objective: str, mission_id: str, user: User, attachments: List[Dict] = None) -> Optional[Dict]:
    """
    Detect if the objective is a direct action (post, tweet, etc.) and execute it.
    Returns response dict if handled, None if should continue with normal agent flow.
    
    Supports RAG: If attachments are provided, their content will be used to enhance
    the generated content.
    """
    obj_lower = objective.lower()
    attachments = attachments or []
    
    detected_action = None
    for action_type, patterns in DIRECT_ACTION_PATTERNS.items():
        if any(p in obj_lower for p in patterns):
            detected_action = action_type
            break
    
    if not detected_action:
        return None  # Not a direct action, continue with normal flow
    
    # Log that we're processing a direct action
    await MissionLog(
        mission_id=mission_id,
        role="agent",
        content=f"Processing direct {detected_action.replace('_', ' ')} request...",
        log_type="thinking"
    ).insert()
    
    # Build RAG context from attachments if provided
    rag_context = ""
    if attachments:
        from app.services.rag import rag_service
        asset_ids = [att.get("asset_id") for att in attachments if att.get("asset_id")]
        if asset_ids:
            rag_context = await rag_service.build_context_from_assets(asset_ids, max_chars=6000)
            if rag_context:
                await MissionLog(
                    mission_id=mission_id,
                    role="agent", 
                    content=f"📚 Using context from {len(asset_ids)} knowledge asset(s) to generate content...",
                    log_type="thinking"
                ).insert()
    
    # Use LLM to extract action content
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    import json
    
    try:
        extract_llm = ChatGroq(
            temperature=0.0, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.1-8b-instant"
        )
        
        # Add RAG context to prompts if available
        rag_injection = ""
        if rag_context:
            rag_injection = f"""

IMPORTANT: Use the following knowledge base content to inform and enhance your generated content.
Extract key details, features, benefits, and talking points from this source material:

{rag_context}

---
"""
        
        if detected_action == "twitter_post":
            extraction_prompt = [
                SystemMessage(content=f"""Extract the tweet content from the user's request.
Return JSON only: {{"tweet": "the tweet text", "ready": true/false}}
Set ready=true and generate the tweet based on what they want to promote/share.
Max 280 characters for tweet.{rag_injection}"""),
                HumanMessage(content=f"User request: {objective}")
            ]
        elif detected_action == "reddit_post":
            extraction_prompt = [
                SystemMessage(content=f"""Extract Reddit post details from the user's request.
Return JSON only: {{"subreddit": "subreddit_name", "title": "post title", "body": "post content", "ready": true/false}}

IMPORTANT:
- If they mention a specific subreddit (r/something), extract it and set ready=true
- If they DON'T specify a subreddit, set ready=false and leave subreddit empty
- Generate a compelling title and body based on what they want to promote
- Make the content authentic and not spammy{rag_injection}"""),
                HumanMessage(content=f"User request: {objective}")
            ]
        elif detected_action == "linkedin_post":
            extraction_prompt = [
                SystemMessage(content=f"""Extract LinkedIn post content from the user's request.
Return JSON only: {{"content": "the post text", "ready": true/false}}
Generate professional LinkedIn post content based on what they want to share/promote. Set ready=true.{rag_injection}"""),
                HumanMessage(content=f"User request: {objective}")
            ]
        elif detected_action == "slack_message":
            extraction_prompt = [
                SystemMessage(content=f"""Extract Slack message details from the user's request.
Return JSON only: {{"channel": "channel_name_or_id", "message": "the message text", "ready": true/false}}
Set ready=false if channel is unclear.{rag_injection}"""),
                HumanMessage(content=f"User request: {objective}")
            ]
        elif detected_action == "gmail_send":
            extraction_prompt = [
                SystemMessage(content=f"""Extract email details from the user's request.
Return JSON only: {{"to": "recipient@email.com", "subject": "email subject", "body": "email body", "ready": true/false}}
Set ready=false if recipient email is unclear.{rag_injection}"""),
                HumanMessage(content=f"User request: {objective}")
            ]
        else:
            return None
        
        ex_res = await extract_llm.ainvoke(extraction_prompt)
        content_str = ex_res.content
        if "```json" in content_str:
            content_str = content_str.split("```json")[1].split("```")[0].strip()
        elif "```" in content_str:
            content_str = content_str.replace("```", "").strip()
        
        action_data = json.loads(content_str)
        
        # If not ready, ask for clarification
        if not action_data.get("ready", False):
            clarify_msg = f"I detected you want to {detected_action.replace('_', ' ')}. Could you provide more details?"
            if detected_action == "reddit_post":
                clarify_msg = "Which subreddit should I post to? Please reply with the subreddit name (e.g., 'r/SaaS' or 'r/startups')."
            elif detected_action == "slack_message":
                clarify_msg = "Which Slack channel should I send to? Please reply with the channel name."
            
            await MissionLog(mission_id=mission_id, role="agent", content=clarify_msg, log_type="action").insert()
            return {"handled": True, "needs_input": True, "action_type": detected_action, "action_data": action_data}
        
        # Get tool connection
        tool_map = {
            "twitter_post": "twitter",
            "reddit_post": "reddit", 
            "linkedin_post": "linkedin",
            "slack_message": "slack",
            "gmail_send": "gmail"
        }
        tool = tool_map.get(detected_action)
        
        # Check connection
        conn_id = None
        if tool == "slack":
            conn_id = user.slack_connection_id
        elif tool == "gmail":
            conn_id = user.gmail_connection_id
        else:
            conn_id = user.other_connections.get(tool) if user.other_connections else None
        
        if not conn_id:
            # Create pending action and return connect prompt
            pending = PendingAction(
                user_id=user.clerk_id,
                mission_id=mission_id,
                action_type=detected_action,
                action_data=action_data,
                tool=tool
            )
            await pending.insert()
            
            # Generate OAuth URL
            import httpx
            TOOL_CONFIG_MAP = {
                "linkedin": "ac_SdzD1ondK6Zi",
                "twitter": "ac_EjFjyYk1dXE2",
                "reddit": "ac_2_IjyXggGH8F",
                "github": "ac_UE__S2Ls9sMT",
                "slack": "ac_YPQ1Q5xomR5i",
                "gmail": settings.COMPOSIO_AUTH_CONFIG_ID
            }
            
            auth_config_id = TOOL_CONFIG_MAP.get(tool)
            frontend_base = "http://localhost:5173"
            redirect_url = f"{frontend_base}/chat/{mission_id}?pending_action={pending.id}"
            
            url = "https://backend.composio.dev/api/v3/connected_accounts"
            headers = {"x-api-key": settings.COMPOSIO_API_KEY}
            payload = {
                "auth_config": {"id": auth_config_id},
                "connection": {"user_id": user.clerk_id},
                "redirectUrl": redirect_url,
                "redirect_uri": redirect_url
            }
            
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
                    
                    msg = f"To post on {tool.title()}, please connect your account first. Click the button below to connect, and I'll publish automatically!"
                    await MissionLog(
                        mission_id=mission_id, 
                        role="agent", 
                        content=msg, 
                        log_type="action",
                        metadata={"action": "connect_tool", "tool": tool, "connect_url": composio_redirect, "pending_action_id": str(pending.id)}
                    ).insert()
                    return {"handled": True, "needs_connection": True}
        
        # Execute the action!
        result = {"success": False, "error": "Unknown action"}
        
        # Instead of auto-posting, create a draft preview and let user confirm
        # Save the action data in PendingAction for later execution
        pending = PendingAction(
            user_id=user.clerk_id,
            mission_id=mission_id,
            action_type=detected_action,
            action_data=action_data,
            tool=tool
        )
        await pending.insert()
        
        # For emails: send to Review Queue (no Post Now in chat)
        # For social media: show draft_preview in chat with Post Now button
        if detected_action == "gmail_send":
            # Create a Draft for Review Queue
            from app.models import Draft, DraftStatus, Prospect
            
            # Create a minimal prospect for the email recipient
            prospect = Prospect(
                mission_id=mission_id,
                name=action_data.get("to", "").split("@")[0].replace(".", " ").title(),
                company="Email Contact",
                context_source="Direct Email",
                public_contact=action_data.get("to", ""),
                relevance_score=1.0,
                relevance_reason="Direct email request from mission chat"
            )
            await prospect.insert()
            
            # Create Draft in Review Queue
            draft = Draft(
                prospect_id=str(prospect.id),
                channel="email",
                subject=action_data.get("subject", ""),
                body=action_data.get("body", ""),
                ai_reasoning="Generated from mission chat request",
                status=DraftStatus.PENDING,
                attachments=action_data.get("attachments", [])
            )
            await draft.insert()
            
            # Mark the pending action as pointing to this draft
            pending.action_data["draft_id"] = str(draft.id)
            await pending.save()
            
            # Log to chat - direct user to Review Queue
            preview_content = f"📧 **Email Draft Created**\n\n**To:** {action_data.get('to', '')}\n**Subject:** {action_data.get('subject', '')}\n\n{action_data.get('body', '')[:200]}..."
            await MissionLog(
                mission_id=mission_id,
                role="agent",
                content=preview_content,
                log_type="success",
                metadata={
                    "action": "draft_ready",
                    "draft_id": str(draft.id),
                    "channel": "email"
                }
            ).insert()
            
            return {"handled": True, "draft_created": True, "draft_id": str(draft.id)}
        
        # For social media: show preview in chat with Post Now button
        # Also create a Draft so Edit button can redirect to Review Queue
        from app.models import Draft, DraftStatus
        
        # Determine channel and content for Draft
        channel_map = {
            "twitter_post": "twitter",
            "reddit_post": "reddit", 
            "linkedin_post": "linkedin",
            "slack_message": "slack",
            "github_issue": "github"
        }
        channel = channel_map.get(detected_action, "email")
        
        # Create Draft for Review Queue (for Edit flow)
        draft = Draft(
            prospect_id=None,  # Social media posts don't always have a prospect
            channel=channel,
            subject=action_data.get("title") or action_data.get("subject", ""),
            body=action_data.get("content") or action_data.get("body") or action_data.get("tweet") or action_data.get("message", ""),
            ai_reasoning="Generated from mission chat request",
            status=DraftStatus.PENDING,
            metadata={
                "subreddit": action_data.get("subreddit"),
                "slackChannel": action_data.get("channel"),
                "repo": action_data.get("repo"),
                "pending_action_id": str(pending.id)
            }
        )
        await draft.insert()
        
        # Link draft to pending action
        pending.action_data["draft_id"] = str(draft.id)
        await pending.save()
        
        # Format preview message based on action type
        preview_content = ""
        if detected_action == "twitter_post":
            preview_content = f"**Tweet Preview:**\n\n{action_data.get('tweet', '')}"
        elif detected_action == "reddit_post":
            preview_content = f"**Reddit Post Preview:**\n\n**Subreddit:** r/{action_data.get('subreddit', 'unknown')}\n\n**Title:** {action_data.get('title', '')}\n\n**Content:**\n{action_data.get('body', '')}"
        elif detected_action == "linkedin_post":
            preview_content = f"**LinkedIn Post Preview:**\n\n{action_data.get('content', '')}"
        elif detected_action == "slack_message":
            preview_content = f"**Slack Message Preview:**\n\n**Channel:** #{action_data.get('channel', 'general')}\n\n**Message:**\n{action_data.get('message', '')}"
        elif detected_action == "github_issue":
            preview_content = f"**GitHub Issue Preview:**\n\n**Repo:** {action_data.get('repo', '')}\n**Title:** {action_data.get('title', '')}\n\n**Body:**\n{action_data.get('body', '')}"
        
        # Log the preview with action button metadata (Post Now + Edit)
        await MissionLog(
            mission_id=mission_id,
            role="agent",
            content=preview_content,
            log_type="action",
            metadata={
                "action": "draft_preview",
                "action_type": detected_action,
                "pending_action_id": str(pending.id),
                "draft_id": str(draft.id),
                "tool": tool,
                "channel": channel,
                "action_data": action_data
            }
        ).insert()
        
        return {"handled": True, "draft_created": True, "pending_action_id": str(pending.id)}
        
    except Exception as e:
        error_msg = f"Error processing action: {str(e)[:100]}"
        await MissionLog(mission_id=mission_id, role="agent", content=error_msg, log_type="error").insert()
        return {"handled": True, "error": str(e)}

@router.post("/", response_model=Mission)
async def create_mission(mission_in: MissionCreate, user: User = Depends(get_current_user)):
    mission = Mission(user_id=user.clerk_id, objective=mission_in.objective)
    await mission.insert()
    
    mission_id = str(mission.id)
    
    # Save initial log entry
    attachment_msg = ""
    if mission_in.attachments:
        attachment_msg = f" with {len(mission_in.attachments)} attachment(s)"
    initial_log = MissionLog(
        mission_id=mission_id,
        role="system",
        content=f"Mission started: {mission_in.objective}{attachment_msg}",
        log_type="success"
    )
    await initial_log.insert()
    
    # Check if this is a direct action (post, tweet, etc.) - execute immediately
    action_result = await detect_and_execute_direct_action(
        mission_in.objective, 
        mission_id, 
        user, 
        attachments=mission_in.attachments
    )
    
    if action_result and action_result.get("handled"):
        # Direct action was handled, don't start agent workflow
        return mission
    
    # Not a direct action - trigger background agent for outreach workflow
    asyncio.create_task(run_mission_agent(mission_id, mission_in.objective, user.clerk_id, mission_in.attachments or []))
    
    return mission

@router.get("/")
async def list_missions(user: User = Depends(get_current_user)):
    from app.models import Prospect, Draft, DraftStatus
    
    missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    # Enrich with counts
    result = []
    for mission in missions:
        mission_id = str(mission.id)
        
        # Count prospects for this mission
        prospects_count = await Prospect.find(Prospect.mission_id == mission_id).count()
        
        # Count pending drafts for this mission (via prospect_id lookup)
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        prospect_ids = [str(p.id) for p in prospects]
        drafts_count = 0
        if prospect_ids:
            drafts_count = await Draft.find(
                {"prospect_id": {"$in": prospect_ids}, "status": DraftStatus.PENDING}
            ).count()
        
        result.append({
            "_id": str(mission.id),
            "id": str(mission.id),
            "user_id": mission.user_id,
            "objective": mission.objective,
            "status": mission.status,
            "created_at": mission.created_at.isoformat(),
            "prospects_count": prospects_count,
            "drafts_count": drafts_count,
        })
    
    return result

@router.get("/{mission_id}/logs")
async def get_mission_logs(mission_id: str, user: User = Depends(get_current_user)):
    """Get all logs for a mission"""
    # Verify mission belongs to user
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    logs = await MissionLog.find(MissionLog.mission_id == mission_id).sort("+timestamp").to_list()
    return [
        {
            "id": str(log.id),
            "role": log.role,
            "content": log.content,
            "type": log.log_type,
            "metadata": log.metadata,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

@router.post("/pending-action/{action_id}/execute")
async def execute_pending_action(action_id: str, user: User = Depends(get_current_user)):
    """Execute a pending action after OAuth callback"""
    from app.core.config import settings
    
    # Find the pending action
    pending = await PendingAction.get(action_id)
    if not pending:
        raise HTTPException(status_code=404, detail="Pending action not found")
    
    if pending.user_id != user.clerk_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if pending.executed:
        return {"success": False, "message": "Action already executed", "already_executed": True}
    
    # Get connection ID for the tool
    tool = pending.tool
    conn_id = None
    if tool == "slack":
        conn_id = user.slack_connection_id
    elif tool == "gmail":
        conn_id = user.gmail_connection_id
    else:
        conn_id = user.other_connections.get(tool) if user.other_connections else None
    
    if not conn_id:
        return {"success": False, "message": f"{tool.title()} is still not connected. Please try connecting again."}
    
    # Verify connection is active with Composio
    import httpx
    url = f"https://backend.composio.dev/api/v3/connected_accounts/{conn_id}"
    headers = {"x-api-key": settings.COMPOSIO_API_KEY}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status", "")
                if status not in ["ACTIVE", "CONNECTED"]:
                    return {"success": False, "message": f"{tool.title()} connection is not active yet. Status: {status}. Please wait a moment and try again."}
            else:
                return {"success": False, "message": f"Could not verify {tool.title()} connection status."}
        except Exception as e:
            return {"success": False, "message": f"Error checking connection: {str(e)}"}
    
    # Execute the action based on type
    action_data = pending.action_data
    result = {"success": False, "error": "Unknown action type"}
    
    try:
        if pending.action_type == "linkedin_post":
            from app.integrations import linkedin
            result = await linkedin.publish_post(user.clerk_id, action_data.get("content", ""))
        
        elif pending.action_type == "twitter_post":
            from app.integrations import twitter
            result = await twitter.post_tweet(user.clerk_id, action_data.get("tweet", ""))
        
        elif pending.action_type == "reddit_post":
            from app.integrations import reddit
            result = await reddit.create_post(
                user.clerk_id,  # Use clerk_id as Composio entity ID
                action_data.get("subreddit", "test"),
                action_data.get("title", "Post"),
                action_data.get("body", "")
            )
        
        elif pending.action_type == "slack_message":
            from app.integrations import slack
            result = await slack.send_message(
                user.clerk_id,
                action_data.get("channel", "general"),
                action_data.get("message", "")
            )
        
        elif pending.action_type == "gmail_send":
            from app.core.sender import send_email_via_composio
            result = await send_email_via_composio(
                user.clerk_id,
                action_data.get("to", ""),
                action_data.get("subject", ""),
                action_data.get("body", "")
            )
        
        elif pending.action_type == "github_issue":
            from app.integrations import github
            repo_str = action_data.get("repo", "")
            if "/" in repo_str:
                owner, repo_name = repo_str.split("/", 1)
            else:
                owner, repo_name = repo_str, ""
            result = await github.create_issue(
                user.clerk_id,
                owner,
                repo_name,
                action_data.get("title", ""),
                action_data.get("body", "")
            )
    except Exception as e:
        result = {"success": False, "error": str(e)}
    
    # Mark as executed
    pending.executed = True
    await pending.save()
    
    # Log the result to the mission chat
    if result.get("success"):
        success_messages = {
            "linkedin_post": "✅ LinkedIn post published successfully!",
            "twitter_post": "✅ Tweet posted successfully!",
            "reddit_post": f"✅ Posted to r/{action_data.get('subreddit', 'unknown')} successfully!",
            "slack_message": f"✅ Message sent to Slack #{action_data.get('channel', 'general')}!",
            "gmail_send": f"✅ Email sent to {action_data.get('to', 'recipient')}!",
            "github_issue": f"✅ Issue created in {action_data.get('repo', 'repo')}!"
        }
        msg = success_messages.get(pending.action_type, "✅ Action completed successfully!")
        await MissionLog(mission_id=pending.mission_id, role="agent", content=msg, log_type="success").insert()
        return {"success": True, "message": msg, "mission_id": pending.mission_id}
    else:
        error_msg = f"❌ Failed to execute: {result.get('error', 'Unknown error')}"
        await MissionLog(mission_id=pending.mission_id, role="agent", content=error_msg, log_type="error").insert()
        return {"success": False, "message": error_msg, "mission_id": pending.mission_id}

class ChatMessage(BaseModel):
    message: str

@router.post("/{mission_id}/chat")
async def chat_with_mission(mission_id: str, chat: ChatMessage, user: User = Depends(get_current_user)):
    """Send a chat message and get AI response"""
    from app.core.config import settings
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    from app.models import Draft, DraftStatus, Prospect, Agent
    from beanie.operators import In
    
    # Verify mission belongs to user
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Save user message as log
    user_log = MissionLog(
        mission_id=mission_id,
        role="user",
        content=chat.message,
        log_type="action"
    )
    await user_log.insert()

    msg_lower = chat.message.lower()
    
    import re
    force_draft = False
    
    # CHECK FOR LINKEDIN URL
    linkedin_regex = r"(https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?)"
    found_linkedin = re.findall(linkedin_regex, chat.message)
    
    if found_linkedin:
        linkedin_url = found_linkedin[0]
        
        # Extract username from URL
        username_match = re.search(r"linkedin\.com/in/([a-zA-Z0-9_-]+)", linkedin_url)
        linkedin_username = username_match.group(1) if username_match else "Unknown"
        
        # Try to extract name from context or use username
        extracted_name = None
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            
            extract_llm = ChatGroq(
                temperature=0.0, 
                groq_api_key=settings.GROQ_API_KEY, 
                model_name="llama-3.1-8b-instant"
            )
            extraction_prompt = [
                SystemMessage(content="Extract the PERSON NAME from the text. Return JSON only: {'name': 'extracted name'}. If unclear, use the LinkedIn username formatted as a name (e.g., 'john-doe' becomes 'John Doe')."),
                HumanMessage(content=f"Text: {chat.message}\nLinkedIn Username: {linkedin_username}\nMission: {mission.objective}")
            ]
            ex_res = await extract_llm.ainvoke(extraction_prompt)
            import json
            content_str = ex_res.content
            if "```json" in content_str:
                content_str = content_str.split("```json")[1].split("```")[0].strip()
            elif "```" in content_str:
                content_str = content_str.replace("```", "").strip()
            ex_data = json.loads(content_str)
            if ex_data.get("name") and ex_data["name"] not in ["null", "None", ""]:
                extracted_name = ex_data["name"]
        except Exception as e:
            print(f"Name extraction failed: {e}")
        
        # Format username as name fallback
        if not extracted_name:
            extracted_name = " ".join(word.capitalize() for word in linkedin_username.replace("-", " ").replace("_", " ").split())
        
        # Store in Neo4j
        from app.services.neo4j import neo4j_service
        try:
            neo4j_service.resolve_person(extracted_name)
            neo4j_service.add_contact_method(extracted_name, "linkedin", linkedin_url)
        except Exception as e:
            print(f"Neo4j storage failed: {e}")
        
        # Find or create prospect
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        
        if prospects:
            target_prospect = prospects[0]
            target_prospect.public_contact = linkedin_url
            target_prospect.name = extracted_name
            if not target_prospect.scraped_data:
                target_prospect.scraped_data = {}
            target_prospect.scraped_data["linkedin"] = linkedin_url
            await target_prospect.save()
            msg_content = f"Saved LinkedIn for {extracted_name}: {linkedin_url}"
        else:
            target_prospect = Prospect(
                mission_id=mission_id,
                name=extracted_name,
                company="Unknown",
                context_source="LinkedIn (User Input)",
                public_contact=linkedin_url,
                scraped_data={"linkedin": linkedin_url},
                relevance_reason="User provided LinkedIn profile",
                relevance_score=1.0
            )
            await target_prospect.insert()
            msg_content = f"Created prospect for {extracted_name} with LinkedIn: {linkedin_url}"
        
        await MissionLog(
            mission_id=mission_id, 
            role="agent", 
            content=msg_content, 
            log_type="success"
        ).insert()
        
        # Now automatically create a draft for this person
        force_draft = True
    
    # CHECK FOR EMAIL UPDATE
    email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    found_emails = re.findall(email_regex, chat.message)
    
    if found_emails and not found_linkedin:  # Don't process email if we already processed LinkedIn
        new_email = found_emails[0]
        
        # 0. SMART EXTRACTION (LLM)
        # Try to extract the name associated with this email from the user's natural language message
        extracted_name = None
        try:
             extract_llm = ChatGroq(
                temperature=0.0, 
                groq_api_key=settings.GROQ_API_KEY, 
                model_name="llama-3.1-8b-instant"
            )
             extraction_prompt = [
                SystemMessage(content="You are an Entity Extractor. Extract the PERSON NAME associated with the target email from the user text. Return valid JSON only: {'name': 'extracted name'}. If no name is found, return {'name': null}."),
                HumanMessage(content=f"User Text: {chat.message}\nTarget Email: {new_email}")
             ]
             ex_res = await extract_llm.ainvoke(extraction_prompt)
             import json
             ex_data = {}
             try:
                 content_str = ex_res.content
                 if "```json" in content_str:
                     content_str = content_str.split("```json")[1].split("```")[0].strip()
                 elif "```" in content_str:
                     content_str = content_str.replace("```", "").strip()
                 ex_data = json.loads(content_str)
                 if ex_data.get("name") and ex_data["name"] not in ["null", "None", ""]:
                     extracted_name = ex_data["name"]
             except:
                 pass
        except Exception as e:
            print(f"Extraction failed: {e}")

        # 1. Check Global Contacts for Name (Fallback)
        from app.models import ContactHistory
        contact_record = await ContactHistory.find_one(
            ContactHistory.user_id == user.clerk_id,
            ContactHistory.prospect_email == new_email.lower()
        )
        
        known_name = contact_record.prospect_name if contact_record and contact_record.prospect_name else None
        
        # FINAL NAME PRIORITY: Extracted > Known (History) > Email Handle
        final_name = extracted_name or known_name or new_email.split("@")[0]
        
        # 2. Find Mission Prospects
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        
        target_prospect = None
        msg_content = ""
        
        if prospects:
            # Update existing
            target_prospect = prospects[0]
            target_prospect.public_contact = new_email
            target_prospect.name = final_name  # Always update name if we found a better one
            await target_prospect.save()
            
            msg_content = f"Updated contact info for {target_prospect.name}: {new_email}"
        else:
            # Create New Prospect
            target_prospect = Prospect(
                mission_id=mission_id,
                name=final_name,
                company="Unknown",
                context_source="Chat Input",
                public_contact=new_email,
                relevance_reason="User provided email directly",
                relevance_score=1.0
            )
            await target_prospect.insert()
            msg_content = f"Created new prospect for {target_prospect.name} ({new_email})"
            
        await MissionLog(
            mission_id=mission_id, 
            role="agent", 
            content=msg_content, 
            log_type="success"
        ).insert()
        
        # Automatically trigger draft regeneration
        force_draft = True
        
    else:
        # No email found? Try looking up by NAME in ContactHistory
        cleaned_msg = chat.message.lower()
        
        # Get user's contacts (optimistic fetch, or use text search if available)
        # For now, fetching recent 100 contacts to check against
        from app.models import ContactHistory
        contacts = await ContactHistory.find(
            ContactHistory.user_id == user.clerk_id
        ).sort("-last_contacted_at").limit(100).to_list()
        
        found_contact = None
        for c in contacts:
            if c.prospect_name and c.prospect_name.lower() in cleaned_msg:
                # Found a name match!
                # Avoid single-word matches if they are common words (simple heuristic)
                if len(c.prospect_name) < 3: continue 
                found_contact = c
                break
        
        if found_contact:
            new_email = found_contact.prospect_email
            known_name = found_contact.prospect_name
            
            # Find Mission Prospects
            prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
            
            target_prospect = None
            msg_content = ""
            
            if prospects:
                target_prospect = prospects[0]
                target_prospect.public_contact = new_email
                target_prospect.name = known_name
                await target_prospect.save()
                msg_content = f"Found {known_name} in your contacts. Updated info with email: {new_email}"
            else:
                target_prospect = Prospect(
                    mission_id=mission_id,
                    name=known_name,
                    company="Unknown",
                    context_source="Contact History",
                    public_contact=new_email,
                    relevance_reason="User referenced known contact",
                    relevance_score=1.0
                )
                await target_prospect.insert()
                msg_content = f"Found {known_name} in contacts. Created prospect with email: {new_email}"
            
            await MissionLog(
                mission_id=mission_id, 
                role="agent", 
                content=msg_content, 
                log_type="success"
            ).insert()
            
            force_draft = True
        
    
    # CHECK FOR INTEGRATION REQUEST (Slack, Gmail, etc.)
    integration_keywords = {
        "slack": ["slack", "notify me on slack", "integrate slack"],
        "gmail": ["connect email", "connect gmail", "link gmail"],
    }
    
    for tool, keywords in integration_keywords.items():
        if any(k in msg_lower for k in keywords):
            # Check if already connected
            is_connected = False
            if tool == "slack":
                is_connected = bool(user.slack_connection_id)
            elif tool == "gmail":
                is_connected = bool(user.gmail_connection_id)
            
            if not is_connected:
                tool_label = tool.title()
                prompt_msg = f"To proceed with {tool_label} integration, please connect your {tool_label} account."
                await MissionLog(
                    mission_id=mission_id, 
                    role="agent", 
                    content=prompt_msg, 
                    log_type="action",
                    metadata={"action": "connect_tool", "tool": tool}
                ).insert()
                return {
                    "message": prompt_msg,
                    "role": "agent",
                    "type": "action",
                    "metadata": {"action": "connect_tool", "tool": tool}
                }
            else:
                # Already connected
                tool_label = tool.title()
                success_msg = f"Your {tool_label} is already connected! I'll use it for notifications."
                await MissionLog(mission_id=mission_id, role="agent", content=success_msg, log_type="success").insert()
                return {"message": success_msg, "role": "agent", "type": "success"}
    
    # CHECK FOR CREATE DRAFT COMMAND
    create_draft_keywords = ["create draft", "regenerate draft", "generate draft", "new draft", "draft again", "make another draft", "proceed", "proceed and create", "yes create", "go ahead", "make draft", "write draft"]
    if force_draft or any(k in msg_lower for k in create_draft_keywords):
        # Find existing prospects for this mission
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        
        if not prospects:
            fail_msg = "No prospects found for this mission yet. The agent is still working on discovery. Please wait a moment."
            await MissionLog(mission_id=mission_id, role="agent", content=fail_msg, log_type="error").insert()
            return {"message": fail_msg, "role": "agent", "type": "error"}
        
        # Pick the first prospect (or could pick one without a pending draft)
        prospect = prospects[0]
        
        await MissionLog(
            mission_id=mission_id, 
            role="agent", 
            content=f"Regenerating draft for {prospect.name}...", 
            log_type="thinking"
        ).insert()
        
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            
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

            human_prompt = f"""Target Context: {prospect.name} at {prospect.company}
Source: {prospect.context_source}
Relevance: {prospect.relevance_reason}
Mission: {mission.objective}
"""
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
            
            response = await llm.ainvoke(messages)
            content = response.content
            
            # Parse response
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
            
            # Clean up markdown
            subject = subject.replace("`", "").strip()
            body = body.replace("```", "").strip()
            
            # Save new draft
            new_draft = Draft(
                prospect_id=str(prospect.id),
                subject=subject,
                body=body,
                ai_reasoning=reasoning,
                status=DraftStatus.PENDING
            )
            await new_draft.insert()
            
            success_msg = f"Draft generated for {prospect.name}! Ready for review."
            await MissionLog(
                mission_id=mission_id, 
                role="agent", 
                content=success_msg, 
                log_type="success",
                metadata={"action": "draft_ready", "draft_id": str(new_draft.id), "mission_id": mission_id}
            ).insert()
            
            return {
                "message": success_msg,
                "role": "agent",
                "type": "success",
                "metadata": {"action": "draft_ready", "draft_id": str(new_draft.id), "mission_id": mission_id}
            }
            
        except Exception as e:
            error_msg = f"Failed to generate draft: {str(e)[:100]}"
            await MissionLog(mission_id=mission_id, role="agent", content=error_msg, log_type="error").insert()
            return {"message": error_msg, "role": "agent", "type": "error"}
    
    # CHECK FOR APPROVAL INTENT (only for sending already created drafts)
    approval_keywords = ["approve", "send it", "send the mail", "looks good", "send now", "approve and send", "all good send", "lgtm"]
    if any(k in msg_lower for k in approval_keywords):
        # Find pending draft for this mission
        # 1. Get prospects for mission
        prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
        prospect_ids = [str(p.id) for p in prospects]
        
        # 2. Find pending draft
        if prospect_ids:
            draft = await Draft.find_one(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.PENDING)
            
            if draft:
                # APPROVE IT
                draft.status = DraftStatus.APPROVED
                await draft.save()
                
                # Create Active Agent (Workflow)
                new_agent = Agent(
                    user_id=user.clerk_id,
                    name=f"Lead Workflow: {draft.subject[:20]}...",
                    description=f"Active engagement for mission {mission_id}",
                    status="active",
                    workflow={
                        "nodes": [
                            {"id": "1", "type": "trigger", "data": {"label": "Draft Approved"}, "position": {"x": 50, "y": 50}},
                            {"id": "2", "type": "action", "data": {"label": "Email Sent"}, "position": {"x": 50, "y": 150}},
                            {"id": "3", "type": "wait", "data": {"label": "Wait for Reply"}, "position": {"x": 50, "y": 250}}
                        ], 
                        "edges": [
                            {"id": "e1-2", "source": "1", "target": "2"},
                            {"id": "e2-3", "source": "2", "target": "3"}
                        ]
                    }
                )
                await new_agent.insert()
                
                # ATTEMPT TO SEND EMAIL
                from app.core.sender import send_email_via_composio
                send_status = "queued (no connection)"
                
                # Find prospect for email address
                prospect_map = {str(p.id): p for p in prospects}
                target_prospect = prospect_map.get(draft.prospect_id)
                recipient = target_prospect.public_contact if target_prospect else None
                
                if user.gmail_connection_id and recipient:
                    try:
                        attachments = getattr(draft, 'attachments', []) or []
                        await send_email_via_composio(
                            user.clerk_id,
                            recipient,
                            draft.subject,
                            draft.body,
                            attachments
                        )
                        send_status = "sent successfully"
                        start_msg = f"Draft approved and email sent to {recipient}!"
                    except Exception as e:

                        send_status = f"failed to send ({str(e)})"
                        start_msg = f"Draft approved but sending failed: {str(e)}"
                else:
                    if not recipient:
                        start_msg = "Draft approved, but I couldn't find an email address for this prospect."
                    else:
                        start_msg = f"Draft approved! However, your Gmail is not connected so I couldn't send data to {recipient}."
                
                # Log success
                await MissionLog(mission_id=mission_id, role="agent", content=start_msg, log_type="success").insert()
                
                return {
                    "message": start_msg,
                    "role": "agent",
                    "type": "success"
                }
            else:
                 # Check if recently approved
                 recent = await Draft.find_one(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.APPROVED)
                 if recent:
                     return {"message": "The draft was already approved and is being processed.", "role": "agent", "type": "success"}

        # No draft found
        fail_msg = "I don't see a pending draft to send yet. The background agent works on one prospect at a time. Please wait a moment or check the Review Queue."
        await MissionLog(mission_id=mission_id, role="agent", content=fail_msg, log_type="error").insert()
        return {"message": fail_msg, "role": "agent", "type": "error"}

    # =========================================================================
    # CHECK FOR DIRECT ACTION COMMANDS (Tool Execution via Composio)
    # =========================================================================
    action_patterns = {
        "twitter_post": ["post on twitter", "tweet this", "create a tweet", "post a tweet", "tweet:", "post to twitter", "send tweet"],
        "reddit_post": ["post on reddit", "create a reddit post", "post to reddit", "post in r/", "submit to reddit", "reddit post:"],
        "linkedin_post": ["post on linkedin", "create a linkedin post", "share on linkedin", "linkedin post:", "post to linkedin"],
        "slack_message": ["send to slack", "slack message", "post to slack", "message on slack", "notify slack"],
        "gmail_send": ["send email", "send an email", "email to", "compose email", "mail to"],
        "github_issue": ["create issue", "open issue", "github issue", "new issue on github"],
    }
    
    detected_action = None
    for action_type, patterns in action_patterns.items():
        if any(p in msg_lower for p in patterns):
            detected_action = action_type
            break
    
    if detected_action:
        # Extract content using LLM
        try:
            extract_llm = ChatGroq(
                temperature=0.0, 
                groq_api_key=settings.GROQ_API_KEY, 
                model_name="llama-3.1-8b-instant"
            )
            
            if detected_action == "twitter_post":
                extraction_prompt = [
                    SystemMessage(content="""Extract the tweet content from the user's message.
Return JSON only: {"tweet": "the tweet text", "ready": true/false}
Set ready=false if the content is unclear and needs clarification.
Max 280 characters for tweet."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            elif detected_action == "reddit_post":
                extraction_prompt = [
                    SystemMessage(content="""Extract Reddit post details from the user's message.
Return JSON only: {"subreddit": "subreddit_name", "title": "post title", "body": "post content", "ready": true/false}
Set ready=false if subreddit or content is unclear."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            elif detected_action == "linkedin_post":
                extraction_prompt = [
                    SystemMessage(content="""Extract LinkedIn post content from the user's message.
Return JSON only: {"content": "the post text", "ready": true/false}
Set ready=false if the content is unclear."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            elif detected_action == "slack_message":
                extraction_prompt = [
                    SystemMessage(content="""Extract Slack message details from the user's message.
Return JSON only: {"channel": "channel_name_or_id", "message": "the message text", "ready": true/false}
Set ready=false if channel or message is unclear."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            elif detected_action == "gmail_send":
                extraction_prompt = [
                    SystemMessage(content="""Extract email details from the user's message.
Return JSON only: {"to": "recipient@email.com", "subject": "email subject", "body": "email body", "ready": true/false}
Set ready=false if recipient email, subject, or body is unclear."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            elif detected_action == "github_issue":
                extraction_prompt = [
                    SystemMessage(content="""Extract GitHub issue details from the user's message.
Return JSON only: {"repo": "owner/repo", "title": "issue title", "body": "issue description", "ready": true/false}
Set ready=false if repo, title, or description is unclear."""),
                    HumanMessage(content=f"User: {chat.message}\nMission context: {mission.objective}")
                ]
            
            ex_res = await extract_llm.ainvoke(extraction_prompt)
            import json
            content_str = ex_res.content
            if "```json" in content_str:
                content_str = content_str.split("```json")[1].split("```")[0].strip()
            elif "```" in content_str:
                content_str = content_str.replace("```", "").strip()
            
            action_data = json.loads(content_str)
            
            if not action_data.get("ready", False):
                # Need more info
                clarify_msg = f"I detected you want to {detected_action.replace('_', ' ')}. Could you please provide more details?"
                if detected_action == "reddit_post":
                    clarify_msg += " What subreddit should I post to and what's the content?"
                elif detected_action == "twitter_post":
                    clarify_msg += " What would you like the tweet to say?"
                elif detected_action == "linkedin_post":
                    clarify_msg += " What would you like to post on LinkedIn?"
                elif detected_action == "slack_message":
                    clarify_msg += " What channel and message would you like to send?"
                elif detected_action == "gmail_send":
                    clarify_msg += " Who should I email, and what's the subject and message?"
                elif detected_action == "github_issue":
                    clarify_msg += " Which repo (owner/repo), what's the issue title and description?"
                await MissionLog(mission_id=mission_id, role="agent", content=clarify_msg, log_type="action").insert()
                return {"message": clarify_msg, "role": "agent", "type": "action"}
            
            # Helper function to get connection ID and handle missing connections
            async def get_connection_or_prompt(tool: str):
                """Get connection ID or create pending action and return connect prompt"""
                conn_id = None
                if tool == "slack":
                    conn_id = user.slack_connection_id
                elif tool == "gmail":
                    conn_id = user.gmail_connection_id
                else:
                    conn_id = user.other_connections.get(tool) if user.other_connections else None
                
                if conn_id:
                    return conn_id, None  # Connected, no prompt needed
                
                # Not connected - save pending action
                pending = PendingAction(
                    user_id=user.clerk_id,
                    mission_id=mission_id,
                    action_type=detected_action,
                    action_data=action_data,
                    tool=tool
                )
                await pending.insert()
                
                # Generate connect URL
                import httpx
                
                TOOL_CONFIG_MAP = {
                    "linkedin": "ac_SdzD1ondK6Zi",
                    "twitter": "ac_EjFjyYk1dXE2",
                    "reddit": "ac_2_IjyXggGH8F",
                    "github": "ac_UE__S2Ls9sMT",
                    "slack": "ac_YPQ1Q5xomR5i",
                    "gmail": settings.COMPOSIO_AUTH_CONFIG_ID
                }
                
                auth_config_id = TOOL_CONFIG_MAP.get(tool)
                if not auth_config_id:
                    return None, {"error": f"Unknown tool: {tool}"}
                
                # Create Composio connection request with redirect back to chat
                frontend_base = "http://localhost:5173"
                redirect_url = f"{frontend_base}/chat/{mission_id}?pending_action={pending.id}"
                
                url = "https://backend.composio.dev/api/v3/connected_accounts"
                headers = {"x-api-key": settings.COMPOSIO_API_KEY}
                payload = {
                    "auth_config": {"id": auth_config_id},
                    "connection": {"user_id": user.clerk_id},
                    "redirectUrl": redirect_url,
                    "redirect_uri": redirect_url
                }
                
                async with httpx.AsyncClient() as client:
                    resp = await client.post(url, json=payload, headers=headers, timeout=30.0)
                    if resp.status_code in [200, 201, 202]:
                        data = resp.json()
                        composio_redirect = data.get("redirectUrl") or data.get("redirect_url")
                        connection_id = data.get("id") or data.get("connection_id")
                        
                        # Pre-save the connection ID (will be activated after OAuth)
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
                        
                        return None, {
                            "connect_url": composio_redirect,
                            "pending_action_id": str(pending.id),
                            "tool": tool
                        }
                    else:
                        return None, {"error": f"Failed to create connection: {resp.text}"}
            
            # Map action types to tools
            tool_map = {
                "twitter_post": "twitter",
                "reddit_post": "reddit",
                "linkedin_post": "linkedin",
                "slack_message": "slack",
                "gmail_send": "gmail",
                "github_issue": "github"
            }
            tool = tool_map.get(detected_action, "unknown")
            
            # Check connection first
            connection_id, prompt = await get_connection_or_prompt(tool)
            if prompt:
                if "error" in prompt:
                    return {"message": prompt["error"], "role": "agent", "type": "error"}
                msg = f"To {detected_action.replace('_', ' ')}, I need you to connect your {tool.title()} account first. Click the button below to connect."
                await MissionLog(mission_id=mission_id, role="agent", content=msg, log_type="action", metadata={"action": "connect_tool", "tool": tool, "connect_url": prompt.get("connect_url"), "pending_action_id": prompt.get("pending_action_id")}).insert()
                return {"message": msg, "role": "agent", "type": "action", "metadata": {"action": "connect_tool", "tool": tool, "connect_url": prompt.get("connect_url"), "pending_action_id": prompt.get("pending_action_id")}}
            
            # Connected! Create a draft preview instead of auto-posting
            pending = PendingAction(
                user_id=user.clerk_id,
                mission_id=mission_id,
                action_type=detected_action,
                action_data=action_data,
                tool=tool
            )
            await pending.insert()
            
            # Format preview message based on action type
            preview_content = ""
            if detected_action == "twitter_post":
                preview_content = f"**Tweet Preview:**\n\n{action_data.get('tweet', '')}"
            elif detected_action == "reddit_post":
                preview_content = f"**Reddit Post Preview:**\n\n**Subreddit:** r/{action_data.get('subreddit', 'unknown')}\n\n**Title:** {action_data.get('title', '')}\n\n**Content:**\n{action_data.get('body', '')}"
            elif detected_action == "linkedin_post":
                preview_content = f"**LinkedIn Post Preview:**\n\n{action_data.get('content', '')}"
            elif detected_action == "slack_message":
                preview_content = f"**Slack Message Preview:**\n\n**Channel:** #{action_data.get('channel', 'general')}\n\n**Message:**\n{action_data.get('message', '')}"
            elif detected_action == "gmail_send":
                preview_content = f"**Email Preview:**\n\n**To:** {action_data.get('to', '')}\n**Subject:** {action_data.get('subject', '')}\n\n**Body:**\n{action_data.get('body', '')}"
            elif detected_action == "github_issue":
                preview_content = f"**GitHub Issue Preview:**\n\n**Repo:** {action_data.get('repo', '')}\n**Title:** {action_data.get('title', '')}\n\n**Body:**\n{action_data.get('body', '')}"
            
            # Log the preview with action button metadata
            await MissionLog(
                mission_id=mission_id,
                role="agent",
                content=preview_content,
                log_type="action",
                metadata={
                    "action": "draft_preview",
                    "action_type": detected_action,
                    "pending_action_id": str(pending.id),
                    "tool": tool,
                    "action_data": action_data
                }
            ).insert()
            
            return {
                "message": preview_content,
                "role": "agent",
                "type": "action",
                "metadata": {
                    "action": "draft_preview",
                    "action_type": detected_action,
                    "pending_action_id": str(pending.id),
                    "tool": tool,
                    "action_data": action_data
                }
            }
                
        except Exception as e:
            error_msg = f"Failed to process action: {str(e)[:100]}"
            await MissionLog(mission_id=mission_id, role="agent", content=error_msg, log_type="error").insert()
            return {"message": error_msg, "role": "agent", "type": "error"}

    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        system_prompt = f"""You are the Mission Control AI.
Mission Objective: {mission.objective}

GUIDELINES:
- Address the user's question about the mission.
- If they ask for status, say "Agents are active".
- Do NOT generate sample emails here.
- If they want to change the strategy, acknowledge it (but actual config update is manual for now).
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=chat.message)
        ]
        
        response = await llm.ainvoke(messages)
        ai_content = response.content
        
        # Save AI response as log
        ai_log = MissionLog(
            mission_id=mission_id,
            role="agent",
            content=ai_content,
            log_type="success"
        )
        await ai_log.insert()
        
        return {
            "message": ai_content,
            "role": "agent",
            "type": "success"
        }
        
    except Exception as e:
        error_msg = f"Sorry, I encountered an error: {str(e)[:100]}"
        # Save error log
        error_log = MissionLog(
            mission_id=mission_id,
            role="agent",
            content=error_msg,
            log_type="error"
        )
        await error_log.insert()
        
        return {
            "message": error_msg,
            "role": "agent",
            "type": "error"
        }

@router.delete("/{mission_id}")
async def delete_mission(mission_id: str, user: User = Depends(get_current_user)):
    """Delete a mission and its logs, drafts, and prospects"""
    from app.models import Draft, Prospect # Delayed import to avoid circular dependency
    
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Cascade Delete: Drafts -> Prospects -> Logs -> Mission
    from beanie.operators import In
    
    # Find all prospects for this mission
    prospects = await Prospect.find(Prospect.mission_id == mission_id).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    
    # Delete connected drafts
    if prospect_ids:
        await Draft.find(In(Draft.prospect_id, prospect_ids)).delete()
    
    # Delete prospects
    await Prospect.find(Prospect.mission_id == mission_id).delete()
    
    # Delete logs
    await MissionLog.find(MissionLog.mission_id == mission_id).delete()
    
    # Delete the mission
    await mission.delete()
    return {"status": "deleted", "mission_id": mission_id}

@router.patch("/{mission_id}/stop")
async def stop_mission(mission_id: str, user: User = Depends(get_current_user)):
    """Stop/pause a running mission"""
    mission = await Mission.get(mission_id)
    if not mission or mission.user_id != user.clerk_id:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    mission.status = "stopped"
    await mission.save()
    
    # Log the stop event
    log = MissionLog(
        mission_id=mission_id,
        role="system",
        content="Mission stopped by user",
        log_type="action"
    )
    await log.insert()
    
    return {"status": "stopped", "mission_id": mission_id}


