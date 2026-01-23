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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";

const navItems = [
  { icon: Rocket, label: "Dashboard", path: "/dashboard", id: "sidebar-dashboard" },
  { icon: MessageSquare, label: "Strategy", path: "/chat/new", id: "sidebar-strategy" },
  { icon: ClipboardCheck, label: "Approvals", path: "/review", id: "sidebar-approvals" },
  { icon: Bot, label: "Operations", path: "/agents", id: "sidebar-operations" },
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
    <div className="py-4 pl-4 h-full flex items-center">
      <aside
        className={cn(
          "flex flex-col h-[calc(100vh-2rem)] glass-panel rounded-2xl transition-all duration-500 ease-spring",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center h-20 border-b border-[#14213D]/30">
          <Link to="/dashboard" className="flex items-center justify-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
              <div className="w-3 h-3 rounded-full bg-primary bio-pulse" />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
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
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-[#14213D]/50 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                        isActive && "text-primary"
                      )}
                    />
                    {!isCollapsed && <span className="tracking-wide">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-[#14213D] border-[#14213D] text-white">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User Profile Section (The Void Core) */}
        <div className="p-3 mt-auto">
          <div className={cn(
            "rounded-xl bg-black/40 border border-[#14213D] p-3 transition-all",
            !isCollapsed ? "flex items-center gap-3" : "flex justify-center"
          )}>
            <SignedIn>
              <div className="relative">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 border-2 border-[#14213D] hover:border-primary transition-colors"
                    }
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-black" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate text-white">{user?.fullName || "Agent Commander"}</p>
                  <Link to="/profile" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    View Profile <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </SignedIn>
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 flex justify-center border-t border-[#14213D]/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full h-8 text-muted-foreground hover:text-white hover:bg-[#14213D]/50"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>
    </div>
  );
}
