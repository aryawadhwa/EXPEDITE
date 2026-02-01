import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import {
    Send,
    ArrowLeft,
    User,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Mic,
    MicOff,
    ExternalLink
} from "lucide-react";

// App Logo Component
const AppLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M 20 4 L 36 20 L 20 28 L 20 4 Z" fill="currentColor" fillOpacity="0.9"/>
        <path d="M 20 12 L 28 20 L 20 36 L 12 20 L 20 12 Z" fill="currentColor" fillOpacity="0.7"/>
        <path d="M 20 16 L 24 20 L 20 24 L 16 20 L 20 16 Z" fill="currentColor" fillOpacity="0.4"/>
        <path d="M 4 20 L 12 16 L 12 24 L 4 20 Z" fill="currentColor" fillOpacity="0.6"/>
    </svg>
);
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Logo } from "@/components/ui/logo";

interface Attachment {
    asset_id: string;
    filename: string;
    content_type: string;
}

// SpeechRecognition types for Web Speech API
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        SpeechRecognition: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        webkitSpeechRecognition: any;
    }
}

interface Asset {
    id: string;
    filename: string;
    content_type?: string;
    url?: string;
    [key: string]: unknown;
}

interface Message {
    id: string;
    role: "user" | "agent" | "system";
    content: string;
    timestamp: Date;
    status?: "thinking" | "complete" | "error";
    metadata?: {
        tool?: string;
        connect_url?: string;
        action?: string;
        pending_action_id?: string;
        channel?: string;
        draft_id?: string;
        posting?: boolean;
        posted?: boolean;
        // Allow other properties
        [key: string]: unknown;
    };
}

interface Mission {
    id?: string;
    _id?: string;
    objective: string;
    status: string;
    created_at: string;
}

