from datetime import datetime
from typing import Generator, Optional
from uuid import uuid4
import json

from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlmodel import and_

from app.core.config import settings


def _default_database_url() -> str:
    # Local default for zero-config boot.
    return "sqlite:///./data/expedite.db"


DATABASE_URL = getattr(settings, "DATABASE_URL", None) or _default_database_url()
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=CONNECT_ARGS)


class MissionSQL(SQLModel, table=True):
    __tablename__ = "missions"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    objective: str
    status: str = "running"
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class MissionLogSQL(SQLModel, table=True):
    __tablename__ = "mission_logs"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    mission_id: str = Field(index=True)
    role: str
    content: str
    log_type: str = "action"
    metadata_json: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class FollowupTaskSQL(SQLModel, table=True):
    __tablename__ = "followup_tasks"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(index=True)
    mission_id: str = Field(index=True)
    prospect_email: str = Field(index=True)
    channel: str = "email"
    template: str = "followup_d3_system.txt"
    due_at: datetime = Field(index=True)
    status: str = "queued"  # queued | created | skipped
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class ProspectSQL(SQLModel, table=True):
    __tablename__ = "prospects"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    mission_id: str = Field(index=True)
    user_id: str = Field(index=True)
    name: str
    company: str = "Unknown"
    email: str = ""
    source_url: str = ""
    verification_method: str = "unknown"
    verification_confidence: int = 0
    email_format_valid: bool = False
    domain_has_mx: bool = False
    smtp_likely_deliverable: bool = False
    risk_flag: str = "unknown"  # safe | unknown | high-risk
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class DraftSQL(SQLModel, table=True):
    __tablename__ = "drafts"
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    mission_id: str = Field(index=True)
    user_id: str = Field(index=True)
    prospect_id: Optional[str] = Field(default=None, index=True)
    channel: str = "email"
    subject: str = ""
    body: str = ""
    ai_reasoning: str = ""
    status: str = "PENDING"
    attachments_json: str = "[]"
    metadata_json: str = "{}"
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


def init_sqlite_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def create_mission_sql(session: Session, user_id: str, objective: str) -> MissionSQL:
    mission = MissionSQL(user_id=user_id, objective=objective)
    session.add(mission)
    session.commit()
    session.refresh(mission)
    return mission


def add_mission_log_sql(
    session: Session,
    mission_id: str,
    role: str,
    content: str,
    log_type: str = "action",
    metadata_json: Optional[str] = None,
) -> MissionLogSQL:
    log = MissionLogSQL(
        mission_id=mission_id,
        role=role,
        content=content,
        log_type=log_type,
        metadata_json=metadata_json,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


def list_missions_sql(session: Session, user_id: str) -> list[MissionSQL]:
    stmt = (
        select(MissionSQL)
        .where(MissionSQL.user_id == user_id)
        .order_by(MissionSQL.created_at.desc())
    )
    return list(session.exec(stmt).all())


def get_mission_sql(session: Session, mission_id: str) -> Optional[MissionSQL]:
    return session.get(MissionSQL, mission_id)


def list_logs_sql(session: Session, mission_id: str) -> list[MissionLogSQL]:
    stmt = (
        select(MissionLogSQL)
        .where(MissionLogSQL.mission_id == mission_id)
        .order_by(MissionLogSQL.timestamp.asc())
    )
    return list(session.exec(stmt).all())


def create_followup_task_sql(
    session: Session,
    user_id: str,
    mission_id: str,
    prospect_email: str,
    due_at: datetime,
    channel: str = "email",
    template: str = "followup_d3_system.txt",
) -> FollowupTaskSQL:
    task = FollowupTaskSQL(
        user_id=user_id,
        mission_id=mission_id,
        prospect_email=prospect_email,
        channel=channel,
        template=template,
        due_at=due_at,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_due_followups_sql(session: Session, now: datetime) -> list[FollowupTaskSQL]:
    stmt = select(FollowupTaskSQL).where(
        and_(FollowupTaskSQL.status == "queued", FollowupTaskSQL.due_at <= now)
    )
    return list(session.exec(stmt).all())


def mark_followup_status_sql(session: Session, task_id: str, status: str) -> None:
    task = session.get(FollowupTaskSQL, task_id)
    if not task:
        return
    task.status = status
    session.add(task)
    session.commit()


def create_or_get_prospect_sql(
    session: Session,
    mission_id: str,
    user_id: str,
    name: str,
    company: str,
    email: str,
    source_url: str = "",
    verification_method: str = "unknown",
    verification_confidence: int = 0,
    email_format_valid: bool = False,
    domain_has_mx: bool = False,
    smtp_likely_deliverable: bool = False,
    risk_flag: str = "unknown",
) -> ProspectSQL:
    stmt = select(ProspectSQL).where(
        and_(
            ProspectSQL.user_id == user_id,
            ProspectSQL.mission_id == mission_id,
            ProspectSQL.email == email,
        )
    )
    existing = session.exec(stmt).first()
    if existing:
        return existing
    row = ProspectSQL(
        mission_id=mission_id,
        user_id=user_id,
        name=name,
        company=company,
        email=email,
        source_url=source_url,
        verification_method=verification_method,
        verification_confidence=verification_confidence,
        email_format_valid=email_format_valid,
        domain_has_mx=domain_has_mx,
        smtp_likely_deliverable=smtp_likely_deliverable,
        risk_flag=risk_flag,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def create_draft_sql(
    session: Session,
    mission_id: str,
    user_id: str,
    channel: str,
    subject: str,
    body: str,
    prospect_id: Optional[str] = None,
    ai_reasoning: str = "",
    attachments: Optional[list] = None,
    metadata: Optional[dict] = None,
) -> DraftSQL:
    row = DraftSQL(
        mission_id=mission_id,
        user_id=user_id,
        prospect_id=prospect_id,
        channel=channel,
        subject=subject,
        body=body,
        ai_reasoning=ai_reasoning,
        status="PENDING",
        attachments_json=json.dumps(attachments or []),
        metadata_json=json.dumps(metadata or {}),
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def list_pending_drafts_sql(session: Session, user_id: str, mission_id: Optional[str] = None) -> list[DraftSQL]:
    stmt = select(DraftSQL).where(and_(DraftSQL.user_id == user_id, DraftSQL.status == "PENDING"))
    if mission_id:
        stmt = stmt.where(DraftSQL.mission_id == mission_id)
    stmt = stmt.order_by(DraftSQL.created_at.desc())
    return list(session.exec(stmt).all())


def get_draft_sql(session: Session, draft_id: str) -> Optional[DraftSQL]:
    return session.get(DraftSQL, draft_id)


def save_draft_sql(session: Session, draft: DraftSQL) -> None:
    session.add(draft)
    session.commit()


def clear_pending_drafts_sql(session: Session, user_id: str) -> int:
    rows = list_pending_drafts_sql(session, user_id)
    count = 0
    for row in rows:
        session.delete(row)
        count += 1
    session.commit()
    return count


def get_prospect_sql(session: Session, prospect_id: str) -> Optional[ProspectSQL]:
    return session.get(ProspectSQL, prospect_id)


def list_prospects_sql(session: Session, user_id: str, mission_id: Optional[str] = None) -> list[ProspectSQL]:
    stmt = select(ProspectSQL).where(ProspectSQL.user_id == user_id)
    if mission_id:
        stmt = stmt.where(ProspectSQL.mission_id == mission_id)
    return list(session.exec(stmt).all())
