/**
 * Nexus Code — Contest Server Engine (Phase 6)
 *
 * Implements deterministic contest lifecycle state machine:
 * - Authoritative scheduling & dynamic status (scheduled -> live -> ended)
 * - Anti-cheat proctoring & violation strike tracking
 * - ICPC-style scoring engine (Rank, Points, Penalty Calculation)
 * - Seamless fallback persistence matching PostgreSQL schema
 */

import { contestScoringService, type AuthoritativeParticipantScore } from '../scoring/scoringService';
import { rankingService, type ChapterLeaderboardRow } from '../ranking/rankingService';
import { realtimeBroadcaster } from '../realtime/realtimeBroadcaster';
import { integrityEngine } from '../integrity/integrityEngine';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ContestEngineProblem {
  problemId: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
  points: number;
  tags?: string[];
}

export interface ContestEngineItem {
  id: string;
  title: string;
  description: string;
  startAt: string; // ISO
  endAt: string; // ISO
  registrationDeadline: string; // ISO
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
  rules: {
    penaltyMinutesPerWrongAnswer: number;
    maxWarnings: number;
    enableProctoring: boolean;
    allowedLanguages?: string[];
    freezeLeaderboardMinutesBeforeEnd?: number;
  };
  createdBy: string;
  createdAt: string;
  problems: ContestEngineProblem[];
}

export interface ParticipantRecord {
  contestId: string;
  userId: string;
  displayName: string;
  collegeId?: string;
  email?: string;
  registeredAt: string;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
  warnings: number;
  joinedAt?: string | null;
  disqualifiedAt?: string | null;
}

export interface ViolationRecord {
  id: string;
  contestId: string;
  userId: string;
  userDisplayName?: string;
  type: string;
  severity: string;
  occurredAt: string;
  warningNumber: number;
  evidence: Record<string, unknown>;
}

export interface UserProblemAttempt {
  attempts: number;
  solved: boolean;
  score: number;
  solvedAtMinutes?: number;
}

export interface ContestUserScore {
  contestId: string;
  userId: string;
  displayName: string;
  collegeId?: string;
  totalScore: number;
  penaltyTime: number; // in minutes
  solvedCount: number;
  rank?: number;
  isDisqualified?: boolean;
  lastSolveAtMinutes?: number;
  problems: Record<string, UserProblemAttempt>;
  updatedAt?: string;
}

// ============================================================================
// SEED TOURNAMENTS
// ============================================================================

const now = Date.now();

// 1. LIVE NOW Tournament: Started 30 mins ago, ends in 90 mins
const liveStart = new Date(now - 30 * 60 * 1000).toISOString();
const liveEnd = new Date(now + 90 * 60 * 1000).toISOString();
const liveRegDeadline = new Date(now + 60 * 60 * 1000).toISOString();

// 2. UPCOMING Tournament: Starts tomorrow at 10:00 AM
const upcomingStart = new Date(now + 24 * 60 * 60 * 1000).toISOString();
const upcomingEnd = new Date(now + 26 * 60 * 60 * 1000).toISOString();
const upcomingReg = new Date(now + 23 * 60 * 60 * 1000).toISOString();

// 3. PAST Tournament: Ended yesterday
const pastStart = new Date(now - 48 * 60 * 60 * 1000).toISOString();
const pastEnd = new Date(now - 46 * 60 * 60 * 1000).toISOString();
const pastReg = new Date(now - 49 * 60 * 60 * 1000).toISOString();

const contestsStore = new Map<string, ContestEngineItem>();
const participantsStore = new Map<string, Map<string, ParticipantRecord>>(); // contestId -> userId -> ParticipantRecord
const violationsStore = new Map<string, ViolationRecord[]>(); // contestId -> ViolationRecord[]
const scoresStore = new Map<string, Map<string, ContestUserScore>>(); // contestId -> userId -> ContestUserScore

