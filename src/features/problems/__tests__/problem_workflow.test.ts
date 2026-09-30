/**
 * Automated Verification: Problem Management & Validation Workflow (Phase 3)
 */

import { generateSlug, validateProblemForPublishing, problemService } from '../services/problemService';
import type { ProblemFormData, ProblemTestCaseItem } from '../types';

function runTests() {
  console.log('====================================================');
  console.log('NEXUS CODE — PHASE 3 PROBLEM WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Slug Generation
  console.log('1. Testing Slug Generation...');
  const slug1 = generateSlug('Two Sum Deluxe — Problem #1!');
  if (slug1 === 'two-sum-deluxe-problem-1') {
    console.log('  [PASS] Clean slug generated: ' + slug1);
  } else {
    console.error('  [FAIL] Unexpected slug: ' + slug1);
    process.exit(1);
  }

  // Test 2: Validation of Incomplete Draft
  console.log('\n2. Testing Validation of Incomplete Draft for Publishing...');
  const incompleteDraft: Partial<ProblemFormData> = {
    title: 'Short',
    statement: '', // Missing
  };
  const valResult1 = validateProblemForPublishing(incompleteDraft, []);
  if (!valResult1.isValid && Object.keys(valResult1.errors).length >= 5) {
    console.log(`  [PASS] Correctly rejected incomplete problem with ${Object.keys(valResult1.errors).length} errors.`);
    console.log('         Errors detected:', Object.keys(valResult1.errors).join(', '));
  } else {
    console.error('  [FAIL] Failed to reject incomplete problem:', valResult1);
    process.exit(1);
  }

  // Test 3: Validation of Problem Missing Hidden Tests
  console.log('\n3. Testing Validation of Problem Missing Hidden Tests...');
  const draftWithoutTests: ProblemFormData = {
    title: 'Valid Palindrome II',
    slug: 'valid-palindrome-ii',
    statement: 'Given a string s, return true if the s can be palindrome after deleting at most one character.',
    input_format: 'A single string s.',
    output_format: 'Return true or false.',
    constraints: '1 <= s.length <= 10^5\ns consists of lowercase English letters.',
    examples: [
      { id: '1', input: 's = "aba"', output: 'true', explanation: 'Already a palindrome.' },
    ],
    explanation: 'Greedy two-pointer approach comparing mismatch characters.',
    difficulty: 'easy',
    tags: ['Strings', 'Two Pointers'],
    status: 'draft',
    languages: [],
    test_cases: [], // No hidden tests!
  };

  const valResult2 = validateProblemForPublishing(draftWithoutTests, []);
  if (!valResult2.isValid && valResult2.errors.test_cases) {
    console.log('  [PASS] Correctly rejected publication when hidden test cases are absent.');
  } else {
    console.error('  [FAIL] Should have required hidden test cases before publishing:', valResult2);
    process.exit(1);
  }

  // Test 4: Validation of Fully-Specified Problem with Hidden Tests
  console.log('\n4. Testing Validation of Complete Problem with Hidden Tests...');
  const validTestCases: ProblemTestCaseItem[] = [
    {
      storage_path: 'inline://test',
      visibility: 'hidden',
      input_data: 'abca',
      expected_output: 'true',
      metadata: { timeout_ms: 1000, memory_limit_kb: 262144 },
    },
  ];

  const valResult3 = validateProblemForPublishing(draftWithoutTests, validTestCases);
  if (valResult3.isValid) {
    console.log('  [PASS] Fully qualified problem with all 8 fields and hidden test cases validated successfully.');
  } else {
    console.error('  [FAIL] Unexpected validation errors:', valResult3.errors);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('ALL PHASE 3 WORKFLOW & VALIDATION TESTS PASSED!');
  console.log('====================================================\n');
}

runTests();
