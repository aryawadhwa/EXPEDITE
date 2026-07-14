"""
Market intelligence service for evidence-first targeting.

Provides:
- sector news signals (Google News RSS)
- company-specific news snippets
- canonical application/interview research links
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET

import httpx


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"


@dataclass
class NewsItem:
    title: str
    link: str
    source: str
    published_at: str


class MarketIntelligenceService:
    async def _fetch_rss_items(self, query: str, limit: int = 8) -> List[NewsItem]:
        url = GOOGLE_NEWS_RSS.format(query=quote_plus(query))
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return []
            root = ET.fromstring(resp.text)
        items: List[NewsItem] = []
        for it in root.findall(".//item")[:limit]:
            title = (it.findtext("title") or "").strip()
            link = (it.findtext("link") or "").strip()
            pub = (it.findtext("pubDate") or "").strip()
            src_el = it.find("source")
            source = (src_el.text if src_el is not None else "Unknown") or "Unknown"
            if title and link:
                items.append(NewsItem(title=title, link=link, source=source, published_at=pub))
        return items

    async def sector_signals(self, sectors: List[str], per_sector_limit: int = 6) -> List[Dict]:
        signals: List[Dict] = []
        now = datetime.now(timezone.utc).isoformat()
        for sector in sectors:
            query = f"{sector} hiring internships software engineering"
            news = await self._fetch_rss_items(query, limit=per_sector_limit)
            momentum = min(100, len(news) * 12 + 20)
            signals.append(
                {
                    "sector": sector,
                    "score": momentum,
                    "updated_at": now,
                    "news": [n.__dict__ for n in news],
                }
            )
        signals.sort(key=lambda s: s["score"], reverse=True)
        return signals

    async def company_intel(self, company: str, limit: int = 5) -> Dict:
        news = await self._fetch_rss_items(f"{company} hiring internships engineering", limit=limit)
        links = {
            "careers": f"https://www.google.com/search?q={quote_plus(company + ' careers internships')}",
            "linkedin_jobs": f"https://www.linkedin.com/jobs/search/?keywords={quote_plus(company + ' internship software engineer')}",
            "glassdoor_interviews": f"https://www.google.com/search?q={quote_plus(company + ' glassdoor interview internship')}",
            "leetcode_discuss": f"https://www.google.com/search?q={quote_plus(company + ' interview experience leetcode discuss')}",
            "github_repos": f"https://github.com/search?q={quote_plus(company)}&type=repositories",
        }
        return {
            "company": company,
            "news": [n.__dict__ for n in news],
            "application_links": links,
        }


market_intel_service = MarketIntelligenceService()
