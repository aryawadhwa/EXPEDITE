import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MissionCardProps {
  id: string;
  name: string;
  status: "running" | "paused" | "completed" | "error" | "stopped" | "waiting_approval";
  stage: number;
  totalStages: number;
  prospectsFound: number;
  emailsQueued: number;
  startedAt: string;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MissionCard({
  id,
  name,
  status,
  stage,
  totalStages,
  prospectsFound,
  emailsQueued,
  onStop,
  onDelete
}: MissionCardProps) {
  const navigate = useNavigate();

  const isRunning = status === "running";

  return (
    <Card className="group relative overflow-hidden glass-card bg-[#14213D]/10 hover:bg-[#14213D]/30 border border-[#14213D] shadow-lg transition-all duration-300">
      {/* 1. Holographic Spotlight Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-40" />
      </div>

      {/* 2. Top Scanline Border */}
      <div
        className={cn(
          "absolute top-0 left-0 h-[1px] w-full transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 z-10"
        )}
      />

      {/* Active Pulse Border (Kept existing visual specific to running/active state) */}
      {isRunning && (
        <div className="absolute inset-0 border border-primary/20 animate-pulse rounded-xl pointer-events-none z-10" />
      )}

      <div className="p-5 space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isRunning && <Activity className="w-3 h-3 text-primary animate-pulse" />}
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider group-hover:text-primary/70 transition-colors">
                STR-{id.slice(-4)}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-white group-hover:text-primary transition-colors font-serif truncate max-w-[200px]" title={name}>
              {name}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs uppercase px-2 py-0.5 border transition-all",
              isRunning
                ? "border-primary text-primary bg-primary/10 bio-pulse shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                : "border-muted text-muted-foreground group-hover:border-primary/30 group-hover:text-primary/70"
            )}
          >
            {status}
          </Badge>
        </div>

        {/* HUD Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/40 rounded p-2 border border-[#14213D] group-hover:border-[#14213D]/80 transition-colors">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Prospects</div>
            <div className="text-xl font-mono text-white">{prospectsFound}</div>
          </div>
          <div className="bg-black/40 rounded p-2 border border-[#14213D] group-hover:border-[#14213D]/80 transition-colors">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Drafts</div>
            <div className="text-xl font-mono text-white">{emailsQueued}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>System Progress</span>
            <span className="text-primary/80">{Math.round((stage / totalStages) * 100)}%</span>
          </div>
          <div className="h-0.5 w-full bg-[#14213D] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-primary transition-all duration-500",
                isRunning && "shadow-[0_0_8px_rgba(var(--primary),0.6)]"
              )}
              style={{ width: `${(stage / totalStages) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            {isRunning ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary hover:scale-105 transition-all" onClick={(e) => { e.stopPropagation(); onStop(id); }}>
                <Pause className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary hover:scale-105 transition-all" onClick={(e) => { e.stopPropagation(); }}>
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive hover:scale-105 transition-all" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            className="h-8 bg-[#14213D] hover:bg-primary hover:text-black text-white px-3 text-xs font-mono uppercase tracking-wide border border-primary/20 transition-all group/btn"
            onClick={() => navigate(`/chat/${id}`)}
          >
            Enter Console <ArrowRight className="ml-1.5 w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
