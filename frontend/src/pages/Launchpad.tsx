import { useState, useEffect } from "react";
import { HeroInput } from "@/components/launchpad/HeroInput";
import { RecipeCard } from "@/components/launchpad/RecipeCard";
import { LiveMissionCard } from "@/components/launchpad/LiveMissionCard";
import { Target, TrendingUp, Building2, UserPlus, Zap } from "lucide-react";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const recipes = [
  {
    icon: TrendingUp,
    title: "Series A Founders",
    description: "Find founders who recently raised Series A and are scaling their teams.",
    gradient: "bg-gradient-to-r from-primary to-purple-500",
    query: "Find CTOs at Series A startups",
  },
  {
    icon: Target,
    title: "Hiring Managers",
    description: "Target hiring managers at companies with open engineering roles.",
    gradient: "bg-gradient-to-r from-success to-emerald-400",
    query: "Target hiring managers at growing tech companies",
  },
  {
    icon: Building2,
    title: "Enterprise CTOs",
    description: "Reach CTOs at enterprise companies in specific industries.",
    gradient: "bg-gradient-to-r from-warning to-orange-400",
    query: "Find CTOs at enterprise software companies",
  },
  {
    icon: UserPlus,
    title: "Recently Promoted",
    description: "Connect with executives who were recently promoted to VP+ roles.",
    gradient: "bg-gradient-to-r from-info to-cyan-400",
    query: "Find executives recently promoted to VP or higher",
  },
];

interface Mission {
  _id?: string;
  id?: string;
  objective?: string;
  status?: string;
  prospects_count?: number;
  drafts_count?: number;
  created_at?: string;
  [key: string]: unknown;
}

const Launchpad = () => {
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
      const mission = await api.createMission(query);
      toast.success("Mission Launched!", {
        description: "Redirecting to mission control...",
      });
      navigate(`/chat/${mission._id || mission.id}`);
    } catch (error) {
      console.error("Failed to launch recipe:", error);
      toast.error("Failed to launch recipe");
    }
  };

  const handleStopMission = async (missionId: string) => {
    try {
      await api.stopMission(missionId);
      toast.success("Mission stopped");
      const missions = await api.listMissions();
      setActiveMissions(missions || []);
    } catch (error) {
      console.error("Failed to stop mission:", error);
      toast.error("Failed to stop mission");
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      await api.deleteMission(missionId);
      toast.success("Mission deleted");
      const missions = await api.listMissions();
      setActiveMissions(missions || []);
    } catch (error) {
      console.error("Failed to delete mission:", error);
      toast.error("Failed to delete mission");
    }
  };

  return (
    <div className="min-h-full p-6 lg:p-8 space-y-12 max-w-[1600px] mx-auto">
      {/* Hero Section */}
      <section className="pt-8 pb-4 relative">
        <div className="text-center mb-12 relative z-10">

          
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
            Launch Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Campaign</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Describe your target audience and let our AI agents scout, research, and engage prospects on autopilot.
          </p>
        </div>
        <HeroInput />
      </section>

      {/* Quick Recipes */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">Quick Recipes</h2>
            <p className="text-sm text-zinc-500">One-click templates to get started fast</p>
          </div>
          <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 group">
            View all templates
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipes.map((recipe, i) => (
            <RecipeCard
              key={recipe.title}
              {...recipe}
              onClick={() => handleRecipeClick(recipe.query)}
            />
          ))}
        </div>
      </section>

      {/* Active Missions */}
      <section className="pb-20">
        <div className="flex items-center justify-between mb-8 px-2">
           <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-white">Active Missions</h2>
            <p className="text-sm text-zinc-500">Monitor your running campaigns</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
            {activeMissions.filter((m) => m.status === "running").length} SYSTEM(S) ONLINE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[240px] rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
            ))
          ) : activeMissions.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
              <p className="text-zinc-400 text-lg mb-2">No active missions</p>
              <p className="text-zinc-600 text-sm">Launch your first campaign from the input above</p>
            </div>
          ) : (
            activeMissions.map((mission) => (
              <LiveMissionCard
                key={mission._id || mission.id}
                id={mission._id || mission.id}
                name={mission.objective || "Untitled Mission"}
                status={
                  mission.status === "waiting_approval" ? "paused" : mission.status || "running"
                }
                stage={mission.status === "waiting_approval" ? 2 : 1}
                totalStages={3}
                prospectsFound={mission.prospects_count || 0}
                emailsQueued={mission.drafts_count || 0}
                startedAt={
                  mission.created_at
                    ? new Date(mission.created_at).toLocaleString()
                    : "Just now"
                }
                onStop={handleStopMission}
                onDelete={handleDeleteMission}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Launchpad;
