import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Loader2, Mail, Linkedin, Twitter, MessageSquare, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Channel-specific configuration
const channelConfig: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  fields: { key: string; label: string; placeholder: string; maxLength?: number; multiline?: boolean }[];
  charLimit?: number;
  tips: string[];
}> = {
  email: {
    icon: Mail,
    color: "text-blue-400",
    label: "Email",
    fields: [
      { key: "subject", label: "Subject Line", placeholder: "Enter subject line...", maxLength: 100 },
      { key: "body", label: "Email Body", placeholder: "Write your email content...", multiline: true }
    ],
    tips: ["Keep subject under 50 chars for mobile", "Personalize the first line"]
  },
  gmail: {
    icon: Mail,
    color: "text-red-400",
    label: "Gmail",
    fields: [
      { key: "subject", label: "Subject Line", placeholder: "Enter subject line...", maxLength: 100 },
      { key: "body", label: "Email Body", placeholder: "Write your email content...", multiline: true }
    ],
    tips: ["Keep subject under 50 chars for mobile", "Personalize the first line"]
  },
  linkedin: {
    icon: Linkedin,
    color: "text-blue-500",
    label: "LinkedIn",
    fields: [
      { key: "body", label: "Message", placeholder: "Write your LinkedIn message...", maxLength: 8000, multiline: true }
    ],
    charLimit: 8000,
    tips: ["Connection request notes limited to 300 chars", "Keep messages professional"]
  },
  twitter: {
    icon: Twitter,
    color: "text-sky-400",
    label: "Twitter/X",
    fields: [
      { key: "body", label: "Tweet", placeholder: "What's happening?", maxLength: 280, multiline: true }
    ],
    charLimit: 280,
    tips: ["Leave room for engagement", "Use hashtags sparingly"]
  },
  reddit: {
    icon: MessageSquare,
    color: "text-orange-500",
    label: "Reddit",
    fields: [
      { key: "subject", label: "Post Title", placeholder: "An interesting title...", maxLength: 300 },
      { key: "body", label: "Post Content", placeholder: "Write your post content...", multiline: true }
    ],
    tips: ["Follow subreddit rules", "Provide value, don't self-promote"]
  },
  slack: {
    icon: MessageSquare,
    color: "text-purple-500",
    label: "Slack",
    fields: [
      { key: "body", label: "Message", placeholder: "Type your message...", multiline: true }
    ],
    tips: ["Use markdown for formatting", "Be concise"]
  },
  github: {
    icon: Github,
    color: "text-gray-400",
    label: "GitHub",
    fields: [
      { key: "subject", label: "Issue Title", placeholder: "Issue title...", maxLength: 256 },
      { key: "body", label: "Issue Body", placeholder: "Describe the issue...", multiline: true }
    ],
    tips: ["Use markdown for code blocks", "Be specific and provide context"]
  }
};

interface ContentEditorProps {
  channel: string;
  subject?: string;
  body?: string;
  onSubjectChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function ContentEditor({
  channel = "email",
  subject: initialSubject = "",
  body: initialBody = "",
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: ContentEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  // Get config for this channel (fallback to email)
  const config = channelConfig[channel.toLowerCase()] || channelConfig.email;
  const Icon = config.icon;

  // Sync state when props change
  useEffect(() => {
    setSubject(initialSubject);
  }, [initialSubject]);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  const handleFieldChange = (key: string, value: string) => {
    if (key === "subject") {
      setSubject(value);
      onSubjectChange?.(value);
    } else if (key === "body") {
      setBody(value);
      onBodyChange?.(value);
    }
  };

  const getValue = (key: string) => {
    if (key === "subject") return subject;
    if (key === "body") return body;
    return "";
  };

  const getCharCount = () => {
    // For platforms with char limits, combine all text
    if (config.charLimit) {
      return body.length;
    }
    return body.split(/\s+/).filter(Boolean).length;
  };

  const isOverLimit = config.charLimit && body.length > config.charLimit;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", config.color)} />
            <span className="text-sm font-medium text-foreground">{config.label} Draft</span>
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

        {/* Dynamic Fields */}
        {config.fields.filter(f => !f.multiline).map(field => (
          <div key={field.key} className="mb-3">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {field.label}
              {field.maxLength && (
                <span className="float-right font-mono text-[10px]">
                  {getValue(field.key).length}/{field.maxLength}
                </span>
              )}
            </label>
            <Input
              value={getValue(field.key)}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className="bg-secondary border-transparent focus:border-primary/50 font-medium"
            />
          </div>
        ))}
      </div>

      {/* Body Editor */}
      <div className="flex-1 p-5">
        {config.fields.filter(f => f.multiline).map(field => (
          <div key={field.key} className="h-full">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {field.label}
              {field.maxLength && (
                <span className={cn(
                  "float-right font-mono text-[10px]",
                  getValue(field.key).length > field.maxLength && "text-destructive"
                )}>
                  {getValue(field.key).length}/{field.maxLength}
                </span>
              )}
            </label>
            <Textarea
              value={getValue(field.key)}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                "h-full min-h-[300px] resize-none bg-secondary border-transparent focus:border-primary/50 text-sm leading-relaxed",
                isOverLimit && "border-destructive focus:border-destructive"
              )}
            />
          </div>
        ))}
      </div>

      {/* Stats & Tips */}
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {config.charLimit ? (
              <div className={cn("flex items-center gap-1.5", isOverLimit && "text-destructive")}>
                <span className="font-mono">{body.length}</span>/{config.charLimit} chars
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-mono">{body.split(/\s+/).filter(Boolean).length}</span> words
              </div>
            )}
            {subject && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono">{subject.length}</span> subject chars
              </div>
            )}
          </div>
          {!isOverLimit && (
            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
              Ready to Send
            </Badge>
          )}
          {isOverLimit && (
            <Badge variant="destructive" className="text-xs">
              Over character limit
            </Badge>
          )}
        </div>
        
        {/* Platform Tips */}
        <div className="flex flex-wrap gap-2">
          {config.tips.map((tip, i) => (
            <span key={i} className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
               {tip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
