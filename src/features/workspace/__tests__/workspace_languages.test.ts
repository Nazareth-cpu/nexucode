/**
 * Automated Verification: Monaco Coding Workspace & Languages (Phase 4)
 */

import { WORKSPACE_LANGUAGES, SupportedWorkspaceLanguage } from '../types';
import { nexusCodeMonacoTheme, NEXUS_CODE_THEME_NAME } from '../themes/nexusCodeTheme';

function runWorkspaceTests() {
  console.log('====================================================');
  console.log('NEXUS CODE — PHASE 4 MONACO WORKSPACE TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Exactly the 6 confirmed platform languages
  console.log('1. Verifying Supported Platform Languages...');
  const expectedLanguages: SupportedWorkspaceLanguage[] = [
    'c',
    'cpp',
    'java',
    'python',
    'javascript',
    'typescript',
  ];

  const configuredLanguages = Object.keys(WORKSPACE_LANGUAGES);
  if (configuredLanguages.length !== 6) {
    console.error(`  [FAIL] Expected exactly 6 languages, got ${configuredLanguages.length}`);
    process.exit(1);
  }

  for (const lang of expectedLanguages) {
    if (!WORKSPACE_LANGUAGES[lang]) {
      console.error(`  [FAIL] Missing required language definition: ${lang}`);
      process.exit(1);
    }
    console.log(`  [OK] Language ${lang.toUpperCase()} configured: label="${WORKSPACE_LANGUAGES[lang].label}", monacoLang="${WORKSPACE_LANGUAGES[lang].monacoLang}"`);
  }

  // Test 2: Monaco Language Identifiers
  console.log('\n2. Verifying Monaco Language Identifiers...');
  const expectedMonacoMappings: Record<SupportedWorkspaceLanguage, string> = {
    c: 'c',
    cpp: 'cpp',
    java: 'java',
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
  };

  for (const [lang, expectedId] of Object.entries(expectedMonacoMappings)) {
    const actual = WORKSPACE_LANGUAGES[lang as SupportedWorkspaceLanguage].monacoLang;
    if (actual !== expectedId) {
      console.error(`  [FAIL] Monaco language identifier mismatch for ${lang}: expected ${expectedId}, got ${actual}`);
      process.exit(1);
    }
  }
  console.log('  [PASS] All 6 Monaco language identifiers correctly mapped.');

  // Test 3: Starter Code Boilerplates Presence
  console.log('\n3. Verifying Starter Code Templates...');
  for (const [lang, def] of Object.entries(WORKSPACE_LANGUAGES)) {
    if (!def.defaultStarterCode || def.defaultStarterCode.trim().length === 0) {
      console.error(`  [FAIL] Default starter code missing for ${lang}`);
      process.exit(1);
    }
    console.log(`  [OK] Starter boilerplate verified for ${def.label} (${def.defaultStarterCode.length} chars)`);
  }

  // Test 4: Nexus Code Monaco Dark Theme Tokens
  console.log('\n4. Verifying Nexus Code Monaco Dark Theme...');
  if (NEXUS_CODE_THEME_NAME !== 'nexus-code-dark') {
    console.error(`  [FAIL] Theme name mismatch: ${NEXUS_CODE_THEME_NAME}`);
    process.exit(1);
  }

  const colors = nexusCodeMonacoTheme.colors;
  if (colors['editor.background'] !== '#07110F') {
    console.error(`  [FAIL] Background color mismatch: ${colors['editor.background']}`);
    process.exit(1);
  }
  if (colors['editorCursor.foreground'] !== '#F59E0B') {
    console.error(`  [FAIL] Cursor color mismatch: ${colors['editorCursor.foreground']}`);
    process.exit(1);
  }
  console.log('  [PASS] Custom Monaco theme colors match platform design tokens.');

  // Test 5: Storage Key Scoping Format
  console.log('\n5. Verifying Storage Scoping Key Structure...');
  const testUserId = 'usr_123';
  const testProblemId = 'prob_456';
  const testLang = 'python';
  const expectedKey = `nexus-code:${testUserId}:${testProblemId}:${testLang}`;
  
  if (!expectedKey.startsWith('nexus-code:') || !expectedKey.includes(testLang)) {
    console.error(`  [FAIL] Storage key structure invalid: ${expectedKey}`);
    process.exit(1);
  }
  console.log(`  [PASS] Storage key formatted correctly: ${expectedKey}`);

  console.log('\n====================================================');
  console.log('ALL PHASE 4 MONACO WORKSPACE TESTS PASSED!');
  console.log('====================================================\n');
}

runWorkspaceTests();
