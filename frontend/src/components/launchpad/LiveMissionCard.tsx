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
import { Terminal, Users, Mail, MoreVertical, Square, Trash2, Activity, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
    running: { label: "ACTIVE", color: "text-emerald-400", dotClass: "bg-emerald-400", glow: "shadow-[0_0_10px_rgba(52,211,153,0.5)]" },
    paused: { label: "PAUSED", color: "text-amber-400", dotClass: "bg-amber-400", glow: "" },
    completed: { label: "DONE", color: "text-blue-400", dotClass: "bg-blue-400", glow: "" },
    error: { label: "ERROR", color: "text-red-400", dotClass: "bg-red-400", glow: "" },
    stopped: { label: "STOPPED", color: "text-zinc-500", dotClass: "bg-zinc-500", glow: "" },
};

// Mock logs for liveliness effect
const MOCK_LOGS = [
    "Scouting LinkedIn profiles...",
    "Analyzing relevance...",
    "Drafting outreach...",
    "Verifying email integrity...",
    "Context matching: High...",
    "Rate limit check: OK...",
];

export function LiveMissionCard({
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
    const [logLine, setLogLine] = useState("Initializing...");

    // Simulated "Live Brain" effect
    useEffect(() => {
        if (status !== 'running') return;

        const interval = setInterval(() => {
            const randomLog = MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)];
            setLogLine(`> ${randomLog} [${new Date().toLocaleTimeString()}]`);
        }, 2500);

        return () => clearInterval(interval);
    }, [status]);

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-no-navigate]')) return;
        if (id) navigate(`/chat/${id}`);
    };

    return (
        <div
            className="group relative p-5 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden backdrop-blur-sm"
            onClick={handleCardClick}
        >
            {/* Active Scanline Effect */}
            {status === 'running' && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-mono text-sm uppercase tracking-wider text-zinc-400 mb-1">Target Objective</h4>
                    <p className="font-medium text-zinc-100 truncate text-lg">{name}</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn("px-2 py-1 rounded-md bg-black/40 border border-zinc-800 flex items-center gap-2", config.color)}>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", config.dotClass, config.glow)} />
                        <span className="text-xs font-bold tracking-wider">{config.label}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild data-no-navigate>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            {status === "running" && onStop && id && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStop(id); }} className="cursor-pointer hover:bg-zinc-800">
                                    <Square className="w-4 h-4 mr-2" /> Stop Mission
                                </DropdownMenuItem>
                            )}
                            {onDelete && id && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="cursor-pointer text-red-400 hover:bg-red-400/10 hover:text-red-300">
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete Data
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase">Prospects</span>
                    </div>
                    <span className="text-2xl font-semibold text-white">{prospectsFound}</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs uppercase">Drafts</span>
                    </div>
                    <span className="text-2xl font-semibold text-white">{emailsQueued}</span>
                </div>
            </div>

            {/* Live Terminal */}
            <div className="relative z-10 mt-4 font-mono text-xs bg-black rounded-lg p-3 border border-zinc-900 h-16 overflow-hidden flex flex-col justify-end text-green-500/80">
                <div className="opacity-50">System ready.</div>
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    <span className="animate-typewriter truncate">{logLine}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600 relative z-10">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{startedAt}</span>
                </div>
                <span>ID: {id?.slice(-4).toUpperCase()}</span>
            </div>
        </div>
    );
}
