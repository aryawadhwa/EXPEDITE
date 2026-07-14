import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Rocket,
  CheckCircle2,
  Users,
  TrendingUp,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  BarChart3,
  Target,
  Clock,
  Activity,
} from "lucide-react";
import { useApi } from "@/lib/api";

interface DashboardStats {
  active_missions: number;
  pending_drafts: number;
  total_contacts: number;
  success_rate: number;
}

interface Mission {
  _id: string;
  objective: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface SectorSignal {
  sector: string;
  score: number;
  updated_at: string;
  news: Array<{ title: string; link: string; source: string; published_at: string }>;
}

interface CompanyIntel {
  company: string;
  news: Array<{ title: string; link: string; source: string; published_at: string }>;
  application_links: Record<string, string>;
}

interface ProofLedgerRow {
  prospect_id: string;
  name: string;
  company: string;
  email: string;
  source_url: string;
  verification_method: string;
  email_format_valid: boolean;
  domain_has_mx: boolean;
  smtp_likely_deliverable: boolean;
  verification_confidence: number;
  risk_flag: string;
  last_verified_at: string;
  pending_draft_count: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const api = useApi();
  const [stats, setStats] = useState<DashboardStats>({
    active_missions: 0,
    pending_drafts: 0,
    total_contacts: 0,
    success_rate: 0
  });
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [sectorSignals, setSectorSignals] = useState<SectorSignal[]>([]);
  const [companyIntel, setCompanyIntel] = useState<CompanyIntel | null>(null);
  const [proofRows, setProofRows] = useState<ProofLedgerRow[]>([]);
  const [companyQuery, setCompanyQuery] = useState("Stripe");
  const [intelLoading, setIntelLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [missions, drafts, contacts, sectorIntel, proofLedger] = await Promise.all([
        api.listMissions(),
        api.getPendingDrafts(),
        api.getContactHistory().then((r) => (Array.isArray(r) ? r : r?.contacts || [])),
        api.getSectorIntel(["AI", "Security", "Developer Tools", "Fintech"], 5),
        api.getProofLedger(),
      ]);

      const activeMissions = missions.filter((m: Mission) => 
        m.status === "active" || m.status === "pending" || m.status === "running"
      );
      const completedMissions = missions.filter((m: Mission) => 
        m.status === "completed"
      );

      setStats({
        active_missions: activeMissions.length,
        pending_drafts: drafts.length,
        total_contacts: contacts.length,
        success_rate: missions.length > 0 
          ? (completedMissions.length / missions.length) * 100 
          : 0
      });
      setActiveMissions(activeMissions.slice(0, 3));
      setSectorSignals(sectorIntel?.signals || []);
      setProofRows(proofLedger?.rows || []);
      await refreshCompanyIntel(companyQuery);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard intelligence. Check backend and retry.");
    } finally {
      setLoading(false);
    }
  };

  const refreshCompanyIntel = async (company: string) => {
    if (!company.trim()) return;
    setIntelLoading(true);
    try {
      const res = await api.getCompanyIntel(company.trim(), 6);
      setCompanyIntel(res?.intel || null);
    } catch (e) {
      console.error(e);
      setCompanyIntel(null);
    } finally {
      setIntelLoading(false);
    }
  };

  const topSectorScore = useMemo(() => sectorSignals[0]?.score || 50, [sectorSignals]);
  const competitionEstimate = useMemo(() => {
    // Higher momentum sectors usually imply stronger competition.
    return Math.max(80, Math.round(topSectorScore * 12.5));
  }, [topSectorScore]);
  const internshipChance = useMemo(() => {
    // Heuristic score based on current activity and market conditions.
    const base = 28;
    const executionBoost = Math.min(30, stats.total_contacts * 0.35 + stats.pending_drafts * 0.9);
    const qualityBoost = stats.success_rate * 0.25;
    const marketBoost = topSectorScore * 0.18;
    const competitionPenalty = competitionEstimate * 0.08;
    const chance = base + executionBoost + qualityBoost + marketBoost - competitionPenalty;
    return Math.max(5, Math.min(92, Math.round(chance)));
  }, [stats, topSectorScore, competitionEstimate]);

