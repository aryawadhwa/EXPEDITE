import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Rocket,
  ClipboardCheck,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: Rocket, label: "Launchpad", path: "/dashboard", id: "sidebar-launchpad" },
  { icon: MessageSquare, label: "Missions", path: "/chat/new", id: "sidebar-mission-chat" },
  { icon: ClipboardCheck, label: "Review Queue", path: "/review", id: "sidebar-review-queue" },
  { icon: Bot, label: "Active Agents", path: "/agents", id: "sidebar-active-agents" },
  { icon: Settings, label: "Settings", path: "/settings", id: "sidebar-settings" },
];

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function NavigationSidebar({ isCollapsed, onToggle }: NavigationSidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        <Link to="/landing" className="flex items-center gap-2">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent",
            isCollapsed ? "text-lg" : "text-xl"
          )}>
            {isCollapsed ? "O" : "OutboundAI"}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  id={item.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-primary"
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-popover">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
