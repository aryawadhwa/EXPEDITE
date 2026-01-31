
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi, Mission } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { Badge } from "@/components/ui/badge";
import { MagnetLines } from "@/components/ui/MagnetLines";

interface CalendarItem {
    _id?: string;
    id?: string;
    type: 'mission' | 'draft' | 'email' | 'agent_log';
    date: Date;
    scheduled_date?: string;
    created_at?: string;
    due_date?: string;
    timestamp?: string;
    // Common fields
    content?: string;
    objective?: string;
    subject?: string;
    [key: string]: unknown;
}

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'mission' | 'draft' | 'activity'>('all');

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

                // Normalize Missions
                const normalizedMissions = (missionsData || []).map((m: Mission) => ({
                    ...m,
                    type: 'mission',
                    date: new Date(m.created_at) // Use created_at as missions usually start immediately
                }));

                // Normalize Drafts
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const normalizedDrafts = (draftsData || []).map((d: any) => ({
                    ...d,
                    type: 'draft',
                    date: d.created_at ? new Date(d.created_at) : new Date()
                }));

                // Normalize Email/Timeline Events
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const timelineEvents = (emailTimeline || []).map((event: any) => ({
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
        return items.filter(item => {
            if (filter !== 'all' && item.type !== filter && 
               (filter === 'activity' && (item.type !== 'email' && item.type !== 'agent_log'))) return false;
            return isSameDay(item.date, date);
        });
    };

    return (
        <div className="h-full flex flex-col bg-black/50 backdrop-blur-sm p-4 md:p-6 space-y-4 md:space-y-6 overflow-hidden">

            {/* Header */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full xl:w-auto justify-between xl:justify-start">
                    <div className="flex items-center gap-2 border border-white/10 rounded-lg p-1 bg-zinc-900/50">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[120px] md:min-w-[140px] text-center font-mono font-bold text-sm md:text-lg uppercase tracking-widest text-white">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={handleToday} size="sm" className="font-mono text-xs uppercase border-white/10 bg-transparent text-zinc-400 hover:text-white hover:bg-white/10">Today</Button>
                </div>

                <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/10 overflow-x-auto">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setFilter('all')}
                            className={cn("text-xs h-7 px-2 flex-1 md:flex-none", filter === 'all' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300")}
                        >
                            All
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setFilter('mission')}
                            className={cn("text-xs h-7 px-2 flex-1 md:flex-none", filter === 'mission' ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-emerald-400/70")}
                        >
                            Missions
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setFilter('draft')}
                            className={cn("text-xs h-7 px-2 flex-1 md:flex-none", filter === 'draft' ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-cyan-400/70")}
                        >
                            Drafts
                        </Button>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setFilter('activity')}
                            className={cn("text-xs h-7 px-2 flex-1 md:flex-none", filter === 'activity' ? "bg-purple-500/20 text-purple-400" : "text-zinc-500 hover:text-purple-400/70")}
                        >
                            Activity
                        </Button>
                    </div>

                    <Button onClick={() => navigate("/chat/new")} className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-primary/20 whitespace-nowrap">
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">New Mission</span>
                        <span className="md:hidden">New</span>
                    </Button>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 border border-white/10 rounded-xl bg-zinc-900/20 backdrop-blur-md overflow-hidden flex flex-col shadow-2xl relative">
                 {/* Empty State Background Pattern */}
                 {items.length === 0 && !isLoading && (
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                         <MagnetLines
                            rows={15}
                            columns={15}
                            containerSize="100%"
                            lineColor="rgba(255, 255, 255, 0.1)"
                            lineWidth="1px"
                            lineHeight="20px"
                            baseAngle={0}
                            className="absolute inset-0"
                        />
                    </div>
                 )}

                {/* Desktop/Tablet Grid View (Hidden on Mobile) */}
                <div className="hidden md:flex flex-col h-full z-10">
                    <div className="grid grid-cols-7 border-b border-white/10 bg-zinc-950/50">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="py-3 text-center text-[10px] uppercase tracking-widest font-bold text-zinc-500 border-r border-white/5 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto custom-scrollbar">
                        {paddingDays.map((_, i) => (
                            <div key={`padding-${i}`} className="bg-black/20 border-r border-b border-white/5 min-h-[150px]" />
                        ))}

                        {daysInMonth.map(day => {
                            const dayItems = getItemsForDay(day);
                            const todayIsDay = isToday(day);
                            const intensity = Math.min(dayItems.length * 10, 40);
                            const bgStyle = todayIsDay
                                ? {}
                                : { backgroundColor: dayItems.length > 0 ? `rgba(139, 92, 246, ${intensity / 500})` : 'transparent' };

                            return (
                                <div
                                    key={day.toISOString()}
                                    style={bgStyle}
                                    className={cn(
                                        "p-2 border-r border-b border-white/5 relative transition-all duration-300 hover:bg-white/5 group min-h-[150px] flex flex-col",
                                        todayIsDay && "bg-primary/5 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                                            todayIsDay ? "bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.6)]" : "text-zinc-500 group-hover:text-zinc-300"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                        {dayItems.length > 0 && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-white/10 text-zinc-500 bg-black/40">
                                                {dayItems.length}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-1 overflow-y-auto max-h-[140px] custom-scrollbar">
                                        {dayItems.map((item, idx) => (
                                            <CalendarEventCard
                                                key={item._id || item.id || idx}
                                                item={item}
                                                onClick={() => {
                                                    if (item.type === 'mission') navigate(`/chat/${item._id || item.id}`);
                                                    else if (item.type === 'draft') navigate('/review');
                                                    else if (item.mission_id) navigate(`/chat/${item.mission_id}`);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                         {Array.from({ length: 42 - (daysInMonth.length + paddingDays.length) }).map((_, i) => (
                            <div key={`end-padding-${i}`} className="bg-black/20 border-r border-b border-white/5 min-h-[150px]" />
                        ))}
                    </div>
                </div>

                {/* Mobile Agenda View (Visible on Mobile Only) */}
                <div className="flex md:hidden flex-col h-full overflow-y-auto custom-scrollbar z-10 pb-20">
                    {daysInMonth.map(day => {
                        const dayItems = getItemsForDay(day);
                        const todayIsDay = isToday(day);
                        
                        // Skip empty days in mobile view to save space, unless it's today
                        if (dayItems.length === 0 && !todayIsDay) return null;

                        return (
                            <div key={day.toISOString()} className={cn(
                                "border-b border-white/5 p-4",
                                todayIsDay && "bg-primary/5"
                            )}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex flex-col items-center justify-center border",
                                        todayIsDay ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-zinc-400"
                                    )}>
                                        <span className="text-[10px] uppercase font-bold leading-none">{format(day, "MMM")}</span>
                                        <span className="text-lg font-bold leading-none">{format(day, "d")}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{format(day, "EEEE")}</div>
                                        <div className="text-xs text-zinc-500">{dayItems.length} events</div>
                                    </div>
                                </div>

                                <div className="space-y-2 pl-12">
                                    {dayItems.length === 0 ? (
                                        <p className="text-xs text-zinc-600 italic">No events scheduled</p>
                                    ) : (
                                        dayItems.map((item, idx) => (
                                            <CalendarEventCard
                                                key={item._id || item.id || idx}
                                                item={item}
                                                onClick={() => {
                                                    if (item.type === 'mission') navigate(`/chat/${item._id || item.id}`);
                                                    else if (item.type === 'draft') navigate('/review');
                                                    else if (item.mission_id) navigate(`/chat/${item.mission_id}`);
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Show something if no days have events */}
                    {items.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            No events found for this month.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
