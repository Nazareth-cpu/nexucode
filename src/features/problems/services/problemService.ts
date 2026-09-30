/**
 * Centralized Problem Management Service (Phase 3)
 *
 * Encapsulates all problem database queries, mutations, validation,
 * and test case attachments.
 *
 * Security Rules:
 * 1. created_by is strictly derived from the authenticated Supabase user.
 * 2. Supabase RLS is the authoritative enforcement boundary.
 * 3. Client never bypasses RLS or provides service_role keys.
 * 4. Publishing requires comprehensive structural validation.
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/src/services/supabase';
import type { ProblemRow } from '@/src/types/database';
import type {
  ProblemFormData,
  ProblemResult,
  ProblemServiceError,
  ProblemWithRelations,
  ProblemValidationResult,
  ProblemTestCaseItem,
  ProblemLanguageEntry,
} from '../types';

const LOCAL_STORAGE_KEY = 'nexus_code_problems_store';

function normalizeProblemError(error: unknown): ProblemServiceError {
  if (!error) {
    return { message: 'An unknown error occurred in the problem service.' };
  }
  const err = error as { message?: string; code?: string; details?: unknown; hint?: string };
  return {
    message: err.message || 'Problem service operation failed.',
    code: err.code || 'PROBLEM_ERROR',
    details: err.details || err.hint || error,
  };
}

/**
 * Generate a URL-safe, clean slug from a problem title.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates a problem prior to publication.
 * Enforces all 8 required fields from the platform specification plus hidden tests.
 */
