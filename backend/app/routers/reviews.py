
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models import Draft, DraftStatus, User, Prospect, ContactHistory
from datetime import datetime
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/pending")
async def get_pending_drafts(
    mission_id: str = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user)
):
    """
    Get pending drafts with pagination.
    
    Args:
        mission_id: Optional mission ID to filter
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return (max 100)
        user: Current authenticated user
        
    Returns:
        List of drafts (for backward compatibility) or paginated object
    """
    from app.models import Mission, Prospect
    from beanie.operators import In

    # Enforce pagination limits
    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 1
    if skip < 0:
        skip = 0

    # 1. Get missions for this user (optionally filtered)
    if mission_id:
        # Filter to specific mission
        mission = await Mission.get(mission_id)
        if not mission or mission.user_id != user.clerk_id:
            return []  # Return empty array for backward compatibility
        missions = [mission]
    else:
        missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    mission_ids = [str(m.id) for m in missions]
    mission_map = {str(m.id): m for m in missions}
    
    # 2. Get all prospects for these missions
    prospects = await Prospect.find(In(Prospect.mission_id, mission_ids)).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    prospect_map = {str(p.id): p for p in prospects}
    
    # 3. Fetch pending drafts with pagination
    drafts_query = Draft.find(
        In(Draft.prospect_id, prospect_ids),
        Draft.status == DraftStatus.PENDING
    ).sort("-created_at")  # Newest first
    
    total = await drafts_query.count()
    drafts = await drafts_query.skip(skip).limit(limit).to_list()
    
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
    
    # Return simple array for backward compatibility
    # Frontend can be updated later to use pagination
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

@router.post("/approve-all")
async def approve_all_drafts(mission_id: str = None, user: User = Depends(get_current_user)):
    """
    Approve and send all pending drafts for a mission or all missions.
    
    Args:
        mission_id: Optional mission ID to filter drafts
        user: Current authenticated user
        
    Returns:
        Dict with sent_count, failed_count, and message
    """
    from app.models import Mission, Prospect
    from beanie.operators import In
    import re
    
    # Get missions
    if mission_id:
        mission = await Mission.get(mission_id)
        if not mission or mission.user_id != user.clerk_id:
            raise HTTPException(status_code=404, detail="Mission not found")
        missions = [mission]
    else:
        missions = await Mission.find(Mission.user_id == user.clerk_id).to_list()
    
    mission_ids = [str(m.id) for m in missions]
    
    # Get prospects
    prospects = await Prospect.find(In(Prospect.mission_id, mission_ids)).to_list()
    prospect_ids = [str(p.id) for p in prospects]
    prospect_map = {str(p.id): p for p in prospects}
    
    # Get pending drafts
    drafts = await Draft.find(
        In(Draft.prospect_id, prospect_ids),
        Draft.status == DraftStatus.PENDING
    ).to_list()
    
    if not drafts:
        return {"sent_count": 0, "failed_count": 0, "message": "No pending drafts"}
    
    # Check Gmail connection
    if not user.gmail_connection_id:
        raise HTTPException(
            status_code=400,
            detail="Gmail not connected. Please connect Gmail in Settings → Integrations"
        )
    
    sent_count = 0
    failed_count = 0
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    from app.core.sender import send_email_via_composio
    
    print(f"\n{'='*60}")
    print(f"BULK APPROVE: Processing {len(drafts)} drafts")
    print(f"{'='*60}")
    
    for i, draft in enumerate(drafts, 1):
        try:
            prospect = prospect_map.get(draft.prospect_id)
            if not prospect or not prospect.public_contact:
                print(f"{i}/{len(drafts)}  No email for prospect")
                failed_count += 1
                continue
            
            # Validate email
            if not re.match(email_pattern, prospect.public_contact):
                print(f"{i}/{len(drafts)}  Invalid email: {prospect.public_contact}")
                draft.status = DraftStatus.REJECTED
                await draft.save()
                failed_count += 1
                continue
            
            print(f"{i}/{len(drafts)} → Sending to {prospect.name} ({prospect.public_contact})...")
            
            # Send email
            result = await send_email_via_composio(
                user_id=user.clerk_id,
                recipient=prospect.public_contact,
                subject=draft.subject,
                body=draft.body,
                attachments=getattr(draft, 'attachments', []) or []
            )
            
            if result.get("success"):
                draft.status = DraftStatus.SENT
                await draft.save()
                print(f"{i}/{len(drafts)}  Sent successfully")
                sent_count += 1
                
                # Update contact history
                try:
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
                except Exception as e:
                    print(f"   Contact history update failed: {e}")
                    
            else:
                error_msg = result.get("error", "Unknown error")
                print(f"{i}/{len(drafts)}  Send failed: {error_msg}")
                draft.status = DraftStatus.APPROVED
                await draft.save()
                failed_count += 1
                
        except Exception as e:
            print(f"{i}/{len(drafts)}  Exception: {e}")
            failed_count += 1
    
    print(f"{'='*60}")
    print(f"BULK APPROVE COMPLETE: {sent_count} sent, {failed_count} failed")
    print(f"{'='*60}\n")
    
    return {
        "sent_count": sent_count,
        "failed_count": failed_count,
        "message": f"Sent {sent_count} emails, {failed_count} failed"
    }

