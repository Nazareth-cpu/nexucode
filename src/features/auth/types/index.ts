/**
 * Authentication Domain Types & Interfaces
 *
 * Provides strongly typed contracts for authentication operations, state,
 * and error propagation across the platform.
 */

import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { Profile } from '@/src/features/profile/types';

export type AuthUser = User;
export type AuthSession = Session;

export interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
  collegeId?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface GoogleSignInParams {
  redirectTo?: string;
}

export interface AuthServiceError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface AuthResult<T = unknown> {
  data: T | null;
  error: AuthServiceError | null;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  error: AuthServiceError | null;
}

export interface AuthContextValue extends AuthState {
  signUp: (params: SignUpParams) => Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>>;
  signInWithPassword: (params: SignInParams) => Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>>;
  signInWithGoogle: (params?: GoogleSignInParams) => Promise<AuthResult<{ url?: string | null }>>;
  signOut: () => Promise<AuthResult<void>>;
  clearError: () => void;
  refreshSession: () => Promise<AuthResult<AuthSession | null>>;
  refreshProfile: () => Promise<AuthResult<Profile | null>>;
}

export type AuthStateChangeCallback = (event: AuthChangeEvent, session: AuthSession | null) => void;
