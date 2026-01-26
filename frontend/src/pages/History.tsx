import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { Check, X, Mail, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoryItem {
    id: string;
    name: string;
    company: string;
    subject: string;
    status: 'approved' | 'rejected';
    updated_at: string;
}

export default function History() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const api = useApi();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.getHistory();
                setHistory(data);
            } catch (e) {
                console.error("Failed to fetch history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [api]);

    return (
        <div className="h-full p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">History</h1>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-[24px] overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 text-sm font-medium text-[#8D99AE]">
                    <div className="col-span-3">Prospect</div>
                    <div className="col-span-5">Subject</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Date</div>
                </div>

                {/* List */}
                <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 border-b border-white/5">
                                <Skeleton className="h-6 w-full rounded-full bg-white/5" />
                            </div>
                        ))
                    ) : history.length === 0 ? (
                        <div className="p-12 text-center text-[#8D99AE]">No history available yet.</div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center group">
                                <div className="col-span-3">
                                    <div className="font-medium text-white">{item.name || "Unknown"}</div>
                                    <div className="text-xs text-[#8D99AE]">{item.company}</div>
                                </div>
                                <div className="col-span-5 text-[#EDF2F4] text-sm truncate pr-4 opacity-80 group-hover:opacity-100">
                                    {item.subject}
                                </div>
                                <div className="col-span-2">
                                    {item.status === 'approved' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                            <Check className="w-3 h-3" /> Sent
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                            <X className="w-3 h-3" /> Rejected
                                        </span>
                                    )}
                                </div>
                                <div className="col-span-2 text-right text-xs text-[#8D99AE] font-mono">
                                    {new Date(item.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
