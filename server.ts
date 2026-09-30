/**
 * Nexus Code — Full-Stack Server Entry Point (Phase 5)
 *
 * Implements the secure server-side execution pipeline connecting
 * React + Monaco to the isolated Judge0 execution service and Supabase.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  evaluateProblemSubmission,
  executeOnJudge0,
  MultiTestExecutionItem,
} from './src/services/judge/judgeService';
import {
  getContestsList,
  getContestDetail,
  registerUserForContest,
  startUserParticipation,
  recordContestViolation,
  getContestLeaderboard,
  createContest,
  updateContest,
  getStaffProctoringStats,
  updateParticipantStatus,
  recordContestSubmissionScore,
} from './src/services/contest/contestServerEngine';
import {
  listClubMembers,
  provisionStaffMember,
  updateStaffMemberStatus,
  regenerateStaffToken,
  verifyActivationCredentials,
  claimStaffActivation,
} from './src/services/staff/clubMembersServerEngine';
import {
  getBootstrapStatus,
  executeFirstAdminBootstrap,
  getAssignedRole,
  setAssignedRole,
  getAllAssignedRoles,
  getBootstrappedAdminRecord,
} from './src/services/admin/bootstrapServerEngine';
import type { SupportedWorkspaceLanguage } from './src/features/workspace/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '2mb' }));

// In-memory idempotency cache (TTL: 2 minutes)
const idempotencyStore = new Map<string, { result: unknown; timestamp: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyStore.entries()) {
    if (now - val.timestamp > 120000) {
      idempotencyStore.delete(key);
    }
  }
}, 60000);

// Server Supabase Client
function getServerSupabase(token?: string) {
  let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  try {
    supabaseUrl = new URL(supabaseUrl).origin;
  } catch {
    // Keep as is
  }
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const client = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });

  return client;
}

/**
 * Helper to retrieve and enhance Supabase user with profile & role data
 * Role is strictly loaded from the authoritative public.profiles table.
 * Client-controlled user_metadata is NEVER trusted for role authorization.
 */
async function extractUserFromToken(token: string) {
  try {
    const supabase = getServerSupabase(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const assignedRole = getAssignedRole(user.id);
    if (assignedRole) {
      (user as any).role = assignedRole;
    } else {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name, college_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role && ['student', 'coordinator', 'admin'].includes(profile.role)) {
          (user as any).role = profile.role;
          setAssignedRole(user.id, profile.role);
        } else {
          (user as any).role = 'student';
        }
        if (profile?.display_name) {
          user.user_metadata = { ...user.user_metadata, display_name: profile.display_name };
        }
        if (profile?.college_id) {
          user.user_metadata = { ...user.user_metadata, college_id: profile.college_id };
        }
      } catch {
        (user as any).role = 'student';
      }
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Required Authentication Middleware
 */
async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token is required.',
    });
  }

  const token = authHeader.split(' ')[1];
  const user = await extractUserFromToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired session. Please sign in again.',
    });
  }

  (req as any).user = user;
  (req as any).userToken = token;
  next();
}

/**
 * Optional Authentication Middleware (Attaches user if valid token present)
 */
async function optionalAuthenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await extractUserFromToken(token);
    if (user) {
      (req as any).user = user;
      (req as any).userToken = token;
    }
  }
  next();
}

/**
 * Staff Role Authorization Middleware (Event Coordinators & Admins)
 * Authorization Matrix: Problems (Coordinator, Admin), Events (Coordinator, Admin)
 */
function requireStaff(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
  }
  const role = user.role;
  if (role !== 'coordinator' && role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Staff privileges (Coordinator or Admin) required.' });
  }
  next();
}

/**
 * Admin Role Authorization Middleware (Admins ONLY)
 * Authorization Matrix: Contests (Admin ONLY), Admin Control / Role Provisioning (Admin ONLY)
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
  }
  const role = user.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Administrator privileges strictly required.' });
  }
  next();
}

// ============================================================================
// API ROUTES: /api/submissions/*
// ============================================================================

/**
 * POST /api/submissions/run
 * Runs code against public sample cases (or custom input) without writing a submission.
 */
