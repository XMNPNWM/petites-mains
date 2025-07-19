
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import GlobalDashboard from './pages/GlobalDashboard';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import WritingSpace from './pages/WritingSpace';
import RefinementSpace from './pages/RefinementSpace';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProjectDashboard from './pages/ProjectDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import PricingPage from './pages/PricingPage';
import UserGuidePage from './pages/UserGuidePage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { Toaster } from '@/components/ui/toaster';
import ProjectExportPage from './pages/ProjectExportPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <GlobalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/write"
            element={
              <ProtectedRoute>
                <WritingSpace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/write/:chapterId"
            element={
              <ProtectedRoute>
                <WritingSpace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId/refine/:chapterId"
            element={
              <ProtectedRoute>
                <RefinementSpace />
              </ProtectedRoute>
            }
          />
          <Route path="/project/:projectId/export" element={
            <ProtectedRoute>
              <ProjectExportPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
