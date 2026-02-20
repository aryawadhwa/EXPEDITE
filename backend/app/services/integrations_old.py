"""
Integration Service Layer
Handles all external API integrations with proper error handling, retries, and fallbacks.
"""

import httpx
import asyncio
from typing import Dict, List, Optional, Tuple
from app.core.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

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
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    def log(self, level: str, message: str):
        """Structured logging"""
        log_func = getattr(logger, level, logger.info)
        log_func(f"[{self.name}] {message}")

# ==================================================
# APOLLO INTEGRATION
# ==================================================

class ApolloIntegration(BaseIntegration):
    """Apollo.io API integration for finding prospects"""
    
    def __init__(self):
        super().__init__("Apollo", timeout=30)
        self.api_key = settings.APOLLO_API_KEY
        self.base_url = "https://api.apollo.io/api/v1"
    
    async def search_people(
        self, 
        titles: List[str] = None, 
        industries: List[str] = None,
        per_page: int = 50
    ) -> Tuple[List[Dict], Optional[str]]:
        """
        Search for people
        Returns: (list of people, error message)
        """
        if not self.api_key:
            return [], "Apollo API key not configured"
        
        try:
            body = {
                "page": 1,
                "per_page": per_page
            }
            
            if titles:
                body["person_titles"] = titles
            if industries:
                # Map common industry names to Apollo IDs
                industry_map = {
                    "fintech": "5567cd4773696439b10b0000",
                    "saas": "5567cd4773696439b10b0001",
                }
                body["organization_industry_tag_ids"] = [
                    industry_map.get(ind.lower(), ind) for ind in industries
                ]
            
            self.log("info", f"Searching people: titles={titles}, industries={industries}")
            
            resp = await self.client.post(
                f"{self.base_url}/mixed_people/search",
                headers={
                    "Content-Type": "application/json",
                    "X-Api-Key": self.api_key  # API key in header
                },
                json=body
            )
            
            if resp.status_code == 200:
                data = resp.json()
                people = data.get("people", [])
                self.log("info", f"Found {len(people)} people")
                return people, None
            elif resp.status_code == 429:
                return [], "Apollo rate limit exceeded"
            else:
                error = f"Apollo error: {resp.status_code} - {resp.text[:200]}"
                self.log("error", error)
                return [], error
                
        except Exception as e:
            error = f"Apollo exception: {str(e)}"
            self.log("error", error)
            return [], error

# ==================================================
# HUNTER INTEGRATION
# ==================================================

class HunterIntegration(BaseIntegration):
    """Hunter.io API integration for email verification"""
    
    def __init__(self):
        super().__init__("Hunter", timeout=10)
        self.api_key = settings.HUNTER_API_KEY
        self.base_url = "https://api.hunter.io/v2"
    
    async def find_email(
        self, 
        first_name: str, 
        last_name: str, 
        domain: str
    ) -> Dict:
        """
        Find and verify email
        Returns: {"email": str, "verified": bool, "score": int}
        """
        if not self.api_key or not domain:
            return {"email": None, "verified": False, "score": 0}
        
        try:
            self.log("info", f"Finding email: {first_name} {last_name} @ {domain}")
            
            resp = await self.client.get(
                f"{self.base_url}/email-finder",
                params={
                    "domain": domain,
                    "first_name": first_name,
                    "last_name": last_name,
                    "api_key": self.api_key
                }
            )
            
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                email = data.get("email")
                score = data.get("score", 0)
                status = data.get("status")
                
                # Only verified if score >= 70 and status is valid
                verified = bool(email and score >= 70 and status == "valid")
                
                if verified:
                    self.log("info", f" Verified: {email} (score: {score})")
                else:
                    self.log("info", f" Not verified: {email} (score: {score}, status: {status})")
                
                return {
                    "email": email,
                    "verified": verified,
                    "score": score,
                    "status": status
                }
            else:
                self.log("error", f"Hunter error: {resp.status_code}")
                return {"email": None, "verified": False, "score": 0}
                
        except Exception as e:
            self.log("error", f"Hunter exception: {str(e)}")
            return {"email": None, "verified": False, "score": 0}

# ==================================================
# GROQ LLM INTEGRATION
# ==================================================

