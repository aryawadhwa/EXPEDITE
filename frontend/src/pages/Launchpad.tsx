import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroInput } from "@/components/launchpad/HeroInput";
import { RecipeCard } from "@/components/launchpad/RecipeCard";
import { MissionCard } from "@/components/launchpad/MissionCard";
import { Target, TrendingUp, Building2, UserPlus } from "lucide-react";
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

export default function Launchpad() {
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
  }, []);

  const handleRecipeClick = async (query: string) => {
    try {
      await api.createMission(query);
      toast.success("Recipe Launched!", {
        description: "AI agent is working on your request.",
        action: {
          label: "Go to Review",
          onClick: () => navigate("/review"),
        },
      });
      // Refresh missions
      const missions = await api.listMissions();
      setActiveMissions(missions || []);
    } catch (error) {
      console.error("Failed to launch recipe:", error);
      toast.error("Failed to launch recipe");
    }
  };

  const handleStopMission = async (missionId: string) => {
    try {
      await api.stopMission(missionId);
      toast.success("Mission stopped");
      // Refresh missions
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
      // Refresh missions
      const missions = await api.listMissions();
      setActiveMissions(missions || []);
    } catch (error) {
      console.error("Failed to delete mission:", error);
      toast.error("Failed to delete mission");
    }
  };

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-20">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(239 84% 67% / 0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Mission Control
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Command your AI agents to find and engage your ideal prospects.
          </p>
        </div>

        <HeroInput />
      </section>

      {/* Quick Recipes */}
      <section className="mb-10">
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
            {activeMissions.filter(m => m.status === "running").length} running
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex justify-between mb-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mb-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))
          ) : activeMissions.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-full">No active missions. Launch one above!</p>
          ) : (
            activeMissions.map((mission) => (
              <MissionCard
                key={mission._id || mission.id}
                id={mission._id || mission.id}
                name={mission.objective || "Untitled Mission"}
                status={mission.status === "waiting_approval" ? "paused" : mission.status || "running"}
                stage={mission.status === "waiting_approval" ? 2 : 1}
                totalStages={3}
                prospectsFound={mission.prospects_count || 0}
                emailsQueued={mission.drafts_count || 0}
                startedAt={mission.created_at ? new Date(mission.created_at).toLocaleString() : "Just now"}
                onStop={handleStopMission}
                onDelete={handleDeleteMission}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
