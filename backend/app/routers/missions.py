from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict
from app.models import Mission, User, MissionLog
from app.api.deps import get_current_user
from app.core.agent import run_mission_agent
from pydantic import BaseModel
import asyncio

router = APIRouter()

class MissionCreate(BaseModel):
    objective: str
    attachments: Optional[List[Dict]] = []  # List of {asset_id, filename, content_type}

@router.post("/", response_model=Mission)
async def create_mission(mission_in: MissionCreate, user: User = Depends(get_current_user)):
    mission = Mission(user_id=user.clerk_id, objective=mission_in.objective)
    await mission.insert()
    
    # Save initial log entry
    attachment_msg = ""
    if mission_in.attachments:
        attachment_msg = f" with {len(mission_in.attachments)} attachment(s)"
    initial_log = MissionLog(
        mission_id=str(mission.id),
        role="system",
        content=f"Mission started: {mission_in.objective}{attachment_msg}",
        log_type="success"
    )
    await initial_log.insert()
    
    # Trigger background agent with attachments
    asyncio.create_task(run_mission_agent(str(mission.id), mission_in.objective, user.clerk_id, mission_in.attachments or []))
    
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
    
    # CHECK FOR EMAIL UPDATE
    import re
    email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    found_emails = re.findall(email_regex, chat.message)
    
    force_draft = False
    
    if found_emails:
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
    create_draft_keywords = ["create draft", "regenerate draft", "generate draft", "new draft", "draft again", "make another draft"]
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
    
    # CHECK FOR APPROVAL INTENT
    approval_keywords = ["approve", "send it", "send the mail", "looks good", "proceed"]
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


