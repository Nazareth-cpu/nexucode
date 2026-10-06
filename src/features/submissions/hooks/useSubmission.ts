/**
 * Custom hook for managing code execution, testing, submissions, and history (Phase 5)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/src/features/auth';
import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';
import type { ProblemWithRelations } from '@/src/features/problems';
import { submissionService } from '../services/submissionService';
import type {
  ExecutionState,
  RunCodeResponse,
  SubmissionExecutionResult,
  SubmissionHistoryItem,
} from '../types';

interface UseSubmissionOptions {
  problem: ProblemWithRelations;
  contestId?: string;
  eventId?: string;
  onSubmissionSuccess?: (result: SubmissionExecutionResult) => void;
}

export function useSubmission({ problem, contestId, eventId, onSubmissionSuccess }: UseSubmissionOptions) {
  const { session, user } = useAuth();
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmissionExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Console drawer visibility
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // Custom stdin support
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customStdin, setCustomStdin] = useState(
    problem.examples && problem.examples[0] ? problem.examples[0].input || '' : ''
  );

  // Submission History modal / drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SubmissionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!session?.access_token || !problem.id) return;
    setIsLoadingHistory(true);
    const { data } = await submissionService.getHistory(problem.id, session.access_token);
    setHistory(data || []);
    setIsLoadingHistory(false);
  }, [problem.id, session?.access_token]);

  // Load history on mount or when problem changes
  useEffect(() => {
    if (session?.access_token && problem.id) {
      fetchHistory();
    }
  }, [session?.access_token, problem.id, fetchHistory]);

  /**
   * Run Code: Non-authoritative execution against sample test cases or custom input
   */
  const runCode = useCallback(
    async (
      sourceCode: string,
      language: SupportedWorkspaceLanguage,
      options?: { useCustomInput?: boolean }
    ) => {
      if (executionState === 'running' || executionState === 'submitting') return;

      setExecutionState('running');
      setErrorMessage(null);
      setIsConsoleOpen(true);
      setRunResult(null);
      setSubmitResult(null);

      const stdinToUse = options?.useCustomInput ? customStdin : undefined;

      // Extract client sample cases as fast fallback for the server
      const clientSampleCases = Array.isArray(problem.examples)
        ? problem.examples.map((ex) => ({
            stdin: ex.input || '',
            expectedOutput: ex.output || '',
            visibility: 'sample',
          }))
        : undefined;

      const { data, error } = await submissionService.runCode({
        sourceCode,
        language,
        problemSlug: problem.slug,
        customStdin: stdinToUse,
        ...(clientSampleCases ? { sampleCases: clientSampleCases } as any : {}),
      });

      if (error || !data) {
        setExecutionState('error');
        setErrorMessage(error || 'Failed to execute code on judge.');
      } else {
        setExecutionState('completed');
        setRunResult(data);
      }
    },
    [customStdin, executionState, problem.examples, problem.slug]
  );

  /**
   * Submit Code: Authoritative execution against all test cases (sample + hidden)
   */
  const submitCode = useCallback(
    async (sourceCode: string, language: SupportedWorkspaceLanguage) => {
      if (executionState === 'running' || executionState === 'submitting') return;

      if (!session?.access_token) {
        setIsConsoleOpen(true);
        setExecutionState('error');
        setErrorMessage('Authentication required: Please sign in to submit your solution for evaluation.');
        return;
      }

      setExecutionState('submitting');
      setErrorMessage(null);
      setIsConsoleOpen(true);
      setRunResult(null);
      setSubmitResult(null);

      // Unique idempotency key based on user and submission attempt
      const idempotencyKey = `${user?.id || 'anon'}:${problem.id}:${Date.now()}`;

      const { data, error } = await submissionService.submitCode(
        {
          sourceCode,
          language,
          problemId: problem.id,
          problemSlug: problem.slug,
          contestId,
          eventId,
          idempotencyKey,
        },
        session.access_token
      );

      if (error || !data) {
        setExecutionState('error');
        setErrorMessage(error || 'Submission evaluation failed.');
      } else {
        setExecutionState('completed');
        setSubmitResult(data);
        if (onSubmissionSuccess) {
          onSubmissionSuccess(data);
        }
        // Refresh past submissions
        fetchHistory();
      }
    },
    [contestId, executionState, fetchHistory, onSubmissionSuccess, problem.id, problem.slug, session?.access_token, user?.id]
  );

  const resetResults = useCallback(() => {
    setRunResult(null);
    setSubmitResult(null);
    setErrorMessage(null);
    setExecutionState('idle');
  }, []);

  return {
    executionState,
    runResult,
    submitResult,
    errorMessage,
    isConsoleOpen,
    setIsConsoleOpen,
    isCustomInputOpen,
    setIsCustomInputOpen,
    customStdin,
    setCustomStdin,
    history,
    isLoadingHistory,
    isHistoryOpen,
    setIsHistoryOpen,
    runCode,
    submitCode,
    resetResults,
    fetchHistory,
  };
}
