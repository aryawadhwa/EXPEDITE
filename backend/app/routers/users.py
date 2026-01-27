
from fastapi import APIRouter, Depends
from app.models import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    """Get current user profile"""
    return user
