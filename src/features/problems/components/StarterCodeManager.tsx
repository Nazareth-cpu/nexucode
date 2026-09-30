/**
 * Language Starter Code Templates Manager (Phase 3)
 *
 * Configures starter code templates per supported programming language.
 * Stored in public.problem_languages.
 */

import React, { useState } from 'react';
import { Code, Terminal, Check } from 'lucide-react';
import type { SupportedLanguage } from '@/src/types/database';
import type { ProblemLanguageEntry } from '../types';

interface StarterCodeManagerProps {
  languages: ProblemLanguageEntry[];
  onChange: (languages: ProblemLanguageEntry[]) => void;
}

const SUPPORTED_LANGUAGES: { key: SupportedLanguage; label: string; defaultTemplate: string }[] = [
  {
    key: 'python',
    label: 'Python 3',
    defaultTemplate: `class Solution:
    def solve(self, *args):
        # Write your solution here
        pass
`,
  },
  {
    key: 'cpp',
    label: 'C++ 20',
    defaultTemplate: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};
`,
  },
  {
    key: 'java',
    label: 'Java 17',
    defaultTemplate: `import java.util.*;

class Solution {
    public void solve() {
        // Write your solution here
    }
}
`,
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    defaultTemplate: `function solve(): void {
    // Write your solution here
}
`,
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    defaultTemplate: `function solve() {
    // Write your solution here
}
`,
  },
];

export function StarterCodeManager({ languages, onChange }: StarterCodeManagerProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('python');

  // Find or initialize language template
  const currentEntry = languages.find((l) => l.language === selectedLang);
  const defaultObj = SUPPORTED_LANGUAGES.find((l) => l.key === selectedLang);
  const currentCode = currentEntry?.starter_code ?? (defaultObj?.defaultTemplate || '');

  const handleCodeChange = (newCode: string) => {
    const existingIndex = languages.findIndex((l) => l.language === selectedLang);
    let updated: ProblemLanguageEntry[];
    if (existingIndex >= 0) {
      updated = [...languages];
      updated[existingIndex] = { language: selectedLang, starter_code: newCode };
    } else {
      updated = [...languages, { language: selectedLang, starter_code: newCode }];
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#263833] bg-[#0D1A17] p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#263833]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-[#F8FAFC]">
            Starter Code Templates (Optional)
          </h3>
        </div>
        <span className="text-[11px] text-[#9CA3AF] font-mono">
          Stored in problem_languages
        </span>
      </div>

      {/* Language Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isConfigured = languages.some((l) => l.language === lang.key);
          const isSelected = selectedLang === lang.key;

          return (
            <button
              key={lang.key}
              type="button"
              onClick={() => setSelectedLang(lang.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-[#F59E0B] text-[#07110F] font-semibold shadow-sm'
                  : 'bg-[#07110F] text-[#9CA3AF] hover:text-[#F8FAFC] border border-[#263833]'
              }`}
            >
              <span>{lang.label}</span>
              {isConfigured && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-[#07110F]' : 'bg-[#10B981]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Code Editor Area */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-mono mb-1">
          <span>Starter Template for {defaultObj?.label}:</span>
          <button
            type="button"
            onClick={() => handleCodeChange(defaultObj?.defaultTemplate || '')}
            className="text-[#F59E0B] hover:underline"
          >
            Reset to boilerplate
          </button>
        </div>
        <textarea
          rows={6}
          value={currentCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] leading-relaxed"
        />
      </div>
    </div>
  );
}
