/**
 * Profile & Role Domain Types (Phase 1.5)
 *
 * Defines the strongly-typed contracts for user profiles, supported roles,
 * and profile service operation outcomes.
 */

export type UserRole = 'student' | 'coordinator' | 'admin';

export interface Profile {
  /**
   * Primary key linked to auth.users.id UUID.
   */
  id: string;

  /**
   * User display or full name. Nullable when OAuth provider does not supply it.
   */
  display_name: string | null;

  /**
   * Authoritative email address associated with the authenticated Supabase user.
   */
  email: string;

  /**
   * Public avatar URL (e.g., from Google OAuth or future Supabase Storage).
   */
  avatar_url: string | null;

  /**
   * Platform role strictly constrained to 'student' | 'coordinator' | 'admin'.
   * Defaults to 'student' for all public registrations.
   */
  role: UserRole;

  /**
   * College / Student Roll identifier. Nullable without requiring a complex college schema.
   */
  college_id: string | null;

  /**
   * ISO 8601 timestamp string of profile creation.
   */
  created_at: string;
}

export interface ProfileServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ProfileResult<T = Profile> {
  data: T | null;
  error: ProfileServiceError | null;
}
