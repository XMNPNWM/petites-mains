import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalDashboard from "./pages/GlobalDashboard";
import ProjectDashboard from "./pages/ProjectDashboard";
import WritingSpace from "./pages/WritingSpace";
import RefinementSpace from "./pages/RefinementSpace";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <GlobalDashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId" element={
                <ProtectedRoute>
                  <ProjectDashboard />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId/write" element={
                <ProtectedRoute>
                  <WritingSpace />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId/write/:chapterId" element={
                <ProtectedRoute>
                  <WritingSpace />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId/chapter/:chapterId" element={
                <ProtectedRoute>
                  <WritingSpace />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId/refine" element={
                <ProtectedRoute>
                  <RefinementSpace />
                </ProtectedRoute>
              } />
              <Route path="/project/:projectId/refine/:chapterId" element={
                <ProtectedRoute>
                  <RefinementSpace />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
