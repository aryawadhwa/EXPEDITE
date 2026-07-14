"""
Webhook endpoints for external service callbacks.
"""
from fastapi import APIRouter, Request
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/vapi")
async def vapi_webhook(request: Request):
    """
    Handle Vapi webhook callbacks.

    Events handled:
    - end-of-call-report: Call completed (includes transcript/summary)
    - status-update: Call status changed
    - transcript: Real-time transcript updates
    """
    try:
        payload = await request.json()
        event_type = payload.get("type") or payload.get("message", {}).get("type", "unknown")

        logger.info(f"[VAPI WEBHOOK] event={event_type}")

        if event_type == "end-of-call-report":
            call_data = payload.get("call") or payload
            call_id  = call_data.get("id")
            transcript = call_data.get("transcript")
            summary  = call_data.get("summary")
            duration = call_data.get("duration")
            status   = call_data.get("status")

            logger.info(f"[VAPI] Call {call_id} ended | status={status} duration={duration}s")

            # Resolve mission_id from metadata (assistant or top-level)
            mission_id = (
                call_data.get("assistant", {}).get("metadata", {}).get("mission_id")
                or call_data.get("metadata", {}).get("mission_id")
            )

            if mission_id:
                try:
                    from app.core.agent import log_event
                    from app.models import Mission

                    mission = await Mission.get(mission_id)
                    user_id = mission.user_id if mission else "unknown"

                    await log_event(
                        mission_id,
                        user_id,
                        (
                            f"📞 Call completed.\n\n"
                            f"**Summary:** {summary}\n\n"
                            f"**Duration:** {duration}s | **Status:** {status}"
                        ),
                        "success",
                        metadata={
                            "type": "voice_call",
                            "call_id": call_id,
                            "transcript": transcript,
                        },
                    )
                except Exception as ex:
                    logger.warning(f"[VAPI WEBHOOK] Failed to log to mission {mission_id}: {ex}")

            return {"status": "received", "call_id": call_id, "summary": summary}

        elif event_type == "status-update":
            status = payload.get("message", {}).get("status")
            logger.debug(f"[VAPI] Status update: {status}")
            return {"status": "acknowledged"}

        elif event_type == "transcript":
            transcript = payload.get("message", {}).get("transcript")
            logger.debug(f"[VAPI] Transcript update received")
            return {"status": "acknowledged"}

        return {"status": "received", "event": event_type}

    except Exception as e:
        logger.error(f"[VAPI WEBHOOK ERROR] {e}")
        # Always return 200 to prevent Vapi retry storms
        return {"status": "error", "message": str(e)}


@router.get("/vapi/health")
async def vapi_health():
    """Health check for webhook endpoint."""
    return {"status": "ok", "service": "vapi-webhook"}
