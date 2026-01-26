import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<any[]>([]);
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
                const normalizedMissions = (missionsData || []).map((m: any) => ({
                    ...m,
                    type: 'mission',
                    date: new Date(m.scheduled_date || m.created_at)
                }));

                const normalizedDrafts = (draftsData || []).map((d: any) => ({
                    ...d,
                    type: 'draft',
                    date: d.due_date ? new Date(d.due_date) : new Date() // Default to today if no due date
                }));

                // Normalize email events
                const normalizedEmails = (emailTimeline || []).map((event: any) => ({
                    ...event,
                    type: 'email',
                    date: new Date(event.timestamp)
                }));

                setItems([...normalizedMissions, ...normalizedDrafts, ...normalizedEmails]);
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
    const today = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDay = getDay(monthStart);
    const paddingDays = Array.from({ length: startDay });

    const getItemsForDay = (date: Date) => {
        return items.filter(item => isSameDay(item.date, date));
    };

    return (
        <div className="h-full flex flex-col bg-background p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="min-w-[140px] text-center font-semibold text-lg">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={today} size="sm">Today</Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Missions</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Drafts</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Sent</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Reply</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Follow-up</span>
                    </div>
                    <Button onClick={() => navigate("/dashboard")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Schedule Mission
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {/* Padding Days from previous month */}
                    {paddingDays.map((_, i) => (
                        <div key={`padding-${i}`} className="bg-muted/10 border-r border-b border-border min-h-[120px]" />
                    ))}

                    {/* Actual Days */}
                    {daysInMonth.map(day => {
                        const dayItems = getItemsForDay(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "p-2 border-r border-b border-border min-h-[120px] relative transition-colors hover:bg-muted/5",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    {dayItems.map((item, idx) => {
                                        // Handle missions
                                        if (item.type === 'mission') {
                                            return (
                                                <div
                                                    key={item._id || item.id}
                                                    onClick={() => navigate(`/chat/${item._id || item.id}`)}
                                                    className={cn(
                                                        "text-xs px-2 py-1.5 rounded-md cursor-pointer border truncate transition-all hover:scale-[1.02]",
                                                        item.status === "running" ? "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25" :
                                                            item.status === "completed" ? "bg-success/15 text-success border-success/20 hover:bg-success/25" :
                                                                "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                                    )}
                                                >
                                                    {item.objective}
                                                </div>
                                            );
                                        }

                                        // Handle drafts
                                        if (item.type === 'draft') {
                                            return (
                                                <HoverCard key={item.id || idx}>
                                                    <HoverCardTrigger asChild>
                                                        <div
                                                            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md cursor-pointer border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all"
                                                            onClick={() => navigate("/review")}
                                                        >
                                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{item.subject || "Draft"}</span>
                                                        </div>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-80 p-0 border-border bg-popover z-50">
                                                        <div className="p-4 space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-semibold">{item.subject}</h4>
                                                                <Badge variant="outline" className="text-[10px] border-cyan-500/50 text-cyan-500">Draft</Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                <p>To: <span className="text-foreground font-medium">{item.name || "Unknown"}</span></p>
                                                                <p className="mt-1">{item.company}</p>
                                                            </div>
                                                            <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground line-clamp-3">
                                                                {item.body}
                                                            </div>
                                                            <Button size="sm" className="w-full h-7 text-xs" onClick={() => navigate("/review")}>
                                                                Review Draft
                                                            </Button>
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            );
                                        }

                                        // Handle email events
                                        if (item.type === 'email') {
                                            let color = "bg-gray-500";
                                            let icon = "📧";
                                            let title = item.subject || "Email event";

                                            if (item.event_type === "sent") {
                                                color = "bg-green-500";
                                                icon = "📧";
                                                title = `Sent: ${item.subject || "Email"}`;
                                            } else if (item.event_type === "reply_received") {
                                                color = "bg-blue-500";
                                                icon = "📬";
                                                title = `Reply from ${item.from_email}`;
                                            } else if (item.event_type === "follow_up") {
                                                color = "bg-orange-500";
                                                icon = "🔄";
                                                title = `Follow-up: ${item.subject || ""}`;
                                            } else if (item.event_type === "opened") {
                                                color = "bg-purple-500";
                                                icon = "👁️";
                                                title = "Email opened";
                                            } else if (item.event_type === "clicked") {
                                                color = "bg-pink-500";
                                                icon = "🖱️";
                                                title = "Link clicked";
                                            }

                                            return (
                                                <div
                                                    key={item.id || idx}
                                                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${color}/20 bg-${color.replace('bg-', '')}/10 cursor-pointer hover:opacity-80 transition-all`}
                                                    title={title}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${color}`}></span>
                                                    <span className="truncate text-muted-foreground">{icon} {item.preview?.substring(0, 20) || title}</span>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Fill remaining cells if needed */}
                    {Array.from({ length: 42 - (daysInMonth.length + paddingDays.length) }).map((_, i) => (
                        <div key={`end-padding-${i}`} className="bg-muted/10 border-r border-b border-border min-h-[120px]" />
                    ))}
                </div>
            </div>
        </div>
    );
}