// Initialize Seed Contests
const seedLiveContest: ContestEngineItem = {
  id: 'contest-live-12',
  title: 'CodeSprint Live Championship #12',
  description:
    'Real-time competitive programming sprint. Solve algorithmic challenges under active proctoring with deterministic test evaluation.',
  startAt: liveStart,
  endAt: liveEnd,
  registrationDeadline: liveRegDeadline,
  status: 'live',
  rules: {
    penaltyMinutesPerWrongAnswer: 20,
    maxWarnings: 3,
    enableProctoring: true,
  },
  createdBy: 'admin-seed-id',
  createdAt: new Date(now - 3 * 86400000).toISOString(),
  problems: [
    {
      problemId: 'seed-1',
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      orderIndex: 0,
      points: 100,
      tags: ['Arrays', 'Hash Map'],
    },
    {
      problemId: 'seed-5',
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      difficulty: 'easy',
      orderIndex: 1,
      points: 100,
      tags: ['Stack', 'Strings'],
    },
    {
      problemId: 'seed-2',
      slug: 'add-two-numbers',
      title: 'Add Two Numbers',
      difficulty: 'medium',
      orderIndex: 2,
      points: 150,
      tags: ['Linked Lists', 'Math'],
    },
    {
      problemId: 'seed-3',
      slug: 'longest-substring-without-repeating-characters',
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'medium',
      orderIndex: 3,
      points: 200,
      tags: ['Sliding Window', 'Strings'],
    },
  ],
};

const seedUpcomingContest: ContestEngineItem = {
  id: 'contest-upcoming-chapter-cup',
  title: 'Algorithms Chapter Cup 2026',
  description:
    'Structured chapter algorithmic tournament featuring advanced dynamic programming and graph structures. ICPC scoring and penalty time apply.',
  startAt: upcomingStart,
  endAt: upcomingEnd,
  registrationDeadline: upcomingReg,
  status: 'scheduled',
  rules: {
    penaltyMinutesPerWrongAnswer: 20,
    maxWarnings: 3,
    enableProctoring: true,
  },
  createdBy: 'admin-seed-id',
  createdAt: new Date(now - 86400000).toISOString(),
  problems: [
    {
      problemId: 'seed-1',
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      orderIndex: 0,
      points: 100,
    },
    {
      problemId: 'seed-2',
      slug: 'add-two-numbers',
      title: 'Add Two Numbers',
      difficulty: 'medium',
      orderIndex: 1,
      points: 100,
    },
    {
      problemId: 'seed-3',
      slug: 'longest-substring-without-repeating-characters',
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'medium',
      orderIndex: 2,
      points: 150,
    },
    {
      problemId: 'seed-4',
      slug: 'median-of-two-sorted-arrays',
      title: 'Median of Two Sorted Arrays',
      difficulty: 'hard',
      orderIndex: 3,
      points: 250,
    },
  ],
};

const seedPastContest: ContestEngineItem = {
  id: 'contest-past-winter-invitational',
  title: 'Winter Codemaster Invitational 2025',
  description:
    'Archived tournament problem set. Review past test case evaluations, solutions, and chapter standings.',
  startAt: pastStart,
  endAt: pastEnd,
  registrationDeadline: pastReg,
  status: 'ended',
  rules: {
    penaltyMinutesPerWrongAnswer: 20,
    maxWarnings: 3,
    enableProctoring: false,
  },
  createdBy: 'admin-seed-id',
  createdAt: new Date(now - 7 * 86400000).toISOString(),
  problems: [
    {
      problemId: 'seed-1',
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      orderIndex: 0,
      points: 100,
    },
    {
      problemId: 'seed-5',
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      difficulty: 'easy',
      orderIndex: 1,
      points: 100,
    },
  ],
};

// Seed into Map
contestsStore.set(seedLiveContest.id, seedLiveContest);
contestsStore.set(seedUpcomingContest.id, seedUpcomingContest);
contestsStore.set(seedPastContest.id, seedPastContest);

// Seed Contenders for Live Contest
const liveParticipantsMap = new Map<string, ParticipantRecord>();
const liveScoresMap = new Map<string, ContestUserScore>();

