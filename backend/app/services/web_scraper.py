"""
Enhanced Web Scraper Service
Combines techniques from hiring-cafe-job-scraper and email-scraper repos
Provides comprehensive data extraction for prospect research

Features:
- Job board scraping (Hiring.cafe, LinkedIn, etc.)
- Email extraction from websites
- Recursive link following
- HTML cleaning and parsing
- Rate limiting and error handling
- Retry logic for transient failures
"""

import re
import asyncio
import httpx
from typing import List, Dict, Set, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

logger = logging.getLogger(__name__)


# Retry decorator for HTTP requests
def retry_on_network_error():
    """Decorator for retrying network operations"""
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((
            httpx.TimeoutException,
            httpx.NetworkError,
            httpx.ConnectError,
            ConnectionError
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )


class EmailScraper:
    """
    Extract email addresses from websites with recursive link following.
    Based on: https://github.com/AdrianTomin/email-scraper
    """
    
    # Comprehensive email regex pattern
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )
    
    # Obfuscated email patterns
    OBFUSCATED_PATTERNS = [
        re.compile(r'([a-zA-Z0-9._%+-]+)\s*\[at\]\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'),
        re.compile(r'([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})'),
        re.compile(r'([a-zA-Z0-9._%+-]+)\s*\(at\)\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'),
    ]
    
    def __init__(self, max_depth: int = 2, max_pages: int = 50):
        """
        Initialize email scraper.
        
        Args:
            max_depth: Maximum depth for recursive link following
            max_pages: Maximum number of pages to scrape
        """
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.visited_urls: Set[str] = set()
        self.found_emails: Set[str] = set()
    
    def extract_emails_from_text(self, text: str) -> Set[str]:
        """Extract emails from plain text."""
        emails = set(self.EMAIL_PATTERN.findall(text))
        
        # Handle obfuscated emails
        for pattern in self.OBFUSCATED_PATTERNS:
            matches = pattern.findall(text)
            for match in matches:
                if len(match) == 2:
                    email = f"{match[0]}@{match[1]}"
                elif len(match) == 3:
                    email = f"{match[0]}@{match[1]}.{match[2]}"
                else:
                    continue
                emails.add(email.lower())
        
        return emails
    
    def extract_emails_from_html(self, html: str) -> Set[str]:
        """Extract emails from HTML including mailto links."""
        soup = BeautifulSoup(html, 'html.parser')
        emails = set()
        
        # Extract from text content
        text = soup.get_text()
        emails.update(self.extract_emails_from_text(text))
        
        # Extract from mailto links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0]
                if self.EMAIL_PATTERN.match(email):
                    emails.add(email.lower())
        
        # Extract from data attributes
        for element in soup.find_all(attrs={'data-email': True}):
            email = element['data-email']
            if self.EMAIL_PATTERN.match(email):
                emails.add(email.lower())
        
        return emails
    
    def get_links_from_html(self, html: str, base_url: str) -> Set[str]:
        """Extract all links from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            # Convert relative URLs to absolute
            absolute_url = urljoin(base_url, href)
            
            # Only follow links from same domain
            if urlparse(absolute_url).netloc == urlparse(base_url).netloc:
                # Remove fragments and query params for deduplication
                clean_url = absolute_url.split('#')[0].split('?')[0]
                links.add(clean_url)
        
        return links
    
    @retry_on_network_error()
    async def scrape_url(
        self, 
        url: str, 
        depth: int = 0,
        client: Optional[httpx.AsyncClient] = None
    ) -> Set[str]:
        """
        Recursively scrape a URL for emails with retry logic.
        
        Args:
            url: URL to scrape
            depth: Current recursion depth
            client: HTTP client (reused for efficiency)
            
        Returns:
            Set of found email addresses
        """
        # Check limits
        if depth > self.max_depth or len(self.visited_urls) >= self.max_pages:
            return set()
        
        if url in self.visited_urls:
            return set()
        
        self.visited_urls.add(url)
        logger.info(f"Scraping {url} (depth: {depth})")
        
        # Create client if not provided
        close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
            close_client = True
        
        try:
            response = await client.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            
            if response.status_code != 200:
                return set()
            
            html = response.text
            
            # Extract emails from this page
            emails = self.extract_emails_from_html(html)
            self.found_emails.update(emails)
            
            # Get links for recursive scraping
            if depth < self.max_depth:
                links = self.get_links_from_html(html, url)
                
                # Scrape linked pages (limit concurrency)
                tasks = []
                for link in list(links)[:10]:  # Limit to 10 links per page
                    if link not in self.visited_urls:
                        tasks.append(self.scrape_url(link, depth + 1, client))
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
            
            return emails
            
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return set()
        finally:
            if close_client:
                await client.aclose()
    
    async def scrape(self, start_url: str) -> List[str]:
        """
        Main entry point for scraping.
        
        Args:
            start_url: Starting URL to scrape
            
        Returns:
            List of unique email addresses found
        """
        self.visited_urls.clear()
        self.found_emails.clear()
        
        await self.scrape_url(start_url)
        
        # Filter out common non-personal emails
        filtered_emails = {
            email for email in self.found_emails
            if not any(pattern in email for pattern in [
                'noreply', 'no-reply', 'donotreply', 'info@', 'support@',
                'admin@', 'webmaster@', 'postmaster@', 'abuse@'
            ])
        }
        
        return sorted(filtered_emails)


class JobBoardScraper:
    """
    Scrape job boards for company and contact information.
    Based on: 
    - https://github.com/umur957/hiring-cafe-job-scraper
    - https://github.com/Ashishkapil/Web-scraping-job-portal-sites
    
    Supports: Hiring.cafe, Glassdoor, Monster, Indeed, LinkedIn
    """
    
    HIRING_CAFE_API = "https://api.hiring.cafe/api/v1/jobs/search"
    GLASSDOOR_BASE = "https://www.glassdoor.com"
    MONSTER_BASE = "https://www.monster.com"
    INDEED_BASE = "https://www.indeed.com"
    
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    @retry_on_network_error()
    async def scrape_hiring_cafe(
        self,
        search_term: str,
        location: str = "United States",
        max_results: int = 100
    ) -> List[Dict]:
        """
        Scrape jobs from Hiring.cafe API with retry logic.
        
        Args:
            search_term: Job title or keyword to search
            location: Location filter
            max_results: Maximum number of results
            
        Returns:
            List of job dictionaries with company info
        """
        jobs = []
        page = 0
        page_size = min(1000, max_results)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            while len(jobs) < max_results:
                try:
                    payload = {
                        "search_state": {
                            "query": search_term,
                            "location": location,
                            "workplace_types": ["remote", "hybrid", "onsite"],
                            "commitment_types": ["full_time", "part_time", "contract"],
                            "seniority_levels": ["entry", "mid", "senior"],
                            "date_range": "last_61_days"
                        },
                        "page": page,
                        "page_size": page_size
                    }
                    
                    response = await client.post(
                        self.HIRING_CAFE_API,
                        json=payload,
                        headers={
                            'User-Agent': 'Mozilla/5.0',
                            'Content-Type': 'application/json'
                        }
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Hiring.cafe API error: {response.status_code}")
                        break
                    
                    data = response.json()
                    results = data.get('results', [])
                    
                    if not results:
                        break
                    
                    for job in results:
                        # Clean and structure job data
                        clean_job = {
                            'id': job.get('id'),
                            'title': self._clean_html(job.get('title', '')),
                            'company': job.get('source', 'Unknown'),
                            'apply_url': job.get('apply_url'),
                            'description': self._clean_html(job.get('description', '')),
                            'location': job.get('location', location),
                            'workplace_type': job.get('workplace_type'),
                            'commitment_type': job.get('commitment_type'),
                            'seniority': job.get('seniority_level'),
                            'viewed_count': job.get('viewed_count', 0),
                            'applied_count': job.get('applied_count', 0),
                        }
                        jobs.append(clean_job)
                    
                    page += 1
                    
                    # Rate limiting
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error scraping Hiring.cafe page {page}: {e}")
                    break
        
        return jobs[:max_results]
    
    def _clean_html(self, html_text: str) -> str:
        """Remove HTML tags and clean text."""
        if not html_text:
            return ""
        
        soup = BeautifulSoup(html_text, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    async def extract_company_info(self, company_name: str) -> Dict:
        """
        Extract company information from various sources.
        
        Args:
            company_name: Name of the company
            
        Returns:
            Dict with company info including potential contact emails
        """
        info = {
            'name': company_name,
            'website': None,
            'emails': [],
            'social_links': {}
        }
        
        # Try to find company website
        search_query = f"{company_name} official website"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Simple Google search (in production, use proper search API)
                response = await client.get(
                    f"https://www.google.com/search?q={search_query}",
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Extract first result link
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if '/url?q=' in href:
                            url = href.split('/url?q=')[1].split('&')[0]
                            if company_name.lower() in url.lower():
                                info['website'] = url
                                break
        except Exception as e:
            logger.error(f"Error finding company website: {e}")
        
        return info
    
    async def scrape_glassdoor(
        self,
        search_term: str,
        location: str = "United States",
        max_results: int = 50
    ) -> List[Dict]:
        """
        Scrape jobs from Glassdoor.
        
        Args:
            search_term: Job title or keyword
            location: Location filter
            max_results: Maximum number of results
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
                # Glassdoor search URL
                search_url = f"{self.GLASSDOOR_BASE}/Job/jobs.htm"
                params = {
                    'sc.keyword': search_term,
                    'locT': 'C',
                    'locId': '1',
                    'jobType': 'all',
                    'fromAge': -1,
                    'minSalary': 0,
                    'includeNoSalaryJobs': 'true',
                    'radius': 25,
                    'cityId': -1,
                    'minRating': 0.0,
                    'industryId': -1,
                    'sgocId': -1,
                    'seniorityType': 'all',
                    'companyId': -1,
                    'employerSizes': '0',
                    'applicationType': '0',
                    'remoteWorkType': '0',
                    'pageSize': min(30, max_results),
                    'page': 1
                }
                
                response = await client.get(search_url, params=params)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find job cards
                    job_cards = soup.find_all('li', class_='react-job-listing')
                    
                    for card in job_cards[:max_results]:
                        try:
                            job = self._parse_glassdoor_job(card)
                            if job:
                                jobs.append(job)
                        except Exception as e:
                            logger.error(f"Error parsing Glassdoor job: {e}")
                            continue
                
                logger.info(f"Scraped {len(jobs)} jobs from Glassdoor")
                
        except Exception as e:
            logger.error(f"Error scraping Glassdoor: {e}")
        
        return jobs
    
    def _parse_glassdoor_job(self, card) -> Optional[Dict]:
        """Parse a Glassdoor job card."""
        try:
            # Extract job details
            title_elem = card.find('a', class_='job-title')
            company_elem = card.find('div', class_='employer-name')
            location_elem = card.find('div', class_='location')
            salary_elem = card.find('span', class_='salary-estimate')
            
            if not title_elem:
                return None
            
            job = {
                'title': self._clean_html(title_elem.get_text()),
                'company': self._clean_html(company_elem.get_text()) if company_elem else 'Unknown',
                'location': self._clean_html(location_elem.get_text()) if location_elem else 'Unknown',
                'salary': self._clean_html(salary_elem.get_text()) if salary_elem else None,
                'apply_url': f"{self.GLASSDOOR_BASE}{title_elem.get('href', '')}",
                'source': 'Glassdoor',
                'description': '',
                'workplace_type': 'Unknown',
                'commitment_type': 'full_time',
                'seniority': 'Unknown',
            }
            
            return job
            
        except Exception as e:
            logger.error(f"Error parsing Glassdoor job card: {e}")
            return None
    
    async def scrape_monster(
        self,
        search_term: str,
        location: str = "United States",
        max_results: int = 50
    ) -> List[Dict]:
        """
        Scrape jobs from Monster.com.
        
        Args:
            search_term: Job title or keyword
            location: Location filter
            max_results: Maximum number of results
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
                # Monster search URL
                search_url = f"{self.MONSTER_BASE}/jobs/search"
                params = {
                    'q': search_term,
                    'where': location,
                    'page': 1
                }
                
                response = await client.get(search_url, params=params)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find job cards
                    job_cards = soup.find_all('div', class_='job-cardstyle__JobCardComponent')
                    
                    for card in job_cards[:max_results]:
                        try:
                            job = self._parse_monster_job(card)
                            if job:
                                jobs.append(job)
                        except Exception as e:
                            logger.error(f"Error parsing Monster job: {e}")
                            continue
                
                logger.info(f"Scraped {len(jobs)} jobs from Monster")
                
        except Exception as e:
            logger.error(f"Error scraping Monster: {e}")
        
        return jobs
    
    def _parse_monster_job(self, card) -> Optional[Dict]:
        """Parse a Monster job card."""
        try:
            # Extract job details
            title_elem = card.find('h2', class_='title')
            company_elem = card.find('div', class_='company')
            location_elem = card.find('div', class_='location')
            salary_elem = card.find('div', class_='salary')
            
            if not title_elem:
                return None
            
            job = {
                'title': self._clean_html(title_elem.get_text()),
                'company': self._clean_html(company_elem.get_text()) if company_elem else 'Unknown',
                'location': self._clean_html(location_elem.get_text()) if location_elem else 'Unknown',
                'salary': self._clean_html(salary_elem.get_text()) if salary_elem else None,
                'apply_url': title_elem.find('a').get('href', '') if title_elem.find('a') else '',
                'source': 'Monster',
                'description': '',
                'workplace_type': 'Unknown',
                'commitment_type': 'full_time',
                'seniority': 'Unknown',
            }
            
            return job
            
        except Exception as e:
            logger.error(f"Error parsing Monster job card: {e}")
            return None
    
    async def scrape_indeed(
        self,
        search_term: str,
        location: str = "United States",
        max_results: int = 50
    ) -> List[Dict]:
        """
        Scrape jobs from Indeed.com.
        
        Args:
            search_term: Job title or keyword
            location: Location filter
            max_results: Maximum number of results
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0, headers=self.headers) as client:
                # Indeed search URL
                search_url = f"{self.INDEED_BASE}/jobs"
                params = {
                    'q': search_term,
                    'l': location,
                    'start': 0
                }
                
                response = await client.get(search_url, params=params)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find job cards - Indeed uses various class names
                    job_cards = soup.find_all('div', class_='job_seen_beacon')
                    if not job_cards:
                        job_cards = soup.find_all('div', class_='jobsearch-SerpJobCard')
                    
                    for card in job_cards[:max_results]:
                        try:
                            job = self._parse_indeed_job(card)
                            if job:
                                jobs.append(job)
                        except Exception as e:
                            logger.error(f"Error parsing Indeed job: {e}")
                            continue
                
                logger.info(f"Scraped {len(jobs)} jobs from Indeed")
                
        except Exception as e:
            logger.error(f"Error scraping Indeed: {e}")
        
        return jobs
    
    def _parse_indeed_job(self, card) -> Optional[Dict]:
        """Parse an Indeed job card."""
        try:
            # Extract job details
            title_elem = card.find('h2', class_='jobTitle')
            if not title_elem:
                title_elem = card.find('a', class_='jobtitle')
            
            company_elem = card.find('span', class_='companyName')
            location_elem = card.find('div', class_='companyLocation')
            salary_elem = card.find('div', class_='salary-snippet')
            
            if not title_elem:
                return None
            
            # Get job URL
            job_link = title_elem.find('a')
            job_url = f"{self.INDEED_BASE}{job_link.get('href', '')}" if job_link else ''
            
            job = {
                'title': self._clean_html(title_elem.get_text()),
                'company': self._clean_html(company_elem.get_text()) if company_elem else 'Unknown',
                'location': self._clean_html(location_elem.get_text()) if location_elem else 'Unknown',
                'salary': self._clean_html(salary_elem.get_text()) if salary_elem else None,
                'apply_url': job_url,
                'source': 'Indeed',
                'description': '',
                'workplace_type': 'Unknown',
                'commitment_type': 'full_time',
                'seniority': 'Unknown',
            }
            
            return job
            
        except Exception as e:
            logger.error(f"Error parsing Indeed job card: {e}")
            return None
    
    async def scrape_all_sources(
        self,
        search_term: str,
        location: str = "United States",
        max_results_per_source: int = 20
    ) -> Dict[str, List[Dict]]:
        """
        Scrape jobs from all available sources concurrently.
        
        Args:
            search_term: Job title or keyword
            location: Location filter
            max_results_per_source: Max results per source
            
        Returns:
            Dict with source names as keys and job lists as values
        """
        tasks = [
            self.scrape_hiring_cafe(search_term, location, max_results_per_source),
            self.scrape_glassdoor(search_term, location, max_results_per_source),
            self.scrape_monster(search_term, location, max_results_per_source),
            self.scrape_indeed(search_term, location, max_results_per_source),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            'hiring_cafe': results[0] if not isinstance(results[0], Exception) else [],
            'glassdoor': results[1] if not isinstance(results[1], Exception) else [],
            'monster': results[2] if not isinstance(results[2], Exception) else [],
            'indeed': results[3] if not isinstance(results[3], Exception) else [],
        }