export function validateProblemForPublishing(
  data: Partial<ProblemFormData>,
  testCases: ProblemTestCaseItem[] = []
): ProblemValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // 1. Title
  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Problem title must be at least 3 characters.';
  }

  // 2. Slug
  if (!data.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug = 'Slug must be lower-case alphanumeric characters separated by hyphens.';
  }

  // 3. Problem Statement
  if (!data.statement || data.statement.trim().length < 20) {
    errors.statement = 'Problem statement must be at least 20 characters.';
  }

  // 4. Input Format
  if (!data.input_format || data.input_format.trim().length < 5) {
    errors.input_format = 'Input format description is required.';
  }

  // 5. Output Format
  if (!data.output_format || data.output_format.trim().length < 5) {
    errors.output_format = 'Output format description is required.';
  }

  // 6. Constraints
  if (!data.constraints || data.constraints.trim().length < 5) {
    errors.constraints = 'Constraints must be specified.';
  }

  // 7. Examples (at least 1 with input & output)
  if (!data.examples || data.examples.length === 0) {
    errors.examples = 'At least one public example is required.';
  } else {
    const invalidExample = data.examples.some((ex) => !ex.input.trim() || !ex.output.trim());
    if (invalidExample) {
      errors.examples = 'All examples must provide both input and output.';
    }
  }

  // 8. Explanation
  if (!data.explanation || data.explanation.trim().length < 10) {
    errors.explanation = 'A clear problem explanation or approach outline is required.';
  }

  // 9. Difficulty
  if (!data.difficulty || !['easy', 'medium', 'hard'].includes(data.difficulty)) {
    errors.difficulty = 'A valid difficulty (Easy, Medium, or Hard) is required.';
  }

  // 10. Tags
  if (!data.tags || data.tags.length === 0) {
    errors.tags = 'At least one topic tag (e.g., Arrays, Hash Map) is required.';
  }

  // 11. Hidden Test Cases (Critical for competitive programming evaluation)
  const hasHiddenTests = testCases.some((tc) => tc.visibility === 'hidden');
  if (!hasHiddenTests) {
    errors.test_cases = 'At least one hidden test case must be attached before publishing.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

const DEFAULT_PROBLEMS_SEED: ProblemWithRelations[] = [
  {
    id: 'seed-1',
    slug: 'two-sum',
    title: 'Two Sum',
    statement:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    input_format:
      'The first line contains an integer N, the size of the array. The second line contains N space-separated integers. The third line contains the target integer.',
    output_format: 'Print the two zero-based indices separated by a space.',
    constraints:
      '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    difficulty: 'easy',
    tags: ['Arrays', 'Hash Map'],
    status: 'published',
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'Because nums[0] + nums[1] == 9, we return 0 1.' },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'Because nums[1] + nums[2] == 6, we return 1 2.' },
    ],
    explanation:
      'A brute force search checks all pairs with O(N^2) time. Using a hash map to look up complements reduces runtime to O(N).',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            print(f"{seen[complement]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    
    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) {
            cout << seen[comp] << " " << i << endl;
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-1',
        problem_id: 'seed-1',
        storage_path: 'inline://4%0A2%207%2011%2015%0A9',
        visibility: 'sample',
        metadata: {
          input_preview: '4\n2 7 11 15\n9',
          expected_output: '0 1',
          expected_output_preview: '0 1',
        },
      },
      {
        id: 'tc-2',
        problem_id: 'seed-1',
        storage_path: 'inline://3%0A3%202%204%0A6',
        visibility: 'sample',
        metadata: {
          input_preview: '3\n3 2 4\n6',
          expected_output: '1 2',
          expected_output_preview: '1 2',
        },
      },
      {
        id: 'tc-3',
        problem_id: 'seed-1',
        storage_path: 'inline://2%0A3%203%0A6',
        visibility: 'hidden',
        metadata: {
          input_preview: '2\n3 3\n6',
          expected_output: '0 1',
          expected_output_preview: '0 1',
        },
      },
    ],
  },
  {
    id: 'seed-5',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    statement:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    input_format: 'A single line containing the string s.',
    output_format: 'Print "true" if the string is valid, or "false" otherwise.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only: ()[]{}',
    difficulty: 'easy',
    tags: ['Stack', 'Strings'],
    status: 'published',
    examples: [
      { input: '()', output: 'true', explanation: 'Single matched pair.' },
      { input: '()[]{}', output: 'true', explanation: 'All pairs properly open and close.' },
      { input: '(]', output: 'false', explanation: 'Mismatched closing bracket.' },
    ],
    explanation:
      'Use a stack to keep track of open brackets. When an closing bracket is encountered, pop from stack and check matching type.',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s.strip():
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print("true" if isValid(s) else "false")
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <string>
#include <stack>

using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-4',
        problem_id: 'seed-5',
        storage_path: 'inline://%28%29',
        visibility: 'sample',
        metadata: {
          input_preview: '()',
          expected_output: 'true',
          expected_output_preview: 'true',
        },
      },
      {
        id: 'tc-5',
        problem_id: 'seed-5',
        storage_path: 'inline://%28%5D',
        visibility: 'sample',
        metadata: {
          input_preview: '(]',
          expected_output: 'false',
          expected_output_preview: 'false',
        },
      },
      {
        id: 'tc-6',
        problem_id: 'seed-5',
        storage_path: 'inline://%7B%5B%5D%7D',
        visibility: 'hidden',
        metadata: {
          input_preview: '{[]}',
          expected_output: 'true',
          expected_output_preview: 'true',
        },
      },
    ],
  },
  {
    id: 'seed-2',
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    statement:
      'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    input_format:
      'Line 1: N (number of digits in list 1)\nLine 2: N space-separated digits\nLine 3: M (number of digits in list 2)\nLine 4: M space-separated digits',
    output_format: 'Digits of the sum in reverse order, space-separated.',
    constraints:
      'The number of nodes in each linked list is in the range [1, 100].\n0 <= Node.val <= 9\nIt is guaranteed that the list represents a number that does not have leading zeros.',
    difficulty: 'medium',
    tags: ['Linked Lists', 'Math'],
    status: 'published',
    examples: [
      { input: '3\n2 4 3\n3\n5 6 4', output: '7 0 8', explanation: '342 + 465 = 807.' },
      { input: '1\n0\n1\n0', output: '0', explanation: '0 + 0 = 0.' },
    ],
    explanation: 'Simulate digit addition with a carry variable starting from the heads.',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    languages: [],
    test_cases: [
      {
        id: 'tc-7',
        problem_id: 'seed-2',
        storage_path: 'inline://3%0A2%204%203%0A3%0A5%206%204',
        visibility: 'sample',
        metadata: {
          input_preview: '3\n2 4 3\n3\n5 6 4',
          expected_output: '7 0 8',
          expected_output_preview: '7 0 8',
        },
      },
    ],
  },
];