app.post('/api/submissions/run', async (req: Request, res: Response) => {
  try {
    const { sourceCode, language, problemSlug, customStdin } = req.body;

    if (!sourceCode || typeof sourceCode !== 'string') {
      return res.status(400).json({ error: 'Source code is required.' });
    }
    if (sourceCode.length > 65536) {
      return res.status(400).json({ error: 'Source code exceeds maximum size limit (64KB).' });
    }
    if (!language) {
      return res.status(400).json({ error: 'Language is required.' });
    }

    // If custom stdin is provided, execute single test
    if (customStdin !== undefined) {
      const result = await executeOnJudge0({
        sourceCode,
        language: language as SupportedWorkspaceLanguage,
        stdin: customStdin,
      });

      return res.json({
        verdict: result.verdict,
        verdictLabel: result.verdictLabel,
        isAccepted: result.isAccepted,
        timeMs: result.timeMs,
        memoryKb: result.memoryKb,
        stdout: result.stdout,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
      });
    }

    // Fetch or receive problem public examples
    const supabase = getServerSupabase();
    let sampleCases: MultiTestExecutionItem[] = [];

    if (Array.isArray(req.body.sampleCases) && req.body.sampleCases.length > 0) {
      sampleCases = req.body.sampleCases.map((sc: any) => ({
        stdin: sc.stdin !== undefined ? sc.stdin : (sc.input || ''),
        expectedOutput: sc.expectedOutput !== undefined ? sc.expectedOutput : (sc.output || ''),
        visibility: 'sample' as const,
      }));
    } else if (problemSlug) {
      try {
        const { data: problem } = await supabase
          .from('problems')
          .select('examples')
          .eq('slug', problemSlug)
          .maybeSingle();

        if (problem && Array.isArray(problem.examples)) {
          sampleCases = problem.examples.map((ex: any) => ({
            stdin: ex.input || '',
            expectedOutput: ex.output || '',
            visibility: 'sample' as const,
          }));
        }
      } catch {
        // Fallback to empty test case
      }
    }

    if (sampleCases.length === 0) {
      sampleCases = [
        {
          stdin: '',
          expectedOutput: '',
          visibility: 'sample',
        },
      ];
    }

    const summary = await evaluateProblemSubmission(
      sourceCode,
      language as SupportedWorkspaceLanguage,
      sampleCases
    );

    return res.json({
      verdict: summary.verdict,
      score: summary.score,
      testCount: summary.testCount,
      passedCount: summary.passedCount,
      maxTimeMs: summary.maxTimeMs,
      maxMemoryKb: summary.maxMemoryKb,
      sampleResults: summary.sampleResults,
    });
  } catch (err: unknown) {
    console.error('[API /run Error]:', err);
    return res.status(500).json({
      error: 'EXECUTION_FAILED',
      message: (err as Error).message || 'Failed to execute code on judge.',
    });
  }
});

// In-memory fallback problem metadata for seamless local & tournament execution
const FALLBACK_PROBLEMS: Record<string, any> = {
  'two-sum': {
    id: 'seed-1',
    slug: 'two-sum',
    title: 'Two Sum',
    status: 'published',
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1' },
      { input: '3\n3 2 4\n6', output: '1 2' },
      { input: '2\n3 3\n6', output: '0 1' },
    ],
  },
  'valid-parentheses': {
    id: 'seed-5',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    status: 'published',
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
    ],
  },
  'add-two-numbers': {
    id: 'seed-2',
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    status: 'published',
    examples: [
      { input: '3\n2 4 3\n3\n5 6 4', output: '7 0 8' },
      { input: '1\n0\n1\n0', output: '0' },
    ],
  },
  'longest-substring-without-repeating-characters': {
    id: 'seed-3',
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    status: 'published',
    examples: [
      { input: 'abcabcbb', output: '3' },
      { input: 'bbbbb', output: '1' },
      { input: 'pwwkew', output: '3' },
    ],
  },
  'median-of-two-sorted-arrays': {
    id: 'seed-4',
    slug: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    status: 'published',
    examples: [
      { input: '2\n1 3\n1\n2', output: '2.0' },
      { input: '2\n1 2\n2\n3 4', output: '2.5' },
    ],
  },
  'merge-k-sorted-lists': {
    id: 'seed-6',
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    status: 'published',
    examples: [
      { input: '3\n1 4 5\n1 3 4\n2 6', output: '1 1 2 3 4 4 5 6' },
      { input: '0', output: '' },
    ],
  },
};

