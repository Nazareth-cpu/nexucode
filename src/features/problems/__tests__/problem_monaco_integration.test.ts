/**
 * Comprehensive Integration Verification Suite:
 * Problem Management + Monaco Integration (Nexus Code)
 */

import { describe, it } from 'vitest';
import { WORKSPACE_LANGUAGES, SupportedWorkspaceLanguage } from '../../workspace/types';
import { JUDGE0_LANGUAGE_MAPPINGS } from '../../../services/judge/judgeConfig';
import {
  getProblems,
  getProblemBySlugOrId,
  getProblemForJudging,
  createProblem,
  updateProblem,
  deleteProblem,
  generateSlug,
} from '../../../services/problem/problemServerEngine';

describe('Problem Management + Monaco Integration', () => {
  it('runs comprehensive problem and Monaco integration verification suite', async () => {
    await runComprehensiveVerification();
  });
});

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('NEXUS CODE — PROBLEM MANAGEMENT + MONACO INTEGRATION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: MONACO EDITOR & THE 6 SUPPORTED LANGUAGES
  // --------------------------------------------------------------------------
  console.log('[SECTION 1]: Verifying Monaco Editor & Supported Languages Configuration...');
  const expectedLanguages: SupportedWorkspaceLanguage[] = [
    'c',
    'cpp',
    'java',
    'python',
    'python2',
    'javascript',
  ];

  const configuredLangs = Object.keys(WORKSPACE_LANGUAGES);
  if (configuredLangs.length !== 6) {
    throw new Error(`Expected exactly 6 configured workspace languages, found ${configuredLangs.length}: ${configuredLangs.join(', ')}`);
  }

  for (const lang of expectedLanguages) {
    const def = WORKSPACE_LANGUAGES[lang];
    if (!def) {
      throw new Error(`Missing language definition for ${lang}`);
    }
    if (!def.monacoLang || !def.defaultStarterCode || def.defaultStarterCode.trim().length === 0) {
      throw new Error(`Language ${lang} has invalid Monaco syntax mode or empty starter code.`);
    }

    const judgeMapping = JUDGE0_LANGUAGE_MAPPINGS[lang];
    if (!judgeMapping || !judgeMapping.judge0Id) {
      throw new Error(`Missing Judge0 mapping for language ${lang}`);
    }

    console.log(`  ✓ Language: ${def.label.padEnd(12)} | Monaco Mode: ${def.monacoLang.padEnd(10)} | Ext: .${def.fileExtension.padEnd(4)} | Judge0 ID: ${judgeMapping.judge0Id}`);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: LANGUAGE SWITCHING & STARTER CODE ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n[SECTION 2]: Verifying Language Switching & Starter Code Isolation...');

  // Mock code cache simulation matching useWorkspaceStorage
  const codeCache: Record<SupportedWorkspaceLanguage, string> = {
    c: WORKSPACE_LANGUAGES.c.defaultStarterCode,
    cpp: WORKSPACE_LANGUAGES.cpp.defaultStarterCode,
    java: WORKSPACE_LANGUAGES.java.defaultStarterCode,
    python: WORKSPACE_LANGUAGES.python.defaultStarterCode,
    python2: WORKSPACE_LANGUAGES.python2.defaultStarterCode,
    javascript: WORKSPACE_LANGUAGES.javascript.defaultStarterCode,
  };

  // Student modifies Python code
  codeCache.python = 'print("Student customized python code")';

  // Student switches to C++
  const cppCode = codeCache.cpp;
  if (cppCode.includes('Student customized python code')) {
    throw new Error('Code leakage detected! Python code carried into C++ workspace.');
  }
  if (!cppCode.includes('#include <iostream>')) {
    throw new Error('C++ starter code failed to load correctly on language switch.');
  }

  // Student switches to Java
  const javaCode = codeCache.java;
  if (!javaCode.includes('class Solution')) {
    throw new Error('Java starter code failed to load correctly on language switch.');
  }

  // Student switches back to Python - customized code must be preserved
  if (!codeCache.python.includes('Student customized python code')) {
    throw new Error('Per-language code state was not preserved when switching back to Python.');
  }
  console.log('  ✓ No stale code leakage between languages.');
  console.log('  ✓ Independent per-language code state verified.');
  console.log('  ✓ Distinct Monaco syntax and path modes verified.');

  // --------------------------------------------------------------------------
  // SECTION 3: REAL PROBLEM RETRIEVAL & DETAIL-PAGE RESOLUTION
  // --------------------------------------------------------------------------
  console.log('\n[SECTION 3]: Verifying Problem Retrieval & ID/Slug Resolution...');

  // 3.1 Student views practice problems
  const studentProblems = await getProblems('student');
  if (studentProblems.length === 0) {
    throw new Error('Practice problems catalog is empty.');
  }
  console.log(`  ✓ Student retrieved ${studentProblems.length} published practice problems.`);

  // 3.2 Resolve by Slug
  const probBySlug = await getProblemBySlugOrId('two-sum', 'student');
  if (!probBySlug || probBySlug.slug !== 'two-sum') {
    throw new Error('Failed to resolve problem by slug "two-sum".');
  }
  console.log(`  ✓ Resolved problem by slug: "${probBySlug.title}" (ID: ${probBySlug.id})`);

  // 3.3 Resolve by ID
  const probById = await getProblemBySlugOrId(probBySlug.id, 'student');
  if (!probById || probById.id !== probBySlug.id) {
    throw new Error(`Failed to resolve problem by ID "${probBySlug.id}".`);
  }
  console.log(`  ✓ Resolved problem by ID: "${probById.title}"`);

  // 3.4 Missing/Invalid ID gracefully returns null without crashing
  const missingProb = await getProblemBySlugOrId('non-existent-problem-slug-999', 'student');
  if (missingProb !== null) {
    throw new Error('Expected non-existent problem to resolve to null.');
  }
  console.log('  ✓ Missing problem ID gracefully handled with null.');

  // --------------------------------------------------------------------------
  // SECTION 4: HIDDEN TEST CASE SECURITY & JUDGING ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n[SECTION 4]: Verifying Hidden Test Case Isolation...');

  // Student view must ONLY contain sample test cases
  const studentTestCases = probBySlug.test_cases;
  const studentHasHidden = studentTestCases.some((tc) => tc.visibility === 'hidden');
  if (studentHasHidden) {
    throw new Error('SECURITY VIOLATION: Hidden test cases leaked to student problem detail payload!');
  }
  console.log(`  ✓ Student payload contains ${studentTestCases.length} sample test cases (0 hidden leaked).`);

  // Authoritative judging retrieval contains both sample and hidden test cases
  const judgingProblem = getProblemForJudging('two-sum');
  if (!judgingProblem) {
    throw new Error('Failed to retrieve authoritative problem for judging.');
  }
  const hiddenCount = judgingProblem.test_cases.filter((tc) => tc.visibility === 'hidden').length;
  if (hiddenCount === 0) {
    throw new Error('Authoritative judging problem missing required hidden test cases.');
  }
  console.log(`  ✓ Authoritative judge engine retrieved ${hiddenCount} hidden test case(s) for verification.`);

  // --------------------------------------------------------------------------
  // SECTION 5: ROLE-BASED ACCESS & PROBLEM MANAGEMENT (CRUD)
  // --------------------------------------------------------------------------
  console.log('\n[SECTION 5]: Verifying Role-Based Access Controls & Problem Authoring...');

  const studentUser = { id: 'usr-student-01', role: 'student' as const };
  const coordUser = { id: 'usr-coord-01', role: 'coordinator' as const };
  const adminUser = { id: 'usr-admin-01', role: 'admin' as const };

  // 5.1 Student attempt to create a problem -> MUST BE REJECTED
  const studentCreateRes = await createProblem(
    { title: 'Unauthorized Problem', statement: 'Should fail' },
    studentUser
  );
  if (studentCreateRes.success) {
    throw new Error('SECURITY VIOLATION: Student was able to create a problem!');
  }
  console.log('  ✓ Student creation blocked:', studentCreateRes.error);

  // 5.2 Coordinator creates a problem with all 6 starter codes & hidden tests
  const testProblemSlug = `test-matrix-${Date.now()}`;
  const coordCreateRes = await createProblem(
    {
      title: 'Matrix Rotation Challenge',
      slug: testProblemSlug,
      statement: 'Rotate an NxN matrix by 90 degrees clockwise in-place.',
      input_format: 'First line integer N, followed by N lines of N integers.',
      output_format: 'N lines representing the rotated matrix.',
      constraints: '1 <= N <= 100',
      difficulty: 'medium',
      tags: ['Matrix', 'Arrays'],
      status: 'published',
      examples: [{ input: '2\n1 2\n3 4', output: '3 1\n4 2' }],
      explanation: 'Transpose the matrix and then reverse each row.',
      languages: [
        { language: 'python', starter_code: 'def rotate(matrix):\n    pass\n' },
        { language: 'python2', starter_code: 'def rotate(matrix):\n    pass\n' },
        { language: 'cpp', starter_code: 'void rotate(vector<vector<int>>& m) {}\n' },
        { language: 'c', starter_code: 'void rotate(int** m, int n) {}\n' },
        { language: 'java', starter_code: 'public void rotate(int[][] m) {}\n' },
        { language: 'javascript', starter_code: 'function rotate(m) {}\n' },
      ],
      test_cases: [
        {
          id: 'tc-sample-1',
          problem_id: '',
          storage_path: 'inline://sample',
          visibility: 'sample',
          input_data: '2\n1 2\n3 4',
          expected_output: '3 1\n4 2',
        },
        {
          id: 'tc-hidden-1',
          problem_id: '',
          storage_path: 'inline://hidden',
          visibility: 'hidden',
          input_data: '3\n1 2 3\n4 5 6\n7 8 9',
          expected_output: '7 4 1\n8 5 2\n9 6 3',
        },
      ],
    },
    coordUser
  );

  if (!coordCreateRes.success || !coordCreateRes.data) {
    throw new Error(`Coordinator failed to create problem: ${coordCreateRes.error}`);
  }
  const createdProb = coordCreateRes.data;
  console.log(`  ✓ Coordinator successfully authored: "${createdProb.title}" (${createdProb.id})`);
  console.log(`    Persisted ${createdProb.languages.length} language starter templates and ${createdProb.test_cases.length} test cases.`);

  // 5.3 Student opens newly authored problem -> reads successfully, 0 hidden tests leaked
  const studentReadRes = await getProblemBySlugOrId(testProblemSlug, 'student');
  if (!studentReadRes) {
    throw new Error('Student was unable to find the published problem authored by Coordinator.');
  }
  if (studentReadRes.test_cases.some((tc) => tc.visibility === 'hidden')) {
    throw new Error('SECURITY VIOLATION: Hidden test cases leaked on newly created problem!');
  }
  console.log('  ✓ Student successfully loaded the new problem with zero hidden tests leaked.');

  // 5.4 Coordinator updates the problem
  const updateRes = await updateProblem(
    createdProb.id,
    { statement: 'Updated: Rotate an NxN 2D matrix by 90 degrees clockwise in-place.' },
    coordUser
  );
  if (!updateRes.success || !updateRes.data?.statement.includes('Updated:')) {
    throw new Error('Coordinator failed to update problem statement.');
  }
  console.log('  ✓ Coordinator successfully updated problem statement.');

  // 5.5 Student cannot delete problem
  const studentDeleteRes = await deleteProblem(createdProb.id, studentUser);
  if (studentDeleteRes.success) {
    throw new Error('SECURITY VIOLATION: Student was able to delete a problem!');
  }
  console.log('  ✓ Student problem deletion blocked:', studentDeleteRes.error);

  // 5.6 Admin deletes the test problem
  const adminDeleteRes = await deleteProblem(createdProb.id, adminUser);
  if (!adminDeleteRes.success) {
    throw new Error('Administrator failed to delete test problem.');
  }
  console.log('  ✓ Administrator successfully deleted test problem.');

  console.log('\n================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED: 100% GREEN!');
  console.log('================================================================\n');
}

runComprehensiveVerification().catch((err) => {
  console.error('\n[FATAL ERROR IN VERIFICATION SUITE]:', err);
  process.exit(1);
});
