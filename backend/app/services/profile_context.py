from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from app.models import UserAsset
from app.services.rag import rag_service


PROFILE_PATH = Path(__file__).resolve().parents[3] / "data" / "profile.yaml"


def _safe_get(data: Dict[str, Any], key: str, default: Any) -> Any:
    value = data.get(key, default)
    return default if value is None else value


def load_profile_yaml() -> Dict[str, Any]:
    if not PROFILE_PATH.exists():
        return {}
    try:
        raw = PROFILE_PATH.read_text(encoding="utf-8")
        parsed = yaml.safe_load(raw) or {}
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def render_profile_context(profile: Dict[str, Any]) -> str:
    if not profile:
        return ""

    identity = _safe_get(profile, "identity", {})
    goals = _safe_get(profile, "goals", {})
    # Backward-compatible support for flat schema in data/profile.yaml
    name = identity.get("name") or profile.get("name", "Unknown")
    headline = identity.get("headline") or profile.get("headline", "")
    target_roles = goals.get("target_roles") or profile.get("role_targets", [])
    target_domains = goals.get("target_domains") or profile.get("target_domains", [])
    strengths = _safe_get(profile, "strengths", [])
    projects = _safe_get(profile, "projects", [])
    snippets = _safe_get(profile, "story_snippets", [])
    constraints = _safe_get(profile, "message_constraints", [])

    lines: List[str] = [
        "PERSONAL PROFILE CONTEXT:",
        f"- Name: {name}",
        f"- Headline: {headline}",
        f"- Target Roles: {', '.join(target_roles)}",
        f"- Target Domains: {', '.join(target_domains)}",
        f"- Core Stack: {', '.join(profile.get('stack', []))}",
        "",
        "TOP STRENGTHS:",
    ]
    for s in strengths[:8]:
        lines.append(f"- {s}")

    lines.append("")
    lines.append("PROJECT HIGHLIGHTS:")
    for p in projects[:8]:
        name = p.get("name", "Project")
        impact = p.get("impact") or p.get("hook", "")
        stack = ", ".join(p.get("stack", []) or p.get("match_tags", []))
        lines.append(f"- {name}: {impact} | Stack/Tags: {stack}")

    lines.append("")
    lines.append("STORY SNIPPETS:")
    for snip in snippets[:8]:
        lines.append(f"- {snip}")

    if constraints:
        lines.append("")
        lines.append("MESSAGE CONSTRAINTS:")
        for c in constraints[:10]:
            lines.append(f"- {c}")

    return "\n".join(lines).strip()


async def build_personal_context(user_id: str, max_chars: int = 6000) -> str:
    """
    Build a single personalization context from:
    1) data/profile.yaml
    2) user assets like CV/research/github profile markdown
    """
    profile_context = render_profile_context(load_profile_yaml())

    assets = await UserAsset.find(UserAsset.user_id == user_id).to_list()
    priority_ids: List[str] = []
    preferred_tokens = [
        "resume",
        "cv",
        "research",
        "statement",
        "github-profile",
        "portfolio",
    ]
    for asset in assets:
        name = (asset.filename or "").lower()
        if any(token in name for token in preferred_tokens):
            priority_ids.append(str(asset.id))

    asset_context = ""
    if priority_ids:
        asset_context = await rag_service.build_context_from_assets(priority_ids[:8], max_chars=max_chars)

    combined_parts = []
    if profile_context:
        combined_parts.append(profile_context)
    if asset_context:
        combined_parts.append(asset_context[:max_chars])

    return "\n\n".join(combined_parts)[:max_chars].strip()
