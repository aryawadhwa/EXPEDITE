import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Launchpad from "./pages/Launchpad";
import ReviewQueue from "./pages/ReviewQueue";
import ActiveAgents from "./pages/ActiveAgents";
import DeployAgent from "./pages/DeployAgent";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import MissionChat from "./pages/MissionChat";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                  <Launchpad />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
