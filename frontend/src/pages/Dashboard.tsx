import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  CheckCircle2, 
  Users, 
  TrendingUp,
  Mail,
  Clock,
  Activity,
  ArrowRight,
  Sparkles
} from "lucide-react";

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
  updated_at: string;
}

interface ActivityItem {
  type: string;
  timestamp: string;
  description: string;
  icon?: string;
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
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [api]);

  const withTimeout = async <T,>(promise: Promise<T>, label: string, ms = 10000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [missionsResult, draftsResult, contactsResult] = await Promise.allSettled([
        withTimeout(api.listMissions(), "Missions"),
        withTimeout(api.getPendingDrafts(), "Drafts"),
        withTimeout(api.getContactHistory(), "Contacts"),
      ]);

      const missions = missionsResult.status === "fulfilled" ? missionsResult.value : [];
      const drafts = draftsResult.status === "fulfilled" ? draftsResult.value : [];
      const contacts = contactsResult.status === "fulfilled" ? contactsResult.value : [];

      const failedLabels = [
        missionsResult.status === "rejected" ? "missions" : null,
        draftsResult.status === "rejected" ? "drafts" : null,
        contactsResult.status === "rejected" ? "contacts" : null,
      ].filter(Boolean);
      
      // Calculate stats
      const activeMissions = missions.filter((m: Mission) => 
        m.status === 'active' || m.status === 'pending' || m.status === 'running'
      );
      
      const completedMissions = missions.filter((m: Mission) => 
        m.status === 'completed'
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
      
      // Mock recent activity (you can replace with real data)
      setRecentActivity([
        {
          type: "email_sent",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          description: "Email sent to prospect",
          icon: "mail"
        },
        {
          type: "draft_approved",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          description: "Draft approved for LinkedIn post",
          icon: "check"
        },
        {
          type: "contact_added",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          description: "New contact added",
          icon: "user"
        }
      ]);

      if (failedLabels.length > 0) {
        setLoadError(`Some dashboard data could not be loaded: ${failedLabels.join(", ")}.`);
      }
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoadError("Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto mobile-page-padding space-y-4 md:space-y-6">
      {loadError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {loadError}
          <Button variant="ghost" size="sm" className="ml-2 h-auto p-0 text-amber-100 hover:bg-transparent hover:text-white" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Welcome back!</h1>
        </div>
        <p className="text-muted-foreground">
          You have {stats.pending_drafts} pending draft{stats.pending_drafts !== 1 ? 's' : ''} and {stats.active_missions} active mission{stats.active_missions !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:bg-secondary/50 transition-colors border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          onClick={() => navigate('/chat/new')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Rocket className="w-5 h-5 text-primary" />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Create Mission</CardTitle>
            <CardDescription>Start a new AI-powered task</CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/review')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="w-5 h-5 text-success" />
              {stats.pending_drafts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.pending_drafts}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Review Queue</CardTitle>
            <CardDescription>
              {stats.pending_drafts} draft{stats.pending_drafts !== 1 ? 's' : ''} waiting
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/contacts')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">{stats.total_contacts}</span>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-lg mb-1">Contacts</CardTitle>
            <CardDescription>Manage your connections</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="rounded-lg bg-secondary/30 p-3 text-center md:p-4">
              <div className="mb-1 text-2xl font-bold text-primary md:text-3xl">
                {stats.active_missions}
              </div>
              <div className="text-sm text-muted-foreground">Active Missions</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center md:p-4">
              <div className="mb-1 text-2xl font-bold text-blue-400 md:text-3xl">
                {stats.total_contacts}
              </div>
              <div className="text-sm text-muted-foreground">Contacts</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center md:p-4">
              <div className="mb-1 text-2xl font-bold text-success md:text-3xl">
                {stats.success_rate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center md:p-4">
              <div className="mb-1 text-2xl font-bold text-orange-400 md:text-3xl">
                {stats.pending_drafts}
              </div>
              <div className="text-sm text-muted-foreground">Pending Drafts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Active Missions
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/agents')}
                className="justify-start sm:justify-center"
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
                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1"> {mission.objective}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {mission.status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(mission.updated_at)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="flex-1">{activity.description}</span>
                <span className="text-muted-foreground text-xs">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
