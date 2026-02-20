import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Loader2, MessageSquare, Link2, Image, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RedditReviewCardProps {
  subject: string;
  body: string;
  subreddit?: string;
  postType?: "text" | "link" | "image";
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function RedditReviewCard({
  subject: initialSubject,
  body: initialBody,
  subreddit = "",
  postType = "text",
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: RedditReviewCardProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [activeTab, setActiveTab] = useState<string>(postType);

  const titleLimit = 300;
  const isTitleOverLimit = subject.length > titleLimit;

  useEffect(() => {
    setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    onSubjectChange?.(value);
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Reddit Style */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-orange-500/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Reddit Post</span>
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

        {/* Subreddit Selector */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <span className="text-orange-500 font-medium">r/</span>
          <span className="text-sm font-medium">{subreddit || "subreddit"}</span>
          {subreddit && (
            <Badge variant="outline" className="ml-auto text-xs">
              Posting to community
            </Badge>
          )}
        </div>
      </div>

      {/* Post Type Tabs */}
      <div className="px-5 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50">
            <TabsTrigger value="text" className="gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2 text-xs" disabled>
              <Link2 className="w-3.5 h-3.5" />
              Link
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2 text-xs" disabled>
              <Image className="w-3.5 h-3.5" />
              Image
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Post Composer */}
      <div className="flex-1 p-5 overflow-auto">
        {/* Title */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Post Title
            </label>
            <span className={cn(
              "text-[10px] font-mono",
              isTitleOverLimit ? "text-destructive" : "text-muted-foreground"
            )}>
              {subject.length}/{titleLimit}
            </span>
          </div>
          <Input
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            placeholder="An interesting title"
            className={cn(
              "bg-secondary border-transparent focus:border-orange-500/50 font-medium",
              isTitleOverLimit && "border-destructive"
            )}
            maxLength={titleLimit + 10}
          />
        </div>

        {/* Body */}
        <div className="flex-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Post Content (optional)
          </label>
          <Textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="Text (optional)"
            className="min-h-[200px] resize-none bg-secondary border-transparent focus:border-orange-500/50 text-sm leading-relaxed"
          />
        </div>

        {/* Preview */}
        {(subject || body) && (
          <div className="mt-4 p-4 rounded-lg border border-orange-500/20 bg-card">
            <div className="flex items-start gap-3">
              {/* Vote buttons preview */}
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <span className="text-lg"></span>
                <span className="text-xs font-medium">0</span>
                <span className="text-lg"></span>
              </div>
              
              {/* Post content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  r/{subreddit || "subreddit"} • Posted by u/you • just now
                </p>
                <h3 className="font-medium text-foreground mb-2">{subject || "Title preview"}</h3>
                {body && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{body.split(/\s+/).filter(Boolean).length}</span> words
            </div>
          </div>
          {!isTitleOverLimit ? (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 text-xs">
              Ready to Post
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Title too long
            </Badge>
          )}
        </div>

        {/* Warning about self-promotion */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Many subreddits have strict rules about self-promotion. Make sure your post provides value first.
          </p>
        </div>

        {/* Tips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Follow subreddit rules
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Provide value, don't just self-promote
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Engage with comments
          </span>
        </div>
      </div>
    </div>
  );
}
