/**
 * Public-Only Route Guard
 *
 * For routes such as /login and /register that should not be displayed
 * to already-authenticated users. Redirects authenticated users to their
 * intended destination or /dashboard.
 */

import React from 'react';
import { Navigate, useSearchParams, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSafeRedirectUrl } from '../utils/redirect';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export interface PublicOnlyRouteProps {
  children?: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [searchParams] = useSearchParams();

  // 1. Session Restoration Phase (prevent redirect flicker)
  if (isLoading) {
    return <AuthLoadingScreen message="Checking session..." />;
  }

  // 2. Already Authenticated Phase (redirect to dashboard, admin panel, or preserved destination)
  if (isAuthenticated) {
    const rawRedirect = searchParams.get('redirect');
    const defaultTarget = profile?.role === 'admin' ? '/admin' : '/dashboard';
    const safeTarget = getSafeRedirectUrl(rawRedirect, defaultTarget);
    return <Navigate to={safeTarget} replace />;
  }

  // 3. Unauthenticated Phase (allow public access)
  return children ? <>{children}</> : <Outlet />;
}
