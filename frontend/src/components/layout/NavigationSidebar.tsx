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
  Calendar,
  Users,
  Puzzle,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@clerk/clerk-react";

const navItems = [
  { icon: Rocket, label: "Launchpad", path: "/dashboard", id: "sidebar-launchpad" },
  { icon: MessageSquare, label: "Missions", path: "/chat/new", id: "sidebar-mission-chat" },
  { icon: Calendar, label: "Calendar", path: "/calendar", id: "sidebar-calendar" },
  { icon: ClipboardCheck, label: "Review Queue", path: "/review", id: "sidebar-review-queue" },
  { icon: Bot, label: "Active Agents", path: "/agents", id: "sidebar-active-agents" },
  { icon: Users, label: "Contacts", path: "/contacts", id: "sidebar-contacts" },
  { icon: Puzzle, label: "Integrations", path: "/integrations", id: "sidebar-integrations" },
  { icon: Settings, label: "Settings", path: "/settings", id: "sidebar-settings" },
];

interface NavigationSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function NavigationSidebar({ isCollapsed, onToggle }: NavigationSidebarProps) {
  const location = useLocation();
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-terminal border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 p-4 h-16 border-b border-sidebar-border/50">
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg tracking-tight text-white">ExpenditeAI</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="flex justify-center w-full">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo className="h-8 w-8 text-primary" />
            </Link>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("ml-auto h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground", isCollapsed && "mx-auto ml-0")}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
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

      {/* User Profile Section */}
      <div className="p-2 border-t border-sidebar-border">
        <Link to="/profile">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-sidebar-accent",
              isCollapsed ? "justify-center" : ""
            )}
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">
                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || "User"}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="w-3 h-3" />
                  <span>500 credits</span>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

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
