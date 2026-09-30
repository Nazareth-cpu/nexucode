/**
 * Automated Verification Suite for Phase 5: Execution Engine & Judge0 Pipeline
 */

import { JUDGE0_LANGUAGE_MAPPINGS } from '../../../services/judge/judgeConfig';
import { normalizeJudge0StatusId, evaluateProblemSubmission } from '../../../services/judge/judgeService';
import type { SupportedWorkspaceLanguage } from '../../workspace/types';

async function runTests() {
  console.log('[Test 1]: Verifying Judge0 language ID configurations for all 6 languages...');
  const expectedMappings: Record<SupportedWorkspaceLanguage, number> = {
    c: 50,
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 93,
    typescript: 94,
  };

  for (const [lang, id] of Object.entries(expectedMappings)) {
    const config = JUDGE0_LANGUAGE_MAPPINGS[lang as SupportedWorkspaceLanguage];
    if (!config || config.judge0Id !== id) {
      throw new Error(`Mismatch in language configuration for ${lang}: expected ${id}, received ${config?.judge0Id}`);
    }
  }
  console.log('✓ All 6 language IDs correctly configured.');

  console.log('[Test 2]: Verifying Judge0 status ID normalization to verdicts...');
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
    if (norm !== expectedVerdict) {
      throw new Error(`Normalization failure for status ${statusId}: expected ${expectedVerdict}, received ${norm}`);
    }
  }
  console.log('✓ Verdict normalization mappings verified.');

  console.log('[Test 3]: Verifying test case evaluation sanitization & privacy...');
  const summary = await evaluateProblemSubmission(
    'print(input())',
    'python',
    [
      { stdin: 'hello', expectedOutput: 'hello', visibility: 'sample' },
      { stdin: 'secret_test', expectedOutput: 'secret_test', visibility: 'hidden' },
    ]
  );

  if (summary.testCount !== 2) {
    throw new Error(`Expected test count of 2, received ${summary.testCount}`);
  }

  // Ensure sampleResults ONLY contains the sample test, NOT the hidden test
  if (summary.sampleResults.length !== 1) {
    throw new Error(`Privacy breach: expected 1 sample result, received ${summary.sampleResults.length}`);
  }

  if (summary.sampleResults[0].stdin !== 'hello') {
    throw new Error(`Incorrect sample test exposed in sampleResults.`);
  }

  console.log('✓ Privacy verified: Hidden test inputs/outputs are never returned in sampleResults.');
  console.log(`✓ Overall Verdict: ${summary.verdict}, Score: ${summary.score}/100, Tests: ${summary.passedCount}/${summary.testCount}`);
  console.log('\nAll Phase 5 pipeline tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
