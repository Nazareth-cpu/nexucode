/**
 * Problem Management Domain Types (Phase 3)
 */

import type {
  ProblemRow,
  ProblemDifficulty,
  ProblemStatus,
  SupportedLanguage,
  TestCaseVisibility,
} from '@/src/types/database';

export type { ProblemDifficulty, ProblemStatus, SupportedLanguage, TestCaseVisibility };

export interface ProblemExample {
  id: string; // client key
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemLanguageEntry {
  language: SupportedLanguage;
  starter_code: string;
}

export interface ProblemTestCaseItem {
  id?: string;
  problem_id?: string;
  storage_path: string;
  visibility: TestCaseVisibility;
  input_data?: string;
  expected_output?: string;
  metadata: {
    description?: string;
    timeout_ms?: number;
    memory_limit_kb?: number;
    sample_index?: number;
    input_preview?: string;
    expected_output_preview?: string;
    [key: string]: unknown;
  };
}

export interface ProblemFormData {
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  examples: ProblemExample[];
  explanation: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  status: ProblemStatus;
  contest_id?: string;
  // Associated data
  languages: ProblemLanguageEntry[];
  test_cases: ProblemTestCaseItem[];
}

export interface ProblemValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export interface ProblemServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ProblemResult<T = ProblemRow> {
  data: T | null;
  error: ProblemServiceError | null;
}

export interface ProblemWithRelations extends ProblemRow {
  languages?: ProblemLanguageEntry[];
  test_cases?: ProblemTestCaseItem[];
}
