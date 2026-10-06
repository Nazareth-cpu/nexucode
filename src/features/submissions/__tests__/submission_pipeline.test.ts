/**
 * Automated Verification Suite for Phase 5: Execution Engine & Judge0 Pipeline
 */

import { describe, it, expect } from 'vitest';
import { JUDGE0_LANGUAGE_MAPPINGS } from '../../../services/judge/judgeConfig';
import { normalizeJudge0StatusId, evaluateProblemSubmission } from '../../../services/judge/judgeService';
import type { SupportedWorkspaceLanguage } from '../../workspace/types';

describe('Phase 5: Execution Engine & Judge0 Pipeline', () => {
  it('Test 1: Verifying Judge0 language ID configurations for all 6 languages', () => {
    const expectedMappings: Record<SupportedWorkspaceLanguage, number> = {
      c: 50,
      cpp: 54,
      java: 62,
      python: 71,
      python2: 70,
      javascript: 93,
    };

    for (const [lang, id] of Object.entries(expectedMappings)) {
      const config = JUDGE0_LANGUAGE_MAPPINGS[lang as SupportedWorkspaceLanguage];
      expect(config).toBeDefined();
      expect(config?.judge0Id).toBe(id);
    }
  });

  it('Test 2: Verifying Judge0 status ID normalization to verdicts', () => {
    const statusChecks: Array<[number, string]> = [
      [3, 'accepted'],
      [4, 'wrong_answer'],
      [5, 'time_limit_exceeded'],
      [6, 'compilation_error'],
      [7, 'runtime_error'],
      [11, 'runtime_error'],
      [13, 'internal_error'],
    ];

    for (const [statusId, expectedVerdict] of statusChecks) {
      const norm = normalizeJudge0StatusId(statusId);
      expect(norm).toBe(expectedVerdict);
    }
  });

  it('Test 3: Verifying test case evaluation sanitization & privacy', async () => {
    const summary = await evaluateProblemSubmission(
      'print(input())',
      'python',
      [
        { stdin: 'hello', expectedOutput: 'hello', visibility: 'sample' },
        { stdin: 'secret_test', expectedOutput: 'secret_test', visibility: 'hidden' },
      ]
    );

    expect(summary.testCount).toBe(2);
    // Ensure sampleResults ONLY contains the sample test, NOT the hidden test
    expect(summary.sampleResults.length).toBe(1);
    expect(summary.sampleResults[0].stdin).toBe('hello');
  }, 15000);
});
