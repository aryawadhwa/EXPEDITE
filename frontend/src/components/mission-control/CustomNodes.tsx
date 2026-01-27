import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bot, Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

// --- Types ---
export interface MissionNodeData extends Record<string, unknown> {
    label: string;
    status: 'active' | 'completed' | 'failed' | 'paused';
    progress: number;
}

export interface AgentNodeData extends Record<string, unknown> {
    label: string;
    role: string;
    status: 'working' | 'idle' | 'error';
    currentAction?: string;
}

export type MissionNodeType = Node<MissionNodeData>;
export type AgentNodeType = Node<AgentNodeData>;

// --- Components ---

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'active':
        case 'working':
            return <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />;
        case 'completed':
            return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        case 'failed':
        case 'error':
            return <AlertCircle className="w-4 h-4 text-red-400" />;
        default:
            return <Clock className="w-4 h-4 text-zinc-400" />;
    }
};

export const MissionNode = memo(({ data }: NodeProps<MissionNodeType>) => {
    return (
        <Card className={cn(
            "min-w-[250px] bg-black/80 border-2 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]",
            data.status === 'active' ? "border-indigo-500/50" : "border-zinc-800"
        )}>
            <div className="p-4 flex items-start gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                    data.status === 'active' ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                )}>
                    <Rocket className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100 text-sm">{data.label}</span>
                        <StatusIcon status={data.status} />
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full transition-all duration-500"
                            style={{ width: `${data.progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
                        <span>Mission Control</span>
                        <span>{data.progress}%</span>
                    </div>
                </div>
            </div>
            {/* Sources for attaching Agents */}
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-black" />
        </Card>
    );
});

export const AgentNode = memo(({ data }: NodeProps<AgentNodeType>) => {
    return (
        <Card className="min-w-[200px] bg-zinc-900/90 border border-zinc-800 shadow-xl group hover:border-zinc-600 transition-colors">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="outline" className="bg-zinc-950 text-[10px] border-zinc-700 text-zinc-400 px-2 py-0 h-5">
                    {data.role}
                </Badge>
            </div>

            <div className="p-3 pt-4 flex items-center gap-3">
                <div className="relative">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800",
                        data.status === 'working' && "animate-pulse ring-1 ring-emerald-500/50"
                    )}>
                        <Bot className="w-4 h-4 text-zinc-300" />
                    </div>
                    {data.status === 'working' && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-zinc-200 truncate">{data.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate h-4">
                        {data.currentAction || "Idle"}
                    </div>
                </div>
            </div>

            {/* Target connecting to Mission */}
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-500 border-2 border-zinc-900" />

            {/* Optional Output for sub-tasks */}
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-zinc-500 border-2 border-zinc-900" />
        </Card>
    );
});