const seedContenders: Array<{
  userId: string;
  displayName: string;
  collegeId: string;
  score: number;
  penalty: number;
  solved: number;
  problems: Record<string, UserProblemAttempt>;
}> = [
  {
    userId: 'user-contender-1',
    displayName: 'Aarav Sharma',
    collegeId: '21CS001',
    score: 350,
    penalty: 62,
    solved: 3,
    problems: {
      'seed-1': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 8 },
      'seed-5': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 14 },
      'seed-2': { attempts: 2, solved: true, score: 150, solvedAtMinutes: 20 },
      'seed-3': { attempts: 1, solved: false, score: 0 },
    },
  },
  {
    userId: 'user-contender-2',
    displayName: 'Ananya Iyer',
    collegeId: '21CS045',
    score: 250,
    penalty: 45,
    solved: 2,
    problems: {
      'seed-1': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 10 },
      'seed-2': { attempts: 1, solved: true, score: 150, solvedAtMinutes: 35 },
    },
  },
  {
    userId: 'user-contender-3',
    displayName: 'Rohan Verma',
    collegeId: '22CS012',
    score: 200,
    penalty: 36,
    solved: 2,
    problems: {
      'seed-1': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 12 },
      'seed-5': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 24 },
    },
  },
  {
    userId: 'user-contender-4',
    displayName: 'Priya Nair',
    collegeId: '21IT023',
    score: 100,
    penalty: 15,
    solved: 1,
    problems: {
      'seed-1': { attempts: 1, solved: true, score: 100, solvedAtMinutes: 15 },
      'seed-5': { attempts: 2, solved: false, score: 0 },
    },
  },
];

seedContenders.forEach((c) => {
  liveParticipantsMap.set(c.userId, {
    contestId: seedLiveContest.id,
    userId: c.userId,
    displayName: c.displayName,
    collegeId: c.collegeId,
    registeredAt: new Date(now - 3600000).toISOString(),
    status: 'active',
    warnings: 0,
    joinedAt: new Date(now - 1800000).toISOString(),
  });

  liveScoresMap.set(c.userId, {
    contestId: seedLiveContest.id,
    userId: c.userId,
    displayName: c.displayName,
    collegeId: c.collegeId,
    totalScore: c.score,
    penaltyTime: c.penalty,
    solvedCount: c.solved,
    problems: c.problems,
  });
});

participantsStore.set(seedLiveContest.id, liveParticipantsMap);
scoresStore.set(seedLiveContest.id, liveScoresMap);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates current dynamic status based on time.
 */
export function getComputedContestStatus(contest: ContestEngineItem): 'draft' | 'scheduled' | 'live' | 'ended' | 'archived' {
  if (contest.status === 'draft' || contest.status === 'archived') {
    return contest.status;
  }
  const currentTime = Date.now();
  const start = new Date(contest.startAt).getTime();
  const end = new Date(contest.endAt).getTime();

  if (currentTime < start) return 'scheduled';
  if (currentTime >= end) return 'ended';
  return 'live';
}

/**
 * Lists all contests matching filter with user participant state.
 */
export function getContestsList(filter?: string, userId?: string) {
  const list: any[] = [];

  for (const contest of contestsStore.values()) {
    const computedStatus = getComputedContestStatus(contest);
    if (filter === 'live' && computedStatus !== 'live') continue;
    if (filter === 'upcoming' && computedStatus !== 'scheduled') continue;
    if (filter === 'past' && computedStatus !== 'ended') continue;

    const parts = participantsStore.get(contest.id) || new Map();
    const userPart = userId ? parts.get(userId) : undefined;
    const userScore = userId ? scoresStore.get(contest.id)?.get(userId) : undefined;

    const totalPoints = contest.problems.reduce((sum, p) => sum + (p.points || 0), 0);

    const isDQ = userId ? integrityEngine.isParticipantDisqualified('contest', contest.id, userId) : false;
    const userParticipantStatus = isDQ ? 'disqualified' : userPart?.status || null;
    const userWarnings = isDQ ? Math.max(userPart?.warnings || 0, 3) : userPart?.warnings || 0;

    list.push({
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startAt: contest.startAt,
      endAt: contest.endAt,
      registrationDeadline: contest.registrationDeadline,
      status: computedStatus,
      rules: contest.rules,
      createdBy: contest.createdBy,
      createdAt: contest.createdAt,
      participantCount: parts.size,
      problemCount: contest.problems.length,
      totalPoints,
      userParticipantStatus,
      userWarnings,
      userScore: userScore?.totalScore || 0,
    });
  }

  // Sort: live first, then upcoming (by start date ASC), then ended (by start date DESC)
  list.sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    if (a.status === 'scheduled' && b.status === 'scheduled') {
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    }
    return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
  });

  return list;
}

/**
 * Retrieves full contest details.
 */
