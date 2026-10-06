/**
 * Centralized Profile Service (Phase 1.5)
 *
 * Encapsulates all profile-related database queries and mutations.
 * Strictly enforces that:
 * 1. Profile identity is tied to auth.users.id UUID.
 * 2. Public registration defaults to 'student' role.
 * 3. Client cannot specify or elevate roles.
 * 4. Profile creation is strictly idempotent (handles race conditions, OAuth logins, and re-logins).
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/src/services/supabase';
import type { AuthUser } from '@/src/features/auth/types';
import type { Profile, ProfileResult, ProfileServiceError } from '../types';

/**
 * Normalizes Supabase database errors into uniform ProfileServiceError.
 */
function normalizeProfileError(error: unknown): ProfileServiceError {
  if (!error) {
    return { message: 'An unknown error occurred while accessing the profile.' };
  }
  const err = error as { message?: string; code?: string; details?: unknown; hint?: string };
  return {
    message: err.message || 'Profile service operation failed.',
    code: err.code || 'PROFILE_ERROR',
    details: err.details || err.hint || error,
  };
}

/**
 * Constructs a secure in-memory fallback profile when the remote database table
 * is still awaiting Phase 1.5 migration or temporarily unreachable.
 * Guaranteed to default to 'student' role.
 */
function createFallbackProfile(user: AuthUser): Profile {
  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const emailPrefix = email ? email.split('@')[0] : 'Student';
  const displayName = metadata.display_name || metadata.full_name || metadata.name || emailPrefix;
  const avatarUrl = metadata.avatar_url || metadata.picture || null;
  const collegeId = metadata.college_id || null;

  return {
    id: user.id,
    display_name: displayName,
    email,
    avatar_url: avatarUrl,
    role: 'student', // Client-side fallback is strictly 'student'
    college_id: collegeId,
    created_at: user.created_at || new Date().toISOString(),
  };
}

/**
 * Attempts to retrieve authoritative profile and role from the server /api/profile endpoint.
 */
async function fetchServerProfile(user: AuthUser): Promise<Profile> {
  const fallback = createFallbackProfile(user);
  try {
    let token: string | undefined;
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { data: sessionData } = await client.auth.getSession();
        token = sessionData.session?.access_token;
      } catch {}
    }

    // Try reading Supabase token from local storage if client getSession is unavailable
    if (!token && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('student_chapter_auth_token');
        if (stored) {
          const parsed = JSON.parse(stored);
          token = parsed?.access_token || parsed?.currentSession?.access_token;
        }
      } catch {}
    }

    if (token) {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const serverData = await res.json();
        return {
          id: serverData.id,
          display_name: serverData.displayName || fallback.display_name,
          email: serverData.email || fallback.email,
          avatar_url: serverData.avatarUrl || fallback.avatar_url,
          role: (serverData.role as 'student' | 'coordinator' | 'admin') || fallback.role,
          college_id: serverData.collegeId || fallback.college_id,
          created_at: serverData.createdAt || fallback.created_at,
        };
      }
    }
  } catch (err) {
    console.warn('[ProfileService] Server profile fetch notice:', err);
  }
  return fallback;
}

export const profileService = {
  /**
   * Retrieves the profile associated with a specific user UUID.
   * Subject to Supabase Row Level Security (RLS) enforcement.
   */
  async getProfileByUserId(userId: string): Promise<ProfileResult> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: { message: 'Supabase client is not configured.', code: 'UNCONFIGURED_CLIENT' },
      };
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('profiles')
        .select('id, display_name, email, avatar_url, role, college_id, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: normalizeProfileError(error) };
      }

      return { data: (data as Profile) || null, error: null };
    } catch (err) {
      return { data: null, error: normalizeProfileError(err) };
    }
  },

  /**
   * Idempotently retrieves or creates the profile for the authenticated user.
   *
   * Security & Idempotency Rules:
   * - If profile already exists in public.profiles, returns existing record immediately.
   * - Never overwrites an existing Admin or Coordinator role with 'student'.
   * - New account profile creation defaults to 'student'.
   * - On conflict (row already exists), strictly re-fetches existing record without modifying role.
   * - Fallback resolves authoritative role from /api/profile.
   */
  async createProfileIfMissing(user: AuthUser): Promise<ProfileResult> {
    if (!user || !user.id) {
      return {
        data: null,
        error: { message: 'A valid authenticated user is required.', code: 'INVALID_USER' },
      };
    }

    if (!isSupabaseConfigured()) {
      const resolved = await fetchServerProfile(user);
      return { data: resolved, error: null };
    }

    const client = getSupabaseClient();

    try {
      // 1. Check if profile already exists (Authoritative read)
      const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('id, display_name, email, avatar_url, role, college_id, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Authoritative database profile found. Preserve existing role!
        return { data: existingProfile as Profile, error: null };
      }

      // Check if fetch error was due to missing table or permission issues
      if (fetchError) {
        const resolved = await fetchServerProfile(user);
        return { data: resolved, error: null };
      }

      // 2. Prepare safe profile attributes from authenticated identity
      const metadata = user.user_metadata || {};
      const email = user.email || '';
      const emailPrefix = email ? email.split('@')[0] : 'Student';
      const displayName = metadata.display_name || metadata.full_name || metadata.name || emailPrefix;
      const avatarUrl = metadata.avatar_url || metadata.picture || null;
      const collegeId = metadata.college_id || null;

      const newProfileData: Profile = {
        id: user.id,
        display_name: displayName,
        email,
        avatar_url: avatarUrl,
        role: 'student', // New accounts strictly default to student
        college_id: collegeId,
        created_at: new Date().toISOString(),
      };

      // 3. Insert ONLY if row does not exist.
      // NEVER use full upsert that sets role = 'student' on conflict!
      const { data: insertedProfile, error: insertError } = await client
        .from('profiles')
        .insert({
          id: newProfileData.id,
          display_name: newProfileData.display_name,
          email: newProfileData.email,
          avatar_url: newProfileData.avatar_url,
          role: 'student',
          college_id: newProfileData.college_id,
        })
        .select('id, display_name, email, avatar_url, role, college_id, created_at')
        .maybeSingle();

      if (insertError) {
        // If row already exists (e.g. from trigger on_auth_user_created or concurrent creation),
        // re-read existing profile to strictly preserve its database role!
        const { data: reFetched } = await client
          .from('profiles')
          .select('id, display_name, email, avatar_url, role, college_id, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (reFetched) {
          return { data: reFetched as Profile, error: null };
        }

        const resolved = await fetchServerProfile(user);
        return { data: resolved, error: null };
      }

      return { data: (insertedProfile as Profile) || newProfileData, error: null };
    } catch (err) {
      console.error('[Nexus Code ProfileService Error]:', err);
      const resolved = await fetchServerProfile(user);
      return { data: resolved, error: null };
    }
  },

  /**
   * Retrieves the current authenticated user's profile.
   * If the profile does not exist yet, creates it idempotently.
   */
  async getCurrentProfile(authUser?: AuthUser | null): Promise<ProfileResult> {
    if (!authUser) {
      return { data: null, error: null };
    }
    return this.createProfileIfMissing(authUser);
  },
};