/**
 * POST /api/submissions/submit
 * Authoritative submission pipeline. Validates identity, executes against hidden tests,
 * and persists results in public.submissions & public.submission_results.
 */
app.post('/api/submissions/submit', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userToken = (req as any).userToken;

  try {
    const { sourceCode, language, problemId, problemSlug, contestId, idempotencyKey } = req.body;

    // Basic request validation
    if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.trim().length === 0) {
      return res.status(400).json({ error: 'Source code is required.' });
    }
    if (sourceCode.length > 65536) {
      return res.status(400).json({ error: 'Source code exceeds maximum size limit (64KB).' });
    }
    if (!language) {
      return res.status(400).json({ error: 'Language is required.' });
    }
    if (!problemId && !problemSlug) {
      return res.status(400).json({ error: 'Problem identifier (problemId or problemSlug) is required.' });
    }

    // Check Contest Restrictions if submitting inside a tournament
    if (contestId) {
      const isStaff = user.role === 'coordinator' || user.role === 'admin';
      const contestDetail = getContestDetail(contestId, user.id, isStaff);
      if (!contestDetail) {
        return res.status(404).json({ error: 'CONTEST_NOT_FOUND', message: 'Associated tournament not found.' });
      }
      if (contestDetail.status !== 'live' && !isStaff) {
        return res.status(403).json({ error: 'CONTEST_NOT_ACTIVE', message: 'Tournament is not currently live for submissions.' });
      }
      if (contestDetail.userParticipantStatus === 'disqualified') {
        return res.status(403).json({ error: 'DISQUALIFIED', message: 'You have been disqualified from this tournament.' });
      }
      // Auto-start participation if not active
      startUserParticipation(contestId, user);
    }

    // Check Idempotency
    const idempKey = idempotencyKey || `${user.id}:${contestId || 'main'}:${problemId || problemSlug}:${language}:${sourceCode.slice(0, 50)}`;
    const cached = idempotencyStore.get(idempKey);
    if (cached) {
      return res.json(cached.result);
    }

    const supabase = getServerSupabase(userToken);

    // 1. Verify problem exists and is published
    let problem: any = null;
    try {
      let problemQuery = supabase.from('problems').select('id, title, slug, status, examples');
      if (problemId) {
        problemQuery = problemQuery.eq('id', problemId);
      } else {
        problemQuery = problemQuery.eq('slug', problemSlug);
      }
      const { data, error } = await problemQuery.maybeSingle();
      if (!error && data) {
        problem = data;
      }
    } catch {
      // Remote DB query failed; check fallback below
    }

    if (!problem) {
      const matchKey = problemSlug || Object.keys(FALLBACK_PROBLEMS).find((k) => FALLBACK_PROBLEMS[k].id === problemId);
      if (matchKey && FALLBACK_PROBLEMS[matchKey]) {
        problem = FALLBACK_PROBLEMS[matchKey];
      }
    }

    if (!problem) {
      return res.status(404).json({ error: 'PROBLEM_NOT_FOUND', message: 'The requested problem does not exist.' });
    }

    if (problem.status !== 'published' && user.role !== 'admin' && user.role !== 'coordinator') {
      return res.status(403).json({ error: 'PROBLEM_NOT_ACCESSIBLE', message: 'This problem is not published.' });
    }

    const actualProblemId = problem.id;

    // 2. Fetch test cases (both sample and hidden) using server-side query
    let testCasesToRun: MultiTestExecutionItem[] = [];
    try {
      const { data: dbTestCases } = await supabase
        .from('test_cases')
        .select('*')
        .eq('problem_id', actualProblemId);

      if (dbTestCases && dbTestCases.length > 0) {
        testCasesToRun = dbTestCases.map((tc: any) => {
          let stdin = '';
          let expectedOutput = '';
          if (tc.metadata) {
            stdin = tc.metadata.input_data || tc.metadata.input_preview || '';
            expectedOutput = tc.metadata.expected_output || tc.metadata.expected_output_preview || '';
          }
          if (!stdin && tc.storage_path && tc.storage_path.startsWith('inline://')) {
            try {
              stdin = decodeURIComponent(tc.storage_path.replace('inline://', ''));
            } catch {
              stdin = '';
            }
          }
          return {
            id: tc.id,
            stdin,
            expectedOutput,
            visibility: tc.visibility,
            timeoutMs: tc.metadata?.timeout_ms,
            memoryLimitKb: tc.metadata?.memory_limit_kb,
          };
        });
      }
    } catch {
      // Fallback
    }

    // Fallback: If no test_cases records exist yet, use public examples
    if (testCasesToRun.length === 0 && Array.isArray(problem.examples)) {
      testCasesToRun = problem.examples.map((ex: any) => ({
        stdin: ex.input || '',
        expectedOutput: ex.output || '',
        visibility: 'sample' as const,
      }));
    }

    if (testCasesToRun.length === 0) {
      testCasesToRun = [{ stdin: '', expectedOutput: '', visibility: 'sample' }];
    }

    // 3. Create initial submission record with status = 'pending'
    const submissionPayload = {
      problem_id: actualProblemId,
      user_id: user.id,
      language,
      source_ref: `inline://${Buffer.from(sourceCode.slice(0, 100)).toString('base64')}`,
      status: 'pending',
      score: 0,
      execution_time: null,
      memory: null,
    };

    let submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const { data: insertedSub } = await supabase
        .from('submissions')
        .insert(submissionPayload)
        .select('id')
        .single();

      if (insertedSub?.id) {
        submissionId = insertedSub.id;
      }
    } catch {
      // Non-blocking in fallback local mode
    }

    // 4. Dispatch to Judge0 and evaluate all test cases
    const summary = await evaluateProblemSubmission(
      sourceCode,
      language as SupportedWorkspaceLanguage,
      testCasesToRun
    );

    // 5. Update submission record with verified result
    try {
      await supabase
        .from('submissions')
        .update({
          status: 'evaluated',
          score: summary.score,
          execution_time: summary.maxTimeMs,
          memory: summary.maxMemoryKb,
        })
        .eq('id', submissionId);

      // Insert submission_results
      await supabase.from('submission_results').upsert({
        submission_id: submissionId,
        test_count: summary.testCount,
        passed_count: summary.passedCount,
        verdict: summary.verdict,
        judge_metadata: summary.judgeMetadata,
      });
    } catch {
      // Non-blocking in fallback local mode
    }

    // 5.5 If contest submission, record in contest score engine
    if (contestId) {
      const displayName =
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Contender';

      recordContestSubmissionScore({
        contestId,
        userId: user.id,
        userDisplayName: displayName,
        collegeId: user.user_metadata?.college_id,
        problemId: actualProblemId,
        score: summary.score,
        verdict: summary.verdict,
      });
    }

    // 6. Format verified result response (NEVER exposes hidden test inputs/outputs!)
    const responsePayload = {
      submissionId,
      problemId: actualProblemId,
      contestId: contestId || null,
      verdict: summary.verdict,
      score: summary.score,
      testCount: summary.testCount,
      passedCount: summary.passedCount,
      maxTimeMs: summary.maxTimeMs,
      maxMemoryKb: summary.maxMemoryKb,
      sampleResults: summary.sampleResults, // Only contains sample test results
      submittedAt: new Date().toISOString(),
    };

    // Cache idempotency response
    idempotencyStore.set(idempKey, { result: responsePayload, timestamp: Date.now() });

    return res.json(responsePayload);
  } catch (err: unknown) {
    console.error('[API /submit Error]:', err);
    return res.status(500).json({
      error: 'SUBMISSION_FAILED',
      message: (err as Error).message || 'Failed to process submission.',
    });
  }
});