class GroqIntegration:
    """Groq LLM integration"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = "llama-3.3-70b-versatile"
    
    async def generate_json(self, prompt: str, retries: int = 2) -> Dict:
        """
        Generate JSON response
        Returns: parsed JSON dict
        """
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
        """
        Generate JSON response
        Returns: parsed JSON dict
        """
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
# UNIFIED LLM SERVICE (WITH FALLBACK)
# ==================================================

class LLMService:
    """Unified LLM service with automatic fallback"""
    
    def __init__(self):
        self.groq = GroqIntegration()
        self.openai = OpenAIIntegration()
    
    async def generate_json(self, prompt: str) -> Dict:
        """
        Generate JSON with automatic fallback
        1. Try Groq (fast, cheap)
        2. Fallback to OpenAI (reliable, quality)
        """
        # Try Groq first
        result = await self.groq.generate_json(prompt)
        if result:
            return result
        
        # Fallback to OpenAI
        logger.info("[LLM] Groq failed, falling back to OpenAI")
        return await self.openai.generate_json(prompt)

# ==================================================
# PROSPECT PIPELINE SERVICE
# ==================================================

class ProspectPipeline:
    """
    Complete prospect research pipeline
    Orchestrates: Apollo → Hunter → Analysis
    ONLY RETURNS PROSPECTS WITH VERIFIED EMAILS
    """
    
    def __init__(self):
        self.llm = LLMService()
    
    async def find_prospects(
        self, 
        objective: str,
        titles: List[str] = None,
        industries: List[str] = None,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Complete pipeline to find verified prospects
        
        Returns: List of prospects with VERIFIED EMAILS ONLY
        """
        prospects = []
        
        # STAGE 1: Apollo Search (get 50 candidates to increase chances)
        async with ApolloIntegration() as apollo:
            people, error = await apollo.search_people(titles, industries, per_page=50)
            
            if error:
                logger.error(f"[Pipeline] Apollo failed: {error}")
                return []  # Return empty - NO FALLBACK to Firecrawl
            
            logger.info(f"[Pipeline] Apollo returned {len(people)} candidates")
        
        # STAGE 2: Hunter Email Verification
        async with HunterIntegration() as hunter:
            verified_count = 0
            
            for person in people:
                if verified_count >= max_results:
                    break
                
                # Extract data
                first_name = person.get("first_name", "")
                last_name_obf = person.get("last_name_obfuscated", "")
                org = person.get("organization") or {}
                company = org.get("name", "")
                
                # Get domain
                domain = org.get("primary_domain") or org.get("website_url", "")
                if domain:
                    domain = domain.replace("http://", "").replace("https://", "")
                    domain = domain.replace("www.", "").split("/")[0]
                
                # Guess last name from obfuscated
                last_name = last_name_obf.replace("*", "").strip()
                
                # Find and verify email
                if first_name and last_name and domain:
                    hunter_result = await hunter.find_email(first_name, last_name, domain)
                    
                    # ONLY ADD IF VERIFIED
                    if hunter_result.get("verified"):
                        verified_count += 1
                        prospects.append({
                            "source": "apollo+hunter",
                            "name": f"{first_name} {last_name_obf}",
                            "title": person.get("title") or "N/A",
                            "company": company or "N/A",
                            "email": hunter_result["email"],
                            "email_verified": True,
                            "email_score": hunter_result["score"],
                            "linkedin_url": person.get("linkedin_url", ""),
                            "raw_data": person
                        })
            
            logger.info(f"[Pipeline] Verified {verified_count}/{len(people)} emails")
        
        # STAGE 3: AI Analysis & Scoring (only for verified prospects)
        for prospect in prospects:
            analysis = await self._analyze_prospect(prospect, objective)
            prospect["analysis"] = analysis
        
        # Sort by score
        prospects.sort(key=lambda x: x.get("analysis", {}).get("score", 0), reverse=True)
        
        logger.info(f"[Pipeline] Returning {len(prospects)} prospects with verified emails")
        return prospects
    
    async def _analyze_prospect(self, prospect: Dict, objective: str) -> Dict:
        """Analyze and score a prospect"""
        prompt = f"""Score this prospect for: {objective}

Name: {prospect.get('name')}
Title: {prospect.get('title')}
Company: {prospect.get('company')}
Email Verified: Yes

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
