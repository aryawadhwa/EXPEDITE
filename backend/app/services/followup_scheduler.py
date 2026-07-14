from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.db import (
    Session,
    engine,
    create_followup_task_sql,
    create_draft_sql,
    create_or_get_prospect_sql,
    get_due_followups_sql,
    mark_followup_status_sql,
)


scheduler = AsyncIOScheduler()


def queue_followups(user_id: str, mission_id: str, prospect_email: str) -> None:
    # Queue D+3 and D+7 tasks.
    now = datetime.utcnow()
    with Session(engine) as session:
        create_followup_task_sql(
            session=session,
            user_id=user_id,
            mission_id=mission_id,
            prospect_email=prospect_email,
            due_at=now + timedelta(days=3),
            template="followup_d3_system.txt",
        )
        create_followup_task_sql(
            session=session,
            user_id=user_id,
            mission_id=mission_id,
            prospect_email=prospect_email,
            due_at=now + timedelta(days=7),
            template="followup_d7_system.txt",
        )


def process_due_followups() -> int:
    now = datetime.utcnow()
    created = 0
    with Session(engine) as session:
        tasks = get_due_followups_sql(session, now)
        for task in tasks:
            prospect = create_or_get_prospect_sql(
                session=session,
                mission_id=task.mission_id,
                user_id=task.user_id,
                name=task.prospect_email.split("@")[0],
                company="Unknown",
                email=task.prospect_email,
                verification_method="carry-forward",
                verification_confidence=70,
                email_format_valid=True,
                domain_has_mx=True,
                smtp_likely_deliverable=False,
                risk_flag="unknown",
            )
            day_label = "D+3" if "d3" in (task.template or "").lower() else "D+7"
            subject = f"Quick follow-up ({day_label})"
            body = (
                f"Hi {prospect.name},\n\n"
                "Following up on my previous note in case it got buried.\n"
                "Happy to share relevant project links or code snippets if useful.\n\n"
                "Best,\nArya"
            )
            create_draft_sql(
                session=session,
                mission_id=task.mission_id,
                user_id=task.user_id,
                prospect_id=prospect.id,
                channel=task.channel,
                subject=subject,
                body=body,
                ai_reasoning=f"Auto-generated follow-up draft from scheduler template {task.template}.",
                metadata={"followup_task_id": task.id, "template": task.template, "auto_generated": True},
            )
            mark_followup_status_sql(session, task.id, "created")
            created += 1
    return created


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(process_due_followups, "interval", minutes=5, id="followup_job", replace_existing=True)
    scheduler.start()
