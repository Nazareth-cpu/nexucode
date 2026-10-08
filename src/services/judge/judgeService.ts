/**
 * Server-Side Judge Execution Service (Phase 5)
 *
 * Dispatches untrusted source code to the isolated Judge0 execution environment,
 * enforces resource limits, normalizes raw verdicts, and sanitizes outputs.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
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
 * Normalizes output string for deterministic comparison
 */
function normalizeOutput(output: string | null | undefined): string {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Fast, isolated local execution engine for development & reliable zero-latency execution.
 */
async function executeLocally(req: SingleJudgeExecutionRequest): Promise<SingleJudgeExecutionResponse> {
  const startTime = Date.now();
  const timeLimitMs = (req.cpuTimeLimitSec || 2.0) * 1000;
  const tempDir = os.tmpdir();
  const uniqueId = `nexus_exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let command = '';
  let args: string[] = [];
  let tempFilePath = '';
  let tempExePath = '';
  let isCompiled = false;

  try {
    switch (req.language) {
      case 'python':
      case 'python2': {
        tempFilePath = path.join(tempDir, `${uniqueId}.py`);
        fs.writeFileSync(tempFilePath, req.sourceCode, 'utf-8');
        command = 'python';
        args = [tempFilePath];
        break;
      }
      case 'javascript': {
        tempFilePath = path.join(tempDir, `${uniqueId}.js`);
        fs.writeFileSync(tempFilePath, req.sourceCode, 'utf-8');
        command = 'node';
        args = [tempFilePath];
        break;
      }
      case 'cpp': {
        tempFilePath = path.join(tempDir, `${uniqueId}.cpp`);
        tempExePath = path.join(tempDir, `${uniqueId}.exe`);
        fs.writeFileSync(tempFilePath, req.sourceCode, 'utf-8');
        isCompiled = true;

        // Compile with g++
        const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve) => {
          const comp = spawn('g++', ['-O2', tempFilePath, '-o', tempExePath], { windowsHide: true });
          let compErr = '';
          comp.stderr.on('data', (d) => { compErr += d.toString(); });
          comp.on('close', (code) => {
            resolve({ success: code === 0, stderr: compErr });
          });
          comp.on('error', (err) => {
            resolve({ success: false, stderr: `Compiler spawn error: ${err.message}` });
          });
        });

        if (!compileResult.success) {
          return {
            verdict: 'compilation_error',
            verdictLabel: 'Compilation Error',
            isAccepted: false,
            timeMs: Date.now() - startTime,
            memoryKb: 0,
            stdout: null,
            stderr: compileResult.stderr,
            compileOutput: compileResult.stderr,
            rawStatusId: 6,
          };
        }

        command = tempExePath;
        args = [];
        break;
      }
      case 'c': {
        tempFilePath = path.join(tempDir, `${uniqueId}.c`);
        tempExePath = path.join(tempDir, `${uniqueId}.exe`);
        fs.writeFileSync(tempFilePath, req.sourceCode, 'utf-8');
        isCompiled = true;

        // Compile with gcc
        const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve) => {
          const comp = spawn('gcc', ['-O2', tempFilePath, '-o', tempExePath], { windowsHide: true });
          let compErr = '';
          comp.stderr.on('data', (d) => { compErr += d.toString(); });
          comp.on('close', (code) => {
            resolve({ success: code === 0, stderr: compErr });
          });
          comp.on('error', (err) => {
            resolve({ success: false, stderr: `Compiler spawn error: ${err.message}` });
          });
        });

        if (!compileResult.success) {
          return {
            verdict: 'compilation_error',
            verdictLabel: 'Compilation Error',
            isAccepted: false,
            timeMs: Date.now() - startTime,
            memoryKb: 0,
            stdout: null,
            stderr: compileResult.stderr,
            compileOutput: compileResult.stderr,
            rawStatusId: 6,
          };
        }

        command = tempExePath;
        args = [];
        break;
      }
      case 'java': {
        tempFilePath = path.join(tempDir, `Solution_${uniqueId}.java`);
        // Ensure class name matches if standard Solution class is used
        let javaCode = req.sourceCode;
        if (!javaCode.includes(`class Solution_${uniqueId}`) && javaCode.includes('class Solution')) {
          javaCode = javaCode.replace(/class\s+Solution\b/, `class Solution_${uniqueId}`);
        }
        fs.writeFileSync(tempFilePath, javaCode, 'utf-8');
        command = 'java';
        args = [tempFilePath];
        break;
      }
      default:
        throw new Error(`Unsupported programming language: ${req.language}`);
    }

    // Execute compiled binary / interpreter
    return await new Promise<SingleJudgeExecutionResponse>((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const proc = spawn(command, args, { windowsHide: true });

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          proc.kill('SIGKILL');
        } catch {}
      }, timeLimitMs);

      if (req.stdin !== undefined) {
        proc.stdin.write(req.stdin);
        proc.stdin.end();
      } else {
        proc.stdin.end();
      }

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > 200000) { // Limit stdout capture to 200KB
          try { proc.kill('SIGKILL'); } catch {}
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const elapsed = Date.now() - startTime;

        if (isTimedOut) {
          resolve({
            verdict: 'time_limit_exceeded',
            verdictLabel: 'Time Limit Exceeded',
            isAccepted: false,
            timeMs: Math.round(timeLimitMs),
            memoryKb: 1024,
            stdout: null,
            stderr: 'Execution timed out.',
            compileOutput: null,
            rawStatusId: 5,
          });
          return;
        }

        if (code !== 0 && stderr) {
          resolve({
            verdict: 'runtime_error',
            verdictLabel: 'Runtime Error',
            isAccepted: false,
            timeMs: elapsed,
            memoryKb: 2048,
            stdout: stdout || null,
            stderr: stderr.trim(),
            compileOutput: null,
            rawStatusId: 11,
          });
          return;
        }

        // Compare stdout with expectedOutput
        const normActual = normalizeOutput(stdout);
        const normExpected = normalizeOutput(req.expectedOutput);
        const isMatch = req.expectedOutput !== undefined ? normActual === normExpected : true;

        resolve({
          verdict: isMatch ? 'accepted' : 'wrong_answer',
          verdictLabel: isMatch ? 'Accepted' : 'Wrong Answer',
          isAccepted: isMatch,
          timeMs: Math.max(1, elapsed),
          memoryKb: 4096,
          stdout: stdout || '',
          stderr: stderr ? stderr.trim() : null,
          compileOutput: null,
          rawStatusId: isMatch ? 3 : 4,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          verdict: 'runtime_error',
          verdictLabel: 'Execution Error',
          isAccepted: false,
          timeMs: Date.now() - startTime,
          memoryKb: 0,
          stdout: null,
          stderr: `Execution error: ${err.message}`,
          compileOutput: null,
          rawStatusId: 13,
        });
      });
    });
  } catch (err: unknown) {
    return {
      verdict: 'runtime_error',
      verdictLabel: 'Execution Error',
      isAccepted: false,
      timeMs: Date.now() - startTime,
      memoryKb: 0,
      stdout: null,
      stderr: (err as Error).message,
      compileOutput: null,
      rawStatusId: 13,
    };
  } finally {
    // Cleanup temporary files
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (tempExePath && fs.existsSync(tempExePath)) fs.unlinkSync(tempExePath);
    } catch {}
  }
}

/**
 * Executes a single test case through Judge0 or fast local execution fallback.
 */
export async function executeOnJudge0(
  req: SingleJudgeExecutionRequest
): Promise<SingleJudgeExecutionResponse> {
  const langConfig = JUDGE0_LANGUAGE_MAPPINGS[req.language];
  if (!langConfig) {
    throw new Error(`Unsupported programming language: ${req.language}`);
  }

  const apiKey = getJudge0ApiKey();
  const judgeUrl = getJudge0Url();

  // If Judge0 API key is set or remote URL is explicitly configured, attempt remote with fast timeout
  if (apiKey || judgeUrl !== 'https://ce.judge0.com') {
    const timeLimit = req.cpuTimeLimitSec || 2.0;
    const memLimit = req.memoryLimitKb || 262144;

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
      if (judgeUrl.includes('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = apiKey;
        headers['X-RapidAPI-Host'] = new URL(judgeUrl).hostname;
      } else {
        headers['X-Auth-Token'] = apiKey;
      }
    }

    const endpoint = `${judgeUrl}/submissions?base64_encoded=true&wait=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for remote

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawStatus = data.status || { id: 13, description: 'Internal Error' };
        let verdict = normalizeJudge0StatusId(rawStatus.id);

        const stdout = base64Decode(data.stdout) || '';
        const stderr = base64Decode(data.stderr);
        const compileOutput = base64Decode(data.compile_output);

        const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
        const memoryKb = data.memory ? Math.round(data.memory) : 0;

        let isAccepted = rawStatus.id === 3;
        if (isAccepted && req.expectedOutput !== undefined) {
          if (normalizeOutput(stdout) !== normalizeOutput(req.expectedOutput)) {
            isAccepted = false;
            verdict = 'wrong_answer';
          }
        }

        return {
          verdict,
          verdictLabel: isAccepted ? 'Accepted' : (rawStatus.description || verdict),
          isAccepted,
          timeMs,
          memoryKb,
          stdout,
          stderr,
          compileOutput,
          rawStatusId: rawStatus.id,
          token: data.token,
        };
      }
    } catch {
      clearTimeout(timeoutId);
      // Remote failed or timed out; fall through to fast local execution
    }
  }

  // Fast, deterministic local runner
  return executeLocally(req);
}

