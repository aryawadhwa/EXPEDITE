import React from "react";
import { Phone, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PhoneReviewCardProps {
  body: string;
  phoneNumber?: string;
  onBodyChange?: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  isRegenerating?: boolean;
}

export function PhoneReviewCard({
  body,
  phoneNumber,
  onBodyChange,
  onRegenerate,
  isRegenerating = false,
}: PhoneReviewCardProps) {
  return (
    <Card className="w-full bg-[#1C1C1E] border-[#2C2C2E] text-white overflow-hidden shadow-lg">
      <CardHeader className="bg-[#1C1C1E] border-b border-[#2C2C2E] py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-gray-200">
                Voice Call Script
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1">
                This prompt will guide the AI Agent during the call
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-green-500/5 text-green-500 border-green-500/20 px-3 py-1 text-xs"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            AI Script
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Recipient */}
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recipient
          </label>
          <div className="text-sm font-mono text-gray-300 bg-[#2C2C2E]/50 px-3 py-2 rounded border border-[#3C3C3E]">
            {phoneNumber || "Unknown Number"}
          </div>
        </div>

        {/* Script Editor */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              System Prompt / Script
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-6 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-500/10 px-2"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating…" : "Regenerate"}
            </Button>
          </div>

          <div className="relative group">
            <Textarea
              value={body}
              onChange={(e) => onBodyChange?.(e.target.value)}
              className="min-h-[300px] w-full bg-[#2C2C2E]/30 border-[#3C3C3E] text-sm text-gray-200 resize-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 rounded-lg p-4 font-mono leading-relaxed"
              placeholder="Enter the system prompt for the AI agent…"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge
                variant="secondary"
                className="bg-black/50 text-[10px] text-gray-400 backdrop-blur-sm"
              >
                System Prompt
              </Badge>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mr-2" />
            Instructions here will override the default assistant behavior for this specific call.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