/**
 * GET /api/submissions/:id/result
 * Polls or retrieves verified submission status.
 */
app.get('/api/submissions/:id/result', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userToken = (req as any).userToken;
  const submissionId = req.params.id;

  try {
    const supabase = getServerSupabase(userToken);
    const { data: sub, error } = await supabase
      .from('submissions')
      .select('id, user_id, problem_id, language, status, score, execution_time, memory, created_at')
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !sub) {
      return res.status(404).json({ error: 'SUBMISSION_NOT_FOUND' });
    }

    // Ensure student cannot view other students' submissions
    if (sub.user_id !== user.id) {
      return res.status(403).json({ error: 'UNAUTHORIZED' });
    }

    const { data: result } = await supabase
      .from('submission_results')
      .select('test_count, passed_count, verdict, judge_metadata')
      .eq('submission_id', submissionId)
      .maybeSingle();

    return res.json({
      ...sub,
      result: result || null,
    });
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/submissions/history?problemId=...
 * Retrieves current user's past submissions for the current problem.
 */
app.get('/api/submissions/history', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userToken = (req as any).userToken;
  const problemId = req.query.problemId as string;

  if (!problemId) {
    return res.status(400).json({ error: 'problemId is required' });
  }

  try {
    const supabase = getServerSupabase(userToken);
    const { data, error } = await supabase
      .from('submissions')
      .select('id, language, status, score, execution_time, memory, created_at')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return res.json({ data: [] });
    }

    return res.json({ data: data || [] });
  } catch {
    return res.json({ data: [] });
  }
});

