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
    key: 'python2',
    label: 'Python 2',
    defaultTemplate: `class Solution:
    def solve(self, *args):
        # Write your solution here
        pass

if __name__ == "__main__":
    solution = Solution()
    solution.solve()
`,
  },
  {
    key: 'cpp',
    label: 'C++ 20',
    defaultTemplate: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};

int main() {
    Solution solution;
    solution.solve();
    return 0;
}
`,
  },
  {
    key: 'c',
    label: 'C (C17)',
    defaultTemplate: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

void solve() {
    // Write your solution here
}

int main() {
    solve();
    return 0;
}
`,
  },
  {
    key: 'java',
    label: 'Java 17',
    defaultTemplate: `import java.util.*;
import java.io.*;

public class Solution {
    public void solve() {
        // Write your solution here
    }

    public static void main(String[] args) {
        Solution solution = new Solution();
        solution.solve();
    }
}
`,
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    defaultTemplate: `/**
 * Solution function
 */
function solve() {
    // Write your solution here
}

solve();
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
    <div className="space-y-3 rounded-xl border border-[#241D4D] bg-[#0E0B28] p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#241D4D]">
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
                  ? 'bg-[#F59E0B] text-[#08051A] font-semibold shadow-sm'
                  : 'bg-[#08051A] text-[#9CA3AF] hover:text-[#F8FAFC] border border-[#241D4D]'
              }`}
            >
              <span>{lang.label}</span>
              {isConfigured && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-[#08051A]' : 'bg-[#10B981]'
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
          className="w-full px-3 py-2.5 rounded-lg bg-[#08051A] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] leading-relaxed"
        />
      </div>
    </div>
  );
}
