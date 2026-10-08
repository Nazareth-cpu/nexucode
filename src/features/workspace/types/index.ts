/**
 * Monaco Coding Workspace Types (Phase 4)
 *
 * Scoped strictly to the 6 confirmed platform languages:
 * C, C++, JavaScript, Java, Python 3, Python 2
 */

export type SupportedWorkspaceLanguage =
  | 'c'
  | 'cpp'
  | 'java'
  | 'python'
  | 'python2'
  | 'javascript';

export interface LanguageDefinition {
  id: SupportedWorkspaceLanguage;
  label: string;
  monacoLang: string;
  fileExtension: string;
  defaultStarterCode: string;
  version: string;
}

export const WORKSPACE_LANGUAGES: Record<SupportedWorkspaceLanguage, LanguageDefinition> = {
  python: {
    id: 'python',
    label: 'Python 3',
    monacoLang: 'python',
    fileExtension: 'py',
    version: '3.11',
    defaultStarterCode: `class Solution:
    def solve(self, *args):
        # Write your solution here
        pass

if __name__ == "__main__":
    solution = Solution()
    solution.solve()
`,
  },
  python2: {
    id: 'python2',
    label: 'Python 2',
    monacoLang: 'python',
    fileExtension: 'py',
    version: '2.7',
    defaultStarterCode: `class Solution:
    def solve(self, *args):
        # Write your solution here
        pass

if __name__ == "__main__":
    solution = Solution()
    solution.solve()
`,
  },
  cpp: {
    id: 'cpp',
    label: 'C++ 20',
    monacoLang: 'cpp',
    fileExtension: 'cpp',
    version: 'GCC 13.2',
    defaultStarterCode: `#include <iostream>
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
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    Solution solution;
    solution.solve();
    return 0;
}
`,
  },
  c: {
    id: 'c',
    label: 'C (C17)',
    monacoLang: 'c',
    fileExtension: 'c',
    version: 'GCC 13.2',
    defaultStarterCode: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

void solve() {
    // Write your solution here
}

int main() {
    solve();
    return 0;
}
`,
  },
  java: {
    id: 'java',
    label: 'Java 17',
    monacoLang: 'java',
    fileExtension: 'java',
    version: 'OpenJDK 17',
    defaultStarterCode: `import java.util.*;
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
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    fileExtension: 'js',
    version: 'Node.js 20',
    defaultStarterCode: `/**
 * Solution function
 */
function solve() {
    // Write your solution here
}

solve();
`,
  },
};

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: 'on' | 'off';
  lineNumbers: 'on' | 'off';
}

export interface WorkspaceCodeMap {
  [language: string]: string;
}
