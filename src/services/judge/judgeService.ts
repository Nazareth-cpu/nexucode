/**
 * Server-Side Judge Execution Service (Phase 5)
 *
 * Dispatches untrusted source code to the isolated Judge0 execution environment,
 * enforces resource limits, normalizes raw verdicts, and sanitizes outputs.
 */

import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';
import type { SubmissionVerdict } from '@/src/types/database';
import {
  JUDGE0_LANGUAGE_MAPPINGS,
  getJudge0Url,
  getJudge0ApiKey,
} from './judgeConfig';

export interface SingleJudgeExecutionRequest {
  sourceCode: string;
  language: SupportedWorkspaceLanguage;
  stdin?: string;
  expectedOutput?: string;
  cpuTimeLimitSec?: number; // default: 2.0s
  memoryLimitKb?: number;   // default: 256MB = 262144KB
}

export interface SingleJudgeExecutionResponse {
  verdict: SubmissionVerdict;
  verdictLabel: string;
  isAccepted: boolean;
  timeMs: number;
  memoryKb: number;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  rawStatusId: number;
  token?: string;
}

export interface MultiTestExecutionItem {
  id?: string;
  stdin: string;
  expectedOutput: string;
  visibility: 'sample' | 'hidden';
  timeoutMs?: number;
  memoryLimitKb?: number;
}

export interface MultiTestExecutionSummary {
  verdict: SubmissionVerdict;
  score: number;
  testCount: number;
  passedCount: number;
  maxTimeMs: number;
  maxMemoryKb: number;
  sampleResults: Array<{
    testIndex: number;
    stdin: string;
    expectedOutput: string;
    actualOutput: string | null;
    isPassed: boolean;
    verdict: SubmissionVerdict;
    timeMs: number;
    memoryKb: number;
    stderr: string | null;
    compileOutput: string | null;
  }>;
  judgeMetadata: Record<string, unknown>;
}

function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(b64: string | null | undefined): string | null {
  if (!b64) return null;
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf-8');
    }
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return b64;
  }
}

/**
 * Maps Judge0 integer status ID to Nexus Code SubmissionVerdict
 */
export function normalizeJudge0StatusId(statusId: number): SubmissionVerdict {
  switch (statusId) {
    case 3:
      return 'accepted';
    case 4:
      return 'wrong_answer';
    case 5:
      return 'time_limit_exceeded';
    case 6:
      return 'compilation_error';
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return 'runtime_error';
    case 13:
    case 14:
    default:
      return 'internal_error';
  }
}

/**
 * Executes a single test case through the configured Judge0 instance.
 */
