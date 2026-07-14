"""
Voice Agent API endpoints.
Allows frontend to trigger outbound Vapi calls and poll call status.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models import User
from app.api.deps import get_current_user
from app.services.voice import trigger_call, get_call_status
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class CallRequest(BaseModel):
    phone_number: str       # E.164 format: +919876543210
    intent: str             # What the AI should say/achieve
    first_message: Optional[str] = None
    mission_id: Optional[str] = None  # Optional – passed as call metadata


class CallResponse(BaseModel):
    success: bool
    call_id: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None
    details: Optional[str] = None


@router.post("/call", response_model=CallResponse)
async def initiate_call(
    request: CallRequest,
    user: User = Depends(get_current_user),
):
    """
    Initiate an outbound voice call via Vapi.

    - **phone_number**: Target in E.164 format (e.g., +919876543210)
    - **intent**: System prompt / script for the AI caller
    - **first_message**: Optional custom opening line
    - **mission_id**: Optional – linked to a EXPEDITE mission for logging
    """
    if not request.phone_number.startswith("+"):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be in E.164 format (e.g., +919876543210)",
        )

    logger.info(f"[VOICE] User {user.clerk_id} initiating call to {request.phone_number}")

    metadata = {}
    if request.mission_id:
        metadata["mission_id"] = request.mission_id

    result = await trigger_call(
        phone_number=request.phone_number,
        intent=request.intent,
        first_message=request.first_message,
        metadata=metadata,
    )

    if result["success"]:
        logger.info(f"[VOICE] Call initiated – id={result['call_id']}")
        return CallResponse(
            success=True,
            call_id=result["call_id"],
            status=result.get("status", "initiated"),
        )
    else:
        logger.error(f"[VOICE ERROR] {result.get('error')} | {result.get('details', '')}")
        return CallResponse(
            success=False,
            error=result.get("error", "Unknown error"),
            details=result.get("details"),
        )


@router.get("/call/{call_id}")
async def get_call_details(call_id: str, user: User = Depends(get_current_user)):
    """Get the status and transcript of a call by call_id."""
    return await get_call_status(call_id)
