/**
 * Centralized Authentication Service
 *
 * Encapsulates all underlying Supabase Auth interactions behind a uniform,
 * strongly-typed API. Does not expose raw internal client handles to UI components.
 */

import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/src/services/supabase';
import type {
  SignUpParams,
  SignInParams,
  GoogleSignInParams,
  AuthResult,
  AuthUser,
  AuthSession,
  AuthServiceError,
  AuthStateChangeCallback,
} from '../types';

/**
 * Normalizes Supabase and unexpected JavaScript errors into an AuthServiceError.
 */
function normalizeAuthError(error: unknown): AuthServiceError {
  if (!error) {
    return { message: 'An unknown authentication error occurred.' };
  }

  const sbError = error as SupabaseAuthError;
  return {
    message: sbError.message || 'An authentication error occurred.',
    code: sbError.code || (error as { name?: string }).name || 'AUTH_ERROR',
    status: sbError.status,
    details: error,
  };
}

/**
 * Ensures Supabase is configured before executing operations.
 */
function ensureConfigured(): AuthServiceError | null {
  if (!isSupabaseConfigured()) {
    return {
      message: 'Authentication service is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.',
      code: 'UNCONFIGURED_CLIENT',
    };
  }
  return null;
}

export const authService = {
  /**
   * Registers a new user with email and password.
   * Note: Roles are NEVER assigned via client signup. Default 'student' role is
   * managed authoritatively in later database migrations.
   */
  async signUp(params: SignUpParams): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            display_name: params.displayName?.trim() || undefined,
            college_id: params.collegeId?.trim() || undefined,
          },
        },
      });

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Authenticates an existing user with email and password credentials.
   */
  async signInWithPassword(params: SignInParams): Promise<AuthResult<{ user: AuthUser | null; session: AuthSession | null }>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: params.email.trim(),
        password: params.password,
      });

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return {
        data: {
          user: data.user,
          session: data.session,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Initiates Google OAuth authentication flow through Supabase Auth.
   * Google OAuth client credentials are fully managed in the Supabase Dashboard.
   */
  async signInWithGoogle(params?: GoogleSignInParams): Promise<AuthResult<{ url?: string | null }>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const defaultRedirect = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const redirectTo = params?.redirectTo || defaultRedirect;

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return {
        data: {
          url: data.url,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Signs out the currently authenticated user and clears local session cache.
   */
  async signOut(): Promise<AuthResult<void>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Retrieves the current Supabase session from persistent browser storage.
   */
  async getSession(): Promise<AuthResult<AuthSession | null>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getSession();

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return {
        data: data.session,
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Retrieves the currently authenticated user from the current session.
   */
  async getUser(): Promise<AuthResult<AuthUser | null>> {
    const configError = ensureConfigured();
    if (configError) return { data: null, error: configError };

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getUser();

      if (error) {
        return { data: null, error: normalizeAuthError(error) };
      }

      return {
        data: data.user,
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeAuthError(err) };
    }
  },

  /**
   * Subscribes to Supabase authentication state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, etc.).
   * Returns an object with an unsubscribe method.
   */
  onAuthStateChange(callback: AuthStateChangeCallback): { unsubscribe: () => void } {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }

    try {
      const client = getSupabaseClient();
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });

      return {
        unsubscribe: () => {
          subscription.unsubscribe();
        },
      };
    } catch (err) {
      console.error('[authService.onAuthStateChange Error]:', err);
      return { unsubscribe: () => {} };
    }
  },
};