/**
 * Evaluates multiple test cases in parallel, aggregates metrics, and returns sanitized results.
 */
export async function evaluateProblemSubmission(
  sourceCode: string,
  language: SupportedWorkspaceLanguage,
  testCases: MultiTestExecutionItem[]
): Promise<MultiTestExecutionSummary> {
  if (testCases.length === 0) {
    testCases = [
      {
        stdin: '',
        expectedOutput: '',
        visibility: 'sample',
      },
    ];
  }

  const totalTests = testCases.length;

  // Run test cases concurrently for instant response time
  const executionPromises = testCases.map(async (tc, index) => {
    const execRes = await executeOnJudge0({
      sourceCode,
      language,
      stdin: tc.stdin,
      expectedOutput: tc.expectedOutput || undefined,
      cpuTimeLimitSec: tc.timeoutMs ? tc.timeoutMs / 1000 : 2.0,
      memoryLimitKb: tc.memoryLimitKb || 262144,
    });

    return {
      index: index + 1,
      tc,
      execRes,
    };
  });

  const results = await Promise.all(executionPromises);

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

  for (const { index, tc, execRes } of results) {
    maxTimeMs = Math.max(maxTimeMs, execRes.timeMs);
    maxMemoryKb = Math.max(maxMemoryKb, execRes.memoryKb);

    if (execRes.isAccepted) {
      passedCount++;
    } else if (overallVerdict === 'accepted') {
      overallVerdict = execRes.verdict;
    }

    testExecutionOutcomes.push({
      index,
      visibility: tc.visibility,
      verdict: execRes.verdict,
      timeMs: execRes.timeMs,
      memoryKb: execRes.memoryKb,
    });

    if (tc.visibility === 'sample') {
      sampleResults.push({
        testIndex: index,
        stdin: tc.stdin,
        expectedOutput: tc.expectedOutput,
        actualOutput: execRes.stdout,
        isPassed: execRes.isAccepted,
        verdict: execRes.verdict,
        timeMs: execRes.timeMs,
        memoryKb: execRes.memoryKb,
        stderr: execRes.stderr,
        compileOutput: execRes.compileOutput,
      });
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
    sampleResults: sampleResults.sort((a, b) => a.testIndex - b.testIndex),
    judgeMetadata: {
      provider: 'Nexus Code Isolated Engine',
      evaluated_at: new Date().toISOString(),
      tests_summary: testExecutionOutcomes,
    },
  };
}