@router.post("/{id}/approve")
async def approve_draft(id: str, subject: str = None, body: str = None, user: User = Depends(get_current_user)):
    """
    Approve and send a draft email.
    
    This endpoint:
    1. Updates draft with any edits
    2. Validates recipient email
    3. Sends email via Composio
    4. Updates contact history
    5. Updates Neo4j graph
    6. Creates workflow agent
    """
    # 1. Get and validate draft
    draft = await Draft.get(id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # 2. Apply any edits
    if subject:
        draft.subject = subject
    if body:
        draft.body = body
    
    # 3. Get prospect and validate
    if not draft.prospect_id:
        raise HTTPException(status_code=400, detail="Draft has no associated prospect")
    
    prospect = await Prospect.get(draft.prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    
    # 4. Validate recipient email
    recipient = prospect.public_contact
    if not recipient:
        draft.status = DraftStatus.REJECTED
        await draft.save()
        raise HTTPException(status_code=400, detail="Prospect has no email address")
    
    # Validate email format (not a URL)
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, recipient):
        draft.status = DraftStatus.REJECTED
        await draft.save()
        error_msg = f"Invalid email format: '{recipient}'. Expected format: user@domain.com"
        print(f"ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    # 5. Check Gmail connection
    if not user.gmail_connection_id:
        raise HTTPException(
            status_code=400, 
            detail="Gmail not connected. Please connect Gmail in Settings → Integrations"
        )
    
    # 6. Mark as approved
    draft.status = DraftStatus.APPROVED
    await draft.save()
    
    print(f" Draft approved for {prospect.name} ({recipient})")
    
    # 7. Send email via Composio
    from app.core.sender import send_email_via_composio
    
    try:
        print(f"→ Sending email to {recipient} via Composio...")
        attachments = getattr(draft, 'attachments', []) or []
        
        execution_result = await send_email_via_composio(
            user_id=user.clerk_id,
            recipient=recipient,
            subject=draft.subject,
            body=draft.body,
            attachments=attachments
        )
        
        print(f"← Composio result: {execution_result}")
        
        if not execution_result.get("success"):
            # Email failed to send
            error_msg = execution_result.get("error", "Unknown error")
            print(f" Email send failed: {error_msg}")
            
            # Keep as APPROVED but don't mark as SENT
            return {
                "status": "approved_but_failed",
                "message": f"Draft approved but email failed to send: {error_msg}",
                "error": error_msg,
                "workflow_created": False
            }
        
        # 8. Email sent successfully - update draft status
        draft.status = DraftStatus.SENT
        await draft.save()
        
        print(f" Email sent successfully to {recipient}")
        
    except Exception as e:
        print(f" Exception during email send: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "status": "approved_but_failed",
            "message": f"Draft approved but email failed to send: {str(e)}",
            "error": str(e),
            "workflow_created": False
        }
    
    # 9. Update Contact History
    try:
        email = recipient.lower().strip()
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
        
        print(f" Contact history updated for {email}")
    except Exception as e:
        print(f" Failed to update contact history: {e}")
    
    # 10. Update Neo4j Contact Graph
    try:
        from app.services.neo4j import neo4j_service
        if prospect.name:
            neo4j_service.resolve_person(prospect.name)
            if recipient:
                neo4j_service.add_contact_method(prospect.name, "email", recipient)
                print(f" Neo4j: Linked {recipient} to {prospect.name}")
    except Exception as e:
        print(f" Neo4j update failed: {e}")
    
    # 11. Create Active Agent (Workflow)
    try:
        from app.models import Agent
        new_agent = Agent(
            user_id=user.clerk_id,
            name=f"Lead: {prospect.name[:30]}",
            description=f"Active engagement workflow for {prospect.name} at {prospect.company}",
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
        print(f" Workflow agent created: {new_agent.name}")
        
        return {
            "status": "sent",
            "message": f"Email sent successfully to {recipient}",
            "workflow_created": True,
            "agent_id": str(new_agent.id),
            "recipient": recipient
        }
    except Exception as e:
        print(f" Failed to create workflow agent: {e}")
        return {
            "status": "sent",
            "message": f"Email sent successfully to {recipient}",
            "workflow_created": False,
            "recipient": recipient
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
    
    from beanie.operators import In
    from bson import ObjectId

    # Validate and fetch asset info using a bulk query to avoid N+1
    attachments = []

    if data.asset_ids:
        try:
            unique_asset_ids = list(set(data.asset_ids))
            object_ids = [ObjectId(id) for id in unique_asset_ids]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")

        assets = await UserAsset.find(In(UserAsset.id, object_ids)).to_list()
        asset_map = {str(a.id): a for a in assets if a.user_id == user.clerk_id}

        for asset_id in data.asset_ids:
            asset = asset_map.get(asset_id)
            if asset:
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

