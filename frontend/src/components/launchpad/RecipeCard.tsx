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
        "group relative flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5",
        "hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300",
        "text-left overflow-hidden backdrop-blur-sm"
      )}
    >
      {/* Gradient glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
          "bg-gradient-to-br from-white/5 to-transparent"
        )}
      />
      
      {/* Top Border Accent */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity",
          gradient
        )}
      />

      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
          "bg-white/5 border border-white/10 group-hover:scale-110 group-hover:border-white/20"
        )}
      >
        <Icon className="w-6 h-6 text-white group-hover:text-purple-300 transition-colors" />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">{title}</h3>
      <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-zinc-300">{description}</p>
    </button>
  );
}
