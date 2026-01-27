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

const Launchpad = () => {
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
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
    <div className="min-h-full p-6 lg:p-8 space-y-12">
      {/* Hero Section - Clean Input */}
      <section className="pt-8 pb-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Launch Your Mission
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Describe your target audience and let our AI agents find, enrich, and craft personalized outreach.
          </p>
        </div>
        <HeroInput />
      </section>

      {/* Quick Recipes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Recipes</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.title}
              {...recipe}
              onClick={() => handleRecipeClick(recipe.query)}
            />
          ))}
        </div>
      </section>

      {/* Active Missions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Active Missions</h2>
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md">
            {activeMissions.filter((m) => m.status === "running").length} running
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-20 animate-pulse bg-muted rounded" />
                  </div>
                  <div className="h-6 w-16 rounded-full animate-pulse bg-muted" />
                </div>
                <div className="mb-3 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-12 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-16 animate-pulse bg-muted rounded" />
                  </div>
                  <div className="h-1.5 w-full animate-pulse bg-muted rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                  <div className="h-4 w-20 animate-pulse bg-muted rounded" />
                </div>
              </div>
            ))
          ) : activeMissions.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-full">
              No active missions. Launch one above!
            </p>
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
