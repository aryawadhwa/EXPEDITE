"""
Vapi Voice Agent Service
Handles outbound call initiation and callback handling.
"""
import httpx
import logging
from app.core.config import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

VAPI_BASE_URL = "https://api.vapi.ai"


async def trigger_call(
    phone_number: str,
    intent: str,
    first_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Initiate an outbound call via Vapi.

    Args:
        phone_number: E.164 format phone number (e.g., +919876543210)
        intent: The objective/system prompt for the AI caller
        first_message: Optional opening message the AI should say
        metadata: Optional metadata dict to pass to the call (e.g. mission_id)

    Returns:
        Dict with call_id and status
    """
    if not settings.VAPI_API_KEY:
        return {"success": False, "error": "VAPI_API_KEY not configured"}

    if not settings.VAPI_PHONE_NUMBER_ID:
        return {"success": False, "error": "VAPI_PHONE_NUMBER_ID not configured"}

    headers = {
        "Authorization": f"Bearer {settings.VAPI_API_KEY}",
        "Content-Type": "application/json",
    }

    # Use existing assistant ID if configured, otherwise create transient
    if settings.VAPI_ASSISTANT_ID:
        payload = {
            "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
            "assistantId": settings.VAPI_ASSISTANT_ID,
            "customer": {"number": phone_number},
            "assistantOverrides": {
                "firstMessage": first_message,
                "model": {
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "system", "content": intent}],
                },
                "metadata": metadata or {},
            },
        }
    else:
        # Transient assistant
        payload = {
            "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
            "customer": {"number": phone_number},
            "assistant": {
                "firstMessage": first_message or "Hello, this is an AI assistant. Is this a good time to talk?",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "system", "content": intent}],
                },
                "voice": {"provider": "11labs", "voiceId": "21m00Tcm4TlvDq8ikWAM"},
                "metadata": metadata or {},
            },
        }

    logger.info(f"[VAPI] Initiating call to {phone_number}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{VAPI_BASE_URL}/call",
                headers=headers,
                json=payload,
            )
            logger.debug(f"[VAPI] Response {response.status_code}: {response.text[:200]}")

            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    "success": True,
                    "call_id": data.get("id"),
                    "status": data.get("status"),
                    "data": data,
                }
            else:
                return {
                    "success": False,
                    "error": f"Vapi API error: {response.status_code}",
                    "details": response.text,
                }
    except Exception as e:
        logger.error(f"[VAPI] Exception: {e}")
        return {"success": False, "error": str(e)}


async def get_call_status(call_id: str) -> Dict[str, Any]:
    """Get the current status and transcript of a call."""
    if not settings.VAPI_API_KEY:
        return {"success": False, "error": "VAPI_API_KEY not configured"}

    headers = {"Authorization": f"Bearer {settings.VAPI_API_KEY}"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{VAPI_BASE_URL}/call/{call_id}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"[VAPI STATUS] Call {call_id}: {data.get('status')}")
                return {
                    "success": True,
                    "call_id": call_id,
                    "status": data.get("status"),
                    "transcript": data.get("transcript"),
                    "summary": data.get("summary"),
                    "duration": data.get("duration"),
                    "data": data,
                }
            else:
                return {"success": False, "error": f"Vapi API error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
