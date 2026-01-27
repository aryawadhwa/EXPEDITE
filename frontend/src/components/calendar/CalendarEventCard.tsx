import { cn } from "@/lib/utils";
import { Mail, Zap, Play, CheckCircle, Bot } from "lucide-react";
import { useMemo } from "react";

interface CalendarEventCardProps {
    item: any;
    onClick?: () => void;
}

export function CalendarEventCard({ item, onClick }: CalendarEventCardProps) {
    const config = useMemo(() => {
        switch (item.type) {
            case 'mission':
                return {
                    icon: Play,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    label: "Mission"
                };
            case 'draft':
                return {
                    icon: Mail,
                    color: "text-cyan-400",
                    bg: "bg-cyan-500/10",
                    border: "border-cyan-500/20",
                    label: "Draft"
                };
            case 'email':
                return {
                    icon: Zap,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                    label: "Activity"
                };
            case 'agent_log':
                return {
                    icon: Bot,
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/10",
                    border: "border-indigo-500/20",
                    label: "Agent Log"
                };
            default:
                return {
                    icon: CheckCircle,
                    color: "text-zinc-400",
                    bg: "bg-zinc-500/10",
                    border: "border-zinc-500/20",
                    label: "Event"
                };
        }
    }, [item.type]);

    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex items-center gap-2 p-1.5 mb-1 rounded-md border text-xs cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-sm",
                config.bg, config.border, config.color
            )}
            title={item.content || item.subject}
        >
            <config.icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate font-medium">{item.content || item.objective || item.subject || item.preview || "Event"}</span>

            {/* Hover visual */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
        </div>
    );
}
