"""
Integration Service Layer - Hunter.io Only
Simplified architecture using only Hunter.io for prospect research

ENHANCED: Now includes web scraping capabilities from hiring-cafe and email extraction
"""

import httpx
import asyncio
from asyncio import Semaphore, gather, wait_for, TimeoutError
from typing import Dict, List, Optional, Callable
from app.core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Import enhanced scraper
from app.services.web_scraper import enhanced_scraper, EmailScraper, JobBoardScraper

# ==================================================
# BASE INTEGRATION CLASS
# ==================================================

class BaseIntegration:
    """Base class for all external integrations"""
    
    def __init__(self, name: str, timeout: int = 30):
        self.name = name
        self.timeout = timeout
        self.client = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=self.timeout)
        self.log("debug", "Client connection opened")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
            self.log("debug", "Client connection closed")
        if exc_type:
            self.log("error", f"Exception in context: {exc_val}")
        return False
    
    def log(self, level: str, message: str):
        """Structured logging"""
        log_func = getattr(logger, level, logger.info)
        log_func(f"[{self.name}] {message}")

# ==================================================
# HUNTER INTEGRATION - COMPLETE
# ==================================================

class HunterIntegration(BaseIntegration):
    """Hunter.io API integration - Domain Search + Email Verification"""
    
    def __init__(self):
        super().__init__("Hunter", timeout=10)
        self.api_key = settings.HUNTER_API_KEY
        self.base_url = "https://api.hunter.io/v2"
    
    async def domain_search(
        self,
        domain: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Find all people at a company domain
        Returns: List of {email, first_name, last_name, position, verified, score}
        """
        if not self.api_key:
            self.log("warn", "Hunter API key not configured")
            return []
        
        if not domain:
            self.log("warn", "No domain provided")
            return []
        
        try:
            self.log("info", f"Domain search: {domain}")
            
            resp = await self.client.get(
                f"{self.base_url}/domain-search",
                headers={
                    "Authorization": f"Bearer {self.api_key}"
                },
                params={
                    "domain": domain,
                    "limit": limit,
                    "type": "personal"  # Only personal emails
                }
            )
            
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                emails = data.get("emails", [])
                
                self.log("info", f"Found {len(emails)} emails at {domain}")
                
                # Filter and return only verified emails
                results = []
                for e in emails:
                    confidence = e.get("confidence", 0)
                    email = e.get("value")
                    
                    # Only include if confidence >= 70
                    if confidence >= 70 and email:
                        results.append({
                            "email": email,
                            "first_name": e.get("first_name", ""),
                            "last_name": e.get("last_name", ""),
                            "position": e.get("position", ""),
                            "verified": True,
                            "score": confidence,
                            "department": e.get("department"),
                            "seniority": e.get("seniority")
                        })
                
                self.log("info", f"Returning {len(results)} verified emails")
                return results
            elif resp.status_code == 429:
                self.log("error", "Hunter rate limit exceeded")
                return []
            else:
                self.log("error", f"Hunter error: {resp.status_code}")
                return []
                
        except Exception as e:
            self.log("error", f"Hunter exception: {str(e)}")
            return []
    
    async def find_email(
        self, 
        first_name: str, 
        last_name: str, 
        domain: str
    ) -> Dict:
        """
        Find and verify a specific person's email
        Returns: {"email": str, "verified": bool, "score": int, "status": str}
        """
        if not self.api_key:
            self.log("warn", "Hunter API key not configured")
            return {"email": None, "verified": False, "score": 0, "status": "no_api_key"}
        
        if not domain or not first_name or not last_name:
            self.log("warn", f"Invalid inputs: first={first_name}, last={last_name}, domain={domain}")
            return {"email": None, "verified": False, "score": 0, "status": "invalid_input"}
        
        try:
            self.log("info", f"Finding email: {first_name} {last_name} @ {domain}")
            
            resp = await self.client.get(
                f"{self.base_url}/email-finder",
                headers={
                    "Authorization": f"Bearer {self.api_key}"
                },
                params={
                    "domain": domain,
                    "first_name": first_name,
                    "last_name": last_name
                }
            )
            
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                
                # DEFENSIVE: Validate types
                email = data.get("email")
                score = data.get("score", 0)
                status = data.get("status")
                
                # Type validation
                if not isinstance(email, str):
                    email = None
                if not isinstance(score, (int, float)):
                    score = 0
                if not isinstance(status, str):
                    status = "unknown"
                
                # Accept both 'valid' and 'accept_all'
                verified = bool(
                    email and 
                    score >= 70 and 
                    status in ["valid", "accept_all"]
                )
                
                if verified:
                    self.log("info", f"✓ Verified: {email} (score: {score}, status: {status})")
                else:
                    self.log("info", f"✗ Not verified: email={email}, score={score}, status={status}")
                
                return {
                    "email": email,
                    "verified": verified,
                    "score": score,
                    "status": status
                }
            elif resp.status_code == 429:
                self.log("error", "Hunter rate limit exceeded")
                return {"email": None, "verified": False, "score": 0, "status": "rate_limit"}
            else:
                self.log("error", f"Hunter error: {resp.status_code}")
                return {"email": None, "verified": False, "score": 0, "status": "api_error"}
                
        except Exception as e:
            self.log("error", f"Hunter exception: {str(e)}")
            return {"email": None, "verified": False, "score": 0, "status": "exception"}

# ==================================================
# GROQ LLM INTEGRATION
# ==================================================

class GroqIntegration:
    """Groq LLM integration"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"
    
    async def generate_json(self, prompt: str, retries: int = 2) -> Dict:
        """Generate JSON response"""
        from langchain_groq import ChatGroq
        from langchain_core.messages import SystemMessage
        import json
        
        if not self.api_key:
            logger.error("[Groq] API key not configured")
            return {}
        
        llm = ChatGroq(
            temperature=0.0,
            groq_api_key=self.api_key,
            model_name=self.model
        )
        
        for attempt in range(retries):
            try:
                response = await llm.ainvoke([
                    SystemMessage(content=prompt + "\n\nReturn VALID JSON ONLY. No markdown.")
                ])
                content = response.content.replace("```json", "").replace("```", "").strip()
                return json.loads(content)
            except Exception as e:
                logger.error(f"[Groq] Attempt {attempt+1} failed: {e}")
                if attempt == retries - 1:
                    return {}
        return {}

# ==================================================
# OPENAI LLM INTEGRATION (FALLBACK)
# ==================================================

class OpenAIIntegration:
    """OpenAI LLM integration as fallback"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4o-mini"
    
    async def generate_json(self, prompt: str) -> Dict:
        """Generate JSON response"""
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage
        import json
        
        if not self.api_key:
            logger.error("[OpenAI] API key not configured")
            return {}
        
        llm = ChatOpenAI(
            temperature=0.0,
            openai_api_key=self.api_key,
            model_name=self.model
        )
        
        try:
            response = await llm.ainvoke([
                SystemMessage(content=prompt + "\n\nReturn VALID JSON ONLY.")
            ])
            content = response.content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"[OpenAI] Failed: {e}")
            return {}

# ==================================================
# UNIFIED LLM SERVICE
# ==================================================

class LLMService:
    """Unified LLM service with automatic fallback"""
    
    def __init__(self):
        self.groq = GroqIntegration()
        self.openai = OpenAIIntegration()
    
    async def generate_json(self, prompt: str) -> Dict:
        """Generate JSON with automatic fallback"""
        # Try Groq first
        result = await self.groq.generate_json(prompt)
        if result:
            return result
        
        # Fallback to OpenAI
        logger.info("[LLM] Groq failed, falling back to OpenAI")
        return await self.openai.generate_json(prompt)

# ==================================================
# PROSPECT PIPELINE - HUNTER ONLY
# ==================================================

class ProspectPipeline:
    """
    Complete prospect research pipeline using ONLY Hunter.io
    Flow: LLM suggests companies → Hunter domain search → Filter by title
    
    ENHANCED: Now includes web scraping for additional data sources
    """
    
    def __init__(self):
        self.llm = LLMService()
        self.web_scraper = enhanced_scraper
    
    async def find_prospects(
        self, 
        objective: str,
        titles: List[str] = None,
        industries: List[str] = None,
        max_results: int = 10,
        progress_callback: Optional[Callable] = None,
        use_web_scraping: bool = True  # NEW: Enable web scraping
    ) -> List[Dict]:
        """
        Find prospects using Hunter.io only
        
        Flow:
        1. LLM extracts target company domains
        2. Hunter domain search for each company
        3. Filter by job titles
        4. AI analysis and scoring
        """
        try:
            return await wait_for(
                self._find_prospects_internal(
                    objective, titles, industries, max_results, progress_callback
                ),
                timeout=30.0
            )
        except TimeoutError:
            logger.error("[Pipeline] Timeout after 30s")
            if progress_callback:
                await progress_callback("error", 0, "Pipeline timeout")
            return []
        except Exception as e:
            logger.error(f"[Pipeline] Error: {e}", exc_info=True)
            if progress_callback:
                await progress_callback("error", 0, str(e))
            return []
    
    async def _find_prospects_internal(
        self,
        objective: str,
        titles: List[str],
        industries: List[str],
        max_results: int,
        progress_callback: Optional[Callable]
    ) -> List[Dict]:
        """Internal pipeline implementation"""
        prospects = []
        
        # STAGE 1: Extract company domains using LLM
        if progress_callback:
            await progress_callback("extraction", 20, "Extracting target companies...")
        
        domains = await self._extract_company_domains(objective, industries or ["technology"])
        logger.info(f"[Pipeline] Extracted {len(domains)} company domains")
        
        if not domains:
            logger.error("[Pipeline] No companies extracted")
            return []
        
        # STAGE 2: Hunter domain search (parallel)
        if progress_callback:
            await progress_callback("search", 50, f"Searching {len(domains)} companies...")
        
        all_people = await self._search_domains_parallel(domains[:5], max_results=50)
        logger.info(f"[Pipeline] Found {len(all_people)} total people")
        
        # STAGE 3: Filter by job titles
        if titles:
            filtered = [p for p in all_people if self._matches_title(p.get("position", ""), titles)]
            logger.info(f"[Pipeline] Filtered to {len(filtered)} matching titles")
        else:
            filtered = all_people
        
        # STAGE 4: AI analysis
        if progress_callback:
            await progress_callback("analysis", 80, f"Analyzing {len(filtered)} prospects...")
        
        for person in filtered[:max_results]:
            prospect = {
                "source": "hunter",
                "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
                "title": person.get("position", "N/A"),
                "company": person.get("company", "N/A"),
                "email": person["email"],
                "email_verified": True,
                "email_score": person["score"],
                "department": person.get("department"),
                "seniority": person.get("seniority")
            }
            
            # AI analysis
            analysis = await self._analyze_prospect(prospect, objective)
            prospect["analysis"] = analysis
            
            prospects.append(prospect)
        
        # Sort by score
        prospects.sort(key=lambda x: x.get("analysis", {}).get("score", 0), reverse=True)
        
        logger.info(f"[Pipeline] Returning {len(prospects)} prospects")
        
        if progress_callback:
            await progress_callback("complete", 100, f"Found {len(prospects)} verified prospects")
        
        return prospects
    
    async def _extract_company_domains(
        self,
        objective: str,
        industries: List[str]
    ) -> List[str]:
        """Use LLM to extract target company domains"""
        prompt = f"""Extract company domains for this objective: {objective}

Industries: {', '.join(industries)}

Return JSON with a list of well-known company domains in these industries.
Focus on companies that would have the type of people described in the objective.

Example format:
{{"domains": ["stripe.com", "plaid.com", "brex.com", "ramp.com", "mercury.com"]}}

Return 10-15 relevant company domains:"""
        
        result = await self.llm.generate_json(prompt)
        domains = result.get("domains", [])
        
        # Clean domains
        cleaned = []
        for d in domains:
            d = d.lower().replace("http://", "").replace("https://", "").replace("www.", "").split("/")[0]
            if d and "." in d:
                cleaned.append(d)
        
        return cleaned
    
    async def _search_domains_parallel(
        self,
        domains: List[str],
        max_results: int = 50
    ) -> List[Dict]:
        """Search multiple domains in parallel"""
        semaphore = Semaphore(3)  # Max 3 concurrent requests
        
        async def search_one(domain: str) -> List[Dict]:
            async with semaphore:
                try:
                    async with HunterIntegration() as hunter:
                        results = await hunter.domain_search(domain, limit=10)
                        # Add company name to each result
                        company_name = domain.replace(".com", "").replace(".io", "").title()
                        for r in results:
                            r["company"] = company_name
                        return results
                except Exception as e:
                    logger.error(f"Domain search failed for {domain}: {e}")
                    return []
        
        # Run in parallel
        results = await gather(*[search_one(d) for d in domains], return_exceptions=True)
        
        # Flatten results
        all_people = []
        for r in results:
            if isinstance(r, list):
                all_people.extend(r)
        
        return all_people[:max_results]
    
    def _matches_title(self, position: str, titles: List[str]) -> bool:
        """Check if position matches target titles"""
        if not titles or not position:
            return True
        
        position_lower = position.lower()
        return any(title.lower() in position_lower for title in titles)
    
    async def _analyze_prospect(self, prospect: Dict, objective: str) -> Dict:
        """Analyze and score a prospect"""
        prompt = f"""Score this prospect for: {objective}

Name: {prospect.get('name')}
Title: {prospect.get('title')}
Company: {prospect.get('company')}
Email Verified: Yes (score: {prospect.get('email_score')})

Return JSON: {{"score": 8, "reason": "...", "person_name": "...", "company_name": "..."}}"""
        
        analysis = await self.llm.generate_json(prompt)
        
        # Boost score for verified email
        if prospect.get("email_verified"):
            analysis["score"] = min(10, analysis.get("score", 0) + 1)
        
        return analysis

# ==================================================
# SINGLETON INSTANCES
# ==================================================

prospect_pipeline = ProspectPipeline()
llm_service = LLMService()
