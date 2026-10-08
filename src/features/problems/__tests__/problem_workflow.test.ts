/**
 * Automated Verification: Problem Management & Validation Workflow (Phase 3)
 */

import { describe, it, expect } from 'vitest';
import { generateSlug, validateProblemForPublishing } from '../services/problemService';
import type { ProblemFormData, ProblemTestCaseItem } from '../types';

describe('Phase 3: Problem Workflow & Validation', () => {
  it('1. Testing Slug Generation', () => {
    const slug1 = generateSlug('Two Sum Deluxe — Problem #1!');
    expect(slug1).toBe('two-sum-deluxe-problem-1');
  });

  it('2. Testing Validation of Incomplete Draft for Publishing', () => {
    const incompleteDraft: Partial<ProblemFormData> = {
      title: 'Short',
      statement: '', // Missing
    };
    const valResult1 = validateProblemForPublishing(incompleteDraft, []);
    expect(valResult1.isValid).toBe(false);
    expect(Object.keys(valResult1.errors).length).toBeGreaterThanOrEqual(5);
  });

  it('3. Testing Validation of Problem Missing Hidden Tests', () => {
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
    expect(valResult2.isValid).toBe(false);
    expect(valResult2.errors.test_cases).toBeDefined();
  });

  it('4. Testing Validation of Complete Problem with Hidden Tests', () => {
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
      test_cases: [],
    };

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
    expect(valResult3.isValid).toBe(true);
  });
});
