from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.db import get_session, FollowupTaskSQL, ProspectSQL, DraftSQL
from app.services.followup_scheduler import queue_followups
from app.services.reply_classifier import classify_reply


router = APIRouter()


class ReplyClassifyRequest(BaseModel):
    text: str


class QueueFollowupRequest(BaseModel):
    mission_id: str
    prospect_email: str


@router.post("/reply/classify")
async def classify_reply_endpoint(req: ReplyClassifyRequest):
    return await classify_reply(req.text)


@router.post("/followups/queue")
async def queue_followups_endpoint(req: QueueFollowupRequest, user=Depends(get_current_user)):
    queue_followups(user.clerk_id, req.mission_id, req.prospect_email)
    return {"status": "queued", "mission_id": req.mission_id, "prospect_email": req.prospect_email}


@router.get("/followups")
async def list_followups(user=Depends(get_current_user), session: Session = Depends(get_session)):
    rows = session.exec(
        select(FollowupTaskSQL).where(FollowupTaskSQL.user_id == user.clerk_id).order_by(FollowupTaskSQL.due_at.asc())
    ).all()
    return [
        {
            "id": r.id,
            "mission_id": r.mission_id,
            "prospect_email": r.prospect_email,
            "template": r.template,
            "due_at": r.due_at.isoformat(),
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/proof-ledger")
async def proof_ledger(user=Depends(get_current_user), session: Session = Depends(get_session)):
    prospects = session.exec(
        select(ProspectSQL)
        .where(ProspectSQL.user_id == user.clerk_id)
        .order_by(ProspectSQL.created_at.desc())
    ).all()
    ledger = []
    for p in prospects:
        pending_count = session.exec(
            select(DraftSQL).where(
                DraftSQL.user_id == user.clerk_id,
                DraftSQL.prospect_id == p.id,
                DraftSQL.status == "PENDING",
            )
        ).all()
        ledger.append(
            {
                "prospect_id": p.id,
                "name": p.name,
                "company": p.company,
                "email": p.email,
                "source_url": p.source_url,
                "verification_method": p.verification_method,
                "email_format_valid": p.email_format_valid,
                "domain_has_mx": p.domain_has_mx,
                "smtp_likely_deliverable": p.smtp_likely_deliverable,
                "verification_confidence": p.verification_confidence,
                "risk_flag": p.risk_flag,
                "last_verified_at": p.created_at.isoformat(),
                "pending_draft_count": len(pending_count),
            }
        )
    return {"rows": ledger, "generated_at": datetime.utcnow().isoformat()}
