import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SpatialCard } from "@/components/ui/SpatialCard";
import { MagnetLines } from "@/components/ui/MagnetLines";
import {
  Bot,
  Play,
  Pause,
  MoreVertical,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useApi } from "@/lib/api";
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom node component with dark theme styling
const CustomNode = ({ data }: { data: { label: string } }) => (
  <div className="px-4 py-2 rounded-lg bg-card border border-border shadow-md min-w-[120px] text-center">
    <Handle type="target" position={Position.Top} className="!bg-primary" />
    <span className="text-foreground text-sm font-medium">{data.label}</span>
    <Handle type="source" position={Position.Bottom} className="!bg-primary" />
  </div>
);

const nodeTypes = {
  trigger: CustomNode,
  action: CustomNode,
  wait: CustomNode,
  default: CustomNode,
};

// Agent Type for UI
interface AgentUI {
  id: string;
  name: string;
  type: "scout" | "writer" | "enricher" | "custom";
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

const typeConfig: Record<string, { label: string; color: string }> = {
  scout: { label: "Scout", color: "bg-info/20 text-info" },
  writer: { label: "Writer", color: "bg-primary/20 text-primary" },
  enricher: { label: "Enricher", color: "bg-warning/20 text-warning" },
  custom: { label: "Custom", color: "bg-purple-500/20 text-purple-500" },
};

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  active: { label: "Active", dotClass: "status-dot-running" },
  idle: { label: "Idle", dotClass: "bg-muted-foreground" },
  error: { label: "Error", dotClass: "bg-destructive" },
};

export default function ActiveAgents() {
  const [agents, setAgents] = useState<AgentUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser();
  const { getAgents, updateAgent, deleteAgent } = useApi();
  const [selectedAgent, setSelectedAgent] = useState<AgentUI | null>(null);

  console.log("Active User:", user?.id);

  const fetchAgents = async () => {
    try {
      const data = await getAgents();
      const mappedAgents: AgentUI[] = data.map((item: any) => ({
        id: item._id || item.id,
        name: item.name,
        type: item.agent_type || "custom",
        status: item.status || "idle",
        mission: item.description || "No mission assigned",
        progress: item.status === "active" ? 50 : 0,
        stats: {
          processed: item.stats?.processed ?? 0,
          queued: item.stats?.queued ?? 0,
          errors: item.stats?.errors ?? 0
        },
        uptime: item.uptime || "0h 0m"
      }));
      setAgents(mappedAgents);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [getAgents]);

  const handleToggleStatus = async (agent: AgentUI) => {
    const newStatus = agent.status === "active" ? "idle" : "active";
    // Optimistic update
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus as any } : a));

    try {
      await updateAgent(agent.id, { status: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
      // Revert on error
      fetchAgents();
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to terminate this agent?")) return;

    // Optimistic remove
    setAgents(prev => prev.filter(a => a.id !== agentId));

    try {
      await deleteAgent(agentId);
    } catch (e) {
      console.error("Failed to delete agent", e);
      fetchAgents();
    }
  };

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
          <Button className="gap-2" onClick={() => navigate('/agents/deploy')}>
            <Bot className="w-4 h-4" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-5 bg-card border border-border rounded-xl">
              <Skeleton className="h-40 w-full" />
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full relative overflow-hidden rounded-xl border border-dashed border-muted-foreground/25 min-h-[400px] flex items-center justify-center bg-card/50">
            <MagnetLines
              rows={9}
              columns={9}
              containerSize="100%"
              lineColor="hsl(var(--primary) / 0.2)"
              lineWidth="2px"
              lineHeight="20px"
              baseAngle={0}
              className="absolute inset-0 z-0"
            />
            <div className="relative z-10 text-center py-12 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active agents deployed.</p>
              <Button variant="outline" className="mt-4 bg-background/80 backdrop-blur-sm" onClick={() => navigate('/agents/deploy')}>
                Deploy your first agent
              </Button>
            </div>
          </div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    typeConfig[agent.type]?.color || typeConfig.custom.color
                  )}>
                    <Bot className={cn(
                      "w-5 h-5",
                      typeConfig[agent.type]?.color.split(' ')[1] || typeConfig.custom.color.split(' ')[1]
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <Badge variant="secondary" className={cn("text-xs", typeConfig[agent.type]?.color || typeConfig.custom.color)}>
                        {typeConfig[agent.type]?.label || typeConfig.custom.label}
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
                      <DropdownMenuItem onClick={() => setSelectedAgent(agent)}>
                        View Workflow
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>Edit Configuration</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(agent.id)}
                      >
                        Terminate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Mission */}
              <div className="mb-4 p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-foreground">{agent.mission}</p>
              </div>

              {/* Time and Date Information */}
              <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  <span>Last Active: {agent.uptime} ago</span>
                </div>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleToggleStatus(agent)}
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleToggleStatus(agent)}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </Button>
                )}
              </div>
            </div>
          )))
        }
      </div>

      {/* Workflow Dialog */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-lg p-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Agent Workflow: {selectedAgent.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>X</Button>
            </div>
            <div className="flex-1 border rounded-md overflow-hidden bg-background">
              {/* @ts-ignore */}
              <ReactFlow
                nodes={(selectedAgent as any).workflow?.nodes || []}
                edges={(selectedAgent as any).workflow?.edges || []}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setSelectedAgent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
