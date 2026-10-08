/**
 * Centralized Contest Service (Phase 6)
 *
 * Provides API communication for tournament scheduling, live arena synchronization,
 * proctoring violations deterrence, and authoritative ICPC-style leaderboards.
 */

import type {
  ContestItem,
  ContestDetail,
  ContestLeaderboardRow,
  ContestViolationRecord,
  ContestParticipantItem,
  CreateContestInput,
  ViolationReportResponse,
  ViolationType,
} from '../types';
import type { AIContestAnnouncementResult } from '@/src/services/ai/aiContestService';

export const contestService = {
  /**
   * Retrieves all tournaments with computed statuses and registration state.
   */
  async getContests(
    filter?: 'all' | 'live' | 'upcoming' | 'past',
    token?: string
  ): Promise<{ data: ContestItem[]; error: string | null }> {
    try {
      const url = filter && filter !== 'all' ? `/api/contests?filter=${filter}` : '/api/contests';
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: [], error: err.message || `Failed to fetch contests (${res.status})` };
      }

      const data = await res.json();
      return { data: data.contests || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: (err as Error).message || 'Network error fetching contests.' };
    }
  },

  /**
   * Retrieves full contest details, schedule, rules, and problems.
   */
  async getContest(
    id: string,
    token?: string
  ): Promise<{ data: ContestDetail | null; error: string | null }> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/contests/${id}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: err.message || `Contest not found (${res.status})` };
      }

      const data = await res.json();
      return { data: data.contest, error: null };
    } catch (err: unknown) {
      return { data: null, error: (err as Error).message || 'Network error fetching contest.' };
    }
  },

  /**
   * Registers current student for a scheduled/live tournament.
   */
  async register(
    contestId: string,
    token: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.message || err.error || 'Failed to register.' };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Network error registering.' };
    }
  },

  /**
   * Marks participant as active in the tournament arena (joined_at timestamp).
   */
  async startParticipation(
    contestId: string,
    token: string
  ): Promise<{ success: boolean; isDisqualified?: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          isDisqualified: data.isDisqualified || data.error === 'DISQUALIFIED' || res.status === 403,
          error: data.message || data.error || 'Failed to enter arena.',
        };
      }

      return {
        success: true,
        isDisqualified: Boolean(data.isDisqualified),
        error: null,
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Network error starting contest.' };
    }
  },

  /**
   * Reports an integrity violation (tab switch, paste, etc.) to the proctoring engine.
   */
  async recordViolation(
    contestId: string,
    type: ViolationType,
    evidence: Record<string, unknown> = {},
    token: string
  ): Promise<{ data: ViolationReportResponse | null; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, evidence }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: err.message || 'Failed to record violation.' };
      }

      const data: ViolationReportResponse = await res.json();
      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: (err as Error).message || 'Network error logging violation.' };
    }
  },

  /**
   * Fetches real-time authoritative leaderboard for a contest.
   */
  async getLeaderboard(
    contestId: string,
    token?: string
  ): Promise<{ data: ContestLeaderboardRow[]; error: string | null }> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/contests/${contestId}/leaderboard`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: [], error: err.message || 'Failed to fetch leaderboard.' };
      }

      const data = await res.json();
      return { data: data.leaderboard || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: (err as Error).message || 'Network error fetching standings.' };
    }
  },

  /**
   * Creates a new tournament (Staff only).
   */
  async createContest(
    input: CreateContestInput,
    token: string
  ): Promise<{ data: ContestItem | null; error: string | null }> {
    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: err.message || err.error || 'Failed to create contest.' };
      }

      const data = await res.json();
      return { data: data.contest, error: null };
    } catch (err: unknown) {
      return { data: null, error: (err as Error).message || 'Network error creating contest.' };
    }
  },

  /**
   * Updates tournament settings or schedule (Staff only).
   */
  async updateContest(
    id: string,
    input: Partial<CreateContestInput>,
    token: string
  ): Promise<{ data: ContestItem | null; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: err.message || 'Failed to update contest.' };
      }

      const data = await res.json();
      return { data: data.contest, error: null };
    } catch (err: unknown) {
      return { data: null, error: (err as Error).message || 'Network error updating contest.' };
    }
  },

  /**
   * Retrieves participant logs and violations for staff proctoring review.
   */
  async getStaffProctoringData(
    contestId: string,
    token: string
  ): Promise<{
    participants: ContestParticipantItem[];
    violations: ContestViolationRecord[];
    error: string | null;
  }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/admin-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { participants: [], violations: [], error: err.message || 'Failed to fetch proctoring stats.' };
      }

      const data = await res.json();
      return {
        participants: data.participants || [],
        violations: data.violations || [],
        error: null,
      };
    } catch (err: unknown) {
      return {
        participants: [],
        violations: [],
        error: (err as Error).message || 'Network error fetching stats.',
      };
    }
  },

  /**
   * Manually modifies participant status or resets warnings (Staff action).
   */
  async updateParticipantStatus(
    contestId: string,
    userId: string,
    action: 'disqualify' | 'reinstate' | 'reset_warnings',
    token: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/participants/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.message || 'Failed to update participant.' };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Network error.' };
    }
  },

  /**
   * Retrieves authoritative finalized Top 3 winners with AI analysis.
   */
  async getWinners(
    contestId: string,
    token?: string
  ): Promise<{ winners: AIContestAnnouncementResult | null; error: string | null }> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/contests/${contestId}/winners`, { headers });
      if (!res.ok) {
        return { winners: null, error: `Failed to fetch winners (${res.status})` };
      }

      const data = await res.json();
      return { winners: data.winners || null, error: null };
    } catch (err: unknown) {
      return { winners: null, error: (err as Error).message || 'Network error fetching winners.' };
    }
  },

  /**
   * Finalizes contest and triggers authoritative AI Top 3 evaluation (Staff action).
   */
  async finalizeContest(
    contestId: string,
    token: string
  ): Promise<{ success: boolean; winners?: AIContestAnnouncementResult; error: string | null }> {
    try {
      const res = await fetch(`/api/contests/${contestId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || err.message || 'Failed to finalize contest.' };
      }

      const data = await res.json();
      return { success: true, winners: data.winners, error: null };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || 'Network error finalizing contest.' };
    }
  },
};

