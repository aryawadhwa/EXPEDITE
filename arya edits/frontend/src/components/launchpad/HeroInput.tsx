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
        await api.createMission(query);
        setQuery("");
        toast.success("Mission Launched!", {
          description: "AI agent is working. Check Review Queue for drafts awaiting approval.",
          action: {
            label: "Go to Review",
            onClick: () => navigate("/review"),
          },
        });
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
          "absolute inset-0 rounded-xl blur-2xl transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "radial-gradient(circle, rgba(252,163,17,0.15) 0%, transparent 70%)",
        }}
      />

      <form onSubmit={handleSubmit} className="relative z-10">
        <div
          className={cn(
            "relative flex items-center bg-black/60 backdrop-blur-md border rounded-xl transition-all duration-300",
            isFocused ? "border-primary/50 shadow-[0_0_30px_rgba(252,163,17,0.1)]" : "border-[#14213D]"
          )}
        >
          <div className="flex items-center pl-5">
            <Sparkles className={cn(
              "w-5 h-5 transition-colors duration-500",
              isFocused ? "text-primary animate-pulse" : "text-muted-foreground"
            )} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Initialize new mission parameter..."
            className="flex-1 bg-transparent px-4 py-5 text-lg text-white placeholder:text-muted-foreground/50 focus:outline-none font-mono"
          />

          <div className="pr-3">
            <Button
              type="submit"
              size="lg"
              disabled={!query.trim() || isLoading}
              className={cn(
                "gap-2 rounded-lg transition-all font-bold tracking-wide uppercase text-xs h-10",
                query.trim()
                  ? "bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(252,163,17,0.4)]"
                  : "bg-[#14213D]/50 text-muted-foreground border border-[#14213D]"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Initialize</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
        <span className="text-[#14213D]">SUGGESTED_VECTORS:</span>
        <button
          onClick={() => setQuery("Find CTOs at Series A startups")}
          className="px-2 py-1 rounded border border-[#14213D] bg-black/40 hover:border-primary/30 hover:text-primary transition-colors"
        >
          "Find CTOs at Series A startups"
        </button>
        <button
          onClick={() => setQuery("Target SaaS companies hiring engineers")}
          className="px-2 py-1 rounded border border-[#14213D] bg-black/40 hover:border-primary/30 hover:text-primary transition-colors"
        >
          "Target SaaS companies hiring engineers"
        </button>
      </div>
    </div>
  );
}
