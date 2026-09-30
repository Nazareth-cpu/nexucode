/**
 * Scoped Workspace Storage Hook (Phase 4)
 *
 * Persists editor code state independently per language:
 * Key format: nexus-code:{userId}:{problemId}:{language}
 *
 * Guarantees:
 * - Switching languages never destroys written code.
 * - Refreshing the browser restores the student's in-progress solution.
 * - Resetting to starter code is supported per language.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SupportedWorkspaceLanguage } from '../types';
import { WORKSPACE_LANGUAGES } from '../types';

interface UseWorkspaceStorageOptions {
  userId: string;
  problemId: string;
  databaseStarterCodes: Record<string, string>; // language -> code
  initialLanguage?: SupportedWorkspaceLanguage;
}

export function useWorkspaceStorage({
  userId,
  problemId,
  databaseStarterCodes,
  initialLanguage = 'python',
}: UseWorkspaceStorageOptions) {
  // 1. Language preference persistence
  const langKey = `nexus-code:${userId || 'anon'}:pref:language`;
  const [currentLanguage, setCurrentLanguage] = useState<SupportedWorkspaceLanguage>(() => {
    try {
      const savedLang = localStorage.getItem(langKey) as SupportedWorkspaceLanguage | null;
      if (savedLang && WORKSPACE_LANGUAGES[savedLang]) {
        return savedLang;
      }
    } catch {
      // Fallback
    }
    return initialLanguage;
  });

  // 2. Storage key helper
  const getStorageKey = useCallback(
    (lang: SupportedWorkspaceLanguage) => {
      return `nexus-code:${userId || 'anon'}:${problemId}:${lang}`;
    },
    [userId, problemId]
  );

  // 3. Resolve starter code for a language
  const getStarterCode = useCallback(
    (lang: SupportedWorkspaceLanguage): string => {
      // Check database starter code first
      if (databaseStarterCodes[lang] && databaseStarterCodes[lang].trim().length > 0) {
        return databaseStarterCodes[lang];
      }
      // Fallback to standardized language default template
      return WORKSPACE_LANGUAGES[lang]?.defaultStarterCode || '';
    },
    [databaseStarterCodes]
  );

  // 4. Memory cache for all languages in the current workspace session
  const [codeCache, setCodeCache] = useState<Record<SupportedWorkspaceLanguage, string>>(() => {
    const initialMap: Record<SupportedWorkspaceLanguage, string> = {
      python: '',
      cpp: '',
      c: '',
      java: '',
      typescript: '',
      javascript: '',
    };

    (Object.keys(WORKSPACE_LANGUAGES) as SupportedWorkspaceLanguage[]).forEach((lang) => {
      try {
        const key = `nexus-code:${userId || 'anon'}:${problemId}:${lang}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          initialMap[lang] = saved;
        } else {
          initialMap[lang] = getStarterCode(lang);
        }
      } catch {
        initialMap[lang] = getStarterCode(lang);
      }
    });

    return initialMap;
  });

  // Re-synchronize starter codes if databaseStarterCodes load after initial mount
  useEffect(() => {
    setCodeCache((prev) => {
      const updated = { ...prev };
      let changed = false;
      (Object.keys(WORKSPACE_LANGUAGES) as SupportedWorkspaceLanguage[]).forEach((lang) => {
        try {
          const key = getStorageKey(lang);
          const saved = localStorage.getItem(key);
          // If no user edits saved yet, update to latest DB starter code
          if (saved === null) {
            const starter = getStarterCode(lang);
            if (starter !== updated[lang]) {
              updated[lang] = starter;
              changed = true;
            }
          }
        } catch {
          // Ignore
        }
      });
      return changed ? updated : prev;
    });
  }, [databaseStarterCodes, getStarterCode, getStorageKey]);

  // 5. Update code for the current language
  const updateCode = useCallback(
    (newCode: string) => {
      setCodeCache((prev) => {
        if (prev[currentLanguage] === newCode) return prev;
        return {
          ...prev,
          [currentLanguage]: newCode,
        };
      });

      // Persist to scoped storage
      try {
        const key = getStorageKey(currentLanguage);
        localStorage.setItem(key, newCode);
      } catch {
        // Ignore quota
      }
    },
    [currentLanguage, getStorageKey]
  );

  // 6. Switch language safely
  const selectLanguage = useCallback(
    (lang: SupportedWorkspaceLanguage) => {
      setCurrentLanguage(lang);
      try {
        localStorage.setItem(langKey, lang);
      } catch {
        // Ignore
      }
    },
    [langKey]
  );

  // 7. Reset current language to original starter code
  const resetToStarterCode = useCallback(() => {
    const starter = getStarterCode(currentLanguage);
    setCodeCache((prev) => ({
      ...prev,
      [currentLanguage]: starter,
    }));
    try {
      const key = getStorageKey(currentLanguage);
      localStorage.setItem(key, starter);
    } catch {
      // Ignore
    }
  }, [currentLanguage, getStarterCode, getStorageKey]);

  return {
    currentLanguage,
    selectLanguage,
    currentCode: codeCache[currentLanguage] ?? '',
    updateCode,
    resetToStarterCode,
    isCustomCode: codeCache[currentLanguage] !== getStarterCode(currentLanguage),
  };
}
