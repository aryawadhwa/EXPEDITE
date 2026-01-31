
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Draft, DraftStatus, User, Prospect, ContactHistory
from datetime import datetime
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/pending")
async def get_pending_drafts(mission_id: str = None, user: User = Depends(get_current_user)):
    from app.models import Mission, Prospect
    from beanie.operators import In

    # 1. Get missions for this user (optionally filtered)
    if mission_id:
        # Filter to specific mission
        mission = await Mission.get(mission_id)
        if not mission or mission.user_id != user.clerk_id:
            return []  # No access or not found
        missions = [mission]
    else:
        missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    mission_ids = [str(m.id) for m in missions]
    mission_map = {str(m.id): m for m in missions}
    
    # 2. Get all prospects for these missions
    prospects = await Prospect.find(In(Prospect.mission_id, mission_ids)).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    prospect_map = {str(p.id): p for p in prospects}
    
    # 3. Fetch pending drafts for these prospects ONLY
    drafts = await Draft.find(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.PENDING).to_list()
    
    result = []
    for draft in drafts:
        draft_dict = draft.model_dump()
        draft_dict["id"] = str(draft.id)
        
        # Ensure metadata is included
        if not draft_dict.get("metadata"):
            draft_dict["metadata"] = {}
        
        # Fetch associated prospect
        prospect = prospect_map.get(draft.prospect_id)
        
        if prospect:
            draft_dict["name"] = prospect.name
            draft_dict["company"] = prospect.company
            draft_dict["scraped_data"] = prospect.scraped_data
            draft_dict["mission_id"] = prospect.mission_id
            # Include mission objective for UI
            mission_obj = mission_map.get(prospect.mission_id)
            draft_dict["mission_objective"] = mission_obj.objective if mission_obj else None
        
        result.append(draft_dict)
    
    return result

@router.delete("/pending")
async def clear_all_pending_drafts(user: User = Depends(get_current_user)):
    """Delete all pending drafts for the user"""
    from app.models import Mission, Prospect
    from beanie.operators import In
    
    # 1. Get all missions for this user
    missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    mission_ids = [str(m.id) for m in missions]
    
    if not mission_ids:
        return {"status": "cleared", "count": 0}
        
    # 2. Get all prospects for these missions
    prospects = await Prospect.find(In(Prospect.mission_id, mission_ids)).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    
    if not prospect_ids:
        return {"status": "cleared", "count": 0}
         
    # 3. Delete pending drafts for these prospects
    result = await Draft.find(In(Draft.prospect_id, prospect_ids), Draft.status == DraftStatus.PENDING).delete()
    
    count = result.deleted_count if result else 0
    return {"status": "cleared", "count": count}