export function getContestDetail(contestId: string, userId?: string, isStaff = false) {
  const contest = contestsStore.get(contestId);
  if (!contest) return null;

  const computedStatus = getComputedContestStatus(contest);
  const parts = participantsStore.get(contest.id) || new Map();
  const userPart = userId ? parts.get(userId) : undefined;
  const userScore = userId ? scoresStore.get(contest.id)?.get(userId) : undefined;
  const totalPoints = contest.problems.reduce((sum, p) => sum + (p.points || 0), 0);

  // If live or ended or staff, reveal problems with solved status
  const canSeeProblems = computedStatus === 'live' || computedStatus === 'ended' || isStaff;

  const problemSummaries = canSeeProblems
    ? contest.problems.map((p) => {
        const attempt = userScore?.problems?.[p.problemId];
        return {
          problemId: p.problemId,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          orderIndex: p.orderIndex,
          points: p.points,
          tags: p.tags,
          solved: attempt?.solved || false,
          attempted: (attempt?.attempts || 0) > 0,
          score: attempt?.score || 0,
        };
      })
    : [];

  const isDQ = userId ? integrityEngine.isParticipantDisqualified('contest', contest.id, userId) : false;
  const userParticipantStatus = isDQ ? 'disqualified' : userPart?.status || null;
  const userWarnings = isDQ ? Math.max(userPart?.warnings || 0, 3) : userPart?.warnings || 0;

  return {
    id: contest.id,
    title: contest.title,
    description: contest.description,
    startAt: contest.startAt,
    endAt: contest.endAt,
    registrationDeadline: contest.registrationDeadline,
    status: computedStatus,
    rules: contest.rules,
    createdBy: contest.createdBy,
    createdAt: contest.createdAt,
    participantCount: parts.size,
    problemCount: contest.problems.length,
    totalPoints,
    userParticipantStatus,
    userWarnings,
    userScore: userScore?.totalScore || 0,
    problems: problemSummaries,
  };
}

/**
 * Registers student for tournament.
 */