export default function MissionChat() {
    const { missionId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { userId } = useAuth();
    const api = useApi();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mission, setMission] = useState<Mission | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pendingActionExecuted = useRef(false);

    // Connect Param State
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [connectParams, setConnectParams] = useState<Record<string, string>>({});
    const [targetTool, setTargetTool] = useState<string>("");

    // Asset picker state
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [selectedAttachments, setSelectedAttachments] = useState<Asset[]>([]);

    // Voice input state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const shouldListenRef = useRef(false);
    const transcriptRef = useRef(""); // Persist final text across restarts

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                // Add final transcript to ref
                transcriptRef.current += finalTranscript;

                // Update input with stored final + current interim
                setInput(transcriptRef.current + interimTranscript);
            };

            recognition.onend = () => {
                // Auto-restart if we should still be listening
                if (shouldListenRef.current && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log("Could not restart recognition:", e);
                    }
                } else {
                    setIsListening(false);
                    // Do NOT clear transcriptRef here
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);

                // Stop on permission or network errors
                if (
                    event.error === "not-allowed" ||
                    event.error === "audio-capture" ||
                    event.error === "network"
                ) {
                    shouldListenRef.current = false;
                    setIsListening(false);

                    const errorMessage = event.error === "network"
                        ? "Network error: Speech recognition requires internet connection."
                        : "Microphone access denied. Please allow access in settings.";

                    toast.error("Speech Recognition Failed", {
                        description: errorMessage,
                    });
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            shouldListenRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition not supported", {
                description: "Your browser does not support speech recognition.",
            });
            return;
        }

        if (isListening) {
            // Manual stop
            shouldListenRef.current = false;
            // Small delay to allow final result to flush
            setTimeout(() => {
                recognitionRef.current?.stop();
                setIsListening(false);
            }, 150);
        } else {
            // Start fresh
            setInput("");
            transcriptRef.current = ""; // Clear previous recording
            shouldListenRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

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

                // Skip messages targeted only for LiveBrain
                if (data.target === "brain") {
                    return; // Don't add to chat messages, LiveBrain handles these
                }

                setMessages(prev => [...prev, {
                    id: `ws-${Date.now()}`,
                    role: "agent",
                    content: data.message || event.data,
                    timestamp: new Date(),
                    status: data.type === "success" ? "complete" : data.type === "error" ? "error" : "thinking",
                    metadata: data.metadata
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
                    const found = missions.find((m: Mission) => m._id === missionId || m.id === missionId);
                    if (found) {
                        setMission(found);

                        // Load chat history
                        try {
                            const logs = await api.getMissionLogs(missionId);
                            const historyMessages: Message[] = logs.map((log) => ({
                                id: log.id,
                                role: log.role as "user" | "agent" | "system",
                                content: log.content,
                                timestamp: new Date(log.timestamp),
                                status: log.type === "success" ? "complete"
                                    : log.type === "error" ? "error"
                                        : log.type === "thinking" ? "thinking"
                                            : "complete",
                                metadata: log.metadata
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
    }, [missionId, api]);

    // Handle pending action after OAuth callback
    useEffect(() => {
        const pendingActionId = searchParams.get("pending_action");
        if (pendingActionId && !pendingActionExecuted.current) {
            pendingActionExecuted.current = true;

            // Small delay to ensure user profile is loaded
            const executePending = async () => {
                // Show executing message
                setMessages(prev => [...prev, {
                    id: `executing-${Date.now()}`,
                    role: "agent",
                    content: "🔄 Connection successful! Executing your pending action...",
                    timestamp: new Date(),
                    status: "thinking"
                }]);

                try {
                    const result = await api.executePendingAction(pendingActionId);

                    // Remove the "executing" message and add the result
                    setMessages(prev => {
                        const filtered = prev.filter(m => !m.id.startsWith("executing-"));
                        return [...filtered, {
                            id: `result-${Date.now()}`,
                            role: "agent",
                            content: result.message,
                            timestamp: new Date(),
                            status: result.success ? "complete" : "error"
                        }];
                    });

                    if (result.success) {
                        toast.success("Action completed!", {
                            description: result.message
                        });
                    } else {
                        toast.error("Action failed", {
                            description: result.message
                        });
                    }
                } catch (e: unknown) {
                    console.error("Failed to execute pending action:", e);
                    setMessages(prev => {
                        const filtered = prev.filter(m => !m.id.startsWith("executing-"));
                        return [...filtered, {
                            id: `error-${Date.now()}`,
                            role: "agent",
                            content: `Failed to execute action: ${(e as Error).message}`,
                            timestamp: new Date(),
                            status: "error"
                        }];
                    });
                    toast.error("Execution failed", {
                        description: (e as Error).message
                    });
                }

                // Clear the pending_action param from URL
                searchParams.delete("pending_action");
                setSearchParams(searchParams, { replace: true });
            };

            // Wait a bit for the connection to be fully active
            setTimeout(executePending, 1500);
        }
    }, [searchParams, api, setSearchParams]);

    const handleConnect = async (tool: string, params?: Record<string, string>) => {
        try {
            const res = await api.connectTool(tool, params);
            if (res.redirect_url) {
                window.location.href = res.redirect_url;
            }
            setShowConnectDialog(false);
        } catch (e: unknown) {
            console.error("Connect failed", e);
            const msg = (e as Error).message || String(e);

            // Check for missing fields error from Composio
            if (msg.includes("Missing required fields")) {
                const match = msg.match(/Missing required fields: ([^(]+)/);
                if (match) {
                    const fields = match[1].split(',').map((f: string) => f.trim());
                    setMissingFields(fields);
                    setTargetTool(tool);
                    setConnectParams({});
                    setShowConnectDialog(true);
                    return;
                }
            }
            // Fallback
            alert(`Connection failed: ${msg}`);
        }
    };

    // Handle input change to detect # trigger
    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        // Check if user just typed #
        if (value.endsWith('#')) {
            // Fetch assets
            try {
                const assets = await api.getAssets();
                setAvailableAssets(assets || []);
                setShowAssetPicker(true);
            } catch (err) {
                console.error("Failed to fetch assets", err);
            }
        } else if (!value.includes('#')) {
            setShowAssetPicker(false);
        }
    };

    // Handle asset selection
    const handleSelectAsset = (asset: Asset) => {
        // Add to selected attachments
        if (!selectedAttachments.find(a => a.id === asset.id)) {
            setSelectedAttachments(prev => [...prev, asset]);
        }
        // Replace the # with the filename tag
        setInput(prev => prev.replace(/#$/, `[📎 ${asset.filename}] `));
        setShowAssetPicker(false);
    };

    // Remove attachment
    const handleRemoveAttachment = (id: string) => {
        setSelectedAttachments(prev => prev.filter(a => a.id !== id));
    };

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
                    status: response.type === "error" ? "error" : "complete",
                    metadata: response.metadata  // Include metadata for action buttons
                }]);
            } else {
                // Create new mission from input with attachments
                const attachmentData: Attachment[] = selectedAttachments.map(a => ({
                    asset_id: (a.id || a._id) as string,
                    filename: a.filename,
                    content_type: a.content_type || 'application/octet-stream'
                }));
                const newMission = await api.createMission(input, attachmentData);
                setMission(newMission);
                setSelectedAttachments([]); // Clear after sending

                setMessages(prev => [...prev, {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    content: `Mission launched${attachmentData.length > 0 ? ` with ${attachmentData.length} attachment(s)` : ''}! I'm scouting for prospects and will draft personalized emails. Check the Review Queue for drafts awaiting your approval.`,
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

    // Poll user profile for connection status
    interface UserProfile {
        id: string;
        gmail_connection_id?: string;
        slack_connection_id?: string;
        other_connections?: Record<string, boolean>;
        [key: string]: unknown;
    }
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const u = await api.getUser();
                setUserProfile(u);
            } catch (e) {
                console.error("Failed to fetch user", e);
            }
        };
        fetchUser();
        const interval = setInterval(fetchUser, 3000);
        return () => clearInterval(interval);
    }, [api]);

    const isConnected = (tool: string) => {
        if (!userProfile) return false;
        if (tool === "gmail" || tool === "email") return !!userProfile.gmail_connection_id;
        if (tool === "slack") return !!userProfile.slack_connection_id;
        return !!(userProfile.other_connections && userProfile.other_connections[tool]);
    };

    return (
        <div className="h-full flex flex-col bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
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
                            <Logo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
                                    <Logo className="w-5 h-5 text-primary" />
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[80%] rounded-xl px-4 py-3 text-white",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : message.role === "system"
                                        ? "bg-muted"
                                        : "bg-card border border-border"
                            )}>
                                {message.role === "agent" || message.role === "system" ? (
                                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 text-white prose-p:text-white prose-li:text-white prose-headings:text-white prose-strong:text-white">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm text-white">{message.content}</p>
                                )}
                                {(() => {
                                    // Check for connect_url in metadata (direct OAuth link)
                                    const connectUrl = message.metadata?.connect_url;
                                    let toolMatch = message.metadata?.tool;

                                    if (!toolMatch) {
                                        const match = message.content.match(/(?:I need|please connect|connect your) (LinkedIn|Twitter|Telegram|Discord|Slack|GitHub|Reddit|Perplexity|Google Sheets|Gmail|Email)/i);
                                        if (match) {
                                            toolMatch = match[1].toLowerCase().replace(" ", "_");
                                        }
                                    }

                                    if (toolMatch) {
                                        const displayName = toolMatch.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                        
                                        // If backend sent "connect_tool" action, connection is NOT active
                                        // (even if conn_id exists in user profile - it might be expired)
                                        const needsConnection = message.metadata?.action === "connect_tool";
                                        const connected = !needsConnection && isConnected(toolMatch);

                                        return (
                                            <div className="mt-3">
                                                {connected ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full gap-2 border-emerald-500/50 text-emerald-500 bg-emerald-500/10 cursor-default hover:bg-emerald-500/10 hover:text-emerald-500"
                                                        disabled
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {displayName} Connected
                                                    </Button>
                                                ) : (
                                                    // Always use Composio OAuth - blue button
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="w-full gap-2 animate-in fade-in zoom-in duration-300 shadow-md bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => {
                                                            // If we have a direct connect URL, use it
                                                            if (connectUrl) {
                                                                window.location.href = connectUrl;
                                                            } else {
                                                                // Otherwise, call handleConnect which will get the OAuth URL
                                                                handleConnect(toolMatch);
                                                            }
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Connect {displayName}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {/* Create Drafts Button for bulk prospect workflow */}
                                {message.metadata?.action === "prospects_found" && message.metadata?.prospect_ids && (
                                    <div className="mt-3">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
                                            onClick={async () => {
                                                const prospectIds = message.metadata?.prospect_ids as string[];
                                                if (!prospectIds || !missionId) return;

                                                // Show loading state
                                                setMessages(prev => prev.map(m =>
                                                    m.id === message.id
                                                        ? { ...m, metadata: { ...m.metadata, creating: true } }
                                                        : m
                                                ));

                                                try {
                                                    const result = await api.createBulkDrafts(missionId, prospectIds);
                                                    
                                                    setMessages(prev => {
                                                        const updated = prev.map(m =>
                                                            m.id === message.id
                                                                ? { ...m, metadata: { ...m.metadata, creating: false, created: true } }
                                                                : m
                                                        );
                                                        return [...updated, {
                                                            id: `result-${Date.now()}`,
                                                            role: "agent" as const,
                                                            content: result.message,
                                                            timestamp: new Date(),
                                                            status: "complete" as const
                                                        }];
                                                    });

                                                    toast.success("Drafts Created!", {
                                                        description: `${result.created_count} personalized drafts ready for review`,
                                                    });

                                                    // Navigate to review queue after a short delay
                                                    setTimeout(() => {
                                                        navigate(`/review?mission_id=${missionId}`);
                                                    }, 1500);
                                                } catch (e: unknown) {
                                                    setMessages(prev => prev.map(m =>
                                                        m.id === message.id
                                                            ? { ...m, metadata: { ...m.metadata, creating: false } }
                                                            : m
                                                    ));
                                                    toast.error("Failed to create drafts", {
                                                        description: (e as Error).message
                                                    });
                                                }
                                            }}
                                            disabled={message.metadata?.creating || message.metadata?.created}
                                        >
                                            {message.metadata?.creating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Creating Drafts...
                                                </>
                                            ) : message.metadata?.created ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Drafts Created!
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Create Drafts for All ({message.metadata?.count || 0})
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                                {/* Social Media Draft Preview with Post Now + Edit buttons */}
                                {message.metadata?.action === "draft_preview" && (
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            onClick={async () => {
                                                const pendingId = message.metadata?.pending_action_id;
                                                if (!pendingId) return;

                                                // Show loading state
                                                setMessages(prev => prev.map(m =>
                                                    m.id === message.id
                                                        ? { ...m, metadata: { ...m.metadata, posting: true } }
                                                        : m
                                                ));

                                                try {
                                                    const result = await api.executePendingAction(pendingId);

                                                    // Add success/error message
                                                    setMessages(prev => {
                                                        // Update the original message to show posted
                                                        const updated = prev.map(m =>
                                                            m.id === message.id
                                                                ? { ...m, metadata: { ...m.metadata, posting: false, posted: result.success } }
                                                                : m
                                                        );
                                                        // Add result message
                                                        return [...updated, {
                                                            id: `result-${Date.now()}`,
                                                            role: "agent" as const,
                                                            content: result.message,
                                                            timestamp: new Date(),
                                                            status: result.success ? "complete" as const : "error" as const
                                                        }];
                                                    });

                                                    if (result.success) {
                                                        toast.success("Posted!", { description: result.message });
                                                    } else {
                                                        toast.error("Failed", { description: result.message });
                                                    }
                                                } catch (e: unknown) {
                                                    setMessages(prev => prev.map(m =>
                                                        m.id === message.id
                                                            ? { ...m, metadata: { ...m.metadata, posting: false } }
                                                            : m
                                                    ));
                                                    toast.error("Error", { description: (e as Error).message });
                                                }
                                            }}
                                            disabled={message.metadata?.posting || message.metadata?.posted}
                                        >
                                            {message.metadata?.posting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Posting...
                                                </>
                                            ) : message.metadata?.posted ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Posted!
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Post Now
                                                </>
                                            )}
                                        </Button>
                                        {!message.metadata?.posted && !message.metadata?.posting && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => {
                                                    // Redirect to Review Queue with draft_id filter
                                                    const draftId = message.metadata?.draft_id;
                                                    const channel = message.metadata?.channel;
                                                    if (draftId) {
                                                        navigate(`/review?draft_id=${draftId}`);
                                                    } else {
                                                        navigate(`/review?mission_id=${missionId}`);
                                                    }
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {/* View Draft Button (for email drafts) */}
                                {(message.metadata?.action === "draft_ready" ||
                                    message.content.toLowerCase().includes("draft generated") ||
                                    message.content.toLowerCase().includes("ready for review")) && (
                                        <div className="mt-3">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => navigate(`/review?mission_id=${missionId}`)}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                View Draft
                                            </Button>
                                        </div>
                                    )}
                                <div className="flex items-center gap-2 mt-1">
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
                                <AppLogo className="w-5 h-5 text-primary" />
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
                <div className="max-w-3xl mx-auto">
                    {/* Selected Attachments */}
                    {selectedAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedAttachments.map(att => (
                                <div key={att.id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                    <span>📎 {att.filename}</span>
                                    <button onClick={() => handleRemoveAttachment(att.id)} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative flex gap-3">
                        {/* Asset Picker Dropdown */}
                        {showAssetPicker && availableAssets.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-auto">
                                <div className="p-2 text-xs text-muted-foreground border-b border-border">Select an attachment</div>
                                {availableAssets.map(asset => (
                                    <button
                                        key={asset.id}
                                        onClick={() => handleSelectAsset(asset)}
                                        className="w-full text-left px-3 py-2 hover:bg-secondary/50 flex items-center gap-2 text-sm"
                                    >
                                        <span className="text-primary">📄</span>
                                        <span className="truncate">{asset.filename}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showAssetPicker && availableAssets.length === 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 p-3 text-sm text-muted-foreground">
                                No files uploaded. Go to Settings to add files.
                            </div>
                        )}

                        {/* Mic Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleListening}
                            disabled={isLoading}
                            className={cn(
                                "rounded-xl transition-all shrink-0",
                                isListening
                                    ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>

                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => e.key === "Enter" && !showAssetPicker && handleSend()}
                            placeholder={isListening ? "Listening..." : "Describe your outbound mission..."}
                            className={cn(
                                "flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
                                isListening && "border-red-500/50 placeholder:text-red-400"
                            )}
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

            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect {targetTool.charAt(0).toUpperCase() + targetTool.slice(1)}</DialogTitle>
                        <DialogDescription>
                            Please provide the following details to connect.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {missingFields.map((field) => (
                            <div key={field} className="space-y-2">
                                <Label>{field}</Label>
                                <Input
                                    placeholder={`Enter ${field}`}
                                    value={connectParams[field] || ""}
                                    onChange={(e) => setConnectParams(prev => ({ ...prev, [field]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
                        <Button onClick={() => handleConnect(targetTool, connectParams)}>Connect</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
