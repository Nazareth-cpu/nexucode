/**
 * Submissions & Judging Feature Types (Phase 5)
 */

import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';
import type { SubmissionVerdict, SubmissionStatus } from '@/src/types/database';

export type ExecutionState = 'idle' | 'running' | 'submitting' | 'completed' | 'error';

export interface SampleTestResult {
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
}

export interface RunCodeRequest {
  sourceCode: string;
  language: SupportedWorkspaceLanguage;
  problemSlug?: string;
  customStdin?: string;
}

export interface RunCodeResponse {
  verdict: SubmissionVerdict;
  score?: number;
  testCount?: number;
  passedCount?: number;
  maxTimeMs: number;
  maxMemoryKb: number;
  sampleResults?: SampleTestResult[];
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
}

export interface SubmitCodeRequest {
  sourceCode: string;
  language: SupportedWorkspaceLanguage;
  problemId?: string;
  problemSlug?: string;
  contestId?: string;
  idempotencyKey?: string;
}

export interface SubmissionExecutionResult {
  submissionId: string;
  problemId: string;
  verdict: SubmissionVerdict;
  score: number;
  testCount: number;
  passedCount: number;
  maxTimeMs: number;
  maxMemoryKb: number;
  sampleResults?: SampleTestResult[];
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  submittedAt: string;
}

export interface SubmissionHistoryItem {
  id: string;
  language: string;
  status: SubmissionStatus;
  score: number;
  execution_time: number | null;
  memory: number | null;
  created_at: string;
}