export function registerUserForContest(contestId: string, user: { id: string; email?: string; user_metadata?: any }) {
  const contest = contestsStore.get(contestId);
  if (!contest) {
    return { success: false, error: 'Tournament does not exist.' };
  }

  const computedStatus = getComputedContestStatus(contest);
  if (computedStatus === 'ended' || computedStatus === 'archived') {
    return { success: false, error: 'Tournament has concluded.' };
  }

  const deadline = new Date(contest.registrationDeadline).getTime();
  if (Date.now() > deadline) {
    return { success: false, error: 'Registration deadline has passed.' };
  }

  let parts = participantsStore.get(contestId);
  if (!parts) {
    parts = new Map();
    participantsStore.set(contestId, parts);
  }

  const existing = parts.get(user.id);
  if (existing) {
    return { success: true, message: 'Already registered.' };
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Student Contender';

  const collegeId = user.user_metadata?.college_id || undefined;

  const record: ParticipantRecord = {
    contestId,
    userId: user.id,
    displayName,
    collegeId,
    email: user.email,
    registeredAt: new Date().toISOString(),
    status: 'registered',
    warnings: 0,
  };

  parts.set(user.id, record);
  return { success: true, record };
}

/**
 * Marks user active upon entering the live arena.
 * Strictly prevents re-entry if the user has been disqualified.
 */
export function startUserParticipation(contestId: string, user: { id: string; email?: string; user_metadata?: any }) {
  // 1. Authoritative check: Prevent re-entry if disqualified
  if (integrityEngine.isParticipantDisqualified('contest', contestId, user.id)) {
    return {
      success: false,
      error: 'DISQUALIFIED',
      isDisqualified: true,
      message: 'Participation has been permanently revoked due to prior integrity strikes.',
    };
  }

  let parts = participantsStore.get(contestId);
  if (!parts) {
    parts = new Map();
    participantsStore.set(contestId, parts);
  }

  let record = parts.get(user.id);
  if (record && (record.status === 'disqualified' || record.warnings >= 3)) {
    return {
      success: false,
      error: 'DISQUALIFIED',
      isDisqualified: true,
      message: 'Participation has been permanently revoked due to prior integrity strikes.',
    };
  }

  if (!record) {
    // Auto-register if live
    registerUserForContest(contestId, user);
    record = parts.get(user.id);
  }

  if (record && record.status === 'registered') {
    record.status = 'active';
    record.joinedAt = new Date().toISOString();
  }

  return { success: true, record };
}

/**
 * Logs a proctoring violation using authoritative integrityEngine.
 * Enforces the strict 3-Strike System:
 * - Strike 1 -> Warning
 * - Strike 2 -> Critical Warning
 * - Strike 3 -> Immediate Disqualification & Revocation
 */
export function recordContestViolation(
  contestId: string,
  user: { id: string; email?: string; user_metadata?: any },
  type: string,
  evidence: Record<string, unknown> = {},
  supabase?: SupabaseClient
) {
  const contest = contestsStore.get(contestId);
  if (!contest) return { success: false, error: 'Tournament not found' };

  const parts = participantsStore.get(contestId);
  const part = parts?.get(user.id);
  if (!part) {
    return {
      success: false,
      error: 'NOT_PARTICIPATING',
      message: 'Participant is not registered or participating in this tournament.',
    };
  }

  // If already disqualified, immediately reject and confirm permanent revocation
  if (
    part.status === 'disqualified' ||
    part.warnings >= 3 ||
    integrityEngine.isParticipantDisqualified('contest', contestId, user.id)
  ) {
    return {
      success: false,
      warningNumber: Math.max(part.warnings, 3),
      maxWarnings: 3,
      isDisqualified: true,
      status: 'disqualified',
      severity: 'disqualification',
      message: 'Participation has been permanently revoked due to prior integrity strikes.',
      error: 'DISQUALIFIED',
    };
  }

  // Authoritatively evaluate violation via integrityEngine
  const evalResult = integrityEngine.recordViolation(
    'contest',
    contestId,
    user,
    type as any,
    evidence,
    supabase
  );

  part.warnings = evalResult.warningNumber;
  part.status = evalResult.status;
  if (evalResult.isDisqualified) {
    part.disqualifiedAt = new Date().toISOString();
  }

  // Also sync in-memory violationsStore
  let vios = violationsStore.get(contestId);
  if (!vios) {
    vios = [];
    violationsStore.set(contestId, vios);
  }

  if (evalResult.violationRecord) {
    vios.push({
      id: evalResult.violationRecord.id,
      contestId,
      userId: user.id,
      userDisplayName: evalResult.violationRecord.userDisplayName,
      type: evalResult.violationRecord.type,
      severity: evalResult.violationRecord.severity,
      occurredAt: evalResult.violationRecord.occurredAt,
      warningNumber: evalResult.violationRecord.warningNumber,
      evidence: evalResult.violationRecord.evidence,
    });
  }

  // On strike 3 (disqualification), immediately update & broadcast the leaderboard
  if (evalResult.isDisqualified) {
    recalculateAndBroadcastContestStandings(contestId, supabase);
  }

  return evalResult;
}

/**
 * Calculates and updates contest scores after an authoritative submission.
 * Uses authoritative ContestScoringService, updates RankingService, and broadcasts real-time updates.
 */
export function recordContestSubmissionScore({
  contestId,
  userId,
  userDisplayName,
  collegeId,
  problemId,
  score,
  verdict,
  submittedAt,
  supabase,
}: {
  contestId: string;
  userId: string;
  userDisplayName: string;
  collegeId?: string;
  problemId: string;
  score: number;
  verdict: string;
  submittedAt?: string;
  supabase?: SupabaseClient;
}) {
  const contest = contestsStore.get(contestId);
  if (!contest) return;

  const problem = contest.problems.find(
    (p) => p.problemId === problemId || p.slug === problemId
  );
  if (!problem) return;

  let contestScores = scoresStore.get(contestId);
  if (!contestScores) {
    contestScores = new Map();
    scoresStore.set(contestId, contestScores);
  }

  const parts = participantsStore.get(contestId);
  const part = parts?.get(userId);
  const isDisqualified = part?.status === 'disqualified';

  const existingScore = contestScores.get(userId) || null;

  // Use authoritative ContestScoringService
  const authoritativeScore = contestScoringService.calculateUpdatedScore(
    existingScore
      ? {
          contestId,
          userId,
          displayName: existingScore.displayName || userDisplayName,
          collegeId: existingScore.collegeId || collegeId,
          totalScore: existingScore.totalScore,
          penaltyTime: existingScore.penaltyTime,
          solvedCount: existingScore.solvedCount,
          lastSolveAtMinutes: existingScore.lastSolveAtMinutes,
          rank: existingScore.rank,
          isDisqualified: existingScore.isDisqualified || isDisqualified,
          problems: existingScore.problems,
          updatedAt: existingScore.updatedAt || new Date().toISOString(),
        }
      : null,
    {
      contestId,
      userId,
      userDisplayName,
      collegeId,
      problemId: problem.problemId,
      problemPoints: problem.points,
      contestStartAt: contest.startAt,
      rules: {
        penaltyMinutesPerWrongAnswer: contest.rules.penaltyMinutesPerWrongAnswer ?? 20,
      },
      verdict: verdict as any,
      score,
      submittedAt,
      isDisqualified,
    }
  );

  contestScores.set(userId, {
    contestId: authoritativeScore.contestId,
    userId: authoritativeScore.userId,
    displayName: authoritativeScore.displayName,
    collegeId: authoritativeScore.collegeId,
    totalScore: authoritativeScore.totalScore,
    penaltyTime: authoritativeScore.penaltyTime,
    solvedCount: authoritativeScore.solvedCount,
    lastSolveAtMinutes: authoritativeScore.lastSolveAtMinutes,
    isDisqualified: authoritativeScore.isDisqualified,
    problems: authoritativeScore.problems,
    updatedAt: authoritativeScore.updatedAt,
  });

  // Authoritatively recalculate rankings for the whole contest & broadcast
  recalculateAndBroadcastContestStandings(contestId, supabase);
}

/**
 * Authoritatively re-computes contest standings and broadcasts updates to connected clients.
 */
export function recalculateAndBroadcastContestStandings(contestId: string, supabase?: SupabaseClient) {
  const contest = contestsStore.get(contestId);
  if (!contest) return;

  const contestScores = scoresStore.get(contestId) || new Map();
  const parts = participantsStore.get(contestId) || new Map();

  // Combine scores with registered participants who have 0 submissions
  const allParticipantScores: AuthoritativeParticipantScore[] = [];

  for (const [uid, scoreObj] of contestScores.entries()) {
    const part = parts.get(uid);
    allParticipantScores.push({
      contestId,
      userId: uid,
      displayName: scoreObj.displayName || part?.displayName || 'Contender',
      collegeId: scoreObj.collegeId || part?.collegeId,
      totalScore: scoreObj.totalScore,
      penaltyTime: scoreObj.penaltyTime,
      solvedCount: scoreObj.solvedCount,
      lastSolveAtMinutes: scoreObj.lastSolveAtMinutes,
      isDisqualified: part?.status === 'disqualified' || scoreObj.isDisqualified,
      problems: scoreObj.problems,
      updatedAt: scoreObj.updatedAt || new Date().toISOString(),
    });
  }

  for (const [uid, part] of parts.entries()) {
    if (!contestScores.has(uid)) {
      allParticipantScores.push({
        contestId,
        userId: uid,
        displayName: part.displayName,
        collegeId: part.collegeId,
        totalScore: 0,
        penaltyTime: 0,
        solvedCount: 0,
        isDisqualified: part.status === 'disqualified',
        problems: {},
        updatedAt: part.registeredAt,
      });
    }
  }

  // Use authoritative RankingService with tie-break rules
  const ranked = rankingService.calculateContestRankings(allParticipantScores);

  // Sync ranks back to in-memory scoresStore
  for (const r of ranked) {
    const stored = contestScores.get(r.userId);
    if (stored) {
      stored.rank = r.rank;
    }
  }

  // Persist to Supabase if client provided
  if (supabase) {
    rankingService.persistRankingsToDatabase(supabase, ranked).catch(() => {});
  }

  // Format full leaderboard and broadcast to room contest:${contestId}
  const fullLeaderboard = getContestLeaderboard(contestId);
  realtimeBroadcaster.broadcastContestLeaderboard(contestId, fullLeaderboard);

  // Broadcast chapter standings as well
  const chapterStandings = getChapterStandings();
  realtimeBroadcaster.broadcastChapterLeaderboard(chapterStandings);
}

/**
 * Returns computed leaderboard sorted by Total Score DESC, Penalty Time ASC.
 */
export function getContestLeaderboard(contestId: string) {
  const contest = contestsStore.get(contestId);
  if (!contest) return [];

  const parts = participantsStore.get(contestId) || new Map();
  const scores = scoresStore.get(contestId) || new Map();

  // Combine registered contenders with scores
  const allContenders: Array<{
    userId: string;
    displayName: string;
    collegeId?: string;
    totalScore: number;
    penaltyTime: number;
    solvedCount: number;
    isDisqualified: boolean;
    lastSolveAtMinutes?: number;
    problems: Record<string, { status: 'accepted' | 'failed' | 'unattempted'; attempts: number; timeMinutes?: number; points: number }>;
  }> = [];

  // Contenders who have attempted problems
  for (const [uid, scoreObj] of scores.entries()) {
    const part = parts.get(uid);
    const isDQ = part?.status === 'disqualified' || scoreObj.isDisqualified;

    const probMap: Record<string, any> = {};
    for (const prob of contest.problems) {
      const att = scoreObj.problems[prob.problemId];
      if (!att || att.attempts === 0) {
        probMap[prob.problemId] = { status: 'unattempted', attempts: 0, points: prob.points };
      } else if (att.solved) {
        probMap[prob.problemId] = {
          status: 'accepted',
          attempts: att.attempts,
          timeMinutes: att.solvedAtMinutes,
          points: prob.points,
        };
      } else {
        probMap[prob.problemId] = {
          status: 'failed',
          attempts: att.attempts,
          points: prob.points,
        };
      }
    }

    allContenders.push({
      userId: uid,
      displayName: scoreObj.displayName || part?.displayName || 'Contender',
      collegeId: scoreObj.collegeId || part?.collegeId,
      totalScore: scoreObj.totalScore,
      penaltyTime: scoreObj.penaltyTime,
      solvedCount: scoreObj.solvedCount,
      isDisqualified: isDQ,
      lastSolveAtMinutes: scoreObj.lastSolveAtMinutes,
      problems: probMap,
    });
  }

  // Include registered participants with 0 submissions
  for (const [uid, part] of parts.entries()) {
    if (!scores.has(uid)) {
      const probMap: Record<string, any> = {};
      for (const prob of contest.problems) {
        probMap[prob.problemId] = { status: 'unattempted', attempts: 0, points: prob.points };
      }
      allContenders.push({
        userId: uid,
        displayName: part.displayName,
        collegeId: part.collegeId,
        totalScore: 0,
        penaltyTime: 0,
        solvedCount: 0,
        isDisqualified: part.status === 'disqualified',
        problems: probMap,
      });
    }
  }

  // Deterministic sorting with tie-break rules:
  // 1. Non-disqualified first
  // 2. TotalScore DESC
  // 3. PenaltyTime ASC
  // 4. Earliest lastSolveAtMinutes ASC
  // 5. User ID ASC
  allContenders.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1;
    if (!a.isDisqualified && b.isDisqualified) return -1;
    if (a.isDisqualified && b.isDisqualified) return a.userId.localeCompare(b.userId);

    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (a.penaltyTime !== b.penaltyTime) return a.penaltyTime - b.penaltyTime;

    const lastA = a.lastSolveAtMinutes ?? 999999;
    const lastB = b.lastSolveAtMinutes ?? 999999;
    if (lastA !== lastB) return lastA - lastB;

    return a.userId.localeCompare(b.userId);
  });

  // Assign ranks
  return allContenders.map((c, idx) => ({
    rank: idx + 1,
    ...c,
  }));
}

