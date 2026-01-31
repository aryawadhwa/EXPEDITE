
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MagnetLines } from "@/components/ui/MagnetLines";
import {
  Bot,
  Play,
  Pause,
  MoreVertical,
  Activity,
  Linkedin,
  Twitter,
  Mail,
  MessageSquare,
  Github,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useApi, Mission } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

// Use Mission as the primary data source, mapped to AgentUI for display
interface AgentUI {
  id: string;
  name: string;
  type: "scout" | "writer" | "enricher" | "custom";
  status: "active" | "completed" | "failed" | "stopped";
  mission: string;
  progress: number;
  stats: {
    processed: number; // prospects_count
    queued: number;    // drafts_count
    errors: number;
  };
  uptime: string;
  createdAt: string;
}

export default function ActiveAgents() {
  const [agents, setAgents] = useState<AgentUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser();
  const { listMissions, stopMission } = useApi();

  const fetchAgents = useCallback(async () => {
    try {
      const missions: Mission[] = await listMissions();
      
      const mappedAgents: AgentUI[] = missions.map((mission) => {
        // Determine status - map backend status to frontend status
        let status: AgentUI["status"] = "active";
        if (mission.status === "completed" || mission.status === "done") status = "completed";
        if (mission.status === "failed") status = "failed";
        if (mission.status === "stopped") status = "stopped";
        if (mission.status === "running") status = "active";

        // Determine agent type based on objective keywords
        let type: AgentUI["type"] = "scout";
        const objLower = mission.objective.toLowerCase();
        if (objLower.includes("write") || objLower.includes("email") || objLower.includes("draft")) type = "writer";
        else if (objLower.includes("enrich") || objLower.includes("find")) type = "scout";
        else if (objLower.includes("custom")) type = "custom";

        // Calculate synthetic progress based on status/counts
        let progress = 0;
        if (status === "completed") progress = 100;
        else if (status === "active") progress = 50; 
        
        return {
          id: mission.id || mission._id || "unknown",
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
          type,
          status,
          mission: mission.objective,
          progress,
          stats: {
            processed: mission.prospects_count || 0,
            queued: mission.drafts_count || 0,
            errors: 0
          },
          uptime: formatDistanceToNow(new Date(mission.created_at)),
          createdAt: mission.created_at
        };
      });
      
      // Sort by active first, then date
      mappedAgents.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAgents(mappedAgents);
    } catch (error) {
      console.error("Failed to fetch missions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [listMissions]);

  useEffect(() => {
    fetchAgents();
     // Set up a refresh interval to keep stats live
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const handleStopMission = async (id: string) => {
      try {
          await stopMission(id);
          fetchAgents(); // Refresh immediately
      } catch (e) {
          console.error("Failed to stop mission", e);
      }
  }

  const navigateToMission = (id: string) => {
      navigate(`/chat/${id}`);
  }

  // Helper for icons (Replacing SVGs with Lucide)
  const getChannelIcon = (missionObj: string) => {
      const lower = missionObj.toLowerCase();
      if (lower.includes("linkedin")) return <Linkedin className="w-5 h-5 text-[#0077b5]" />;
      if (lower.includes("twitter")) return <Twitter className="w-5 h-5 text-[#1da1f2]" />;
      if (lower.includes("reddit")) return <MessageSquare className="w-5 h-5 text-[#ff4500]" />;
      if (lower.includes("github")) return <Github className="w-5 h-5 text-white" />;
      return <Mail className="w-5 h-5 text-zinc-400" />;
  };

  const getStatusColor = (status: AgentUI["status"]) => {
      switch (status) {
          case "active": return "text-emerald-400";
          case "completed": return "text-blue-400";
          case "failed": return "text-red-400";
          case "stopped": return "text-zinc-400";
          default: return "text-zinc-400";
      }
  };

  const getStatusIcon = (status: AgentUI["status"]) => {
      switch (status) {
          case "active": return <Activity className="w-3 h-3 animate-pulse text-emerald-400" />;
          case "completed": return <CheckCircle2 className="w-3 h-3 text-blue-400" />;
          case "failed": return <XCircle className="w-3 h-3 text-red-400" />;
          case "stopped": return <Pause className="w-3 h-3 text-zinc-400" />;
          default: return <Clock className="w-3 h-3 text-zinc-400" />;
      }
  };

  return (
    <div className="h-full p-6 lg:p-8 overflow-auto bg-black/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Agents</h1>
          <p className="text-zinc-400 mt-1">Monitor and control your AI workforce executing missions</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 font-mono bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10">
            <Activity className="w-3 h-3" />
            {agents.filter(a => a.status === "active").length} Active
          </Badge>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(139,92,246,0.3)]" onClick={() => navigate('/chat/new')}>
            <Bot className="w-4 h-4" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="columns-1 lg:columns-2 xl:columns-3 gap-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 p-5 bg-white/5 border border-white/10 rounded-xl">
              <Skeleton className="h-40 w-full bg-white/5" />
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full relative overflow-hidden rounded-xl border border-dashed border-white/10 min-h-[400px] flex items-center justify-center bg-white/5">
            <MagnetLines
              rows={9}
              columns={9}
              containerSize="100%"
              lineColor="rgba(255, 255, 255, 0.1)"
              lineWidth="2px"
              lineHeight="20px"
              baseAngle={0}
              className="absolute inset-0 z-0"
            />
            <div className="relative z-10 text-center py-12 text-zinc-400">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active missions found.</p>
              <Button variant="outline" className="mt-4 bg-black/50 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:text-white" onClick={() => navigate('/chat/new')}>
                Start a New Mission
              </Button>
            </div>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="break-inside-avoid mb-4 p-5 bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-xl hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex items-start justify-between mb-4 relative z-10 w-full">
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(agent.mission)}
                      <span className="text-sm font-semibold text-zinc-200">
                        {agent.name}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => navigateToMission(agent.id)} className="focus:bg-white/10 focus:text-white">
                          View Mission Console
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white">View Details</DropdownMenuItem>
                        {agent.status === "active" && (
                            <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleStopMission(agent.id)}
                            >
                            Stop Mission
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-zinc-500 focus:bg-white/10 focus:text-zinc-300"
                        >
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <div 
                className="mb-4 p-3 rounded-lg bg-black/40 border border-white/5 cursor-pointer hover:bg-black/60 transition-colors"
                onClick={() => navigateToMission(agent.id)}
              >
                <div className="flex items-start gap-2">
                    <Terminal className="w-3 h-3 text-zinc-500 mt-1 shrink-0" />
                    <p className="text-sm text-zinc-300 line-clamp-2">{agent.mission}</p>
                </div>
              </div>
              
              <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>Started {agent.uptime} ago</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(agent.status)}
                  <span className={`uppercase font-bold text-[10px] ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Progress */}
              {agent.status === "active" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">Mission Progress</span>
                    <span className="font-mono text-purple-400">{agent.progress}%</span>
                  </div>
                  <Progress value={agent.progress} className="h-1.5 bg-white/10" />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="font-mono text-xl font-bold text-white">{agent.stats.processed}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">Prospects</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xl font-bold text-emerald-400">{agent.stats.queued}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">Drafts</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xl font-bold text-red-500/50">{agent.stats.errors}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-1">Issues</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                    onClick={() => navigateToMission(agent.id)}
                >
                    <Terminal className="w-3.5 h-3.5" />
                    View Console
                </Button>
                {agent.status === "active" && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-9 px-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        onClick={() => handleStopMission(agent.id)}
                        title="Stop Mission"
                    >
                        <Pause className="w-3.5 h-3.5" />
                    </Button>
                )}
              </div>
            </div>
          )))
        }
      </div>
    </div>
  );
}
