import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RecipeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  onClick?: () => void;
}

export function RecipeCard({ icon: Icon, title, description, gradient, onClick }: RecipeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-xl border border-border bg-card",
        "hover:border-primary/30 hover:shadow-lg transition-all duration-300",
        "text-left"
      )}
    >
      {/* Gradient accent */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity",
          gradient
        )}
      />

      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
          "bg-secondary group-hover:bg-primary/20"
        )}
      >
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </button>
  );
}
