import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Brain, ChevronRight, ChevronLeft, Terminal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@clerk/clerk-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "thinking" | "action" | "success" | "error";
  message: string;
  agent?: string;
}

const typeConfig = {
  thinking: { color: "text-info", badge: "bg-info/20 text-info", label: "THINKING" },
  action: { color: "text-warning", badge: "bg-warning/20 text-warning", label: "ACTION" },
  success: { color: "text-success", badge: "bg-success/20 text-success", label: "SUCCESS" },
  error: { color: "text-destructive", badge: "bg-destructive/20 text-destructive", label: "ERROR" },
};

interface LiveBrainSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function LiveBrainSidebar({ isOpen, onToggle }: LiveBrainSidebarProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ active: 0, processed: 0, queue: 0 });
  const { userId } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  
  // Resizable width state
  const [width, setWidth] = useState(320); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 280;
  const maxWidth = 600;
  
  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position from right edge
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    if (!userId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      // Connect to WebSocket
      ws = new WebSocket(`ws://localhost:8000/ws/brain/${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setLogs((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            timestamp: new Date(),
            type: "success",
            message: "Connected to Live Brain",
            agent: "System",
          },
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle stats update without adding to logs
          if (data.type === 'stats_update' && data.stats) {
            setStats(data.stats);
            return;
          }

          setLogs((prev) =>
            [
              ...prev,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                type: (data.type || "action") as LogEntry["type"],
                message: data.message || event.data,
                agent: data.agent || "Agent",
              },
            ].slice(-30)
          );
        } catch {
          // Plain text message
          setLogs((prev) =>
            [
              ...prev,
              {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                type: "action" as LogEntry["type"],
                message: event.data,
                agent: "Agent",
              },
            ].slice(-30)
          );
        }
      };

      ws.onerror = () => {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date(),
            type: "error",
            message: "WebSocket connection error",
            agent: "System",
          },
        ]);
      };

      ws.onclose = () => {
        setLogs((prev) => [
          ...prev,
          {
            id: `close-${Date.now()}`,
            timestamp: new Date(),
            type: "thinking",
            message: "Disconnected. Reconnecting in 3s...",
            agent: "System",
          },
        ]);

        // Attempt reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [userId]);

  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed right-4 top-4 z-50 bg-terminal border border-border hover:bg-secondary"
        >
          <Brain className="w-4 h-4 text-primary" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col h-full bg-terminal border-l border-border transition-all",
          isOpen ? "" : "w-0 overflow-hidden",
          isResizing && "transition-none"
        )}
        style={{ width: isOpen ? `${width}px` : 0 }}
      >
        {/* Resize Handle - Drag to resize */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-2 cursor-col-resize group z-10",
            "hover:bg-primary/30 transition-colors",
            isResizing && "bg-primary/50"
          )}
          onMouseDown={handleMouseDown}
        >
          {/* Visual indicator line */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5 bg-border group-hover:bg-primary transition-colors",
            isResizing && "bg-primary"
          )} />
          {/* Grip icon - visible on hover */}
          <div className={cn(
            "absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2",
            "p-1 rounded bg-secondary/80 border border-border",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isResizing && "opacity-100"
          )}>
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm text-foreground">Live Brain</span>
            <span className="status-dot status-dot-running" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Log Feed */}
        <ScrollArea className="flex-1 terminal-scroll">
          <div className="p-3 space-y-2">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={cn(
                  "animate-fade-in",
                  index === logs.length - 1 && "animate-slide-in-right"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-2 p-2 rounded-md bg-card/50 border border-border/50">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      log.type === "thinking" && "bg-info",
                      log.type === "action" && "bg-warning",
                      log.type === "success" && "bg-success",
                      log.type === "error" && "bg-destructive"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {log.agent}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-mono text-[9px] px-1.5 py-0 h-4",
                          typeConfig[log.type].badge
                        )}
                      >
                        {typeConfig[log.type].label}
                      </Badge>
                    </div>
                    <p className={cn("font-mono text-xs leading-relaxed", typeConfig[log.type].color)}>
                      <span className="text-muted-foreground">&gt;</span> {log.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1 px-2 pt-2">
              <span className="font-mono text-xs text-muted-foreground">&gt;</span>
              <span className="w-2 h-4 bg-primary/80 terminal-cursor" />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        <div className="p-3 border-t border-border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-mono text-lg text-foreground">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
            </div>
            <div>
              <p className="font-mono text-lg text-success">{stats.processed}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Processed</p>
            </div>
            <div>
              <p className="font-mono text-lg text-warning">{stats.queue}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Queue</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
