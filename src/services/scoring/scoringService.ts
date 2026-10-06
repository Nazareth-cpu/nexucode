/**
 * Nexus Code — Contest Scoring Service
 *
 * Implements server-authoritative scoring according to competitive programming (ICPC) rules.
 * Strictly processes only verified judge results for contest-scoped submissions.
 * Isolates practice submissions completely from contest scores.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubmissionVerdict } from '@/src/types/database';

export interface ProblemAttemptState {
  attempts: number;
  solved: boolean;
  score: number;
  solvedAtMinutes?: number;
  lastAttemptAt?: string;
}

export interface AuthoritativeParticipantScore {
  contestId: string;
  userId: string;
  displayName: string;
  collegeId?: string;
  totalScore: number;
  penaltyTime: number; // in minutes
  solvedCount: number;
  lastSolveAtMinutes?: number; // earliest completion tie-break
  rank?: number;
  isDisqualified?: boolean;
  problems: Record<string, ProblemAttemptState>;
  updatedAt: string;
}

export interface ContestRuleConfig {
  penaltyMinutesPerWrongAnswer: number;
  tieBreakOrder?: ('score_desc' | 'penalty_asc' | 'last_solve_asc' | 'user_id_asc')[];
}

export interface ProcessSubmissionScoreInput {
  contestId: string;
  userId: string;
  userDisplayName: string;
  collegeId?: string;
  problemId: string;
  problemPoints: number;
  contestStartAt: string;
  rules: ContestRuleConfig;
  verdict: SubmissionVerdict;
  score: number; // 0-100 from judge
  submittedAt?: string;
  isDisqualified?: boolean;
}

export class ContestScoringService {
  /**
   * Evaluates verified judge result and calculates updated score state.
   * Pure calculation function: deterministic and idempotent given submission history.
   */
  public calculateUpdatedScore(
    existingScore: AuthoritativeParticipantScore | null,
    input: ProcessSubmissionScoreInput
  ): AuthoritativeParticipantScore {
    const {
      contestId,
      userId,
      userDisplayName,
      collegeId,
      problemId,
      problemPoints,
      contestStartAt,
      rules,
      verdict,
      score,
      submittedAt = new Date().toISOString(),
      isDisqualified = false,
    } = input;

    // Disqualified participants are locked from gaining points
    if (isDisqualified) {
      if (existingScore) {
        return {
          ...existingScore,
          isDisqualified: true,
          updatedAt: submittedAt,
        };
      }
      return {
        contestId,
        userId,
        displayName: userDisplayName,
        collegeId,
        totalScore: 0,
        penaltyTime: 0,
        solvedCount: 0,
        isDisqualified: true,
        problems: {},
        updatedAt: submittedAt,
      };
    }

    const current: AuthoritativeParticipantScore = existingScore
      ? {
          ...existingScore,
          problems: { ...existingScore.problems },
        }
      : {
          contestId,
          userId,
          displayName: userDisplayName,
          collegeId,
          totalScore: 0,
          penaltyTime: 0,
          solvedCount: 0,
          problems: {},
          updatedAt: submittedAt,
        };

    const problemAttempt: ProblemAttemptState = current.problems[problemId]
      ? { ...current.problems[problemId] }
      : {
          attempts: 0,
          solved: false,
          score: 0,
        };

    // If problem already solved, further submissions do not increment penalty or score
    if (problemAttempt.solved) {
      return current;
    }

    // Increment attempts on new submission
    problemAttempt.attempts += 1;
    problemAttempt.lastAttemptAt = submittedAt;

    const isAccepted = verdict === 'accepted' || score === 100;
    const penaltyPerWrongAnswer = rules.penaltyMinutesPerWrongAnswer ?? 20;

    if (isAccepted) {
      problemAttempt.solved = true;
      problemAttempt.score = problemPoints;

      // Elapsed minutes from contest start
      const startMs = new Date(contestStartAt).getTime();
      const submitMs = new Date(submittedAt).getTime();
      const elapsedMinutes = Math.max(1, Math.round((submitMs - startMs) / 60000));
      problemAttempt.solvedAtMinutes = elapsedMinutes;

      // ICPC rule: penalty = elapsedMinutes + (penaltyPerWrongAnswer * previous_failed_attempts)
      const previousFailures = problemAttempt.attempts - 1;
      const penaltyForThisProblem = elapsedMinutes + penaltyPerWrongAnswer * previousFailures;

      current.problems[problemId] = problemAttempt;
      current.totalScore += problemPoints;
      current.penaltyTime += penaltyForThisProblem;
      current.solvedCount += 1;
      current.lastSolveAtMinutes = elapsedMinutes;
      current.updatedAt = submittedAt;
    } else {
      // Failed attempt: records attempt count for subsequent penalty calculation
      current.problems[problemId] = problemAttempt;
      current.updatedAt = submittedAt;
    }

    return current;
  }

  /**
   * Persists authoritative contest score to Supabase public.contest_scores table.
   * Safe with fallback if remote DB is unavailable.
   */
  public async persistScoreToDatabase(
    supabase: SupabaseClient | null,
    score: AuthoritativeParticipantScore
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('contest_scores').upsert(
        {
          contest_id: score.contestId,
          user_id: score.userId,
          score: score.totalScore,
          penalty_time: score.penaltyTime,
          solved_count: score.solvedCount,
          rank: score.rank ?? null,
          updated_at: score.updatedAt,
        },
        { onConflict: 'contest_id,user_id' }
      );

      if (error) {
        console.warn(`[ContestScoringService]: DB persist warning: ${error.message}`);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[ContestScoringService]: DB persist exception:', err);
      return false;
    }
  }
}

export const contestScoringService = new ContestScoringService();