class EnhancedProspectScraper:
    """
    Combined scraper for comprehensive prospect research.
    Integrates email scraping and job board scraping.
    """
    
    def __init__(self):
        self.email_scraper = EmailScraper(max_depth=2, max_pages=30)
        self.job_scraper = JobBoardScraper()
    
    async def research_company(
        self,
        company_name: str,
        company_website: Optional[str] = None
    ) -> Dict:
        """
        Comprehensive company research.
        
        Args:
            company_name: Name of the company
            company_website: Company website URL (optional)
            
        Returns:
            Dict with company info, emails, and contacts
        """
        result = {
            'company_name': company_name,
            'website': company_website,
            'emails': [],
            'contacts': [],
            'jobs': []
        }
        
        # If no website provided, try to find it
        if not company_website:
            company_info = await self.job_scraper.extract_company_info(company_name)
            result['website'] = company_info.get('website')
        
        # Scrape emails from company website
        if result['website']:
            try:
                emails = await self.email_scraper.scrape(result['website'])
                result['emails'] = emails
                logger.info(f"Found {len(emails)} emails for {company_name}")
            except Exception as e:
                logger.error(f"Error scraping emails for {company_name}: {e}")
        
        return result
    
    async def find_prospects_by_job_title(
        self,
        job_title: str,
        location: str = "United States",
        max_results: int = 50,
        sources: List[str] = None
    ) -> List[Dict]:
        """
        Find prospects by scraping job boards.
        
        Args:
            job_title: Job title to search for
            location: Location filter
            max_results: Maximum number of results
            sources: List of sources to scrape (default: all)
            
        Returns:
            List of prospect dictionaries
        """
        if sources is None:
            # Scrape all sources
            all_jobs = await self.job_scraper.scrape_all_sources(
                search_term=job_title,
                location=location,
                max_results_per_source=max_results // 4  # Distribute across sources
            )
            
            # Combine all jobs
            jobs = []
            for source, source_jobs in all_jobs.items():
                jobs.extend(source_jobs)
        else:
            # Scrape specific sources
            jobs = []
            for source in sources:
                if source == 'hiring_cafe':
                    source_jobs = await self.job_scraper.scrape_hiring_cafe(
                        job_title, location, max_results
                    )
                elif source == 'glassdoor':
                    source_jobs = await self.job_scraper.scrape_glassdoor(
                        job_title, location, max_results
                    )
                elif source == 'monster':
                    source_jobs = await self.job_scraper.scrape_monster(
                        job_title, location, max_results
                    )
                elif source == 'indeed':
                    source_jobs = await self.job_scraper.scrape_indeed(
                        job_title, location, max_results
                    )
                else:
                    continue
                jobs.extend(source_jobs)
        
        prospects = []
        
        # Process each job to extract company info
        for job in jobs[:max_results]:
            company_name = job.get('company', 'Unknown')
            
            prospect = {
                'name': f"{job.get('title')} at {company_name}",
                'title': job.get('title'),
                'company': company_name,
                'location': job.get('location'),
                'salary': job.get('salary'),
                'apply_url': job.get('apply_url'),
                'description': job.get('description', '')[:500],  # First 500 chars
                'source': job.get('source', 'Unknown'),
                'workplace_type': job.get('workplace_type'),
                'commitment_type': job.get('commitment_type'),
                'seniority': job.get('seniority'),
                'relevance_score': self._calculate_relevance(job, job_title)
            }
            
            prospects.append(prospect)
        
        return prospects
    
    def _calculate_relevance(self, job: Dict, search_term: str) -> float:
        """Calculate relevance score based on job data."""
        score = 0.5  # Base score
        
        title = job.get('title', '').lower()
        description = job.get('description', '').lower()
        search_lower = search_term.lower()
        
        # Title match
        if search_lower in title:
            score += 0.3
        
        # Description match
        if search_lower in description:
            score += 0.1
        
        # Engagement signals
        if job.get('applied_count', 0) > 10:
            score += 0.05
        
        if job.get('viewed_count', 0) > 50:
            score += 0.05
        
        return min(score, 1.0)


# Singleton instance
enhanced_scraper = EnhancedProspectScraper()
