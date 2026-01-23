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
        "group relative flex flex-col p-5 rounded-xl border border-[#14213D] bg-black/40 overflow-hidden",
        "hover:border-primary/50 transition-all duration-300",
        "text-left"
      )}
    >
      {/* 1. Holographic Spotlight Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      </div>

      {/* 2. Top Scanline Border */}
      <div
        className={cn(
          "absolute top-0 left-0 h-[1px] w-full transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
        )}
      />

      {/* 3. Gradient Accent (Top Bar) */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity",
          gradient
        )}
      />

      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors relative z-10",
          "bg-[#14213D]/50 border border-[#14213D] group-hover:border-primary/50 group-hover:bg-primary/20"
        )}
      >
        <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
      </div>

      <h3 className="font-medium text-white mb-1 font-serif tracking-wide relative z-10">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors">{description}</p>
    </button>
  );
}
