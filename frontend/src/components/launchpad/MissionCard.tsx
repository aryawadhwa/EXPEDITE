import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, Users, Mail, MoreVertical, Square, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MissionCardProps {
  id?: string;
  name: string;
  status: "running" | "paused" | "completed" | "error" | "stopped";
  stage: number;
  totalStages: number;
  prospectsFound: number;
  emailsQueued: number;
  startedAt: string;
  onStop?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  running: { label: "Running", color: "bg-success", dotClass: "status-dot-running" },
  paused: { label: "Paused", color: "bg-warning", dotClass: "bg-warning" },
  completed: { label: "Completed", color: "bg-primary", dotClass: "bg-primary" },
  error: { label: "Error", color: "bg-destructive", dotClass: "bg-destructive" },
  stopped: { label: "Stopped", color: "bg-muted-foreground", dotClass: "bg-muted-foreground" },
};

export function MissionCard({
  id,
  name,
  status,
  stage,
  totalStages,
  prospectsFound,
  emailsQueued,
  startedAt,
  onStop,
  onDelete,
}: MissionCardProps) {
  const progress = (stage / totalStages) * 100;
  const config = statusConfig[status] || statusConfig.running;
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the menu
    if ((e.target as HTMLElement).closest('[data-no-navigate]')) {
      return;
    }
    if (id) navigate(`/chat/${id}`);
  };

  return (
    <div
      className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{startedAt}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="secondary"
            className={cn(
              "gap-1.5 text-xs font-medium",
              status === "running" && "bg-success/10 text-success",
              status === "paused" && "bg-warning/10 text-warning",
              status === "completed" && "bg-primary/10 text-primary",
              status === "error" && "bg-destructive/10 text-destructive",
              status === "stopped" && "bg-muted text-muted-foreground"
            )}
          >
            <span className={cn("status-dot", config.dotClass)} />
            {config.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-no-navigate>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {status === "running" && onStop && id && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onStop(id); }}
                  className="cursor-pointer"
                >
                  <Square className="w-4 h-4 mr-2" /> Stop
                </DropdownMenuItem>
              )}
              {onDelete && id && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono text-foreground">
            Stage {stage}/{totalStages}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{prospectsFound}</span> prospects
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{emailsQueued}</span> queued
          </span>
        </div>
      </div>
    </div>
  );
}
