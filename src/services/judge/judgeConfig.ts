/**
 * Centralized Judge0 Configuration & Language Mappings (Phase 5)
 *
 * Maps the 6 confirmed Nexus Code platform languages to Judge0 language IDs:
 * - C (GCC 9.2.0): 50
 * - C++ (GCC 9.2.0): 54
 * - Java (OpenJDK 13.0.1): 62
 * - Python (3.8.1 / 3.11): 71
 * - JavaScript (Node.js 18.15.0 / 12): 93 (fallback 63)
 * - TypeScript (5.0.3 / 3.7.4): 94 (fallback 74)
 */

import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';

export interface JudgeLanguageConfig {
  language: SupportedWorkspaceLanguage;
  judge0Id: number;
  label: string;
  defaultFilename: string;
}

export const JUDGE0_LANGUAGE_MAPPINGS: Record<SupportedWorkspaceLanguage, JudgeLanguageConfig> = {
  python: {
    language: 'python',
    judge0Id: 71, // Python (3.8.1) / 92 (3.11.2)
    label: 'Python 3',
    defaultFilename: 'solution.py',
  },
  cpp: {
    language: 'cpp',
    judge0Id: 54, // C++ (GCC 9.2.0) / 105 (GCC 14.1.0)
    label: 'C++ 20',
    defaultFilename: 'solution.cpp',
  },
  c: {
    language: 'c',
    judge0Id: 50, // C (GCC 9.2.0) / 103 (GCC 14.1.0)
    label: 'C (C17)',
    defaultFilename: 'solution.c',
  },
  java: {
    language: 'java',
    judge0Id: 62, // Java (OpenJDK 13.0.1) / 91 (JDK 17.0.6)
    label: 'Java 17',
    defaultFilename: 'Solution.java',
  },
  javascript: {
    language: 'javascript',
    judge0Id: 93, // JavaScript (Node.js 18.15.0) / 63 (Node.js 12.14.0)
    label: 'JavaScript',
    defaultFilename: 'solution.js',
  },
  typescript: {
    language: 'typescript',
    judge0Id: 94, // TypeScript (5.0.3) / 74 (TypeScript 3.7.4)
    label: 'TypeScript',
    defaultFilename: 'solution.ts',
  },
};

/**
 * Returns Judge0 endpoint URL from server environment.
 * Defaults to the public CE instance https://ce.judge0.com.
 */
export function getJudge0Url(): string {
  const url = process.env.JUDGE0_URL || 'https://ce.judge0.com';
  return url.replace(/\/+$/, '');
}

/**
 * Returns optional Judge0 API Key / Auth Token from server environment.
 * Kept strictly server-side.
 */
export function getJudge0ApiKey(): string | undefined {
  return process.env.JUDGE0_API_KEY || process.env.X_RAPIDAPI_KEY || undefined;
}
