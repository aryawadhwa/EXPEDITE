import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";

interface CalendarItem {
    _id?: string;
    id?: string;
    type: 'mission' | 'draft' | 'email' | 'agent_log';
    date: Date;
    scheduled_date?: string;
    created_at?: string;
    due_date?: string;
    timestamp?: string;
    [key: string]: unknown;
}

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const api = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [missionsData, draftsData, emailTimeline] = await Promise.all([
                    api.listMissions(),
                    api.getPendingDrafts(),
                    api.getEmailTimeline()
                ]);

                // Normalize items
                const normalizedMissions = (missionsData || []).map((m: CalendarItem) => ({
                    ...m,
                    type: 'mission',
                    date: new Date(m.scheduled_date || m.created_at)
                }));

                const normalizedDrafts = (draftsData || []).map((d: CalendarItem) => ({
                    ...d,
                    type: 'draft',
                    date: d.due_date ? new Date(d.due_date) : new Date() // Default to today if no due date
                }));

                // Normalize email events & agent logs
                const timelineEvents = (emailTimeline || []).map((event: CalendarItem) => ({
                    ...event,
                    date: new Date(event.timestamp)
                }));

                setItems([...normalizedMissions, ...normalizedDrafts, ...timelineEvents]);
            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [api]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDay = getDay(monthStart);
    const paddingDays = Array.from({ length: startDay });

    const getItemsForDay = (date: Date) => {
        return items.filter(item => isSameDay(item.date, date));
    };

    return (
        <div className="h-full flex flex-col bg-background p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-card">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-zinc-800">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[140px] text-center font-mono font-bold text-lg uppercase tracking-widest text-zinc-300">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-zinc-800">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleToday} size="sm" className="font-mono text-xs uppercase border-zinc-700 hover:bg-zinc-800">Today</Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-[10px] uppercase font-mono text-muted-foreground mr-4">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Missions</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></span> Drafts</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span> Activity</span>
                    </div>

                    <Button onClick={() => navigate("/dashboard")} className="gap-2 bg-zinc-100 text-black hover:bg-white font-semibold">
                        <Plus className="w-4 h-4" />
                        New Schedule
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 border border-zinc-800 rounded-xl bg-black/40 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/50">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-3 text-center text-[10px] uppercase tracking-widest font-bold text-zinc-500 border-r border-zinc-800 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {/* Padding Days */}
                    {paddingDays.map((_, i) => (
                        <div key={`padding-${i}`} className="bg-zinc-900/20 border-r border-b border-zinc-800/50 min-h-[120px]" />
                    ))}

                    {/* Actual Days */}
                    {daysInMonth.map(day => {
                        const dayItems = getItemsForDay(day);
                        const todayIsDay = isToday(day);

                        // Heatmap logic: Calculate intensity based on items
                        const intensity = Math.min(dayItems.length * 10, 50);
                        const bgStyle = todayIsDay
                            ? {}
                            : { backgroundColor: `rgba(59, 130, 246, ${intensity / 500})` }; // Subtle blue tint based on activity

                        return (
                            <div
                                key={day.toISOString()}
                                style={bgStyle}
                                className={cn(
                                    "p-2 border-r border-b border-zinc-800 relative transition-all duration-300 hover:bg-zinc-800/50 group min-h-[120px]",
                                    todayIsDay && "bg-blue-500/10 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                        "text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                                        todayIsDay ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]" : "text-zinc-500 group-hover:text-zinc-300"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {dayItems.map((item, idx) => (
                                        <CalendarEventCard
                                            key={item._id || item.id || idx}
                                            item={item}
                                            onClick={() => {
                                                if (item.type === 'mission') navigate(`/chat/${item._id || item.id}`);
                                                else if (item.type === 'draft') navigate('/review');
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* End Padding */}
                    {Array.from({ length: 42 - (daysInMonth.length + paddingDays.length) }).map((_, i) => (
                        <div key={`end-padding-${i}`} className="bg-zinc-900/20 border-r border-b border-zinc-800/50 min-h-[120px]" />
                    ))}
                </div>
            </div>
        </div>
    );
}
