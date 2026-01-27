from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from beanie import PydanticObjectId

from app.models import EmailThread, EmailEvent, User, Mission, MissionLog
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/timeline")
async def get_email_timeline(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = 100,
    user: User = Depends(get_current_user)
):
    """
    Get all events for calendar display (Email + Agent Activity)
    """
    try:
        # 1. Fetch Email Threads
        email_query = {"user_id": user.clerk_id}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if end_date:
                date_filter["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if date_filter:
                email_query["last_activity"] = date_filter
        
        threads = await EmailThread.find(email_query).to_list()
        
        calendar_events = []
        for thread in threads:
            for event in thread.events:
                calendar_events.append({
                    "id": f"{thread.id}_{event.email_id}",
                    "thread_id": thread.thread_id,
                    "type": "email",
                    "event_type": event.type,
                    "timestamp": event.timestamp.isoformat(),
                    "subject": event.subject,
                    "preview": event.preview,
                    "from_email": event.from_email,
                    "to_email": event.to_email,
                    "status": thread.status,
                    "mission_id": thread.mission_id,
                    "prospect_id": thread.prospect_id
                })

        # 2. Fetch Mission Logs (Agent Activity)
        # First get user missions
        missions = await Mission.find({"user_id": user.clerk_id}).to_list()
        mission_ids = [str(m.id) for m in missions]
        
        if mission_ids:
            log_query = {"mission_id": {"$in": mission_ids}, "log_type": {"$in": ["action", "success", "error"]}}
            if start_date or end_date:
                 date_filter = {}
                 if start_date:
                     date_filter["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                 if end_date:
                     date_filter["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                 if date_filter:
                     log_query["timestamp"] = date_filter

            logs = await MissionLog.find(log_query).sort("-timestamp").limit(limit).to_list()
            
            for log in logs:
                calendar_events.append({
                    "id": str(log.id),
                    "type": "agent_log",
                    "timestamp": log.timestamp.isoformat(),
                    "content": log.content,
                    "role": log.role,
                    "metadata": log.metadata,
                    "mission_id": log.mission_id,
                    "log_type": log.log_type
                })
        
        # Sort combined events by timestamp desc
        calendar_events.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return calendar_events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline: {str(e)}")

@router.get("/threads/{thread_id}")
async def get_thread_details(
    thread_id: str,
    user: User = Depends(get_current_user)
):
    """
    Get complete conversation thread with all events
    """
    thread = await EmailThread.find_one({
        "thread_id": thread_id,
        "user_id": user.clerk_id
    })
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    return {
        "thread_id": thread.thread_id,
        "mission_id": thread.mission_id,
        "prospect_id": thread.prospect_id,
        "status": thread.status,
        "first_sent_at": thread.first_sent_at.isoformat() if thread.first_sent_at else None,
        "last_reply_at": thread.last_reply_at.isoformat() if thread.last_reply_at else None,
        "reply_count": thread.reply_count,
        "events": [
            {
                "type": event.type,
                "timestamp": event.timestamp.isoformat(),
                "email_id": event.email_id,
                "subject": event.subject,
                "preview": event.preview,
                "from_email": event.from_email,
                "to_email": event.to_email,
                "metadata": event.metadata
            }
            for event in thread.events
        ]
    }

@router.post("/threads/{thread_id}/events")
async def add_thread_event(
    thread_id: str,
    event_data: dict,
    user: User = Depends(get_current_user)
):
    """
    Add a new event to an existing thread (for reply detection)
    """
    thread = await EmailThread.find_one({
        "thread_id": thread_id,
        "user_id": user.clerk_id
    })
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Create new event
    new_event = EmailEvent(**event_data)
    thread.events.append(new_event)
    thread.last_activity = new_event.timestamp
    
    # Update status and counters
    if new_event.type == "reply_received":
        thread.status = "replied"
        thread.reply_count += 1
        thread.last_reply_at = new_event.timestamp
    elif new_event.type == "follow_up":
        thread.status = "waiting_reply"
    
    await thread.save()
    
    return {"message": "Event added successfully", "thread_id": thread.thread_id}
