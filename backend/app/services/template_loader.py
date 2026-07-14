from pathlib import Path
from typing import Dict


TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"


class SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"


def load_template(name: str) -> str:
    """
    Load a prompt template from backend/app/templates.
    """
    path = TEMPLATES_DIR / name
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def render_template(name: str, variables: Dict[str, str]) -> str:
    template = load_template(name)
    if not template:
        return ""
    return template.format_map(SafeDict(**variables))
