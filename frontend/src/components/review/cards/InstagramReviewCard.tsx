import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Loader2, Instagram, Image, Camera, Film, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InstagramReviewCardProps {
  body: string;
  postType?: "post" | "story" | "reel";
  mediaUrl?: string;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function InstagramReviewCard({
  body: initialBody,
  postType = "post",
  mediaUrl,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: InstagramReviewCardProps) {
  const [body, setBody] = useState(initialBody);
  const [activeTab, setActiveTab] = useState<string>(postType);

  const charLimit = 2200;
  const hashtagLimit = 30;
  const isOverLimit = body.length > charLimit;
  
  // Count hashtags
  const hashtagCount = (body.match(/#\w+/g) || []).length;
  const isOverHashtagLimit = hashtagCount > hashtagLimit;

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleBodyChange = (value: string) => {
    setBody(value);
    onBodyChange?.(value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Instagram Style */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-orange-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-foreground">Instagram Post</span>
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400">
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

        {/* Post Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50">
            <TabsTrigger value="post" className="gap-2 text-xs">
              <Grid3x3 className="w-3.5 h-3.5" />
              Post
            </TabsTrigger>
            <TabsTrigger value="story" className="gap-2 text-xs" disabled>
              <Camera className="w-3.5 h-3.5" />
              Story
            </TabsTrigger>
            <TabsTrigger value="reel" className="gap-2 text-xs" disabled>
              <Film className="w-3.5 h-3.5" />
              Reel
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Media Preview Area */}
      <div className="p-5 border-b border-border">
        <div className="aspect-square max-h-[200px] rounded-lg border-2 border-dashed border-muted-foreground/20 bg-secondary/30 flex items-center justify-center">
          {mediaUrl ? (
            <img src={mediaUrl} alt="Post media" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-muted-foreground">
              <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No media attached</p>
              <p className="text-[10px] opacity-50">Image/video will be added later</p>
            </div>
          )}
        </div>
      </div>

      {/* Caption Editor */}
      <div className="flex-1 p-5 overflow-auto">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Caption
            </label>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-[10px] font-mono",
                isOverHashtagLimit ? "text-destructive" : "text-muted-foreground"
              )}>
                #{hashtagCount}/{hashtagLimit}
              </span>
              <span className={cn(
                "text-[10px] font-mono",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}>
                {body.length}/{charLimit}
              </span>
            </div>
          </div>
          
          <Textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="Write a caption..."
            className={cn(
              "flex-1 min-h-[150px] resize-none bg-secondary border-transparent focus:border-pink-500/50 text-sm leading-relaxed",
              (isOverLimit || isOverHashtagLimit) && "border-destructive"
            )}
          />

          {/* Caption Preview */}
          {body && (
            <div className="mt-4 p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                <span className="font-semibold text-xs">youraccount</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {body.split(/(\s+)/).map((word, i) => {
                  if (word.startsWith('#')) return <span key={i} className="text-blue-400">{word}</span>;
                  if (word.startsWith('@')) return <span key={i} className="text-blue-400">{word}</span>;
                  return word;
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{hashtagCount}</span> hashtags
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{body.split(/\s+/).filter(Boolean).length}</span> words
            </div>
          </div>
          {!isOverLimit && !isOverHashtagLimit ? (
            <Badge variant="secondary" className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 text-xs">
              Ready to Post
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              {isOverLimit ? "Caption too long" : "Too many hashtags"}
            </Badge>
          )}
        </div>

        {/* Tips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             First line is the hook - make it count
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Use 5-15 relevant hashtags
          </span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
             Add a call-to-action
          </span>
        </div>
      </div>
    </div>
  );
}
