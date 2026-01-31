import { useState, useEffect, useCallback } from "react";
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
import { ReactFlow, Background, Controls, Handle, Position, Node, Edge } from '@xyflow/react';
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
  status: "active" | "inactive" | "error";
  mission: string;
  progress: number;
  stats: {
    processed: number;
    queued: number;
    errors: number;
  };
  uptime: string;
  workflow?: {
    nodes: Node[];
    edges: Edge[];
  };
}

const typeConfig: Record<string, { label: string; color: string }> = {
  scout: { label: "Scout", color: "bg-info/20 text-info" },
  writer: { label: "Writer", color: "bg-primary/20 text-primary" },
  enricher: { label: "Enricher", color: "bg-warning/20 text-warning" },
  custom: { label: "Custom", color: "bg-purple-500/20 text-purple-500" },
};

const statusConfig: Record<string, { label: string; dotClass: string }> = {
  active: { label: "Active", dotClass: "status-dot-running" },
  inactive: { label: "Inactive", dotClass: "bg-muted-foreground" },
  idle: { label: "Idle", dotClass: "bg-muted-foreground" },
  running: { label: "Running", dotClass: "status-dot-running" },
  stopped: { label: "Stopped", dotClass: "bg-muted-foreground" },
  error: { label: "Error", dotClass: "bg-destructive" },
  paused: { label: "Paused", dotClass: "bg-warning" },
};

export default function ActiveAgents() {
  const [agents, setAgents] = useState<AgentUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUser();
  const { getAgents, updateAgent, deleteAgent } = useApi();
  const [selectedAgent, setSelectedAgent] = useState<AgentUI | null>(null);

  console.log("Active User:", user?.id);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await getAgents();
      const mappedAgents: AgentUI[] = data.map((item) => ({
        id: item.id || item._id || "unknown",
        name: item.name,
        type: (item.role as AgentUI["type"]) || "custom",
        status: item.status === "active" ? "active" : "inactive",
        mission: item.system_prompt || "No mission assigned",
        progress: item.status === "active" ? 50 : 0,
        stats: {
          processed: 0,
          queued: 0,
          errors: 0
        },
        uptime: "0h 0m"
      }));
      console.log("Mapped agents:", mappedAgents.map(a => ({ id: a.id, status: a.status })));
      setAgents(mappedAgents);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAgents]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleToggleStatus = async (agent: AgentUI) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    // Optimistic update
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus as "active" | "inactive" } : a));

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
    <div className="h-full p-6 lg:p-8 overflow-auto bg-black/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Agents</h1>
          <p className="text-zinc-400 mt-1">Monitor and control your AI workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 font-mono bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10">
            <Activity className="w-3 h-3" />
            {agents.filter(a => a.status === "active").length} Active
          </Badge>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(139,92,246,0.3)]" onClick={() => navigate('/agents/deploy')}>
            <Bot className="w-4 h-4" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="columns-1 lg:columns-2 xl:columns-3 gap-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
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
              <p>No active agents deployed.</p>
              <Button variant="outline" className="mt-4 bg-black/50 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:text-white" onClick={() => navigate('/agents/deploy')}>
                Deploy your first agent
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
                      {(() => {
                        const lowerName = (agent.mission || "").toLowerCase();
                        if (lowerName.includes("linkedin")) return <img src="https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg" alt="LinkedIn" className="w-5 h-5" />;
                        if (lowerName.includes("twitter")) return <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="Twitter" className="w-5 h-5" />;
                        if (lowerName.includes("reddit")) return <img src="https://www.vectorlogo.zone/logos/reddit/reddit-icon.svg" alt="Reddit" className="w-5 h-5" />;
                        return <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-5 h-5" />;
                      })()}
                      <span className="text-sm font-semibold text-zinc-200">
                        {(() => {
                          const lowerName = (agent.mission || "").toLowerCase();
                          if (lowerName.includes("linkedin")) return "LinkedIn Agent";
                          if (lowerName.includes("twitter")) return "Twitter Agent";
                          if (lowerName.includes("reddit")) return "Reddit Agent";
                          return "Email Agent";
                        })()}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 -mr-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                        <DropdownMenuItem onClick={() => setSelectedAgent(agent)} className="focus:bg-white/10 focus:text-white">
                          View Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-zinc-500">Edit Configuration</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          onClick={() => handleDelete(agent.id)}
                        >
                          Terminate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 w-full">{agent.mission}</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-black/40 border border-white/5">
                <p className="text-sm text-zinc-300">{agent.mission}</p>
              </div>
              <div className="mb-4 flex items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 opacity-70" />
                  <span>Last Active: {agent.uptime} ago</span>
                </div>
              </div>

              {/* Progress */}
              {agent.status === "active" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">Progress</span>
                    <span className="font-mono text-purple-400">{agent.progress}%</span>
                  </div>
                  <Progress value={agent.progress} className="h-1.5 bg-white/10" />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-white">{agent.stats.processed}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Processed</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-emerald-400">{agent.stats.queued}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Queued</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-2xl font-bold text-red-400">{agent.stats.errors}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Errors</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xl font-medium text-zinc-400">{agent.uptime}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Uptime</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {agent.status === "active" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                    onClick={() => handleToggleStatus(agent)}
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-6 h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Agent Workflow: {selectedAgent.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)} className="text-zinc-400 hover:text-white">X</Button>
            </div>
            <div className="flex-1 border border-white/10 rounded-md overflow-hidden bg-black/50">
              <ReactFlow
                nodes={selectedAgent.workflow?.nodes || []}
                edges={selectedAgent.workflow?.edges || []}
                nodeTypes={nodeTypes}
                fitView
                className="dark-flow"
              >
                <Background color="#333" gap={16} />
                <Controls className="bg-zinc-900 border-white/10 fill-white [&>button]:fill-white" />
              </ReactFlow>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setSelectedAgent(null)} className="bg-white/10 hover:bg-white/20 text-white">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
