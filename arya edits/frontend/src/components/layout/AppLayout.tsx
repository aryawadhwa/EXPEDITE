import { useState } from "react";
import { NavigationSidebar } from "./NavigationSidebar";
import { LiveBrainSidebar } from "./LiveBrainSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Brain } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingTour } from "@/components/OnboardingTour";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [brainOpen, setBrainOpen] = useState(true);
  const isMobile = useIsMobile();

  const tour = <OnboardingTour />;

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {tour}
        {/* Mobile Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-sidebar">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar">
              <NavigationSidebar isCollapsed={false} onToggle={() => { }} />
            </SheetContent>
          </Sheet>

          <span className="font-bold text-sm bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">ExpediteAI</span>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Brain className="w-5 h-5 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80 bg-terminal">
              <LiveBrainSidebar isOpen={true} onToggle={() => { }} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {tour}
      {/* Left Navigation */}
      <NavigationSidebar
        isCollapsed={navCollapsed}
        onToggle={() => setNavCollapsed(!navCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Right Brain Sidebar */}
      <LiveBrainSidebar isOpen={brainOpen} onToggle={() => setBrainOpen(!brainOpen)} />
    </div>
  );
}