// ============================================================================
// API ROUTES: /api/contests/* (Phase 6 Contest Engine)
// ============================================================================

/**
 * GET /api/contests?filter=...
 * Lists all tournaments with computed statuses and registration state.
 */
app.get('/api/contests', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string | undefined;
    const user = (req as any).user;
    const contests = getContestsList(filter, user?.id);
    return res.json({ contests });
  } catch (err: unknown) {
    console.error('[API /api/contests Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/contests/:id
 * Retrieves full contest details, schedule, rules, and problem catalog.
 */
app.get('/api/contests/:id', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const user = (req as any).user;
    const isStaff = user?.role === 'coordinator' || user?.role === 'admin';
    const contest = getContestDetail(contestId, user?.id, isStaff);

    if (!contest) {
      return res.status(404).json({ error: 'CONTEST_NOT_FOUND', message: 'Tournament not found.' });
    }

    return res.json({ contest });
  } catch (err: unknown) {
    console.error('[API /api/contests/:id Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/contests/:id/register
 * Self-registration for student contender before registration deadline.
 */
app.post('/api/contests/:id/register', authenticateUser, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const user = (req as any).user;
    const result = registerUserForContest(contestId, user);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    console.error('[API /api/contests/:id/register Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/contests/:id/start
 * Marks contender active upon entering live arena workspace.
 */
app.post('/api/contests/:id/start', authenticateUser, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const user = (req as any).user;
    const result = startUserParticipation(contestId, user);
    return res.json(result);
  } catch (err: unknown) {
    console.error('[API /api/contests/:id/start Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/contests/:id/violations
 * Logs proctoring events (tab blur, copy-paste) and enforces disqualification threshold.
 */
app.post('/api/contests/:id/violations', authenticateUser, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const user = (req as any).user;
    const { type, evidence } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Violation type is required.' });
    }

    const result = recordContestViolation(contestId, user, type, evidence || {});
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    console.error('[API /api/contests/:id/violations Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/contests/:id/leaderboard
 * Computes authoritative ICPC-style live tournament standings.
 */
app.get('/api/contests/:id/leaderboard', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const leaderboard = getContestLeaderboard(contestId);
    return res.json({ leaderboard });
  } catch (err: unknown) {
    console.error('[API /api/contests/:id/leaderboard Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/contests
 * Creates a new tournament (Admin ONLY per authorization matrix).
 */
app.post('/api/contests', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contest = createContest(req.body, user.id);
    return res.status(201).json({ contest });
  } catch (err: unknown) {
    console.error('[API POST /api/contests Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * PUT /api/contests/:id
 * Updates tournament schedule, problems, or configuration (Admin ONLY).
 */
app.put('/api/contests/:id', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const updated = updateContest(contestId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'CONTEST_NOT_FOUND', message: 'Tournament not found.' });
    }
    return res.json({ contest: updated });
  } catch (err: unknown) {
    console.error('[API PUT /api/contests/:id Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/contests/:id/admin-stats
 * Proctoring monitor logs and participant strikes for staff oversight (Admin ONLY).
 */
app.get('/api/contests/:id/admin-stats', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  try {
    const contestId = req.params.id;
    const stats = getStaffProctoringStats(contestId);
    return res.json(stats);
  } catch (err: unknown) {
    console.error('[API GET /api/contests/:id/admin-stats Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/contests/:id/participants/:userId/status
 * Staff action to disqualify, reinstate, or reset warnings for a contender (Admin ONLY).
 */
app.post('/api/contests/:id/participants/:userId/status', authenticateUser, requireAdmin, (req: Request, res: Response) => {
  try {
    const { id: contestId, userId } = req.params;
    const { action } = req.body;
    if (!action || !['disqualify', 'reinstate', 'reset_warnings'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (disqualify, reinstate, reset_warnings) is required.' });
    }

    const success = updateParticipantStatus(contestId, userId, action as any);
    if (!success) {
      return res.status(404).json({ error: 'PARTICIPANT_NOT_FOUND', message: 'Contender not found in this tournament.' });
    }

    return res.json({ success: true, message: `Successfully executed ${action}.` });
  } catch (err: unknown) {
    console.error('[API /api/contests/:id/participants/:userId/status Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ============================================================================
// API ROUTES: /api/admin/* (Role Provisioning & Administrative Controls)
// ============================================================================

/**
 * GET /api/profile
 * Returns the authenticated user's authoritative profile and role.
 * Resilient fallback if remote Supabase profiles table is still awaiting migration.
 */
app.get('/api/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    return res.json({
      id: user.id,
      email: user.email,
      role: user.role || 'student',
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      collegeId: user.user_metadata?.college_id || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      createdAt: user.created_at || new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[API GET /api/profile Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/admin/users
 * Lists user profiles and roles for role provisioning (Admin ONLY).
 */
app.get('/api/admin/users', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, college_id, created_at')
      .order('created_at', { ascending: false });

    if (!error && users && users.length > 0) {
      return res.json({ users });
    }

    // Resilient fallback if profiles table has not yet been populated or migrated
    const fallbackList = getAllAssignedRoles().map((entry) => ({
      id: entry.userId,
      display_name: entry.email ? entry.email.split('@')[0] : 'Platform Administrator',
      email: entry.email || 'admin@nexuscode.edu',
      role: entry.role,
      college_id: null,
      created_at: entry.bootstrappedAt || new Date().toISOString(),
    }));

    return res.json({ users: fallbackList });
  } catch (err: unknown) {
    console.error('[API GET /api/admin/users Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/admin/bootstrap/status
 * Reports whether First Admin Bootstrap is currently available (Zero Admins exist).
 * Source of truth is the server database, not client state.
 */
app.get('/api/admin/bootstrap/status', async (req: Request, res: Response) => {
  try {
    const supabase = getServerSupabase();
    const status = await getBootstrapStatus(supabase);
    const adminRecord = getBootstrappedAdminRecord();
    return res.json({
      ...status,
      adminUserId: adminRecord?.adminUserId || null,
      adminEmail: adminRecord?.adminEmail || null,
    });
  } catch (err: unknown) {
    console.error('[API GET /api/admin/bootstrap/status Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/admin/bootstrap
 * Secure One-Time First Admin Bootstrap.
 *
 * Requirements:
 * - Requires authenticated Supabase session.
 * - Only permitted when ZERO active administrators exist.
 * - Uses the authenticated user's identity as the target (client-supplied user ID is ignored).
 * - Atomically promotes user to 'admin' and seals bootstrap permanently.
 */
app.post('/api/admin/bootstrap', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userToken = (req as any).userToken;
    const supabase = getServerSupabase(userToken);

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string;

    const result = await executeFirstAdminBootstrap(
      {
        userId: user.id,
        userEmail: user.email,
        ipAddress,
        userAgent,
      },
      supabase
    );

    if (!result.success) {
      const statusCode = result.error === 'BOOTSTRAP_ALREADY_COMPLETED' ? 409 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    console.error('[API POST /api/admin/bootstrap Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/admin/roles
 * Administrative role provisioning (Admin ONLY).
 * Strictly updates target user's role to 'student' | 'coordinator' | 'admin'.
 */
app.post('/api/admin/roles', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { targetUserId, newRole } = req.body;
    if (!targetUserId || !newRole || !['student', 'coordinator', 'admin'].includes(newRole)) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Valid targetUserId and newRole (student, coordinator, admin) are required.',
      });
    }

    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);

    // Call stored procedure or direct update (guarded by RLS / trigger)
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select('id, display_name, email, role')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true, user: data });
  } catch (err: unknown) {
    console.error('[API POST /api/admin/roles Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/admin/club-members
 * Lists all club members with activation status and assigned roles (Admin ONLY).
 * Activation token hashes are never exposed.
 */
app.get('/api/admin/club-members', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);
    const members = await listClubMembers(supabase);
    return res.json({ members });
  } catch (err: unknown) {
    console.error('[API GET /api/admin/club-members Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/admin/club-members
 * Provisions a new staff member with unique member_id and cryptographic one-time token (Admin ONLY).
 * Raw token is returned ONLY in this response and is NEVER stored in the database.
 */
app.post('/api/admin/club-members', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { memberId, fullName, email, assignedRole } = req.body;
    if (!memberId || !assignedRole) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Member ID and assigned role (coordinator or admin) are required.',
      });
    }

    const admin = (req as any).user;
    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);

    const result = await provisionStaffMember(
      { memberId, fullName, email, assignedRole },
      admin.id,
      supabase
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to provision staff member.' });
    }

    return res.status(201).json(result);
  } catch (err: unknown) {
    console.error('[API POST /api/admin/club-members Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/admin/club-members/:id/status
 * Disables or enables staff access (Admin ONLY).
 */
app.post('/api/admin/club-members/:id/status', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (ACTIVE or DISABLED) is required.' });
    }

    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);
    const updated = await updateStaffMemberStatus(id, status, supabase);

    if (!updated) {
      return res.status(404).json({ error: 'Staff member record not found.' });
    }

    return res.json({ success: true, message: `Staff status updated to ${status}.` });
  } catch (err: unknown) {
    console.error('[API /api/admin/club-members/:id/status Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/admin/club-members/:id/regenerate-token
 * Generates a fresh one-time activation token for pending invitations (Admin ONLY).
 */
app.post('/api/admin/club-members/:id/regenerate-token', authenticateUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminToken = (req as any).userToken;
    const supabase = getServerSupabase(adminToken);

    const result = await regenerateStaffToken(id, supabase);
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to regenerate token.' });
    }

    return res.json(result);
  } catch (err: unknown) {
    console.error('[API /api/admin/club-members/:id/regenerate-token Error]:', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ============================================================================
// API ROUTES: /api/auth/staff-activate/* (Staff Onboarding Pipeline)
// ============================================================================

/**
 * POST /api/auth/staff-activate/verify
 * Validates member ID and one-time activation token credentials without claiming yet.
 */
app.post('/api/auth/staff-activate/verify', async (req: Request, res: Response) => {
  try {
    const { memberId, token } = req.body;
    if (!memberId || !token) {
      return res.status(400).json({ valid: false, error: 'Member ID and activation token are required.' });
    }

    const supabase = getServerSupabase();
    const result = await verifyActivationCredentials(memberId, token, supabase);

    if (!result.valid) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: unknown) {
    console.error('[API /api/auth/staff-activate/verify Error]:', err);
    return res.status(500).json({ valid: false, error: (err as Error).message });
  }
});

/**
 * POST /api/auth/staff-activate/claim
 * Finalizes staff onboarding:
 * 1. Verifies token hash against database.
 * 2. Authenticates or creates Supabase Auth user.
 * 3. Assigns authoritative role to public.profiles.
 * 4. Marks club_member record ACTIVE, links user_id, sets claimed_at.
 * 5. Permanently invalidates the token_hash so it can never be reused.
 */
app.post('/api/auth/staff-activate/claim', optionalAuthenticateUser, async (req: Request, res: Response) => {
  try {
    const { memberId, token, email, password, displayName, collegeId } = req.body;
    const existingUser = (req as any).user;

    if (!memberId || !token) {
      return res.status(400).json({ success: false, error: 'Member ID and activation token are required.' });
    }

    const supabase = getServerSupabase();

    // 1. Verify token first
    const verification = await verifyActivationCredentials(memberId, token, supabase);
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    let targetUserId = existingUser?.id;
    let targetEmail = existingUser?.email || email;

    // 2. If user not logged in, register or authenticate with Supabase Auth
    if (!targetUserId) {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required to create your staff account.',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      // Attempt sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName?.trim() || verification.member?.fullName || undefined,
            college_id: collegeId?.trim() || undefined,
          },
        },
      });

      if (authError) {
        // If user already exists, try signing in to verify identity
        if (authError.message.includes('already registered')) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr) {
            return res.status(400).json({
              success: false,
              error: 'An account with this email exists. Please provide the correct existing password to link.',
            });
          }
          targetUserId = signInData.user.id;
          targetEmail = signInData.user.email;
        } else if (!process.env.VITE_SUPABASE_URL || authError.message.toLowerCase().includes('invalid') || authError.message.toLowerCase().includes('rate limit')) {
          console.warn('[Staff Activation Warning]: Supabase remote auth rate-limited or unconfigured, using resilient user identity.');
          targetUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        } else {
          return res.status(400).json({ success: false, error: authError.message });
        }
      } else if (authData.user) {
        targetUserId = authData.user.id;
        targetEmail = authData.user.email;
      }
    }

    if (!targetUserId) {
      // Local fallback ID for mock/dev session
      targetUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 3. Atomically claim activation and assign role
    const claimResult = await claimStaffActivation(
      memberId,
      token,
      targetUserId,
      targetEmail,
      supabase
    );

    if (!claimResult.success) {
      return res.status(400).json(claimResult);
    }

    return res.json({
      success: true,
      message: `Staff account successfully activated! Assigned role: ${claimResult.role?.toUpperCase()}.`,
      role: claimResult.role,
      userId: targetUserId,
    });
  } catch (err: unknown) {
    console.error('[API /api/auth/staff-activate/claim Error]:', err);
    return res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ============================================================================
// VITE DEV SERVER / STATIC PRODUCTION SERVING
// ============================================================================

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let html = await fs.promises.readFile(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Code Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Nexus Code Server Failed]:', err);
  process.exit(1);
});
