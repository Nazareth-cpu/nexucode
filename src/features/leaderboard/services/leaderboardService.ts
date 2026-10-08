/**
 * Nexus Code — Leaderboard API Service
 *
 * Provides API communication for authoritative chapter-wide standings
 * and contest-specific standings.
 */

import type { ChapterLeaderboardRow } from '@/src/services/ranking/rankingService';
import type { ContestLeaderboardRow } from '@/src/features/contests/types';

export const leaderboardService = {
  /**
   * Retrieves authoritative chapter-wide standings.
   */
  async getGlobalLeaderboard(token?: string): Promise<{ data: ChapterLeaderboardRow[]; error: string | null }> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/leaderboard', { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: [], error: err.message || `Failed to fetch standings (${res.status})` };
      }

      const data = await res.json();
      return { data: data.standings || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: (err as Error).message || 'Network error fetching chapter leaderboard.' };
    }
  },

  /**
   * Retrieves authoritative contest-specific standings.
   */
  async getContestLeaderboard(contestId: string, token?: string): Promise<{ data: ContestLeaderboardRow[]; error: string | null }> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/contests/${contestId}/leaderboard`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: [], error: err.message || `Failed to fetch contest standings (${res.status})` };
      }

      const data = await res.json();
      return { data: data.leaderboard || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: (err as Error).message || 'Network error fetching contest leaderboard.' };
    }
  },
};
