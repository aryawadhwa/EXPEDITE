import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroInput } from "@/components/launchpad/HeroInput";
import { RecipeCard } from "@/components/launchpad/RecipeCard";
import { MissionCard } from "@/components/launchpad/MissionCard";
import { Target, TrendingUp, Building2, UserPlus, Activity, Plus } from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const recipes = [
  {
    icon: TrendingUp,
    title: "Series A Founders",
    description: "Founders scaling teams post-raise.",
    gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
    query: "Find CTOs at Series A startups",
  },
  {
    icon: Target,
    title: "Hiring Managers",
    description: "Active hiring in Engineering.",
    gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
    query: "Target hiring managers at growing tech companies",
  },
  {
    icon: Building2,
    title: "Enterprise CTOs",
    description: "Fortune 500 decision makers.",
    gradient: "bg-gradient-to-br from-orange-400 to-pink-500",
    query: "Find CTOs at enterprise software companies",
  },
];

interface Mission {
  _id?: string;
  id?: string;
  objective?: string;
  status?: "running" | "paused" | "completed" | "error" | "stopped" | "waiting_approval";
  prospects_count?: number;
  drafts_count?: number;
  created_at?: string;
}

export default function Launchpad() {
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const missions = await api.listMissions();
        setActiveMissions(missions || []);
      } catch (error) {
        console.error("Failed to fetch missions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMissions();
  }, [api]);

  const handleRecipeClick = async (query: string) => {
    try {
      await api.createMission(query);
      toast.success("Mission Started", { description: "Agent deployed." });
      navigate("/history");
    } catch (error) {
      toast.error("Failed to launch");
    }
  };

  return (
    <div className="min-h-full p-8 max-w-[1600px] mx-auto space-y-8">

      {/* 1. Header Area (Apple Title) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
          <p className="text-[#8D99AE] text-lg">Command Center</p>
        </div>
        <Button
          className="rounded-full h-12 px-6 bg-[#EF233C] hover:bg-[#D90429] text-white font-medium shadow-lg hover:shadow-xl transition-all"
          onClick={() => document.getElementById('hero-input')?.focus()}
        >
          <Plus className="w-5 h-5 mr-2" /> New Mission
        </Button>
      </div>

      {/* 2. Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

        {/* A. Hero Input (Span 8) */}
        <div className="md:col-span-8 glass-panel rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EF233C]/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-[#EF233C]/20 transition-all duration-700" />

          <h2 className="text-2xl font-semibold text-white mb-6 z-10">Where should we hunt today?</h2>
          <div className="z-10">
            <HeroInput />
          </div>
        </div>

        {/* B. Stats / Status (Span 4) */}
        <div className="md:col-span-4 glass-panel rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#EF233C]">
              <Activity className="w-5 h-5" />
              <span className="font-medium">System Status</span>
            </div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
              Operational
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div>
              <div className="text-4xl font-bold text-white tracking-tight">{activeMissions.length}</div>
              <div className="text-[#8D99AE]">Active Agents</div>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#EF233C] w-[60%]" />
            </div>
          </div>
        </div>

        {/* C. Quick Recipes (Span 12) */}
        <div className="md:col-span-12">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Deploy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.title} {...recipe} onClick={() => handleRecipeClick(recipe.query)} />
            ))}
          </div>
        </div>

        {/* D. Recent Missions (Span 12) */}
        <div className="md:col-span-12">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-[24px] glass-panel" />
            ) : activeMissions.length > 0 ? (
              activeMissions.slice(0, 3).map((m) => (
                <MissionCard
                  key={m.id || m._id}
                  {...m}
                  id={m.id || m._id || ""}
                  name={m.objective || "Untitled"}
                  status={m.status as "running" | "paused" | "completed" | "error" | "stopped" | "waiting_approval"}
                  stage={1}
                  totalStages={3}
                  prospectsFound={m.prospects_count || 0}
                  emailsQueued={m.drafts_count || 0}
                  startedAt={m.created_at || ""}
                  onStop={() => { }}
                  onDelete={() => { }}
                />
              ))
            ) : (
              <div className="col-span-3 h-32 glass-panel rounded-[24px] flex items-center justify-center text-[#8D99AE]">
                No active missions.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