/**
 * Returns global chapter standings by aggregating contest performance.
 */
export function getChapterStandings(): ChapterLeaderboardRow[] {
  const userMap = new Map<string, {
    userId: string;
    displayName: string;
    collegeId?: string;
    contestScoreTotal: number;
    solvedTotal: number;
    contestsCount: number;
  }>();

  // Baseline seed members
  const baselineMembers = [
    { userId: 'user-contender-1', displayName: 'Aarav Sharma', collegeId: '21CS001', baseScore: 2840, baseSolved: 48 },
    { userId: 'user-contender-2', displayName: 'Ananya Iyer', collegeId: '21CS045', baseScore: 2710, baseSolved: 45 },
    { userId: 'user-contender-3', displayName: 'Rohan Verma', collegeId: '22CS012', baseScore: 2590, baseSolved: 42 },
    { userId: 'user-contender-4', displayName: 'Priya Nair', collegeId: '21IT023', baseScore: 2420, baseSolved: 39 },
    { userId: 'user-contender-5', displayName: 'Karthik Rao', collegeId: '22IT009', baseScore: 2310, baseSolved: 37 },
    { userId: 'user-contender-6', displayName: 'Sneha Patel', collegeId: '23CS078', baseScore: 2150, baseSolved: 34 },
  ];

  baselineMembers.forEach((m) => {
    userMap.set(m.userId, {
      userId: m.userId,
      displayName: m.displayName,
      collegeId: m.collegeId,
      contestScoreTotal: m.baseScore,
      solvedTotal: m.baseSolved,
      contestsCount: 4,
    });
  });

  // Aggregate all live scores across contestsStore
  for (const [contestId, contestScores] of scoresStore.entries()) {
    const parts = participantsStore.get(contestId);
    for (const [userId, scoreObj] of contestScores.entries()) {
      const part = parts?.get(userId);
      const existing = userMap.get(userId);
      if (existing) {
        existing.contestScoreTotal += scoreObj.totalScore;
        existing.solvedTotal += scoreObj.solvedCount;
        existing.contestsCount += 1;
      } else {
        userMap.set(userId, {
          userId,
          displayName: scoreObj.displayName || part?.displayName || 'Student Contender',
          collegeId: scoreObj.collegeId || part?.collegeId,
          contestScoreTotal: scoreObj.totalScore,
          solvedTotal: scoreObj.solvedCount,
          contestsCount: 1,
        });
      }
    }
  }

  return rankingService.calculateChapterStandings(Array.from(userMap.values()));
}

