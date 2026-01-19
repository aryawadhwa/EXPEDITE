import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailEditorProps {
  subject: string;
  body: string;
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function EmailEditor({
  subject: initialSubject,
  body: initialBody,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: EmailEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  // Sync state when props change (e.g., when navigating between drafts)
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
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Generated Draft</span>
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

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Subject Line
          </label>
          <Input
            value={subject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="bg-secondary border-transparent focus:border-primary/50 font-medium"
          />
        </div>
      </div>

      {/* Body Editor */}
      <div className="flex-1 p-5">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Email Body
        </label>
        <Textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          className="h-full min-h-[300px] resize-none bg-secondary border-transparent focus:border-primary/50 text-sm leading-relaxed"
        />
      </div>

      {/* Stats */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-mono">{body.split(/\s+/).length}</span> words
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono">{subject.length}</span> subject chars
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
            Personalization Score: 94%
          </Badge>
        </div>
      </div>
    </div>
  );
}
