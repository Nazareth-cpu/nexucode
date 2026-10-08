/**
 * Client Submission Service (Phase 5)
 *
 * Interfaces with the secure backend submission endpoints.
 * Passes the authenticated Supabase session Bearer token and normalized payloads.
 */

import type {
  RunCodeRequest,
  RunCodeResponse,
  SubmitCodeRequest,
  SubmissionExecutionResult,
  SubmissionHistoryItem,
} from '../types';

export const submissionService = {
  /**
   * Dispatches code to run against sample test cases (non-authoritative trial run).
   */
  async runCode(request: RunCodeRequest): Promise<{ data: RunCodeResponse | null; error: string | null }> {
    try {
      const res = await fetch('/api/submissions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          data: null,
          error: errData.message || errData.error || `Execution failed with HTTP ${res.status}`,
        };
      }

      const data: RunCodeResponse = await res.json();
      try {
        const { streakService } = await import('@/src/services/streak/streakService');
        streakService.recordTodayActivity();
      } catch {}
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: (err as Error).message || 'Network error communicating with execution server.',
      };
    }
  },

  /**
   * Dispatches code for authoritative evaluation against hidden test cases.
   * Requires an authenticated session access token.
   */
  async submitCode(
    request: SubmitCodeRequest,
    accessToken?: string
  ): Promise<{ data: SubmissionExecutionResult | null; error: string | null }> {
    if (!accessToken) {
      return {
        data: null,
        error: 'You must be signed in to submit solutions for evaluation.',
      };
    }

    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          data: null,
          error: errData.message || errData.error || `Submission failed with HTTP ${res.status}`,
        };
      }

      const data: SubmissionExecutionResult = await res.json();
      try {
        const { streakService } = await import('@/src/services/streak/streakService');
        streakService.recordTodayActivity();
      } catch {}
      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: (err as Error).message || 'Network error communicating with submission server.',
      };
    }
  },

  /**
   * Retrieves current user's submission history for a problem.
   */
  async getHistory(
    problemId: string,
    accessToken?: string
  ): Promise<{ data: SubmissionHistoryItem[]; error: string | null }> {
    if (!accessToken || !problemId) {
      return { data: [], error: null };
    }

    try {
      const res = await fetch(`/api/submissions/history?problemId=${encodeURIComponent(problemId)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        return { data: [], error: 'Failed to fetch submission history' };
      }

      const json = await res.json();
      return { data: json.data || [], error: null };
    } catch {
      return { data: [], error: 'Network error fetching history' };
    }
  },
};
