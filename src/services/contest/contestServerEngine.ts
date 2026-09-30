/**
 * Nexus Code — Contest Server Engine (Phase 6)
 *
 * Implements deterministic contest lifecycle state machine:
 * - Authoritative scheduling & dynamic status (scheduled -> live -> ended)
 * - Anti-cheat proctoring & violation strike tracking
 * - ICPC-style scoring engine (Rank, Points, Penalty Calculation)
 * - Seamless fallback persistence matching PostgreSQL schema
 */

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
  problems: Record<string, UserProblemAttempt>;
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
      userParticipantStatus: userPart?.status || null,
      userWarnings: userPart?.warnings || 0,
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
    userParticipantStatus: userPart?.status || null,
    userWarnings: userPart?.warnings || 0,
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
 */
export function startUserParticipation(contestId: string, user: { id: string; email?: string; user_metadata?: any }) {
  let parts = participantsStore.get(contestId);
  if (!parts) {
    parts = new Map();
    participantsStore.set(contestId, parts);
  }

  let record = parts.get(user.id);
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
 * Logs a proctoring violation. Increments strike count and enforces disqualification.
 */
export function recordContestViolation(
  contestId: string,
  user: { id: string; email?: string; user_metadata?: any },
  type: string,
  evidence: Record<string, unknown> = {}
) {
  const contest = contestsStore.get(contestId);
  if (!contest) return { success: false, error: 'Tournament not found' };

  let parts = participantsStore.get(contestId);
  if (!parts) {
    parts = new Map();
    participantsStore.set(contestId, parts);
  }

  let part = parts.get(user.id);
  if (!part) {
    startUserParticipation(contestId, user);
    part = parts.get(user.id);
  }

  if (!part) return { success: false, error: 'Participant not found' };

  const maxWarnings = contest.rules.maxWarnings || 3;
  part.warnings = (part.warnings || 0) + 1;

  let isDisqualified = false;
  if (part.warnings >= maxWarnings) {
    part.status = 'disqualified';
    part.disqualifiedAt = new Date().toISOString();
    isDisqualified = true;
  }

  // Record into violations
  let vios = violationsStore.get(contestId);
  if (!vios) {
    vios = [];
    violationsStore.set(contestId, vios);
  }

  const violationRecord: ViolationRecord = {
    id: `vio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    contestId,
    userId: user.id,
    userDisplayName: part.displayName,
    type,
    severity: isDisqualified ? 'disqualification' : part.warnings === maxWarnings - 1 ? 'critical' : 'warning',
    occurredAt: new Date().toISOString(),
    warningNumber: part.warnings,
    evidence,
  };

  vios.push(violationRecord);

  return {
    success: true,
    warningNumber: part.warnings,
    maxWarnings,
    isDisqualified,
    status: part.status,
    message: isDisqualified
      ? 'Tournament disqualification enforced.'
      : `Warning strike ${part.warnings} of ${maxWarnings} logged.`,
  };
}

/**
 * Calculates and updates contest scores after an authoritative submission.
 */
export function recordContestSubmissionScore({
  contestId,
  userId,
  userDisplayName,
  collegeId,
  problemId,
  score,
  verdict,
}: {
  contestId: string;
  userId: string;
  userDisplayName: string;
  collegeId?: string;
  problemId: string;
  score: number;
  verdict: string;
}) {
  const contest = contestsStore.get(contestId);
  if (!contest) return;

  const problem = contest.problems.find((p) => p.problemId === problemId);
  if (!problem) return;

  let contestScores = scoresStore.get(contestId);
  if (!contestScores) {
    contestScores = new Map();
    scoresStore.set(contestId, contestScores);
  }

  let userScore = contestScores.get(userId);
  if (!userScore) {
    userScore = {
      contestId,
      userId,
      displayName: userDisplayName,
      collegeId,
      totalScore: 0,
      penaltyTime: 0,
      solvedCount: 0,
      problems: {},
    };
    contestScores.set(userId, userScore);
  }

  let problemAttempt = userScore.problems[problemId];
  if (!problemAttempt) {
    problemAttempt = {
      attempts: 0,
      solved: false,
      score: 0,
    };
    userScore.problems[problemId] = problemAttempt;
  }

  // If already solved, do not add more penalty
  if (problemAttempt.solved) return;

  problemAttempt.attempts += 1;

  const isAccepted = verdict === 'accepted' || score === 100;
  if (isAccepted) {
    problemAttempt.solved = true;
    problemAttempt.score = problem.points;

    // Elapsed minutes from contest start
    const contestStartMs = new Date(contest.startAt).getTime();
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - contestStartMs) / 60000));
    problemAttempt.solvedAtMinutes = elapsedMinutes;

    // Penalty = elapsed minutes + 20 * (attempts - 1)
    const penaltyForProblem =
      elapsedMinutes + (contest.rules.penaltyMinutesPerWrongAnswer || 20) * (problemAttempt.attempts - 1);

    userScore.totalScore += problem.points;
    userScore.penaltyTime += penaltyForProblem;
    userScore.solvedCount += 1;
  }
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
    problems: Record<string, { status: 'accepted' | 'failed' | 'unattempted'; attempts: number; timeMinutes?: number; points: number }>;
  }> = [];

  // Contenders who have attempted problems
  for (const [uid, scoreObj] of scores.entries()) {
    const part = parts.get(uid);
    const isDQ = part?.status === 'disqualified';

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

  // Sort: Non-disqualified first by TotalScore DESC, then PenaltyTime ASC
  allContenders.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1;
    if (!a.isDisqualified && b.isDisqualified) return -1;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.penaltyTime - b.penaltyTime;
  });

  // Assign ranks
  return allContenders.map((c, idx) => ({
    rank: idx + 1,
    ...c,
  }));
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
  } else if (action === 'reinstate') {
    part.status = 'active';
    part.disqualifiedAt = null;
    part.warnings = 0;
  } else if (action === 'reset_warnings') {
    part.warnings = 0;
  }

  return true;
}
