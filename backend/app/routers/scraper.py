"""
Web Scraper API Endpoints
Provides access to enhanced scraping capabilities
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel, HttpUrl
from app.models import User
from app.api.deps import get_current_user
from app.services.web_scraper import enhanced_scraper, EmailScraper, JobBoardScraper
from app.services.smtp_verifier import EmailVerifier, ValidationLevel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize email verifier
email_verifier = EmailVerifier(
    from_email="verify@EXPEDITE.com",
    timeout=10,
    connection_attempts=2,
    smtp_safe_check=True
)


class EmailScrapeRequest(BaseModel):
    url: HttpUrl
    max_depth: int = 2
    max_pages: int = 30


class JobSearchRequest(BaseModel):
    job_title: str
    location: str = "United States"
    max_results: int = 50
    sources: Optional[List[str]] = None  # ['hiring_cafe', 'glassdoor', 'monster', 'indeed']


class CompanyResearchRequest(BaseModel):
    company_name: str
    company_website: Optional[HttpUrl] = None


class EmailVerifyRequest(BaseModel):
    email: str
    validation_level: str = "mx"  # regex, mx, mx_blacklist, smtp


class EmailVerifyBatchRequest(BaseModel):
    emails: List[str]
    validation_level: str = "mx"


@router.post("/scrape-emails")
async def scrape_emails(
    request: EmailScrapeRequest,
    user: User = Depends(get_current_user)
):
    """
    Scrape email addresses from a website with automatic verification.
    
    Features:
    - Recursive link following
    - Obfuscated email detection
    - Mailto link extraction
    - Automatic MX record validation (checks if email domain is real)
    - Filters out invalid/disposable emails
    
    Returns only verified, valid emails.
    """
    try:
        scraper = EmailScraper(
            max_depth=request.max_depth,
            max_pages=request.max_pages
        )
        
        emails = await scraper.scrape(str(request.url))
        
        # Verify all emails using MX validation (good balance of speed/accuracy)
        verified_emails = []
        valid_emails = []
        invalid_emails = []
        
        for email in emails:
            result = email_verifier.verify(email, ValidationLevel.MX)
            
            email_data = {
                "email": email,
                "valid": result.valid,
                "validation_type": result.validation_type.value,
                "errors": result.errors,
                "mx_records": result.mx_records
            }
            
            verified_emails.append(email_data)
            
            if result.valid:
                valid_emails.append(email)
            else:
                invalid_emails.append(email)
        
        return {
            "success": True,
            "url": str(request.url),
            "emails_found": len(emails),
            "valid_emails_count": len(valid_emails),
            "invalid_emails_count": len(invalid_emails),
            "valid_emails": valid_emails,
            "invalid_emails": invalid_emails,
            "verification_details": verified_emails,
            "pages_visited": len(scraper.visited_urls)
        }
        
    except Exception as e:
        logger.error(f"Email scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-jobs")
async def scrape_jobs(
    request: JobSearchRequest,
    user: User = Depends(get_current_user)
):
    """
    Scrape job boards for company and contact information.
    
    Sources:
    - Hiring.cafe API
    - Glassdoor
    - Monster.com
    - Indeed.com
    
    You can specify which sources to use via the 'sources' parameter.
    If not specified, all sources will be scraped.
    """
    try:
        prospects = await enhanced_scraper.find_prospects_by_job_title(
            job_title=request.job_title,
            location=request.location,
            max_results=request.max_results,
            sources=request.sources
        )
        
        # Group by source for analytics
        by_source = {}
        for prospect in prospects:
            source = prospect.get('source', 'Unknown')
            if source not in by_source:
                by_source[source] = 0
            by_source[source] += 1
        
        return {
            "success": True,
            "job_title": request.job_title,
            "location": request.location,
            "prospects_found": len(prospects),
            "prospects": prospects,
            "sources_used": request.sources or ['hiring_cafe', 'glassdoor', 'monster', 'indeed'],
            "breakdown_by_source": by_source
        }
        
    except Exception as e:
        logger.error(f"Job scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/research-company")
async def research_company(
    request: CompanyResearchRequest,
    user: User = Depends(get_current_user)
):
    """
    Comprehensive company research.
    
    Extracts:
    - Company website
    - Email addresses
    - Contact information
    - Job postings
    """
    try:
        result = await enhanced_scraper.research_company(
            company_name=request.company_name,
            company_website=str(request.company_website) if request.company_website else None
        )
        
        return {
            "success": True,
            "company": result
        }
        
    except Exception as e:
        logger.error(f"Company research failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scraper/status")
async def get_scraper_status(user: User = Depends(get_current_user)):
    """Get scraper service status and capabilities."""
    return {
        "status": "active",
        "capabilities": {
            "email_scraping": True,
            "job_board_scraping": True,
            "company_research": True,
            "recursive_crawling": True,
            "multi_source_scraping": True
        },
        "sources": [
            "Hiring.cafe API",
            "Glassdoor",
            "Monster.com",
            "Indeed.com",
            "Direct website scraping",
            "Email extraction",
            "Job board aggregation"
        ],
        "limits": {
            "max_depth": 3,
            "max_pages_per_scrape": 50,
            "rate_limit": "10 requests/minute"
        },
        "supported_job_portals": [
            {
                "name": "Hiring.cafe",
                "status": "active",
                "type": "api",
                "features": ["job_search", "company_info", "salary_data"]
            },
            {
                "name": "Glassdoor",
                "status": "active",
                "type": "scraping",
                "features": ["job_search", "company_reviews", "salary_data"]
            },
            {
                "name": "Monster",
                "status": "active",
                "type": "scraping",
                "features": ["job_search", "resume_posting"]
            },
            {
                "name": "Indeed",
                "status": "active",
                "type": "scraping",
                "features": ["job_search", "company_pages"]
            }
        ]
    }



@router.post("/verify-email")
async def verify_email(
    request: EmailVerifyRequest,
    user: User = Depends(get_current_user)
):
    """
    Verify a single email address.
    
    Validation Levels:
    - regex: Syntax validation only (fastest)
    - mx: DNS MX record validation (recommended)
    - mx_blacklist: MX validation + blacklist check
    - smtp: Full SMTP verification (slowest, most thorough)
    
    Returns detailed validation results including errors and debug info.
    """
    try:
        # Parse validation level
        try:
            level = ValidationLevel(request.validation_level.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid validation level. Must be one of: regex, mx, mx_blacklist, smtp"
            )
        
        result = email_verifier.verify(request.email, level)
        
        return {
            "success": True,
            "result": result.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-emails-batch")
async def verify_emails_batch(
    request: EmailVerifyBatchRequest,
    user: User = Depends(get_current_user)
):
    """
    Verify multiple email addresses in batch.
    
    Validation Levels:
    - regex: Syntax validation only (fastest)
    - mx: DNS MX record validation (recommended)
    - mx_blacklist: MX validation + blacklist check
    - smtp: Full SMTP verification (slowest, most thorough)
    
    Returns validation results for all emails.
    """
    try:
        # Parse validation level
        try:
            level = ValidationLevel(request.validation_level.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid validation level. Must be one of: regex, mx, mx_blacklist, smtp"
            )
        
        results = email_verifier.verify_batch(request.emails, level)
        
        # Calculate statistics
        valid_count = sum(1 for r in results if r.valid)
        invalid_count = len(results) - valid_count
        
        return {
            "success": True,
            "total": len(results),
            "valid": valid_count,
            "invalid": invalid_count,
            "results": [r.to_dict() for r in results]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch email verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
