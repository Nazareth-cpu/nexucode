/**
 * Nexus Code — Contest & Global Ranking Service
 *
 * Implements deterministic ranking logic with configurable contest tie-break rules.
 * Never derives authoritative ranking from client-side state.
 * Syncs updated ranks to public.contest_scores and broadcasts to connected clients.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthoritativeParticipantScore } from '../scoring/scoringService';

export interface RankedContestParticipant extends AuthoritativeParticipantScore {
  rank: number;
}

export interface ChapterLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  roll?: string; // collegeId
  solved: number;
  score: number;
  badge: 'Grandmaster' | 'Master' | 'Candidate' | 'Specialist' | 'Contender';
  avatarUrl?: string;
  contestsAttended?: number;
}

export class RankingService {
  /**
   * Deterministically sorts contest scores and assigns authoritative ranks (1, 2, 3...).
   *
   * Tie-Break Hierarchy:
   * 1. Total Score (DESC) - highest points first
   * 2. Penalty Time (ASC) - least penalty time first
   * 3. Earliest Last Solved Time (ASC) - who completed challenges faster
   * 4. User ID (ASC) - strictly deterministic tie-breaker
   *
   * Disqualified participants are placed strictly at the bottom.
   */
  public calculateContestRankings(
    scores: AuthoritativeParticipantScore[]
  ): RankedContestParticipant[] {
    const sorted = [...scores].sort((a, b) => {
      // 1. Disqualification check (disqualified always after active)
      if (a.isDisqualified && !b.isDisqualified) return 1;
      if (!a.isDisqualified && b.isDisqualified) return -1;
      if (a.isDisqualified && b.isDisqualified) {
        return a.userId.localeCompare(b.userId);
      }

      // 2. Total Points (DESC)
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      // 3. Penalty Time (ASC)
      if (a.penaltyTime !== b.penaltyTime) {
        return a.penaltyTime - b.penaltyTime;
      }

      // 4. Last Solved Minute (ASC) - earlier finish breaks tie
      const lastA = a.lastSolveAtMinutes ?? 999999;
      const lastB = b.lastSolveAtMinutes ?? 999999;
      if (lastA !== lastB) {
        return lastA - lastB;
      }

      // 5. Deterministic tie-breaker
      return a.userId.localeCompare(b.userId);
    });

    let currentRank = 1;
    return sorted.map((item, index) => {
      if (item.isDisqualified) {
        return {
          ...item,
          rank: index + 1, // Still given deterministic ordered position
        };
      }
      const rankedItem: RankedContestParticipant = {
        ...item,
        rank: currentRank,
      };
      currentRank += 1;
      return rankedItem;
    });
  }

  /**
   * Persists recalculated ranks to Supabase public.contest_scores table in batch.
   */
  public async persistRankingsToDatabase(
    supabase: SupabaseClient | null,
    rankedScores: RankedContestParticipant[]
  ): Promise<void> {
    if (!supabase || rankedScores.length === 0) return;

    try {
      const updates = rankedScores.map((s) => ({
        contest_id: s.contestId,
        user_id: s.userId,
        score: s.totalScore,
        penalty_time: s.penaltyTime,
        solved_count: s.solvedCount,
        rank: s.rank,
        updated_at: s.updatedAt,
      }));

      await supabase.from('contest_scores').upsert(updates, {
        onConflict: 'contest_id,user_id',
      });
    } catch (err) {
      console.warn('[RankingService]: Failed to persist batch rankings to Supabase:', err);
    }
  }

  /**
   * Calculates Global Chapter Leaderboard from aggregate contest and practice performance.
   */
  public calculateChapterStandings(
    userStats: Array<{
      userId: string;
      displayName: string;
      collegeId?: string;
      contestScoreTotal: number;
      solvedTotal: number;
      contestsCount?: number;
      avatarUrl?: string;
    }>
  ): ChapterLeaderboardRow[] {
    const sorted = [...userStats].sort((a, b) => {
      if (b.contestScoreTotal !== a.contestScoreTotal) {
        return b.contestScoreTotal - a.contestScoreTotal;
      }
      if (b.solvedTotal !== a.solvedTotal) {
        return b.solvedTotal - a.solvedTotal;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((user, idx) => {
      const score = user.contestScoreTotal;
      let badge: ChapterLeaderboardRow['badge'] = 'Contender';
      if (score >= 2500) badge = 'Grandmaster';
      else if (score >= 2000) badge = 'Master';
      else if (score >= 1500) badge = 'Candidate';
      else if (score >= 1000) badge = 'Specialist';

      return {
        rank: idx + 1,
        userId: user.userId,
        name: user.displayName,
        roll: user.collegeId || '—',
        solved: user.solvedTotal,
        score,
        badge,
        avatarUrl: user.avatarUrl,
        contestsAttended: user.contestsCount || 0,
      };
    });
  }
}

export const rankingService = new RankingService();
