/**
 * Authentication Context & Provider
 *
 * Manages reactive authentication state, session hydration on startup,
 * and lifecycle listener subscription. Keeps UI components decoupled from
 * Supabase client handles.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { isSupabaseConfigured } from '@/src/services/supabase';
import { profileService } from '@/src/features/profile/services/profileService';
import type { Profile } from '@/src/features/profile/types';
import { authService } from '../services/authService';
import type {
  AuthContextValue,
  AuthUser,
  AuthSession,
  AuthServiceError,
  SignUpParams,
  SignInParams,
  GoogleSignInParams,
  AuthResult,
} from '../types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Auth initialization state (restoring session from storage)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Distinct profile loading state (fetching / creating profile for authenticated user)
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [error, setError] = useState<AuthServiceError | null>(null);
  const isConfigured = isSupabaseConfigured();

  const activeProfilePromiseRef = useRef<Promise<Profile | null> | null>(null);
  const activeProfileUserIdRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Internal helper to load or create profile idempotently whenever the user identity changes.
   * Eliminates race conditions by deduplicating concurrent inflight requests for the same user.
   */
  const loadProfileForUser = useCallback(async (targetUser: AuthUser | null): Promise<Profile | null> => {
    if (!targetUser) {
      setProfile(null);
      setIsProfileLoading(false);
      activeProfileUserIdRef.current = null;
      activeProfilePromiseRef.current = null;
      return null;
    }

    // Return inflight promise if already loading profile for this user
    if (activeProfileUserIdRef.current === targetUser.id && activeProfilePromiseRef.current) {
      return activeProfilePromiseRef.current;
    }

    activeProfileUserIdRef.current = targetUser.id;
    setIsProfileLoading(true);

    const loadPromise = (async () => {
      try {
        const { data: userProfile, error: profileErr } = await profileService.createProfileIfMissing(targetUser);
        if (profileErr) {
          console.warn('[Nexus Code AuthContext]: Profile fetch notice:', profileErr.message);
        }
        setProfile(userProfile);
        return userProfile;
      } catch (err) {
        console.error('[Nexus Code AuthContext]: Unexpected error loading profile:', err);
        return null;
      } finally {
        setIsProfileLoading(false);
        activeProfilePromiseRef.current = null;
      }
    })();

    activeProfilePromiseRef.current = loadPromise;
    return loadPromise;
  }, []);

  const refreshProfile = useCallback(async (): Promise<AuthResult<Profile | null>> => {
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return { data: null, error: null };
    }

    setIsProfileLoading(true);
    try {
      const { data: userProfile, error: profileErr } = await profileService.createProfileIfMissing(user);
      setProfile(userProfile);
      return {
        data: userProfile,
        error: profileErr ? { message: profileErr.message, code: profileErr.code, details: profileErr.details } : null,
      };
    } finally {
      setIsProfileLoading(false);
    }
  }, [user]);

  const refreshSession = useCallback(async (): Promise<AuthResult<AuthSession | null>> => {
    const result = await authService.getSession();
    if (result.error) {
      setError(result.error);
    } else {
      setSession(result.data);
      const nextUser = result.data?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        await loadProfileForUser(nextUser);
      } else {
        setProfile(null);
      }
    }
    return result;
  }, [loadProfileForUser]);

  useEffect(() => {
    let isMounted = true;

    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session hydration from browser persistent storage
    authService
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!isMounted) return;

        if (sessionError) {
          setError(sessionError);
          setIsLoading(false);
        } else if (data) {
          setSession(data);
          setUser(data.user);
          // Hydrate profile BEFORE marking initialization complete to prevent role race condition
          if (data.user) {
            await loadProfileForUser(data.user);
          }
          if (isMounted) {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError({
            message: 'Failed to restore session.',
            details: err,
          });
          setIsLoading(false);
        }
      });

    // 2. Real-time subscription to Supabase authentication state changes
    const { unsubscribe } = authService.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;

      const nextUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(nextUser);
      clearError();

      if (nextUser) {
        await loadProfileForUser(nextUser);
      } else {
        setProfile(null);
        setIsProfileLoading(false);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isConfigured, clearError, loadProfileForUser]);

  const signUp = useCallback(
    async (params: SignUpParams): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> => {
      clearError();
      const result = await authService.signUp(params);
      if (result.error) {
        setError(result.error);
      } else if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.user);
        if (result.data.user) {
          await loadProfileForUser(result.data.user);
        }
      }
      return result;
    },
    [clearError, loadProfileForUser]
  );

  const signInWithPassword = useCallback(
    async (params: SignInParams): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> => {
      clearError();
      const result = await authService.signInWithPassword(params);
      if (result.error) {
        setError(result.error);
      } else if (result.data?.session) {
        setSession(result.data.session);
        setUser(result.data.user);
        if (result.data.user) {
          await loadProfileForUser(result.data.user);
        }
      }
      return result;
    },
    [clearError, loadProfileForUser]
  );

  const signInWithGoogle = useCallback(
    async (params?: GoogleSignInParams): Promise<AuthResult<{ url?: string | null }>> => {
      clearError();
      const result = await authService.signInWithGoogle(params);
      if (result.error) {
        setError(result.error);
      }
      return result;
    },
    [clearError]
  );

  const signOut = useCallback(async (): Promise<AuthResult<void>> => {
    clearError();
    const result = await authService.signOut();
    if (result.error) {
      setError(result.error);
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsProfileLoading(false);
    }
    return result;
  }, [clearError]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isProfileLoading,
      isAuthenticated: !isLoading && !!user,
      isConfigured,
      error,
      signUp,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      clearError,
      refreshSession,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      isProfileLoading,
      isConfigured,
      error,
      signUp,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      clearError,
      refreshSession,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Internal hook to consume the AuthContext directly.
 * Prefer importing `useAuth` from `@/src/features/auth`.
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
