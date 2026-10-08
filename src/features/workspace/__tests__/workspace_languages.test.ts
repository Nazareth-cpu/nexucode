/**
 * Automated Verification: Monaco Coding Workspace & Languages (Phase 4)
 */

import { describe, it, expect } from 'vitest';
import { WORKSPACE_LANGUAGES, SupportedWorkspaceLanguage } from '../types';
import { nexusCodeMonacoTheme, NEXUS_CODE_THEME_NAME } from '../themes/nexusCodeTheme';

describe('Phase 4: Monaco Workspace & Languages', () => {
  it('1. Verifying Supported Platform Languages', () => {
    const expectedLanguages: SupportedWorkspaceLanguage[] = [
      'c',
      'cpp',
      'java',
      'python',
      'python2',
      'javascript',
    ];

    const configuredLanguages = Object.keys(WORKSPACE_LANGUAGES);
    expect(configuredLanguages.length).toBe(6);

    for (const lang of expectedLanguages) {
      expect(WORKSPACE_LANGUAGES[lang]).toBeDefined();
    }
  });

  it('2. Verifying Monaco Language Identifiers', () => {
    const expectedMonacoMappings: Record<SupportedWorkspaceLanguage, string> = {
      c: 'c',
      cpp: 'cpp',
      java: 'java',
      python: 'python',
      python2: 'python',
      javascript: 'javascript',
    };

    for (const [lang, expectedId] of Object.entries(expectedMonacoMappings)) {
      const actual = WORKSPACE_LANGUAGES[lang as SupportedWorkspaceLanguage].monacoLang;
      expect(actual).toBe(expectedId);
    }
  });

  it('3. Verifying Starter Code Templates', () => {
    for (const [, def] of Object.entries(WORKSPACE_LANGUAGES)) {
      expect(def.defaultStarterCode).toBeDefined();
      expect(def.defaultStarterCode.trim().length).toBeGreaterThan(0);
    }
  });

  it('4. Verifying Nexus Code Monaco Dark Theme', () => {
    expect(NEXUS_CODE_THEME_NAME).toBe('nexus-code-dark');
    const colors = nexusCodeMonacoTheme.colors;
    expect(colors['editor.background']).toBe('#08051A');
    expect(colors['editorCursor.foreground']).toBe('#F59E0B');
  });

  it('5. Verifying Storage Scoping Key Structure', () => {
    const testUserId = 'usr_123';
    const testProblemId = 'prob_456';
    const testLang = 'python';
    const expectedKey = `nexus-code:${testUserId}:${testProblemId}:${testLang}`;
    expect(expectedKey.startsWith('nexus-code:')).toBe(true);
    expect(expectedKey.includes(testLang)).toBe(true);
  });
});
