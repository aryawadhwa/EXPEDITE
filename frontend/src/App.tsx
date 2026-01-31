import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Launchpad from "./pages/Launchpad";
import ReviewQueue from "./pages/ReviewQueue";
import ActiveAgents from "./pages/ActiveAgents";
import DeployAgent from "./pages/DeployAgent";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import MissionChat from "./pages/MissionChat";
import Calendar from "./pages/Calendar";
import ContactHistory from "./pages/ContactHistory";
import { Integrations } from "./pages/Integrations";
import Profile from "./pages/Profile";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useState, useEffect } from "react";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Wrapper to handle route transitions
const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Trigger loading animation on route change
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isLoading && <LoadingScreen />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <>
            <SignedIn>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/chat/:missionId" element={
          <>
            <SignedIn>
              <AppLayout>
                <MissionChat />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/review" element={
          <>
            <SignedIn>
              <AppLayout>
                <ReviewQueue />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/calendar" element={
          <>
            <SignedIn>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/contacts" element={
          <>
            <SignedIn>
              <AppLayout>
                <ContactHistory />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/agents" element={
          <>
            <SignedIn>
              <AppLayout>
                <ActiveAgents />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/agents/deploy" element={
          <>
            <SignedIn>
              <AppLayout>
                <DeployAgent />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/settings" element={
          <>
            <SignedIn>
              <AppLayout>
                <Settings />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/integrations" element={
          <>
            <SignedIn>
              <AppLayout>
                <Integrations />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="/profile" element={
          <>
            <SignedIn>
              <AppLayout>
                <Profile />
              </AppLayout>
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
