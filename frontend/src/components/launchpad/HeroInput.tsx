import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Loader2, Paperclip, ChevronDown, ChevronUp, Users, Search, PenTool, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function HeroInput() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const api = useApi();
  const navigate = useNavigate();

  // Agent Squad State
  const [selectedAgents, setSelectedAgents] = useState({
    researcher: true,
    enricher: true,
    copywriter: true,
  });

  // Asset picker state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);

  const toggleAgent = (agent: keyof typeof selectedAgents) => {
    const newState = { ...selectedAgents, [agent]: !selectedAgents[agent] };
    setSelectedAgents(newState);

    // Dispatch event to update map immediately
    window.dispatchEvent(new CustomEvent('updateAgentConfig', {
      detail: newState
    }));
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Trigger workflow display when user types
    if (value.trim().length > 0) {
      window.dispatchEvent(new CustomEvent('showWorkflow', {
        detail: { show: true, objective: value, agents: selectedAgents }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('showWorkflow', {
        detail: { show: false }
      }));
    }

    if (value.endsWith('#')) {
      try {
        const assets = await api.getAssets();
        setAvailableAssets(assets || []);
        setShowAssetPicker(true);
      } catch (err) {
        console.error("Failed to fetch assets", err);
      }
    } else if (!value.includes('#')) {
      setShowAssetPicker(false);
    }
  };

  const handleSelectAsset = (asset: any) => {
    if (!selectedAttachments.find(a => a.id === asset.id)) {
      setSelectedAttachments(prev => [...prev, asset]);
    }
    setQuery(prev => prev.replace(/#$/, ''));
    setShowAssetPicker(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setSelectedAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      setIsLoading(true);
      try {
        // Include attachment info in the objective
        let objective = query;
        if (selectedAttachments.length > 0) {
          objective += ` [Attachments: ${selectedAttachments.map(a => a.filename).join(', ')}]`;
        }

        // Add active agents to metadata (backend support needed later, currently logic is inferred)
        const agentConfig = `[Agents: ${Object.entries(selectedAgents).filter(([_, v]) => v).map(([k]) => k).join(', ')}]`;

        const mission = await api.createMission(objective + " " + agentConfig);
        setQuery("");
        setSelectedAttachments([]);
        toast.success("Mission Launched!", {
          description: "Redirecting to mission control...",
        });
        navigate(`/chat/${mission._id || mission.id}`);
      } catch (error) {
        console.error("Failed to create mission:", error);
        toast.error("Mission launch failed", {
          description: "Please check your connection and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Minimized state
  if (isMinimized) {
    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between p-3 bg-card/80 backdrop-blur-md rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Mission Input</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(false)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl blur-xl transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(239 84% 67% / 0.3) 0%, hsl(280 84% 60% / 0.2) 100%)",
        }}
      />

      {/* Minimize Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-card border border-border z-20 hover:bg-muted shadow-lg"
        onClick={() => setIsMinimized(true)}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {/* Selected Attachments */}
      {selectedAttachments.length > 0 && (
        <div className="relative flex flex-wrap gap-2 mb-2 px-2">
          {selectedAttachments.map(att => (
            <div key={att.id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              <Paperclip className="w-3 h-3" />
              <span>{att.filename}</span>
              <button onClick={() => handleRemoveAttachment(att.id)} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Agent Squad Selection */}
      <div className="flex items-center justify-end gap-2 mb-2 px-1">
        <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">Deploy Squad:</span>
        <Badge
          variant="outline"
          className={cn("cursor-pointer transition-all gap-1", selectedAgents.researcher ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "opacity-50 grayscale")}
          onClick={() => toggleAgent('researcher')}
        >
          <Search className="w-3 h-3" /> Research
        </Badge>
        <Badge
          variant="outline"
          className={cn("cursor-pointer transition-all gap-1", selectedAgents.enricher ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "opacity-50 grayscale")}
          onClick={() => toggleAgent('enricher')}
        >
          <Database className="w-3 h-3" /> Data
        </Badge>
        <Badge
          variant="outline"
          className={cn("cursor-pointer transition-all gap-1", selectedAgents.copywriter ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "opacity-50 grayscale")}
          onClick={() => toggleAgent('copywriter')}
        >
          <PenTool className="w-3 h-3" /> Copy
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        {/* Asset Picker Dropdown */}
        {showAssetPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-auto">
            {availableAssets.length > 0 ? (
              <>
                <div className="p-2 text-xs text-muted-foreground border-b border-border">Select an attachment</div>
                {availableAssets.map(asset => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary/50 flex items-center gap-2 text-sm"
                  >
                    <span className="text-primary">📄</span>
                    <span className="truncate">{asset.filename}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">
                No files uploaded. Go to Settings to add files.
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "relative flex items-center bg-card border rounded-xl transition-all duration-300",
            isFocused ? "border-primary/50 shadow-lg" : "border-border"
          )}
        >
          <div className="flex items-center pl-5">
            <Sparkles className={cn(
              "w-5 h-5 transition-colors",
              isFocused ? "text-primary" : "text-muted-foreground"
            )} />
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => e.key === "Enter" && !showAssetPicker && handleSubmit(e)}
            placeholder="Describe your outbound mission..."
            className="flex-1 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="pr-3">
            <Button
              type="submit"
              size="default"
              disabled={!query.trim() || isLoading}
              className={cn(
                "gap-2 rounded-lg transition-all",
                query.trim()
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Try:</span>
        <button
          onClick={() => {
            setQuery("Find CTOs at Series A startups");
            handleInputChange({ target: { value: "Find CTOs at Series A startups" } } as any);
          }}
          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          "Find CTOs at Series A startups"
        </button>
        <button
          onClick={() => {
            setQuery("Target SaaS companies hiring engineers");
            handleInputChange({ target: { value: "Target SaaS companies hiring engineers" } } as any);
          }}
          className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
        >
          "Target SaaS companies hiring engineers"
        </button>
      </div>
    </div>
  );
}
