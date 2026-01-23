import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Linkedin, Twitter, Lightbulb } from "lucide-react";

interface ProspectCardProps {
  name: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  recentNews: string[];
  aiReasoning: string;
  tags: string[];
  avatar?: string;
}

export function ProspectCard({
  name,
  title,
  company,
  location,
  linkedinUrl,
  twitterUrl,
  recentNews,
  aiReasoning,
  tags,
}: ProspectCardProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-lg font-semibold text-foreground">
            {name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Twitter className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 p-5 space-y-5 overflow-auto">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Recent Activity</h4>
          <ul className="space-y-2">
            {recentNews.map((news, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                {news}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* AI Reasoning */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">AI Reasoning</h4>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              {aiReasoning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
