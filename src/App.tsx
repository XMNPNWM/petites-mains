import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import UpdateProfile from './pages/UpdateProfile';
import PrivateRoute from './components/PrivateRoute';
import ProjectDetail from './pages/ProjectDetail';
import WritingSpace from './pages/WritingSpace';
import RefinementSpace from './pages/RefinementSpace';
import WorldbuildingSpace from './pages/WorldbuildingSpace';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import ProjectExportPage from './pages/ProjectExportPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/update-profile"
            element={
              <PrivateRoute>
                <UpdateProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetail />
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
          <Route
            path="/project/:projectId/worldbuilding"
            element={
              <ProtectedRoute>
                <WorldbuildingSpace />
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
