/**
 * Reusable Profile Hook (Phase 1.5)
 *
 * Exposes the authenticated user's Nexus Code profile, role, and loading state.
 * Inherits state directly from the unified AuthContext to prevent duplicate listeners.
 */

import { useAuth } from '@/src/features/auth';
import type { Profile, UserRole } from '../types';

export interface UseProfileReturn {
  profile: Profile | null;
  isProfileLoading: boolean;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
  collegeId: string | null;
  email: string;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, profile, isProfileLoading, refreshProfile } = useAuth();

  const role: UserRole = profile?.role || 'student';
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student Member';

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const collegeId = profile?.college_id || user?.user_metadata?.college_id || null;
  const email = profile?.email || user?.email || '';

  return {
    profile,
    isProfileLoading,
    role,
    displayName,
    avatarUrl,
    collegeId,
    email,
    refreshProfile: async () => {
      await refreshProfile();
    },
  };
}