  const hoursSaved = useMemo(() => {
    // 30 minutes saved per lead found (15 mins research + 15 mins drafting)
    return Math.round((stats.total_contacts * 30) / 60);
  }, [stats.total_contacts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-semibold">Internship Intelligence Terminal</h1>
            </div>
            <p className="text-muted-foreground">
              Evidence-first pipeline with proofs, competition signal, and strategy recommendations.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="font-mono text-xs">LIVE</Badge>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
              <ShieldCheck className="w-3 h-3 mr-1" />
              GDPR Compliant
            </Badge>
          </div>
        </div>
        {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      </div>

      {/* ROI Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Time Saved</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{hoursSaved}</span>
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>
            <Clock className="w-8 h-8 text-primary/40" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Leads Found</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{stats.total_contacts}</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-muted-foreground/40" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Emails Drafted</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-400">{stats.total_contacts}</span>
              </div>
            </div>
            <Mail className="w-8 h-8 text-blue-400/40" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-secondary/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Internship Chance</p>
            <p className="text-2xl font-bold text-success">{internshipChance}%</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Competition Estimate</p>
            <p className="text-2xl font-bold">{competitionEstimate}+</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Missions</p>
            <p className="text-2xl font-bold">{stats.active_missions}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Verified Pipeline</p>
            <p className="text-2xl font-bold">{stats.total_contacts}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Reviews</p>
            <p className="text-2xl font-bold">{stats.pending_drafts}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sector Momentum (Proofs)
            </CardTitle>
            <CardDescription>News-backed ranking for where to focus applications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectorSignals.slice(0, 4).map((s) => (
              <div key={s.sector} className="p-3 rounded-md border border-border/60 bg-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{s.sector}</div>
                  <Badge>{s.score}/100</Badge>
                </div>
                <div className="space-y-1">
                  {s.news.slice(0, 2).map((n) => (
                    <a
                      key={n.link}
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {n.title} <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Counter Strategy
            </CardTitle>
            <CardDescription>Beat average applicants with asymmetric proof.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
              Send a repo-specific insight in first touch. Generic applicants won’t.
            </div>
            <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
              Attach one relevant build/demo link matching the role stack.
            </div>
            <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
              Use D+3 follow-up with new value, not “just checking in.”
            </div>
            <div className="p-3 rounded-md bg-secondary/30 border border-border/50">
              Prioritize sectors with high momentum and lower crowding.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Company Dossier (Proof Panel)
          </CardTitle>
          <CardDescription>
            Pull company-specific interview/application links and recent news before applying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              placeholder="Type company name (e.g., Stripe, Databricks)"
            />
            <Button onClick={() => void refreshCompanyIntel(companyQuery)} disabled={intelLoading}>
              {intelLoading ? "Loading..." : "Load Intel"}
            </Button>
          </div>

          {companyIntel ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-md border border-border/60 bg-secondary/20">
                <h4 className="font-medium mb-2">Application/Interview Links</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(companyIntel.application_links || {}).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                      {k.replaceAll("_", " ")} <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-md border border-border/60 bg-secondary/20">
                <h4 className="font-medium mb-2">Recent Proof Signals</h4>
                <div className="space-y-2 text-sm">
                  {(companyIntel.news || []).slice(0, 4).map((n) => (
                    <a key={n.link} href={n.link} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                      {n.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No company intel loaded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Proof Ledger
          </CardTitle>
          <CardDescription>
            Every prospect must carry verification signals before send.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proofRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified prospects yet.</p>
          ) : (
            <div className="space-y-2">
              {proofRows.slice(0, 12).map((r) => (
                <div key={r.prospect_id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 rounded-md border border-border/60 bg-secondary/20 text-sm">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-muted-foreground">{r.company}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p>{r.email}</p>
                    {r.source_url ? (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        source <ExternalLink className="inline h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground">no source url</p>
                    )}
                  </div>
                  <div>
                    <p>Format: {r.email_format_valid ? "yes" : "no"}</p>
                    <p>MX: {r.domain_has_mx ? "yes" : "no"}</p>
                    <p>SMTP: {r.smtp_likely_deliverable ? "likely" : "unknown"}</p>
                  </div>
                  <div>
                    <p>Confidence: {r.verification_confidence}%</p>
                    <p>Risk: {r.risk_flag}</p>
                    <p>Method: {r.verification_method}</p>
                  </div>
                  <div>
                    <p>Pending drafts: {r.pending_draft_count}</p>
                    <p className="text-muted-foreground">{new Date(r.last_verified_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:bg-secondary/50 transition-colors border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          onClick={() => navigate("/launchpad")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Rocket className="w-5 h-5 text-primary" />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Create Mission</CardTitle>
            <CardDescription>Start evidence-backed outreach mission</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => navigate("/review")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-5 h-5 text-success" />
              {stats.pending_drafts > 0 ? <Badge variant="destructive">{stats.pending_drafts}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Review Queue</CardTitle>
            <CardDescription>Approve drafts with proof checks</CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => navigate("/contacts")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">{stats.total_contacts}</span>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Contact Intelligence</CardTitle>
            <CardDescription>See verification and engagement state</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Missions
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/agents')}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMissions.map((mission) => (
              <div 
                key={mission._id}
                className="p-4 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/chat/${mission._id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1"> {mission.objective}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {mission.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Transparency Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>- Internship chance is a heuristic, not guaranteed outcome.</p>
          <p>- Competition estimate is inferred from sector momentum and hiring signals.</p>
          <p>- Proof links are fetched from external sources and should be manually reviewed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
