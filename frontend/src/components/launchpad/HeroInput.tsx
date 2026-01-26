import { useState } from "react";
import { Search, Sparkles, ArrowRight, Loader2 } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      setIsLoading(true);
      try {
        const mission = await api.createMission(query);
        setQuery("");
        toast.success("Mission Launched!", {
          description: "Redirecting to mission control...",
        });
        // Redirect immediately to Mission Chat
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

      <form onSubmit={handleSubmit} className="relative">
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
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What is your outbound mission objective?"
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
