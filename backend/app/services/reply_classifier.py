from typing import Dict
import json

from langchain_core.messages import SystemMessage, HumanMessage

from app.core.llm import create_chat_llm
from app.core.config import settings


async def classify_reply(text: str) -> Dict:
    llm = create_chat_llm(temperature=0.0, model_name=settings.GEMINI_MODEL)
    prompt = """Classify this outreach reply into one label:
- POSITIVE: interested, asks for next steps, agrees to call/interview
- NEUTRAL: ambiguous, asks for more info, soft maybe
- REJECT: explicit no, not interested, closed
- NOISE: out-of-office, auto-response, unrelated

Return valid JSON only:
{"label":"POSITIVE|NEUTRAL|REJECT|NOISE","reason":"short reason","next_action":"one-line recommendation"}"""
    res = await llm.ainvoke([
        SystemMessage(content=prompt),
        HumanMessage(content=text),
    ])
    content = (res.content or "").strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(content)
        label = data.get("label", "NEUTRAL")
        reason = data.get("reason", "")
        next_action = data.get("next_action", "")
        return {"label": label, "reason": reason, "next_action": next_action}
    except Exception:
        return {"label": "NEUTRAL", "reason": "parse_fallback", "next_action": "Ask one clarifying question."}