/**
 * Creates a new contest (Staff action).
 */
export function createContest(input: any, userId: string) {
  const id = `contest-${Date.now()}`;
  const contest: ContestEngineItem = {
    id,
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
    registrationDeadline: input.registrationDeadline || input.startAt,
    status: input.status || 'scheduled',
    rules: {
      penaltyMinutesPerWrongAnswer: input.rules?.penaltyMinutesPerWrongAnswer ?? 20,
      maxWarnings: input.rules?.maxWarnings ?? 3,
      enableProctoring: input.rules?.enableProctoring ?? true,
      allowedLanguages: input.rules?.allowedLanguages,
    },
    createdBy: userId,
    createdAt: new Date().toISOString(),
    problems: (input.problems || []).map((p: any, idx: number) => ({
      problemId: p.problemId,
      slug: p.slug || `problem-${idx + 1}`,
      title: p.title || `Problem ${String.fromCharCode(65 + idx)}`,
      difficulty: p.difficulty || 'medium',
      orderIndex: p.orderIndex ?? idx,
      points: p.points || 100,
    })),
  };

  contestsStore.set(id, contest);
  return contest;
}

/**
 * Updates an existing tournament.
 */
export function updateContest(contestId: string, input: any) {
  const existing = contestsStore.get(contestId);
  if (!existing) return null;

  if (input.title) existing.title = input.title;
  if (input.description !== undefined) existing.description = input.description;
  if (input.startAt) existing.startAt = input.startAt;
  if (input.endAt) existing.endAt = input.endAt;
  if (input.registrationDeadline) existing.registrationDeadline = input.registrationDeadline;
  if (input.status) existing.status = input.status;
  if (input.rules) {
    existing.rules = { ...existing.rules, ...input.rules };
  }
  if (input.problems) {
    existing.problems = input.problems;
  }

  return existing;
}

/**
 * Retrieves proctoring logs and participants for staff.
 */
export function getStaffProctoringStats(contestId: string) {
  const parts = Array.from((participantsStore.get(contestId) || new Map()).values());
  const vios = violationsStore.get(contestId) || [];
  return { participants: parts, violations: vios };
}

/**
 * Modifies participant status (Staff action).
 */
export function updateParticipantStatus(
  contestId: string,
  userId: string,
  action: 'disqualify' | 'reinstate' | 'reset_warnings'
) {
  const parts = participantsStore.get(contestId);
  if (!parts) return false;

  const part = parts.get(userId);
  if (!part) return false;

  if (action === 'disqualify') {
    part.status = 'disqualified';
    part.disqualifiedAt = new Date().toISOString();
    part.warnings = 3;
    integrityEngine.disqualifyUser('contest', contestId, userId);
  } else if (action === 'reinstate') {
    part.status = 'active';
    part.disqualifiedAt = null;
    part.warnings = 0;
    integrityEngine.resetStrikes('contest', contestId, userId);
  } else if (action === 'reset_warnings') {
    part.warnings = 0;
    integrityEngine.resetStrikes('contest', contestId, userId);
  }

  recalculateAndBroadcastContestStandings(contestId);
  return true;
}
