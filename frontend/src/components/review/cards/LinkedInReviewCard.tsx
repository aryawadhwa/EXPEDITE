import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Loader2, Linkedin, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LinkedInReviewCardProps {
  body: string;
  messageType?: "connection" | "inmail" | "message";
  recipientName?: string;
  recipientTitle?: string;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function LinkedInReviewCard({
  body: initialBody,
  messageType = "message",
  recipientName,
  recipientTitle,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: LinkedInReviewCardProps) {
  const [body, setBody] = useState(initialBody);

  // Character limits based on message type
  const charLimit = messageType === "connection" ? 300 : 8000;
  const isOverLimit = body.length > charLimit;

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - LinkedIn Style */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-blue-500/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-foreground">LinkedIn Message</span>
            <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">
              {messageType === "connection" ? "Connection Request" : messageType === "inmail" ? "InMail" : "Direct Message"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={onRegenerate}
            disabled={isRegenerating || !onRegenerate}
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>

        {/* Recipient Preview */}
        {recipientName && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">{recipientName}</p>
              {recipientTitle && (
                <p className="text-xs text-muted-foreground">{recipientTitle}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Composer - LinkedIn Style */}
      <div className="flex-1 p-5">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Message
            </label>
            <span className={cn(
              "text-[10px] font-mono",
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            )}>
              {body.length}/{charLimit}
            </span>
          </div>
          
          {/* LinkedIn-style message box */}
          <div className={cn(
            "flex-1 rounded-lg border-2 transition-colors",
            isOverLimit ? "border-destructive/50 bg-destructive/5" : "border-blue-500/20 bg-card hover:border-blue-500/40"
          )}>
            <Textarea
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Write a personalized message..."
              className="h-full min-h-[250px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm leading-relaxed p-4"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className={cn("flex items-center gap-1.5", isOverLimit && "text-destructive")}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-mono">{body.length}</span>/{charLimit} chars
            </div>
          </div>
          {!isOverLimit ? (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-xs">
              Ready to Send
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Over {charLimit} char limit
            </Badge>
          )}
        </div>

        {/* Platform Tips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            💡 {messageType === "connection" ? "Connection request notes are limited to 300 chars" : "Keep messages professional and personal"}
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            💡 Mention a mutual connection or shared interest
          </span>
        </div>
      </div>
    </div>
  );
}
