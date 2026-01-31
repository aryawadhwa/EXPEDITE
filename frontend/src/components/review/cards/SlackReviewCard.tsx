import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Loader2, Hash, AtSign, Bold, Italic, Code, Link2, List, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SlackReviewCardProps {
  body: string;
  channel?: string;
  threadTs?: string;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function SlackReviewCard({
  body: initialBody,
  channel = "general",
  threadTs,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: SlackReviewCardProps) {
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  // Parse Slack markdown preview
  const formatSlackText = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1 rounded text-pink-400">$1</code>')
      .replace(/```([^`]+)```/g, '<pre class="bg-secondary p-2 rounded text-sm my-2">$1</pre>');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Slack Style */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-purple-500/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Slack Message</span>
            <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-400">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Generated
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

        {/* Channel/Thread Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{channel}</span>
          {threadTs && (
            <Badge variant="outline" className="ml-auto text-xs">
              Thread reply
            </Badge>
          )}
        </div>
      </div>

      {/* Message Composer */}
      <div className="flex-1 p-5 overflow-auto">
        <div className="h-full flex flex-col">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 mb-3 pb-3 border-b border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Code className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Link2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <List className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <AtSign className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Smile className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Text Area */}
          <Textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={`Message #${channel}`}
            className="flex-1 min-h-[150px] resize-none bg-secondary border-transparent focus:border-purple-500/50 text-sm leading-relaxed"
          />

          {/* Preview */}
          {body && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                  U
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">You</span>
                    <span className="text-xs text-muted-foreground">just now</span>
                  </div>
                  <div 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatSlackText(body) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{body.split(/\s+/).filter(Boolean).length}</span> words
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{body.length}</span> chars
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 text-xs">
            Ready to Send
          </Badge>
        </div>

        {/* Tips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            💡 Use *bold* and _italic_ for emphasis
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            💡 @mention people for important messages
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            💡 Use threads for detailed discussions
          </span>
        </div>
      </div>
    </div>
  );
}
