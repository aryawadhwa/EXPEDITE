/**
 * Prospect Research Page
 * Unified interface for web scraping and job board intelligence
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/lib/api';

export default function ProspectResearch() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email scraping state
  const [emailUrl, setEmailUrl] = useState('');
  const [emailResults, setEmailResults] = useState<any | null>(null);

  // Job scraping state
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('United States');
  const [jobSources, setJobSources] = useState<string[]>([]);
  const [jobResults, setJobResults] = useState<any | null>(null);

  // Company research state
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyResults, setCompanyResults] = useState<any | null>(null);

  const handleEmailScrape = async () => {
    if (!emailUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.scrapeEmails(emailUrl, 2, 30);
      setEmailResults(result);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape emails');
    } finally {
      setLoading(false);
    }
  };

  const handleJobScrape = async () => {
    if (!jobTitle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.scrapeJobs(
        jobTitle,
        jobLocation,
        50,
        jobSources.length > 0 ? jobSources : undefined
      );
      setJobResults(result);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyResearch = async () => {
    if (!companyName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.researchCompany(
        companyName,
        companyWebsite || undefined
      );
      setCompanyResults(result);
    } catch (err: any) {
      setError(err.message || 'Failed to research company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Prospect Research</h1>
        <p className="text-muted-foreground">
          Find emails, discover warm leads, and research companies
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="emails" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails">Email Scraper</TabsTrigger>
          <TabsTrigger value="jobs">Job Boards</TabsTrigger>
          <TabsTrigger value="company">Company Research</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-url">Website URL</Label>
                <Input
                  id="email-url"
                  placeholder="https://example.com"
                  value={emailUrl}
                  onChange={(e) => setEmailUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Recursively crawls website to find email addresses
                </p>
              </div>

              <Button onClick={handleEmailScrape} disabled={loading || !emailUrl}>
                {loading ? 'Scraping...' : 'Scrape Emails'}
              </Button>
            </div>
          </Card>

          {emailResults && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Emails Found:</span> {emailResults.emails_found || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Valid Emails:</span>{' '}
                  <span className="text-green-600 font-semibold">{emailResults.valid_emails_count || 0}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Invalid Emails:</span>{' '}
                  <span className="text-red-600">{emailResults.invalid_emails_count || 0}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Pages Visited:</span> {emailResults.pages_visited || 0}
                </p>
              </div>

              {emailResults.valid_emails && emailResults.valid_emails.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2"> Valid Emails ({emailResults.valid_emails_count})</h4>
                    <div className="space-y-2">
                      {emailResults.verification_details && emailResults.verification_details
                        .filter((detail: any) => detail.valid)
                        .map((detail: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex-1">
                              <span className="font-mono text-sm font-medium">{detail.email}</span>
                              {detail.mx_records && detail.mx_records.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  MX: {detail.mx_records[0]}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(detail.email)}
                            >
                              Copy
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {emailResults.invalid_emails && emailResults.invalid_emails.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2"> Invalid Emails ({emailResults.invalid_emails_count})</h4>
                      <div className="space-y-2">
                        {emailResults.verification_details && emailResults.verification_details
                          .filter((detail: any) => !detail.valid)
                          .map((detail: any, idx: number) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-sm">{detail.email}</span>
                                <Badge variant="destructive">Invalid</Badge>
                              </div>
                              <p className="text-xs text-red-600">
                                {detail.errors && detail.errors.join(', ')}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No valid emails found</p>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="VP of Sales"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  placeholder="United States"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div>
                <Label>Job Portals (leave empty for all)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['hiring_cafe', 'glassdoor', 'monster', 'indeed'].map((source) => (
                    <Badge
                      key={source}
                      variant={jobSources.includes(source) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setJobSources((prev) =>
                          prev.includes(source)
                            ? prev.filter((s) => s !== source)
                            : [...prev, source]
                        );
                      }}
                    >
                      {source === 'hiring_cafe' ? 'Hiring.cafe' : source.charAt(0).toUpperCase() + source.slice(1)}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Click to select specific sources, or leave empty to search all
                </p>
              </div>

              <Button onClick={handleJobScrape} disabled={loading || !jobTitle}>
                {loading ? 'Searching...' : 'Find Prospects'}
              </Button>
            </div>
          </Card>

          {jobResults && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Found {jobResults.prospects_found} Prospects
                </h3>
                <div className="flex gap-2">
                  {Object.entries(jobResults.breakdown_by_source).map(([source, count]) => (
                    <Badge key={source} variant="secondary">
                      {source}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {jobResults.prospects.map((prospect: Prospect, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{prospect.company}</h4>
                        <p className="text-sm text-muted-foreground">{prospect.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{prospect.source}</Badge>
                        <Badge variant="secondary">
                          {Math.round(prospect.relevance_score * 100)}% match
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{prospect.location}</p>
                    {prospect.salary && (
                      <p className="text-sm font-medium text-green-600 mb-2">{prospect.salary}</p>
                    )}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {prospect.description}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={prospect.apply_url} target="_blank" rel="noopener noreferrer">
                          View Job
                        </a>
                      </Button>
                      <Button size="sm">Add to Mission</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="company-website">Website (Optional)</Label>
                <Input
                  id="company-website"
                  placeholder="https://acme.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>

              <Button onClick={handleCompanyResearch} disabled={loading || !companyName}>
                {loading ? 'Researching...' : 'Research Company'}
              </Button>
            </div>
          </Card>

          {companyResults && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Company Profile</h3>

              <div className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <p className="text-sm">{companyResults.company.company_name}</p>
                </div>

                {companyResults.company.website && (
                  <div>
                    <Label>Website</Label>
                    <a
                      href={companyResults.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {companyResults.company.website}
                    </a>
                  </div>
                )}

                <div>
                  <Label>Emails Found ({companyResults.company.emails.length})</Label>
                  <div className="space-y-2 mt-2">
                    {companyResults.company.emails.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">{email}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(email)}
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
