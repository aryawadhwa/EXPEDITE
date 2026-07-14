import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect, Suspense, lazy, type ReactNode } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Launchpad = lazy(() => import("./pages/Launchpad"));
const ReviewQueue = lazy(() => import("./pages/ReviewQueue"));
const ActiveAgents = lazy(() => import("./pages/ActiveAgents"));
const DeployAgent = lazy(() => import("./pages/DeployAgent"));
const Settings = lazy(() => import("./pages/Settings"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MissionChat = lazy(() => import("./pages/MissionChat"));
const Calendar = lazy(() => import("./pages/Calendar"));
const ContactHistory = lazy(() => import("./pages/ContactHistory"));
const Integrations = lazy(() => import("./pages/Integrations").then(module => ({ default: module.Integrations })));
const Profile = lazy(() => import("./pages/Profile"));
const ProspectResearch = lazy(() => import("./pages/ProspectResearch"));
const VoiceCall = lazy(() => import("./pages/VoiceCall"));

import LoadingScreen from "@/components/ui/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

// Wrapper to handle route transitions
const AppContent = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />

        {/* App Routes (single-user local mode) */}
        <Route path="/dashboard" element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        } />
        <Route path="/launchpad" element={
          <ProtectedLayout>
            <Launchpad />
          </ProtectedLayout>
        } />
        <Route path="/chat/:missionId" element={
          <ProtectedLayout>
            <MissionChat />
          </ProtectedLayout>
        } />
        <Route path="/review" element={
          <ProtectedLayout>
            <ReviewQueue />
          </ProtectedLayout>
        } />
        <Route path="/calendar" element={
          <ProtectedLayout>
            <Calendar />
          </ProtectedLayout>
        } />
        <Route path="/contacts" element={
          <ProtectedLayout>
            <ContactHistory />
          </ProtectedLayout>
        } />
        <Route path="/agents" element={
          <ProtectedLayout>
            <ActiveAgents />
          </ProtectedLayout>
        } />
        <Route path="/agents/deploy" element={
          <ProtectedLayout>
            <DeployAgent />
          </ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        } />
        <Route path="/integrations" element={
          <ProtectedLayout>
            <Integrations />
          </ProtectedLayout>
        } />
        <Route path="/profile" element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        } />
        <Route path="/research" element={
          <ProtectedLayout>
            <ProspectResearch />
          </ProtectedLayout>
        } />
        <Route path="/voice" element={
          <ProtectedLayout>
            <VoiceCall />
          </ProtectedLayout>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
