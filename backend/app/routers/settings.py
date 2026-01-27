from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_current_user
from app.models import User, UserSettings

router = APIRouter()


class SettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    daily_digest_time: Optional[str] = None
    auto_approve_low_risk: Optional[bool] = None
    personalization_threshold: Optional[int] = None
    daily_sending_limit: Optional[int] = None


@router.get("/")
async def get_settings(user: User = Depends(get_current_user)):
    """Get current user settings"""
    # Ensure settings field exists (for older users)
    if not hasattr(user, 'settings') or user.settings is None:
        user.settings = UserSettings()
        await user.save()
    
    return {
        "email_notifications": user.settings.email_notifications,
        "daily_digest_time": user.settings.daily_digest_time,
        "auto_approve_low_risk": user.settings.auto_approve_low_risk,
        "personalization_threshold": user.settings.personalization_threshold,
        "daily_sending_limit": user.settings.daily_sending_limit,
    }


@router.patch("/")
async def update_settings(update: SettingsUpdate, user: User = Depends(get_current_user)):
    """Update user settings"""
    # Ensure settings field exists
    if not hasattr(user, 'settings') or user.settings is None:
        user.settings = UserSettings()
    
    # Update only provided fields
    if update.email_notifications is not None:
        user.settings.email_notifications = update.email_notifications
    if update.daily_digest_time is not None:
        user.settings.daily_digest_time = update.daily_digest_time
    if update.auto_approve_low_risk is not None:
        user.settings.auto_approve_low_risk = update.auto_approve_low_risk
    if update.personalization_threshold is not None:
        user.settings.personalization_threshold = update.personalization_threshold
    if update.daily_sending_limit is not None:
        user.settings.daily_sending_limit = update.daily_sending_limit
    
    await user.save()
    
    return {
        "status": "updated",
        "settings": {
            "email_notifications": user.settings.email_notifications,
            "daily_digest_time": user.settings.daily_digest_time,
            "auto_approve_low_risk": user.settings.auto_approve_low_risk,
            "personalization_threshold": user.settings.personalization_threshold,
            "daily_sending_limit": user.settings.daily_sending_limit,
        }
    }
