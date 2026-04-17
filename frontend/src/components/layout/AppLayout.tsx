import { useState } from "react";
import { NavigationSidebar } from "./NavigationSidebar";
import { LiveBrainSidebar } from "./LiveBrainSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Brain } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Logo } from "@/components/ui/logo";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [brainOpen, setBrainOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileBrainOpen, setMobileBrainOpen] = useState(false);
  const isMobile = useIsMobile();

  const tour = <OnboardingTour />;

  if (isMobile) {
    return (
      <div className="relative flex min-h-screen flex-col bg-black">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: '#000000'
          }}
        />
        {tour}
        {/* Mobile Header */}
        <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/95 px-4 pb-2 pt-2 backdrop-blur">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-40">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="z-[70] w-[85vw] max-w-72 border-r border-border bg-sidebar p-0">
              <div className="h-full overflow-y-auto">
                <NavigationSidebar isCollapsed={false} onToggle={() => { }} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-base font-bold text-white">Expedite</span>
          </div>

          <Sheet open={mobileBrainOpen} onOpenChange={setMobileBrainOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-40">
                <Brain className="w-5 h-5 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="z-[70] w-[92vw] max-w-md border-l border-border bg-terminal p-0">
              <LiveBrainSidebar isOpen={true} onToggle={() => { }} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile Content */}
        <main className="safe-bottom relative z-10 flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen bg-black overflow-hidden relative"
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: '#000000'
        }}
      />
      {tour}
      {/* Left Navigation */}
      <div className="relative z-10 h-full">
        <NavigationSidebar
          isCollapsed={navCollapsed}
          onToggle={() => setNavCollapsed(!navCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">{children}</main>

      {/* Right Brain Sidebar */}
      <div className="relative z-10 h-full">
        <LiveBrainSidebar isOpen={brainOpen} onToggle={() => setBrainOpen(!brainOpen)} />
      </div>
    </div>
  );
}
