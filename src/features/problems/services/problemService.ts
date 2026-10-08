/**
 * Centralized Problem Management Service
 *
 * Real, Supabase & Authoritative Server-backed Problem Engine.
 *
 * Security & Data Rules:
 * 1. created_by is strictly derived from the authenticated Supabase user.
 * 2. Supabase RLS and server middlewares form the authoritative enforcement boundary.
 * 3. Coordinator and Admin can author and edit problems; Students have read-only access.
 * 4. Hidden test cases are NEVER returned to the student/client.
 * 5. Supports language-specific starter codes across all 6 supported languages.
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
 * Enforces all required fields from the platform specification plus hidden tests.
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

async function getAuthToken(): Promise<string | undefined> {
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

export const problemService = {
  /**
   * Retrieves problems matching filters.
   * If caller is a student, returns only published problems.
   * If caller is coordinator/admin, returns all problems.
   */
  async getProblems(filter?: {
    status?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{ data: ProblemRow[]; error: ProblemServiceError | null }> {
    const token = await getAuthToken();

    // 1. Authoritative Server API endpoint
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.set('status', filter.status);
      if (filter?.difficulty) params.set('difficulty', filter.difficulty);
      if (filter?.search) params.set('search', filter.search);

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/problems?${params.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.problems)) {
          return { data: json.problems as ProblemRow[], error: null };
        }
      }
    } catch {
      // Fall through to direct Supabase query
    }

    // 2. Direct Supabase Query (with RLS enforcement)
    if (isSupabaseConfigured()) {
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
        if (!error && data) {
          return { data: data as ProblemRow[], error: null };
        }
        if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
          return { data: [], error: normalizeProblemError(error) };
        }
      } catch (err) {
        return { data: [], error: normalizeProblemError(err) };
      }
    }

    return { data: [], error: null };
  },

  /**
   * Retrieves a single problem with its languages and accessible test cases.
   * Resolves both slug and UUID/ID.
   * Hidden test cases are strictly filtered out for student users.
   */
  async getProblemBySlug(slugOrId: string): Promise<ProblemResult<ProblemWithRelations>> {
    if (!slugOrId || typeof slugOrId !== 'string' || slugOrId.trim().length === 0) {
      return { data: null, error: { message: 'Invalid or missing problem identifier.' } };
    }
    const cleanId = slugOrId.trim();
    const token = await getAuthToken();

    // 1. Authoritative Server API endpoint
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/problems/${encodeURIComponent(cleanId)}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.problem) {
          return { data: json.problem as ProblemWithRelations, error: null };
        }
      } else if (res.status === 403) {
        return {
          data: null,
          error: { message: 'This problem is in draft mode and requires coordinator or admin privileges.' },
        };
      }
    } catch {
      // Fall through to direct Supabase query
    }

    // 2. Direct Supabase Query (with RLS enforcement)
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
        const query = client.from('problems').select('*');
        const { data: problem, error: probError } = isUuid
          ? await query.eq('id', cleanId).maybeSingle()
          : await query.eq('slug', cleanId).maybeSingle();

        if (problem) {
          // Fetch associated languages
          const { data: languages } = await client
            .from('problem_languages')
            .select('language, starter_code')
            .eq('problem_id', problem.id);

          // Fetch associated test cases (RLS automatically enforces sample-only for students)
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
        }

        if (probError && probError.code !== 'PGRST205' && probError.code !== '42P01') {
          return { data: null, error: normalizeProblemError(probError) };
        }
      } catch (err) {
        return { data: null, error: normalizeProblemError(err) };
      }
    }

    return {
      data: null,
      error: { message: 'The requested problem does not exist or has been archived.' },
    };
  },

  /**
   * Creates a new problem as draft or published.
   * Enforces server-side authorization: Event Coordinator or Admin only.
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

    const token = await getAuthToken();

    // 1. Authoritative Server API (validates coordinator/admin role server-side)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/problems', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.problem) {
        return { data: json.problem as ProblemWithRelations, error: null };
      }
      if (!res.ok) {
        return { data: null, error: { message: json.error || 'Failed to create problem on server.' } };
      }
    } catch {
      // Fall through to direct Supabase insert
    }

    // 2. Direct Supabase Insert fallback (guarded by RLS)
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const problemSlug = formData.slug || generateSlug(formData.title);
        const cleanExamples = (formData.examples || []).map((ex) => ({
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

        const { data: inserted, error: insertError } = await client
          .from('problems')
          .insert(newProblemPayload)
          .select()
          .single();

        if (insertError) {
          return { data: null, error: normalizeProblemError(insertError) };
        }

        const problemId = inserted.id;

        // Languages
        if (formData.languages && formData.languages.length > 0) {
          const langRows = formData.languages.map((l) => ({
            problem_id: problemId,
            language: l.language,
            starter_code: l.starter_code,
          }));
          await client.from('problem_languages').insert(langRows);
        }

        // Test Cases
        if (formData.test_cases && formData.test_cases.length > 0) {
          const tcRows = formData.test_cases.map((tc) => ({
            problem_id: problemId,
            storage_path: tc.storage_path || `inline://${encodeURIComponent(tc.input_data || '')}`,
            visibility: tc.visibility,
            metadata: tc.metadata || {},
          }));
          await client.from('test_cases').insert(tcRows);
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
    }

    return { data: null, error: { message: 'Unable to create problem: database unreachable.' } };
  },

  /**
   * Updates an existing problem.
   * Enforces server-side authorization: Event Coordinator or Admin only.
   */
  async updateProblem(
    problemId: string,
    formData: ProblemFormData,
    userId: string
  ): Promise<ProblemResult<ProblemWithRelations>> {
    if (!problemId || !userId) {
      return { data: null, error: { message: 'Problem ID and user ID are required.' } };
    }

    const token = await getAuthToken();

    // 1. Authoritative Server API
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/problems/${encodeURIComponent(problemId)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.problem) {
        return { data: json.problem as ProblemWithRelations, error: null };
      }
      if (!res.ok) {
        return { data: null, error: { message: json.error || 'Failed to update problem on server.' } };
      }
    } catch {
      // Fall through to direct Supabase update
    }

    // 2. Direct Supabase Update fallback
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const cleanExamples = (formData.examples || []).map((ex) => ({
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

        const { data: updated, error: updateError } = await client
          .from('problems')
          .update(updatePayload)
          .eq('id', problemId)
          .select()
          .single();

        if (updateError) {
          return { data: null, error: normalizeProblemError(updateError) };
        }

        // Synchronize test cases
        if (formData.test_cases && formData.test_cases.length > 0) {
          await client.from('test_cases').delete().eq('problem_id', problemId);
          const tcRows = formData.test_cases.map((tc) => ({
            problem_id: problemId,
            storage_path: tc.storage_path || `inline://${encodeURIComponent(tc.input_data || '')}`,
            visibility: tc.visibility,
            metadata: tc.metadata || {},
          }));
          await client.from('test_cases').insert(tcRows);
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
    }

    return { data: null, error: { message: 'Unable to update problem: database unreachable.' } };
  },

  /**
   * Deletes a problem (Platform Administrator ONLY).
   */
  async deleteProblem(
    problemId: string
  ): Promise<{ success: boolean; error: ProblemServiceError | null }> {
    if (!problemId) {
      return { success: false, error: { message: 'Problem ID is required.' } };
    }

    const token = await getAuthToken();

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/problems/${encodeURIComponent(problemId)}`, {
        method: 'DELETE',
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, error: null };
      }
      return { success: false, error: { message: json.error || 'Failed to delete problem.' } };
    } catch {
      // Fallback direct Supabase
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('problems').delete().eq('id', problemId);
        if (error) {
          return { success: false, error: normalizeProblemError(error) };
        }
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: normalizeProblemError(err) };
      }
    }

    return { success: false, error: { message: 'Delete operation failed.' } };
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

    if (isSupabaseConfigured()) {
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
    }

    return { data: null, error: { message: 'Database unreachable.' } };
  },

  /**
   * Deletes a test case.
   */
  async removeTestCase(
    testCaseId: string,
    _problemId?: string
  ): Promise<{ success: boolean; error: ProblemServiceError | null }> {
    if (!testCaseId) {
      return { success: false, error: { message: 'Test case ID is required.' } };
    }

    if (isSupabaseConfigured()) {
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
    }

    return { success: false, error: { message: 'Database unreachable.' } };
  },
};
