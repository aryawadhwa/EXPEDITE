/**
 * Web Scraper API Client
 * Provides access to email scraping and job board intelligence
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get Clerk token
async function getClerkToken(): Promise<string | null> {
  try {
    // Try to get token from Clerk's session
    const { getToken } = await import('@clerk/clerk-react');
    // This will be called from React components where useAuth is available
    return null; // Will be set per request
  } catch {
    return null;
  }
}

export interface EmailScrapeRequest {
  url: string;
  max_depth?: number;
  max_pages?: number;
}

export interface EmailScrapeResponse {
  success: boolean;
  url: string;
  emails_found: number;
  emails: string[];
  pages_visited: number;
}

export interface JobSearchRequest {
  job_title: string;
  location?: string;
  max_results?: number;
  sources?: string[]; // ['hiring_cafe', 'glassdoor', 'monster', 'indeed']
}

export interface Prospect {
  name: string;
  title: string;
  company: string;
  location: string;
  apply_url: string;
  description: string;
  source: string;
  relevance_score: number;
}

export interface JobSearchResponse {
  success: boolean;
  job_title: string;
  location: string;
  prospects_found: number;
  prospects: Prospect[];
  sources_used: string[];
  breakdown_by_source: Record<string, number>;
}

export interface CompanyResearchRequest {
  company_name: string;
  company_website?: string;
}

export interface CompanyResearchResponse {
  success: boolean;
  company: {
    company_name: string;
    website: string | null;
    emails: string[];
    contacts: any[];
    jobs: any[];
  };
}

export interface ScraperStatus {
  status: string;
  capabilities: {
    email_scraping: boolean;
    job_board_scraping: boolean;
    company_research: boolean;
    recursive_crawling: boolean;
  };
  sources: string[];
  limits: {
    max_depth: number;
    max_pages_per_scrape: number;
    rate_limit: string;
  };
}

/**
 * Scrape emails from a website
 */
export async function scrapeEmails(
  request: EmailScrapeRequest
): Promise<EmailScrapeResponse> {
  const response = await apiClient.post('/scraper/scrape-emails', {
    url: request.url,
    max_depth: request.max_depth || 2,
    max_pages: request.max_pages || 30,
  });
  return response.data;
}

/**
 * Search job boards for prospects
 */
export async function scrapeJobs(
  request: JobSearchRequest
): Promise<JobSearchResponse> {
  const response = await apiClient.post('/scraper/scrape-jobs', {
    job_title: request.job_title,
    location: request.location || 'United States',
    max_results: request.max_results || 50,
    sources: request.sources, // Optional: specify which sources to use
  });
  return response.data;
}

/**
 * Research a company comprehensively
 */
export async function researchCompany(
  request: CompanyResearchRequest
): Promise<CompanyResearchResponse> {
  const response = await apiClient.post('/scraper/research-company', {
    company_name: request.company_name,
    company_website: request.company_website,
  });
  return response.data;
}

/**
 * Get scraper service status
 */
export async function getScraperStatus(): Promise<ScraperStatus> {
  const response = await apiClient.get('/scraper/scraper/status');
  return response.data;
}
