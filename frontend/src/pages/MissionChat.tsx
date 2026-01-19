import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import {
    Send,
    ArrowLeft,
    User,
    Bot,
    Loader2,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "agent" | "system";
    content: string;
    timestamp: Date;
    status?: "thinking" | "complete" | "error";
}

export default function MissionChat() {
    const { missionId } = useParams();
    const navigate = useNavigate();
    const { userId } = useAuth();
    const api = useApi();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mission, setMission] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Connect to WebSocket for real-time updates
    useEffect(() => {
        if (!userId) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/brain/${userId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, {
                    id: `ws-${Date.now()}`,
                    role: "agent",
                    content: data.message || event.data,
                    timestamp: new Date(),
                    status: data.type === "success" ? "complete" : data.type === "error" ? "error" : "thinking"
                }]);
            } catch {
                setMessages(prev => [...prev, {
                    id: `ws-${Date.now()}`,
                    role: "agent",
                    content: event.data,
                    timestamp: new Date(),
                    status: "complete"
                }]);
            }
        };

        return () => ws.close();
    }, [userId]);

    // Load mission data and history
    useEffect(() => {
        const loadMission = async () => {
            if (missionId && missionId !== "new") {
                try {
                    // Get mission details
                    const missions = await api.listMissions();
                    const found = missions.find((m: any) => m._id === missionId || m.id === missionId);
                    if (found) {
                        setMission(found);

                        // Load chat history
                        try {
                            const logs = await api.getMissionLogs(missionId);
                            const historyMessages: Message[] = logs.map((log: any) => ({
                                id: log.id,
                                role: log.role as "user" | "agent" | "system",
                                content: log.content,
                                timestamp: new Date(log.timestamp),
                                status: log.type === "success" ? "complete"
                                    : log.type === "error" ? "error"
                                        : log.type === "thinking" ? "thinking"
                                            : "complete"
                            }));
                            setMessages(historyMessages);
                        } catch (e) {
                            // If no logs, show initial message
                            setMessages([{
                                id: "initial",
                                role: "system",
                                content: `Mission: ${found.objective}`,
                                timestamp: new Date(found.created_at || Date.now()),
                            }]);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load mission:", e);
                }
            }
        };
        loadMission();
    }, [missionId]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: input,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // If we're in an existing mission, chat with AI
            if (mission && missionId && missionId !== "new") {
                // Send message to AI and get response
                const response = await api.chatWithMission(missionId, input);
                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    content: response.message,
                    timestamp: new Date(),
                    status: response.type === "error" ? "error" : "complete"
                }]);
            } else {
                // Create new mission from input
                const newMission = await api.createMission(input);
                setMission(newMission);

                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    content: "Mission launched! I'm scouting for prospects and will draft personalized emails. Check the Review Queue for drafts awaiting your approval.",
                    timestamp: new Date(),
                    status: "complete"
                }]);

                // Navigate to the new mission's chat
                if (newMission._id || newMission.id) {
                    navigate(`/chat/${newMission._id || newMission.id}`, { replace: true });
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: "agent",
                content: "Failed to process request. Please try again.",
                timestamp: new Date(),
                status: "error"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 h-14 border-b border-border bg-card/50">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-foreground">
                        {mission ? mission.objective?.slice(0, 50) + "..." : "New Mission"}
                    </h1>
                    {mission && (
                        <p className="text-xs text-muted-foreground">
                            Started {new Date(mission.created_at).toLocaleString()}
                        </p>
                    )}
                </div>
                <Badge variant={mission?.status === "running" ? "default" : "secondary"}>
                    {mission?.status || "New"}
                </Badge>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-20">
                            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                What's your outbound mission?
                            </h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Describe who you want to reach and I'll find prospects, research them, and draft personalized emails for your review.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === "user" && "justify-end"
                            )}
                        >
                            {message.role !== "user" && (
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    message.role === "agent" ? "bg-primary/20" : "bg-muted"
                                )}>
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[80%] rounded-xl px-4 py-3",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : message.role === "system"
                                        ? "bg-muted"
                                        : "bg-card border border-border"
                            )}>
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] opacity-60">
                                        {message.timestamp.toLocaleTimeString()}
                                    </span>
                                    {message.status === "thinking" && (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    )}
                                    {message.status === "complete" && (
                                        <CheckCircle className="w-3 h-3 text-success" />
                                    )}
                                    {message.status === "error" && (
                                        <XCircle className="w-3 h-3 text-destructive" />
                                    )}
                                </div>
                            </div>

                            {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-card border border-border rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4 bg-card/50">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Describe your outbound mission..."
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="lg"
                        className="rounded-xl"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
