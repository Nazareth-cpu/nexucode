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
  const [bootstrapAvailable, setBootstrapAvailable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    fetch('/api/admin/bootstrap/status')
      .then((res) => res.json())
      .then((data) => setBootstrapAvailable(Boolean(data?.available)))
      .catch(() => setBootstrapAvailable(false));
  }, []);

  // 1. Session Restoration Phase (prevent redirect flicker)
  if (isLoading || bootstrapAvailable === null) {
    return <AuthLoadingScreen message="Checking session..." />;
  }

  // 2. Already Authenticated Phase (redirect to dashboard or preserved destination)
  if (isAuthenticated) {
    // If first admin bootstrap is available and user is not yet an admin, allow viewing /login to complete establishment
    if (bootstrapAvailable && profile?.role !== 'admin') {
      return children ? <>{children}</> : <Outlet />;
    }

    const rawRedirect = searchParams.get('redirect');
    const safeTarget = getSafeRedirectUrl(rawRedirect, '/dashboard');
    return <Navigate to={safeTarget} replace />;
  }

  // 3. Unauthenticated Phase (allow public access)
  return children ? <>{children}</> : <Outlet />;
}