export async function executeOnJudge0(
  req: SingleJudgeExecutionRequest
): Promise<SingleJudgeExecutionResponse> {
  const langConfig = JUDGE0_LANGUAGE_MAPPINGS[req.language];
  if (!langConfig) {
    throw new Error(`Unsupported programming language: ${req.language}`);
  }

  const judgeUrl = getJudge0Url();
  const apiKey = getJudge0ApiKey();

  // Resource limits
  const timeLimit = req.cpuTimeLimitSec || 2.0;
  const memLimit = req.memoryLimitKb || 262144; // 256 MB

  const payload: Record<string, unknown> = {
    source_code: base64Encode(req.sourceCode),
    language_id: langConfig.judge0Id,
    cpu_time_limit: timeLimit,
    memory_limit: memLimit,
  };

  if (req.stdin !== undefined) {
    payload.stdin = base64Encode(req.stdin);
  }
  if (req.expectedOutput !== undefined) {
    payload.expected_output = base64Encode(req.expectedOutput);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    // If using RapidAPI
    if (judgeUrl.includes('rapidapi.com')) {
      headers['X-RapidAPI-Key'] = apiKey;
      headers['X-RapidAPI-Host'] = new URL(judgeUrl).hostname;
    } else {
      // Direct Judge0 self-hosted token
      headers['X-Auth-Token'] = apiKey;
    }
  }

  const endpoint = `${judgeUrl}/submissions?base64_encoded=true&wait=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s network timeout

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Judge0 API returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const rawStatus = data.status || { id: 13, description: 'Internal Error' };
    const verdict = normalizeJudge0StatusId(rawStatus.id);

    const stdout = base64Decode(data.stdout);
    const stderr = base64Decode(data.stderr);
    const compileOutput = base64Decode(data.compile_output);

    const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
    const memoryKb = data.memory ? Math.round(data.memory) : 0;

    return {
      verdict,
      verdictLabel: rawStatus.description || verdict,
      isAccepted: rawStatus.id === 3,
      timeMs,
      memoryKb,
      stdout,
      stderr,
      compileOutput,
      rawStatusId: rawStatus.id,
      token: data.token,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      return {
        verdict: 'time_limit_exceeded',
        verdictLabel: 'Network / Execution Timeout',
        isAccepted: false,
        timeMs: Math.round(timeLimit * 1000),
        memoryKb: 0,
        stdout: null,
        stderr: 'Execution timed out waiting for the judge response.',
        compileOutput: null,
        rawStatusId: 5,
      };
    }
    throw err;
  }
}

/**
 * Evaluates multiple test cases (both sample and hidden),
 * aggregates metrics, and returns sanitized results.
 */
export async function evaluateProblemSubmission(
  sourceCode: string,
  language: SupportedWorkspaceLanguage,
  testCases: MultiTestExecutionItem[]
): Promise<MultiTestExecutionSummary> {
  if (testCases.length === 0) {
    // If no test cases defined, run against empty stdin
    testCases = [
      {
        stdin: '',
        expectedOutput: '',
        visibility: 'sample',
      },
    ];
  }

  let totalTests = testCases.length;
  let passedCount = 0;
  let overallVerdict: SubmissionVerdict = 'accepted';
  let maxTimeMs = 0;
  let maxMemoryKb = 0;

  const sampleResults: MultiTestExecutionSummary['sampleResults'] = [];
  const testExecutionOutcomes: Array<{
    index: number;
    visibility: 'sample' | 'hidden';
    verdict: SubmissionVerdict;
    timeMs: number;
    memoryKb: number;
  }> = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = await executeOnJudge0({
      sourceCode,
      language,
      stdin: tc.stdin,
      expectedOutput: tc.expectedOutput || undefined,
      cpuTimeLimitSec: tc.timeoutMs ? tc.timeoutMs / 1000 : 2.0,
      memoryLimitKb: tc.memoryLimitKb || 262144,
    });

    maxTimeMs = Math.max(maxTimeMs, execRes.timeMs);
    maxMemoryKb = Math.max(maxMemoryKb, execRes.memoryKb);

    // Check pass condition
    let passed = execRes.isAccepted;
    // Fallback: If Judge0 didn't compare expectedOutput directly, compare trimmed stdout with expected
    if (execRes.rawStatusId === 3 && tc.expectedOutput) {
      const cleanStdout = (execRes.stdout || '').trim().replace(/\r\n/g, '\n');
      const cleanExpected = tc.expectedOutput.trim().replace(/\r\n/g, '\n');
      if (cleanStdout !== cleanExpected) {
        passed = false;
        execRes.verdict = 'wrong_answer';
        execRes.verdictLabel = 'Wrong Answer';
      }
    }

    if (passed) {
      passedCount++;
    } else if (overallVerdict === 'accepted') {
      // First failing test dictates overall verdict
      overallVerdict = execRes.verdict;
    }

    testExecutionOutcomes.push({
      index: i + 1,
      visibility: tc.visibility,
      verdict: execRes.verdict,
      timeMs: execRes.timeMs,
      memoryKb: execRes.memoryKb,
    });

    // Only expose sample test case details to the student!
    if (tc.visibility === 'sample') {
      sampleResults.push({
        testIndex: i + 1,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        actualOutput: execRes.stdout,
        isPassed: passed,
        verdict: execRes.verdict,
        timeMs: execRes.timeMs,
        memoryKb: execRes.memoryKb,
        stderr: execRes.stderr,
        compileOutput: execRes.compileOutput,
      });
    }

    // Short-circuit on compilation error
    if (execRes.verdict === 'compilation_error') {
      break;
    }
  }

  const score = totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0;

  return {
    verdict: overallVerdict,
    score,
    testCount: totalTests,
    passedCount,
    maxTimeMs,
    maxMemoryKb,
    sampleResults,
    judgeMetadata: {
      provider: 'Judge0 CE',
      evaluated_at: new Date().toISOString(),
      tests_summary: testExecutionOutcomes,
    },
  };
}
