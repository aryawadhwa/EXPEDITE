"""
Email Finder Service
Integrates with Hunter.io API to find email addresses for prospects

Usage:
    from app.services.email_finder import email_finder
    
    # Find email for a specific person
    email = await email_finder.find_email("John", "Doe", "oracle.com")
    
    # Find multiple emails at a company
    emails = await email_finder.find_emails_for_company("oracle.com", limit=10)
"""

import httpx
from typing import Optional, Dict, List
import os
import logging

logger = logging.getLogger(__name__)


class EmailFinder:
    """Find email addresses using Hunter.io API"""
    
    def __init__(self):
        self.api_key = os.getenv('HUNTER_API_KEY')
        self.base_url = "https://api.hunter.io/v2"
        
        if not self.api_key:
            logger.warning("HUNTER_API_KEY not configured - email finding will be disabled")
    
    async def find_email(
        self, 
        first_name: str, 
        last_name: str, 
        company_domain: str
    ) -> Optional[str]:
        """
        Find email address for a specific person at a company.
        
        Args:
            first_name: Person's first name
            last_name: Person's last name
            company_domain: Company domain (e.g., "oracle.com")
            
        Returns:
            Email address if found with >50% confidence, None otherwise
        """
        if not self.api_key:
            logger.debug("Email finder disabled - no API key")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/email-finder",
                    params={
                        "domain": company_domain,
                        "first_name": first_name,
                        "last_name": last_name,
                        "api_key": self.api_key
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    email = data.get("data", {}).get("email")
                    confidence = data.get("data", {}).get("score", 0)
                    
                    if email and confidence > 50:  # Only use if >50% confidence
                        logger.info(f"Found email: {email} (confidence: {confidence}%)")
                        return email
                    else:
                        logger.debug(f"Low confidence email for {first_name} {last_name} at {company_domain}")
                        return None
                elif response.status_code == 429:
                    logger.warning("Hunter.io API rate limit exceeded")
                    return None
                else:
                    logger.error(f"Hunter.io API error: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error("Hunter.io API timeout")
            return None
        except Exception as e:
            logger.error(f"Email finder error: {e}")
            return None
    
    async def find_emails_for_company(
        self, 
        company_domain: str, 
        limit: int = 10,
        department: Optional[str] = None
    ) -> List[Dict]:
        """
        Find multiple emails at a company.
        
        Args:
            company_domain: Company domain (e.g., "oracle.com")
            limit: Max number of emails to find
            department: Optional department filter (e.g., "engineering", "sales")
            
        Returns:
            List of dicts with email, name, position, confidence
        """
        if not self.api_key:
            logger.debug("Email finder disabled - no API key")
            return []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "domain": company_domain,
                    "limit": limit,
                    "api_key": self.api_key
                }
                
                if department:
                    params["department"] = department
                
                response = await client.get(
                    f"{self.base_url}/domain-search",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    emails = []
                    
                    for person in data.get("data", {}).get("emails", []):
                        if person.get("value"):
                            emails.append({
                                "email": person["value"],
                                "first_name": person.get("first_name", ""),
                                "last_name": person.get("last_name", ""),
                                "position": person.get("position", ""),
                                "department": person.get("department", ""),
                                "confidence": person.get("confidence", 0)
                            })
                    
                    logger.info(f"Found {len(emails)} emails at {company_domain}")
                    return emails
                elif response.status_code == 429:
                    logger.warning("Hunter.io API rate limit exceeded")
                    return []
                else:
                    logger.error(f"Hunter.io API error: {response.status_code}")
                    return []
                    
        except httpx.TimeoutException:
            logger.error("Hunter.io API timeout")
            return []
        except Exception as e:
            logger.error(f"Company email search error: {e}")
            return []
    
    def extract_domain_from_company(self, company_name: str) -> str:
        """
        Extract likely domain from company name.
        
        Args:
            company_name: Company name (e.g., "Oracle Corporation")
            
        Returns:
            Likely domain (e.g., "oracle.com")
        """
        # Remove common suffixes
        clean_name = company_name.lower()
        for suffix in [" inc", " inc.", " corp", " corp.", " corporation", 
                       " llc", " ltd", " limited", " co", " company"]:
            clean_name = clean_name.replace(suffix, "")
        
        # Remove special characters and spaces
        clean_name = clean_name.strip().replace(" ", "").replace("-", "")
        
        # Add .com (most common TLD)
        return f"{clean_name}.com"
    
    async def enrich_prospect_with_email(
        self, 
        prospect: Dict,
        persona: str = "corporate"
    ) -> Dict:
        """
        Enrich a prospect dict with email if not present.
        
        Args:
            prospect: Dict with 'name', 'company', optionally 'public_contact'
            
        Returns:
            Updated prospect dict with email if found
        """
        # Skip if already has email
        if prospect.get("public_contact") and "@" in prospect.get("public_contact", ""):
            return prospect
        
        company = prospect.get("company", "")
        if not company or company == "Unknown":
            return prospect
        
        # Extract domain
        domain = self.extract_domain_from_company(company)
        
        # Try to find emails at this company
        emails = await self.find_emails_for_company(domain, limit=5)
        
        if emails:
            from app.services.smtp_verifier import EmailVerifier, ValidationLevel
            verifier = EmailVerifier(smtp_safe_check=True)

            # 1. Filter out generic "info@" style emails
            generic_prefixes = ['info@', 'support@', 'sales@', 'contact@', 'hello@', 'marketing@', 'admin@', 'office@', 'help@']
            valid_emails = [e for e in emails if not any(e['email'].lower().startswith(p) for p in generic_prefixes)]
            
            if not valid_emails:
                return prospect

            # 2. Prioritize roles based on persona
            if persona == "academic":
                target_keywords = ['professor', 'research', 'lab', 'principal investigator', 'postdoc', 'university', 'science', 'faculty', 'phd']
            elif persona == "startup":
                target_keywords = ['founder', 'ceo', 'cto', 'engineering', 'lead', 'head']
            else:
                target_keywords = ['hr', 'recruiting', 'talent', 'people', 'hiring', 'university', 'campus']
                
            targeted_emails = [e for e in valid_emails if any(kw in e.get('department', '').lower() or kw in e.get('position', '').lower() for kw in target_keywords)]
            
            # Use targeted emails if found, otherwise fall back to any non-generic valid email
            target_list = targeted_emails if targeted_emails else valid_emails
            
            # Sort by confidence
            target_list.sort(key=lambda x: x.get("confidence", 0), reverse=True)

            # 3. SMTP Verification to ensure email is REAL
            best_email = None
            for email_obj in target_list:
                result = verifier.verify(email_obj["email"], validation_level=ValidationLevel.MX_BLACKLIST)
                if result.valid:
                    best_email = email_obj
                    break
            
            if best_email:
                prospect["public_contact"] = best_email["email"]
                prospect["email_confidence"] = best_email["confidence"]
                prospect["email_source"] = "Hunter.io + Verified"
                
                if best_email.get("first_name") and best_email.get("last_name"):
                    prospect["name"] = f"{best_email['first_name']} {best_email['last_name']}"
                
                if best_email.get("position"):
                    prospect["title"] = best_email["position"]
        
        return prospect


# Singleton instance
email_finder = EmailFinder()
