/**
 * Centralized Application Providers
 *
 * Wraps root application with global contexts and infrastructure providers.
 */

import React from 'react';
import { AuthProvider } from '@/src/features/auth';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
