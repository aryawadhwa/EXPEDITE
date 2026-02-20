import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Loader2, Twitter, Image, Smile, MapPin, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface TwitterReviewCardProps {
  body: string;
  tweetType?: "tweet" | "reply" | "quote";
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function TwitterReviewCard({
  body: initialBody,
  tweetType = "tweet",
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: TwitterReviewCardProps) {
  const [body, setBody] = useState(initialBody);
  const charLimit = 280;
  const isOverLimit = body.length > charLimit;
  const charPercentage = Math.min((body.length / charLimit) * 100, 100);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  // Calculate remaining chars color
  const getCounterColor = () => {
    const remaining = charLimit - body.length;
    if (remaining < 0) return "text-destructive";
    if (remaining < 20) return "text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-sky-400" />
            <span className="text-sm font-medium text-foreground">
              {tweetType === "reply" ? "Reply" : tweetType === "quote" ? "Quote Tweet" : "New Tweet"}
            </span>
            <Badge variant="secondary" className="text-xs">
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
      </div>

      {/* Tweet Composer - Twitter Style */}
      <div className="flex-1 p-5">
        <div className="h-full flex flex-col">
          {/* Compose area with avatar */}
          <div className="flex gap-3 h-full">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-sky-400/30 to-blue-500/30 flex items-center justify-center text-sky-400 font-semibold">
              U
            </Avatar>
            <div className="flex-1 flex flex-col">
              <Textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="What's happening?"
                className={cn(
                  "flex-1 min-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-lg p-0 placeholder:text-muted-foreground/50",
                  isOverLimit && "text-destructive"
                )}
              />
              
              {/* Tweet Preview with formatting */}
              {body && (
                <div className="mt-4 p-4 rounded-xl border border-border bg-secondary/30">
                  <p className="text-sm whitespace-pre-wrap">
                    {body.split(/(\s+)/).map((word, i) => {
                      if (word.startsWith('#')) return <span key={i} className="text-sky-400">{word}</span>;
                      if (word.startsWith('@')) return <span key={i} className="text-sky-400">{word}</span>;
                      if (word.startsWith('http')) return <span key={i} className="text-sky-400">{word}</span>;
                      return word;
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Twitter style actions */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between">
          {/* Media buttons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:bg-sky-400/10">
              <Image className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:bg-sky-400/10">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:bg-sky-400/10">
              <BarChart2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:bg-sky-400/10">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>

          {/* Character counter */}
          <div className="flex items-center gap-3">
            {/* Circular progress */}
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-secondary"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${charPercentage * 0.628} 100`}
                  className={cn(
                    "transition-all",
                    isOverLimit ? "text-destructive" : charPercentage > 90 ? "text-yellow-500" : "text-sky-400"
                  )}
                />
              </svg>
            </div>
            <span className={cn("text-sm font-mono", getCounterColor())}>
              {charLimit - body.length}
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Leave room for engagement
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Use hashtags sparingly (1-2 max)
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Best times: 9am, 12pm, 5pm
          </span>
        </div>
      </div>
    </div>
  );
}