@router.post("/{id}/approve")
async def approve_draft(id: str, subject: str = None, body: str = None, user: User = Depends(get_current_user)):
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    if subject:
        draft.subject = subject
    if body:
        draft.body = body
        
    draft.status = DraftStatus.APPROVED 
    await draft.save()
    
    # 1. Create Active Agent (Workflow)
    from app.models import Agent, Prospect
    new_agent = Agent(
        user_id=user.clerk_id,
        name=f"Lead: {subject[:20] if subject else 'New Lead'}...",
        description=f"Active engagement workflow for draft {id}",
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


    # 2.5 Record in Contact History (The "Fix" for missing contacts)
    if draft.prospect_id:
        prospect = await Prospect.get(draft.prospect_id)
        if prospect and prospect.public_contact:
            # Check for existing contact
            email = prospect.public_contact.lower().strip()
            existing_contact = await ContactHistory.find_one(
                ContactHistory.user_id == user.clerk_id,
                ContactHistory.prospect_email == email
            )
            
            if existing_contact:
                existing_contact.last_contacted_at = datetime.utcnow()
                existing_contact.last_mission_id = prospect.mission_id
                existing_contact.total_emails_sent += 1
                await existing_contact.save()
            else:
                new_contact = ContactHistory(
                    user_id=user.clerk_id,
                    prospect_email=email,
                    prospect_name=prospect.name,
                    first_mission_id=prospect.mission_id,
                    last_mission_id=prospect.mission_id,
                    total_emails_sent=1
                )
                await new_contact.insert()

    # 2.6 Neo4j Contact Graph Update (Identity & Channel Storage)
    if draft.prospect_id:
        try:
            prospect = await Prospect.get(draft.prospect_id)
            if prospect and prospect.name:
                # 1. Resolve Person
                from app.services.neo4j import neo4j_service
                person_node = neo4j_service.resolve_person(prospect.name)
                
                # 2. Store Email Contact if available
                contact_email = prospect.public_contact or (prospect.scraped_data and prospect.scraped_data.get('email'))
                if contact_email:
                    neo4j_service.add_contact_method(prospect.name, "email", contact_email)
                    print(f"Neo4j: Linked {contact_email} to {prospect.name}")
                    
        except Exception as e:
            print(f"Neo4j Update Failed: {e}")



    # 2. Execute Outreach based on Channel using Composio integrations
    channel = draft.channel.lower() if draft.channel else "email"
    
    # Get recipient/target from prospect
    recipient = None
    if draft.prospect_id:
        from app.models import Prospect
        prospect = await Prospect.get(draft.prospect_id)
        if prospect:
            recipient = prospect.public_contact
            
    execution_result = {"success": False, "error": "No handler"}
    
    if channel in ["email", "gmail"] and user.gmail_connection_id:
        from app.core.sender import send_email_via_composio
        if recipient:
            print(f"Approved: Sending email to {recipient} via user {user.clerk_id}")
            attachments = getattr(draft, 'attachments', []) or []
            execution_result = await send_email_via_composio(
                user.clerk_id,
                recipient,
                draft.subject,
                draft.body,
                attachments  # Pass attachments to send function
            )
            print(f"Email result: {execution_result}")
        else:
            execution_result = {"success": False, "error": "No recipient email found"}
            
    elif channel == "linkedin":
        connection_id = user.other_connections.get("linkedin") if user.other_connections else None
        if connection_id:
            from app.integrations import linkedin
            metadata = getattr(draft, 'metadata', {}) or {}
            # If no recipient, it's a public post; otherwise it's a DM
            if recipient:
                print(f"Approved: Sending LinkedIn message to {recipient}")
                execution_result = await linkedin.send_message(user.clerk_id, recipient, draft.body)
            else:
                print(f"Approved: Publishing LinkedIn post")
                execution_result = await linkedin.publish_post(user.clerk_id, draft.body)
            print(f"LinkedIn result: {execution_result}")
        else:
            execution_result = {"success": False, "error": "LinkedIn not connected"}
            
    elif channel == "twitter":
        connection_id = user.other_connections.get("twitter") if user.other_connections else None
        if connection_id:
            from app.integrations import twitter
            print(f"Approved: Posting tweet")
            execution_result = await twitter.post_tweet(user.clerk_id, draft.body)
            print(f"Twitter result: {execution_result}")
        else:
            execution_result = {"success": False, "error": "Twitter not connected"}
            
    elif channel == "reddit":
        connection_id = user.other_connections.get("reddit") if user.other_connections else None
        
        if not connection_id:
            # ❌ NOT CONNECTED - Show clear error
            error_msg = "Reddit account not connected. Please connect Reddit in Settings → Integrations."
            print(f"ERROR: {error_msg}")
            
            execution_result = {"success": False, "error": error_msg}
            
            # Update draft to show error
            await db.drafts.update_one(
                {"_id": draft_id},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": error_msg,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        else:
            # ✅ CONNECTED - Proceed with posting
            from app.integrations import reddit
            # Extract subreddit from metadata, recipient, or use default
            metadata = getattr(draft, 'metadata', {}) or {}
            subreddit = metadata.get("subreddit")
            if not subreddit and recipient:
                subreddit = recipient.replace("r/", "") if recipient.startswith("r/") else recipient
            if not subreddit:
                subreddit = "test"
            print(f"Approved: Creating Reddit post in r/{subreddit}")
            execution_result = await reddit.create_post(
                user.clerk_id,
                subreddit,
                draft.subject or "Post",
                draft.body
            )
            print(f"Reddit result: {execution_result}")
            
            # Check if posting failed
            if not execution_result.get("success"):
                error_msg = execution_result.get("error", "Unknown error")
                await db.drafts.update_one(
                    {"_id": draft_id},
                    {
                        "$set": {
                            "status": "failed",
                            "error_message": f"Reddit API error: {error_msg}",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
    elif channel == "slack":
        # Get slack channel from metadata or recipient
        metadata = getattr(draft, 'metadata', {}) or {}
        slack_channel = metadata.get("slackChannel") or recipient or "general"
        if user.slack_connection_id:
            from app.integrations import slack
            print(f"Approved: Sending Slack message to #{slack_channel}")
            execution_result = await slack.send_message(
                user.clerk_id,
                slack_channel,
                draft.body
            )
            print(f"Slack result: {execution_result}")
        else:
            execution_result = {"success": False, "error": "Slack not connected"}
            
    elif channel == "github":
        connection_id = user.other_connections.get("github") if user.other_connections else None
        metadata = getattr(draft, 'metadata', {}) or {}
        repo = metadata.get("repo") or recipient
        if connection_id and repo:
            from app.integrations import github
            # recipient should be in format owner/repo
            import re
            match = re.search(r"([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)", recipient)
            if match:
                owner, repo = match.groups()
                print(f"Approved: Creating GitHub issue in {owner}/{repo}")
                execution_result = await github.create_issue(
                    user.clerk_id,
                    owner,
                    repo,
                    draft.subject or "Issue",
                    draft.body
                )
                print(f"GitHub result: {execution_result}")
            else:
                execution_result = {"success": False, "error": "Invalid repo format"}
        else:
            execution_result = {"success": False, "error": "GitHub not connected or no repo specified"}
    
    # Update draft status based on result
    if execution_result.get("success"):
        draft.status = DraftStatus.SENT
        await draft.save()
    
    # Log the result
    print(f"Execution result for {channel}: {execution_result}")

    return {
        "status": "approved", 
        "message": "Draft approved. Workflow started.",
        "workflow_created": True,
        "agent_id": str(new_agent.id)
    }

@router.post("/{id}/reject")
async def reject_draft(id: str, feedback: str, user: User = Depends(get_current_user)):
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    draft.status = DraftStatus.REJECTED
    await draft.save()
    
    # TODO: In a future implementation, could trigger agent to regenerate with feedback
    return {"status": "rejected", "message": "Draft rejected"}

@router.post("/{id}/regenerate")
async def regenerate_draft(id: str, user: User = Depends(get_current_user)):
    """Regenerate a draft using the AI model, preserving the original mission context"""
    from app.core.config import settings
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    from app.models import Mission
    
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Get prospect data and MISSION CONTEXT
    prospect_data = {}
    mission_objective = ""
    if draft.prospect_id:
        prospect = await Prospect.get(draft.prospect_id)
        if prospect:
            prospect_data = {
                "name": prospect.name,
                "company": prospect.company,
                "public_contact": prospect.public_contact,
                "scraped_data": prospect.scraped_data,
                "relevance_reason": prospect.relevance_reason
            }
            # Get mission objective for context
            if prospect.mission_id:
                mission = await Mission.get(prospect.mission_id)
                if mission:
                    mission_objective = mission.objective
    
    try:
        llm = ChatGroq(
            temperature=0.7, 
            groq_api_key=settings.GROQ_API_KEY, 
            model_name="llama-3.3-70b-versatile"
        )
        
        channel = (draft.channel or "email").lower()
        
        # Channel-specific prompts with MISSION CONTEXT
        if channel in ["email", "gmail"]:
            system_prompt = """You are an expert sales development representative (SDR). 
Write a personalized, professional outreach email that:
- Is 6-10 sentences (2-3 paragraphs)
- Has a compelling, specific subject line that relates to the mission/purpose
- Opens with something relevant to the prospect or their company
- Clearly explains the value proposition based on the MISSION OBJECTIVE
- Has a clear, specific call to action
- Sounds warm, human and conversational - not generic or salesy
- If there are attachments mentioned, reference them naturally in the body

IMPORTANT: The email MUST be relevant to the original mission objective provided.

Return your response in this exact format:
SUBJECT: [your subject line - make it specific to the mission]
BODY:
[your email body - 2-3 paragraphs, warm and professional]
REASONING: [1-2 sentences explaining your approach]"""

            human_prompt = f"""MISSION OBJECTIVE (the user's original request):
{mission_objective or 'Send a professional outreach email'}

PROSPECT INFORMATION:
Name: {prospect_data.get('name', 'Unknown')}
Company: {prospect_data.get('company', 'Unknown')}
Email: {prospect_data.get('public_contact', 'N/A')}
Why they're relevant: {prospect_data.get('relevance_reason', 'N/A')}
Additional Data: {str(prospect_data.get('scraped_data', {}))[:800]}

CURRENT DRAFT (to improve upon):
Subject: {draft.subject}
Body: {draft.body}

ATTACHMENTS: {len(draft.attachments or [])} file(s) attached

Write a better email that stays TRUE to the mission objective. The email should be warm, professional, and 2-3 paragraphs long. Reference any attachments if present."""

        elif channel == "twitter":
            system_prompt = """You are a social media expert. Write an engaging tweet that:
- Is under 280 characters
- Is catchy and gets engagement
- Relates to the MISSION OBJECTIVE
- Uses appropriate hashtags (1-2 max)
- Sounds authentic, not corporate

Return your response in this exact format:
BODY:
[your tweet]
REASONING: [why this tweet works]"""

            human_prompt = f"""MISSION OBJECTIVE: {mission_objective or 'Create an engaging tweet'}

Previous tweet: {draft.body}

Write a better, more engaging tweet that aligns with the mission objective."""

        elif channel == "linkedin":
            system_prompt = """You are a LinkedIn content expert. Write a professional LinkedIn post that:
- Is 150-300 words (not too short!)
- Has a hook in the first line
- Relates to the MISSION OBJECTIVE
- Provides genuine insights or value
- Encourages engagement without being salesy
- Uses appropriate line breaks for readability

Return your response in this exact format:
BODY:
[your post]
REASONING: [why this works]"""

            human_prompt = f"""MISSION OBJECTIVE: {mission_objective or 'Create an engaging LinkedIn post'}

Previous post: {draft.body[:500] if draft.body else ''}

Write a better, more engaging LinkedIn post that aligns with the mission objective. Make it 150-300 words."""

        elif channel == "reddit":
            metadata = draft.metadata or {}
            subreddit = metadata.get("subreddit", "unknown")
            system_prompt = f"""You are a Reddit power user. Write a post for r/{subreddit} that:
- Has a compelling, attention-grabbing title
- Provides genuine value to the community
- Is 2-4 paragraphs for text posts
- Follows typical Reddit etiquette
- Is authentic and not promotional
- Relates to the MISSION OBJECTIVE

Return your response in this exact format:
SUBJECT: [post title]
BODY:
[post content - 2-4 paragraphs]
REASONING: [why this works for this subreddit]"""

            human_prompt = f"""MISSION OBJECTIVE: {mission_objective or 'Create an engaging Reddit post'}

Subreddit: r/{subreddit}
Previous title: {draft.subject}
Previous content: {draft.body[:500] if draft.body else ''}

Write a better post for r/{subreddit} that aligns with the mission objective."""

        elif channel == "slack":
            metadata = draft.metadata or {}
            slack_channel = metadata.get("slackChannel", "general")
            system_prompt = f"""You are writing a Slack message for #{slack_channel}. Write a message that:
- Is clear and well-structured
- Is appropriate for workplace communication
- Gets the point across effectively
- Can be a few sentences to a paragraph

Return your response in this exact format:
BODY:
[your message]
REASONING: [why this works]"""

            human_prompt = f"""MISSION OBJECTIVE: {mission_objective or 'Send a Slack message'}

Channel: #{slack_channel}
Previous message: {draft.body}

Write a better Slack message that aligns with the mission objective."""

        else:
            # Generic fallback
            system_prompt = """You are a content expert. Rewrite this content to be more engaging and effective.

Return your response in this exact format:
SUBJECT: [title/subject if applicable]
BODY:
[your content]
REASONING: [why this works]"""

            human_prompt = f"""Previous content:
Subject: {draft.subject}
Body: {draft.body}

Write a better version."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ]
        
        response = await llm.ainvoke(messages)
        content = response.content
        
        # Parse the response
        subject = draft.subject  # Keep existing subject as fallback
        body = content
        reasoning = "AI-regenerated content"
        
        if "SUBJECT:" in content:
            parts = content.split("BODY:")
            subject = parts[0].replace("SUBJECT:", "").strip()
            if len(parts) > 1:
                remaining = parts[1]
                if "REASONING:" in remaining:
                    body_parts = remaining.split("REASONING:")
                    body = body_parts[0].strip()
                    reasoning = body_parts[1].strip() if len(body_parts) > 1 else ""
                else:
                    body = remaining.strip()
        elif "BODY:" in content:
            parts = content.split("BODY:")
            if len(parts) > 1:
                remaining = parts[1]
                if "REASONING:" in remaining:
                    body_parts = remaining.split("REASONING:")
                    body = body_parts[0].strip()
                    reasoning = body_parts[1].strip() if len(body_parts) > 1 else ""
                else:
                    body = remaining.strip()
        
        # Update draft
        draft.subject = subject
        draft.body = body
        draft.ai_reasoning = reasoning
        draft.status = DraftStatus.PENDING
        await draft.save()
        
        return {
            "status": "regenerated",
            "subject": subject,
            "body": body,
            "ai_reasoning": reasoning
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate: {str(e)}")


from pydantic import BaseModel
from typing import List, Optional

class AttachmentUpdate(BaseModel):
    asset_ids: List[str]  # List of UserAsset IDs to attach

@router.post("/{id}/attachments")
async def update_draft_attachments(id: str, data: AttachmentUpdate, user: User = Depends(get_current_user)):
    """Update attachments for a draft by selecting from Knowledge Assets"""
    from app.models import UserAsset
    
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Validate and fetch asset info
    attachments = []
    for asset_id in data.asset_ids:
        asset = await UserAsset.get(asset_id)
        if asset and asset.user_id == user.clerk_id:
            attachments.append({
                "asset_id": str(asset.id),
                "filename": asset.filename,
                "content_type": asset.content_type
            })
    
    draft.attachments = attachments
    await draft.save()
    
    return {
        "status": "updated",
        "attachments": attachments
    }

@router.get("/{id}/available-assets")
async def get_available_assets(id: str, user: User = Depends(get_current_user)):
    """Get list of user's Knowledge Assets that can be attached to this draft"""
    from app.models import UserAsset
    
    # Get all user's assets
    assets = await UserAsset.find(UserAsset.user_id == user.clerk_id).to_list()
    
    return [
        {
            "id": str(asset.id),
            "filename": asset.filename,
            "content_type": asset.content_type,
            "size": len(asset.file_data) if asset.file_data else 0
        }
        for asset in assets
    ]