/**
 * Local Fallback Storage Helpers (Ensures uninterrupted operation when Supabase tables are pending)
 */
function getLocalProblems(): ProblemWithRelations[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_PROBLEMS_SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROBLEMS_SEED;
  } catch {
    return DEFAULT_PROBLEMS_SEED;
  }
}

function saveLocalProblems(list: ProblemWithRelations[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota
  }
}

export const problemService = {
  /**
   * Retrieves problems matching filters.
   * If caller is a student, Supabase RLS will return only published problems.
   * If caller is coordinator/admin, RLS returns all problems.
   */
  async getProblems(filter?: {
    status?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{ data: ProblemRow[]; error: ProblemServiceError | null }> {
    if (!isSupabaseConfigured()) {
      return { data: getLocalProblems(), error: null };
    }

    try {
      const client = getSupabaseClient();
      let query = client
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.difficulty && filter.difficulty !== 'All') {
        query = query.eq('difficulty', filter.difficulty.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to local storage if remote tables not yet initialized in schema cache
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[ProblemService]: Remote table public.problems not yet available. Using local store.');
          let local = getLocalProblems();
          if (filter?.status && filter.status !== 'all') {
            local = local.filter((p) => p.status === filter.status);
          }
          if (filter?.difficulty && filter.difficulty !== 'All') {
            local = local.filter((p) => p.difficulty.toLowerCase() === filter.difficulty?.toLowerCase());
          }
          return { data: local, error: null };
        }
        return { data: [], error: normalizeProblemError(error) };
      }

      return { data: (data as ProblemRow[]) || [], error: null };
    } catch (err) {
      return { data: getLocalProblems(), error: normalizeProblemError(err) };
    }
  },

  /**
   * Retrieves a single problem with its languages and accessible test cases.
   */
  async getProblemBySlug(slug: string): Promise<ProblemResult<ProblemWithRelations>> {
    if (!slug) {
      return { data: null, error: { message: 'Slug is required.' } };
    }

    if (!isSupabaseConfigured()) {
      const found = getLocalProblems().find((p) => p.slug === slug);
      return { data: found || null, error: found ? null : { message: 'Problem not found' } };
    }

    try {
      const client = getSupabaseClient();
      const { data: problem, error: probError } = await client
        .from('problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (probError) {
        if (probError.code === 'PGRST205' || probError.code === '42P01') {
          const found = getLocalProblems().find((p) => p.slug === slug);
          return { data: found || null, error: found ? null : { message: 'Problem not found' } };
        }
        return { data: null, error: normalizeProblemError(probError) };
      }

      if (!problem) {
        // Check local store
        const found = getLocalProblems().find((p) => p.slug === slug);
        return { data: found || null, error: found ? null : { message: 'Problem not found' } };
      }

      // Fetch associated languages
      const { data: languages } = await client
        .from('problem_languages')
        .select('language, starter_code')
        .eq('problem_id', problem.id);

      // Fetch associated test cases (RLS automatically enforces that students only see sample test cases)
      const { data: testCases } = await client
        .from('test_cases')
        .select('*')
        .eq('problem_id', problem.id);

      const fullProblem: ProblemWithRelations = {
        ...(problem as ProblemRow),
        languages: (languages as ProblemLanguageEntry[]) || [],
        test_cases: (testCases as ProblemTestCaseItem[]) || [],
      };

      return { data: fullProblem, error: null };
    } catch (err) {
      const found = getLocalProblems().find((p) => p.slug === slug);
      return { data: found || null, error: normalizeProblemError(err) };
    }
  },

  /**
   * Creates a new problem as draft or published.
   * created_by is derived strictly from the authenticated user UUID.
   */
  async createProblem(
    formData: ProblemFormData,
    userId: string
  ): Promise<ProblemResult<ProblemWithRelations>> {
    if (!userId) {
      return {
        data: null,
        error: { message: 'Authenticated user ID is required to create a problem.', code: 'UNAUTHORIZED' },
      };
    }

    const problemSlug = formData.slug || generateSlug(formData.title);

    // Format examples JSON
    const cleanExamples = formData.examples.map((ex) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || '',
    }));

    const newProblemPayload = {
      title: formData.title,
      slug: problemSlug,
      statement: formData.statement,
      input_format: formData.input_format,
      output_format: formData.output_format,
      constraints: formData.constraints,
      examples: cleanExamples,
      explanation: formData.explanation,
      difficulty: formData.difficulty,
      tags: formData.tags,
      status: formData.status || 'draft',
      created_by: userId,
    };

    if (!isSupabaseConfigured()) {
      const localId = `local-${Date.now()}`;
      const createdItem: ProblemWithRelations = {
        id: localId,
        ...newProblemPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        languages: formData.languages,
        test_cases: formData.test_cases,
      };
      const list = getLocalProblems();
      list.unshift(createdItem);
      saveLocalProblems(list);
      return { data: createdItem, error: null };
    }

    try {
      const client = getSupabaseClient();
      const { data: inserted, error: insertError } = await client
        .from('problems')
        .insert(newProblemPayload)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === 'PGRST205' || insertError.code === '42P01') {
          // Fallback to local store
          const localId = `local-${Date.now()}`;
          const createdItem: ProblemWithRelations = {
            id: localId,
            ...newProblemPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            languages: formData.languages,
            test_cases: formData.test_cases,
          };
          const list = getLocalProblems();
          list.unshift(createdItem);
          saveLocalProblems(list);
          return { data: createdItem, error: null };
        }
        return { data: null, error: normalizeProblemError(insertError) };
      }

      const problemId = inserted.id;

      // Insert languages starter codes
      if (formData.languages && formData.languages.length > 0) {
        const langRows = formData.languages.map((l) => ({
          problem_id: problemId,
          language: l.language,
          starter_code: l.starter_code,
        }));
        await client.from('problem_languages').insert(langRows);
      }

      // Insert test cases
      if (formData.test_cases && formData.test_cases.length > 0) {
        const tcRows = formData.test_cases.map((tc) => ({
          problem_id: problemId,
          storage_path: tc.storage_path || `inline://${encodeURIComponent(tc.input_data || '')}`,
          visibility: tc.visibility,
          metadata: tc.metadata || {},
        }));
        await client.from('test_cases').insert(tcRows);
      }

      // Audit log entry
      try {
        await client.from('audit_logs').insert({
          actor_id: userId,
          action: 'problem.created',
          entity_type: 'problem',
          entity_id: problemId,
          metadata: { title: inserted.title, status: inserted.status },
        });
      } catch {
        // Non-blocking audit failure
      }

      const fullProblem: ProblemWithRelations = {
        ...(inserted as ProblemRow),
        languages: formData.languages,
        test_cases: formData.test_cases,
      };

      return { data: fullProblem, error: null };
    } catch (err) {
      return { data: null, error: normalizeProblemError(err) };
    }
  },

  /**
   * Updates an existing problem.
   */
  async updateProblem(
    problemId: string,
    formData: ProblemFormData,
    userId: string
  ): Promise<ProblemResult<ProblemWithRelations>> {
    if (!problemId || !userId) {
      return { data: null, error: { message: 'Problem ID and user ID are required.' } };
    }

    const cleanExamples = formData.examples.map((ex) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || '',
    }));

    const updatePayload = {
      title: formData.title,
      slug: formData.slug,
      statement: formData.statement,
      input_format: formData.input_format,
      output_format: formData.output_format,
      constraints: formData.constraints,
      examples: cleanExamples,
      explanation: formData.explanation,
      difficulty: formData.difficulty,
      tags: formData.tags,
      status: formData.status,
    };

    if (!isSupabaseConfigured() || problemId.startsWith('local-')) {
      const list = getLocalProblems();
      const index = list.findIndex((p) => p.id === problemId || p.slug === formData.slug);
      if (index >= 0) {
        list[index] = {
          ...list[index],
          ...updatePayload,
          updated_at: new Date().toISOString(),
          languages: formData.languages,
          test_cases: formData.test_cases,
        };
        saveLocalProblems(list);
        return { data: list[index], error: null };
      }
    }

    try {
      const client = getSupabaseClient();
      const { data: updated, error: updateError } = await client
        .from('problems')
        .update(updatePayload)
        .eq('id', problemId)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: normalizeProblemError(updateError) };
      }

      // Synchronize test cases if provided
      if (formData.test_cases && formData.test_cases.length > 0) {
        // Delete existing and re-insert or upsert
        await client.from('test_cases').delete().eq('problem_id', problemId);
        const tcRows = formData.test_cases.map((tc) => ({
          problem_id: problemId,
          storage_path: tc.storage_path || `inline://${encodeURIComponent(tc.input_data || '')}`,
          visibility: tc.visibility,
          metadata: tc.metadata || {},
        }));
        await client.from('test_cases').insert(tcRows);
      }

      // Audit log entry
      try {
        await client.from('audit_logs').insert({
          actor_id: userId,
          action: formData.status === 'published' ? 'problem.published' : 'problem.updated',
          entity_type: 'problem',
          entity_id: problemId,
          metadata: { title: updated.title, status: updated.status },
        });
      } catch {
        // Non-blocking
      }

      return {
        data: {
          ...(updated as ProblemRow),
          languages: formData.languages,
          test_cases: formData.test_cases,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: normalizeProblemError(err) };
    }
  },

  /**
   * Publishes a draft problem after full structural validation.
   */
  async publishProblem(
    problemId: string,
    formData: ProblemFormData,
    userId: string
  ): Promise<ProblemResult<ProblemWithRelations>> {
    // 1. Run strict publishing validation
    const validation = validateProblemForPublishing(formData, formData.test_cases);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return {
        data: null,
        error: {
          message: `Cannot publish problem: ${firstError}`,
          code: 'VALIDATION_FAILED',
          details: validation.errors,
        },
      };
    }

    // 2. Persist with status = 'published'
    return this.updateProblem(problemId, { ...formData, status: 'published' }, userId);
  },

  /**
   * Adds a hidden test case to a problem.
   */
  async addTestCase(
    problemId: string,
    testCase: ProblemTestCaseItem
  ): Promise<{ data: ProblemTestCaseItem | null; error: ProblemServiceError | null }> {
    if (!problemId) {
      return { data: null, error: { message: 'Problem ID is required.' } };
    }

    if (!isSupabaseConfigured() || problemId.startsWith('local-')) {
      const list = getLocalProblems();
      const prob = list.find((p) => p.id === problemId);
      if (prob) {
        if (!prob.test_cases) prob.test_cases = [];
        const newItem: ProblemTestCaseItem = {
          ...testCase,
          id: `tc-${Date.now()}`,
          problem_id: problemId,
        };
        prob.test_cases.push(newItem);
        saveLocalProblems(list);
        return { data: newItem, error: null };
      }
    }

    try {
      const client = getSupabaseClient();
      const payload = {
        problem_id: problemId,
        storage_path: testCase.storage_path || `inline://${encodeURIComponent(testCase.input_data || '')}`,
        visibility: testCase.visibility,
        metadata: {
          ...testCase.metadata,
          input_preview: testCase.input_data ? testCase.input_data.slice(0, 100) : undefined,
          expected_output_preview: testCase.expected_output ? testCase.expected_output.slice(0, 100) : undefined,
        },
      };

      const { data, error } = await client
        .from('test_cases')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error: normalizeProblemError(error) };
      }

      return { data: data as ProblemTestCaseItem, error: null };
    } catch (err) {
      return { data: null, error: normalizeProblemError(err) };
    }
  },

  /**
   * Deletes a test case.
   */
  async removeTestCase(testCaseId: string, problemId?: string): Promise<{ success: boolean; error: ProblemServiceError | null }> {
    if (!testCaseId) {
      return { success: false, error: { message: 'Test case ID is required.' } };
    }

    if (!isSupabaseConfigured() || (problemId && problemId.startsWith('local-'))) {
      const list = getLocalProblems();
      for (const p of list) {
        if (p.test_cases) {
          p.test_cases = p.test_cases.filter((tc) => tc.id !== testCaseId);
        }
      }
      saveLocalProblems(list);
      return { success: true, error: null };
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.from('test_cases').delete().eq('id', testCaseId);
      if (error) {
        return { success: false, error: normalizeProblemError(error) };
      }
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: normalizeProblemError(err) };
    }
  },
};
