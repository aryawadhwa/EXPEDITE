from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from beanie.operators import In
from pydantic import BaseModel

from app.models import ContactHistory, User
from app.core.auth import get_current_user

router = APIRouter()


class CheckDuplicatesRequest(BaseModel):
    emails: List[str]


class RecordContactRequest(BaseModel):
    email: str
    name: str = None
    mission_id: str
    thread_id: str = None


@router.get("/history")
async def get_contact_history(
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(get_current_user)
):
    """Get all previously contacted prospects"""
    contacts = await ContactHistory.find(
        ContactHistory.user_id == user.clerk_id
    ).sort(-ContactHistory.last_contacted_at).skip(skip).limit(limit).to_list()
    
    return contacts


@router.post("/check-duplicates")
async def check_duplicates(
    request: CheckDuplicatesRequest,
    user: User = Depends(get_current_user)
):
    """Check which emails have been contacted before"""
    normalized_emails = [email.lower().strip() for email in request.emails]
    
    existing = await ContactHistory.find(
        In(ContactHistory.prospect_email, normalized_emails),
        ContactHistory.user_id == user.clerk_id
    ).to_list()
    
    existing_map = {c.prospect_email: c for c in existing}
    
    duplicates = [
        {
            "email": email,
            "first_contacted": existing_map[email].first_contacted_at.isoformat(),
            "last_contacted": existing_map[email].last_contacted_at.isoformat(),
            "total_emails": existing_map[email].total_emails_sent,
            "has_replied": existing_map[email].has_replied,
            "status": existing_map[email].status
        }
        for email in normalized_emails
        if email in existing_map
    ]
    
    new_contacts = [
        email for email in normalized_emails
        if email not in existing_map
    ]
    
    return {
        "duplicates": duplicates,
        "new_contacts": new_contacts
    }


@router.post("/record")
async def record_contact(
    request: RecordContactRequest,
    user: User = Depends(get_current_user)
):
    """Record a new email contact or update existing"""
    email = request.email.lower().strip()
    
    existing = await ContactHistory.find_one(
        ContactHistory.user_id == user.clerk_id,
        ContactHistory.prospect_email == email
    )
    
    if existing:
        # Update existing
        existing.last_contacted_at = datetime.utcnow()
        existing.last_mission_id = request.mission_id
        existing.total_emails_sent += 1
        existing.updated_at = datetime.utcnow()
        if request.thread_id and request.thread_id not in existing.thread_ids:
            existing.thread_ids.append(request.thread_id)
        await existing.save()
        return existing
    else:
        # Create new
        contact = ContactHistory(
            user_id=user.clerk_id,
            prospect_email=email,
            prospect_name=request.name,
            first_mission_id=request.mission_id,
            last_mission_id=request.mission_id,
            thread_ids=[request.thread_id] if request.thread_id else []
        )
        await contact.insert()
        return contact


@router.get("/stats")
async def get_contact_stats(user: User = Depends(get_current_user)):
    """Get contact statistics"""
    total_contacts = await ContactHistory.find(
        ContactHistory.user_id == user.clerk_id
    ).count()
    
    replied_contacts = await ContactHistory.find(
        ContactHistory.user_id == user.clerk_id,
        ContactHistory.has_replied == True
    ).count()
    
    return {
        "total_contacts": total_contacts,
        "replied_contacts": replied_contacts,
        "reply_rate": (replied_contacts / total_contacts * 100) if total_contacts > 0 else 0
    }
