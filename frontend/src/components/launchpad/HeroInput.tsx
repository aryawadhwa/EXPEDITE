import { useState } from "react";
import { Sparkles, ArrowRight, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function HeroInput() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const api = useApi();
  const navigate = useNavigate();

  // Asset picker state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

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

        const mission = await api.createMission(objective);
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
            className="flex-1 bg-transparent px-4 py-5 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="pr-3">
            <Button
              type="submit"
              size="lg"
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
        <button className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
          "Find CTOs at Series A startups"
        </button>
        <button className="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors">
          "Target SaaS companies hiring engineers"
        </button>
      </div>
    </div>
  );
}
