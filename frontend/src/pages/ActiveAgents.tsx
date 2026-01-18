import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Bot,
  Play,
  Pause,
  MoreVertical,
  Activity,
  Clock,
  Target,
  Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  type: "scout" | "writer" | "enricher";
  status: "active" | "idle" | "error";
  mission: string;
  progress: number;
  stats: {
    processed: number;
    queued: number;
    errors: number;
  };
  uptime: string;
}

const agents: Agent[] = [];

const typeConfig: Record<string, { label: string; color: string }> = {
  scout: { label: "Scout", color: "bg-info/20 text-info" },
  writer: { label: "Writer", color: "bg-primary/20 text-primary" },
  enricher: { label: "Enricher", color: "bg-warning/20 text-warning" },
};

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  active: { label: "Active", dotClass: "status-dot-running" },
  idle: { label: "Idle", dotClass: "bg-muted-foreground" },
  error: { label: "Error", dotClass: "bg-destructive" },
};

export default function ActiveAgents() {
  return (
    <div className="h-full p-6 lg:p-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Agents</h1>
          <p className="text-muted-foreground mt-1">Monitor and control your AI workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 font-mono">
            <Activity className="w-3 h-3" />
            {agents.filter(a => a.status === "active").length} Active
          </Badge>
          <Button className="gap-2">
            <Bot className="w-4 h-4" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-5 bg-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  agent.type === "scout" && "bg-info/10",
                  agent.type === "writer" && "bg-primary/10",
                  agent.type === "enricher" && "bg-warning/10"
                )}>
                  <Bot className={cn(
                    "w-5 h-5",
                    agent.type === "scout" && "text-info",
                    agent.type === "writer" && "text-primary",
                    agent.type === "enricher" && "text-warning"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <Badge variant="secondary" className={cn("text-xs", typeConfig[agent.type].color)}>
                      {typeConfig[agent.type].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{agent.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn("status-dot", statusConfig[agent.status].dotClass)} />
                  <span className="text-xs text-muted-foreground">
                    {statusConfig[agent.status].label}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>View Logs</DropdownMenuItem>
                    <DropdownMenuItem>Edit Configuration</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Terminate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mission */}
            <div className="mb-4 p-3 rounded-lg bg-secondary/50">
              <p className="text-sm text-foreground">{agent.mission}</p>
            </div>

            {/* Progress */}
            {agent.status === "active" && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono text-foreground">{agent.progress}%</span>
                </div>
                <Progress value={agent.progress} className="h-1.5" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="font-mono text-lg text-foreground">{agent.stats.processed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Processed</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg text-warning">{agent.stats.queued}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Queued</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg text-destructive">{agent.stats.errors}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Errors</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg text-muted-foreground">{agent.uptime}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {agent.status === "active" ? (
                <Button variant="secondary" size="sm" className="flex-1 gap-2">
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="flex-1 gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
