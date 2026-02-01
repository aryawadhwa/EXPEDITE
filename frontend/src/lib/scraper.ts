/**
 * Web Scraper API Client
 * Provides access to email scraping and job board intelligence
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use(async (config) => {
  try {
    // Get token from Clerk session if available
    const token = await (window as any).__clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

export interface EmailScrapeRequest {
  url: string;
  max_depth?: number;
  max_pages?: number;
}

export interface EmailScrapeResponse {
  success: boolean;
  url: string;
  emails_found: number;
  valid_emails_count: number;
  invalid_emails_count: number;
  valid_emails: string[];
  invalid_emails: string[];
  verification_details: Array<{
    email: string;
    valid: boolean;
    validation_type: string;
    errors: string[];
    mx_records: string[];
  }>;
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
    multi_source_scraping: boolean;
  };
  sources: string[];
  limits: {
    max_depth: number;
    max_pages_per_scrape: number;
    rate_limit: string;
  };
  supported_job_portals: Array<{
    name: string;
    status: string;
    type: string;
    features: string[];
  }>;
}

export interface EmailVerifyRequest {
  email: string;
  validation_level?: 'regex' | 'mx' | 'mx_blacklist' | 'smtp';
}

export interface EmailVerifyResponse {
  success: boolean;
  result: {
    email: string;
    valid: boolean;
    validation_type: string;
    errors: string[];
    mx_records: string[];
    smtp_check?: boolean;
    disposable?: boolean;
  };
}

export interface EmailVerifyBatchRequest {
  emails: string[];
  validation_level?: 'regex' | 'mx' | 'mx_blacklist' | 'smtp';
}

export interface EmailVerifyBatchResponse {
  success: boolean;
  total: number;
  valid: number;
  invalid: number;
  results: Array<{
    email: string;
    valid: boolean;
    validation_type: string;
    errors: string[];
    mx_records: string[];
  }>;
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

/**
 * Verify a single email address
 */
export async function verifyEmail(
  request: EmailVerifyRequest
): Promise<EmailVerifyResponse> {
  const response = await apiClient.post('/scraper/verify-email', {
    email: request.email,
    validation_level: request.validation_level || 'mx',
  });
  return response.data;
}

/**
 * Verify multiple email addresses in batch
 */
export async function verifyEmailsBatch(
  request: EmailVerifyBatchRequest
): Promise<EmailVerifyBatchResponse> {
  const response = await apiClient.post('/scraper/verify-emails-batch', {
    emails: request.emails,
    validation_level: request.validation_level || 'mx',
  });
  return response.data;
}
