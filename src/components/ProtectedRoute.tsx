
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingState from '@/components/features/dashboard/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('[PROTECTED_ROUTE] Loading:', loading, 'User:', user ? 'exists' : 'null');

  if (loading) {
    console.log('[PROTECTED_ROUTE] Auth loading, showing loading state');
    return <LoadingState />;
  }

  if (!user) {
    console.log('[PROTECTED_ROUTE] No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('[PROTECTED_ROUTE] User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
