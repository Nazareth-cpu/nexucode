/**
 * Protected Route Guard
 *
 * Prevents unauthenticated users from accessing authenticated application routes.
 * Preserves intended destination URL for post-authentication redirect.
 * Waits for session restoration (AUTH_INITIALIZING) before deciding.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Session Restoration Phase (prevent premature redirect)
  if (isLoading) {
    return <AuthLoadingScreen message="Restoring session..." />;
  }

  // 2. Unauthenticated Phase (redirect to /login with preserved destination)
  if (!isAuthenticated) {
    const intendedTarget = location.pathname + location.search;
    const redirectParam = encodeURIComponent(intendedTarget);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  // 3. Authenticated Phase
  return children ? <>{children}</> : <Outlet />;
}
