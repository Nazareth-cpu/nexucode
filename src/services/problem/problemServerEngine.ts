/**
 * Nexus Code — Problem Server Engine
 *
 * Authoritative problem management and persistence engine.
 * Supports dual Supabase PostgreSQL + resilient server-authoritative store.
 *
 * Enforces:
 * 1. Role-based access (Students: read published only, Staff: manage).
 * 2. Hidden test case security (Never sent to student/client).
 * 3. Starter codes for all 6 confirmed languages:
 *    C, C++, JavaScript, Java, Python 3, Python 2.
 * 4. Judging test suite access for evaluation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';

export type UserRole = 'student' | 'coordinator' | 'admin';

export interface ProblemLanguageItem {
  language: SupportedWorkspaceLanguage;
  starter_code: string;
}

export interface ProblemTestCaseItem {
  id: string;
  problem_id: string;
  storage_path: string;
  visibility: 'sample' | 'hidden';
  input_data?: string;
  expected_output?: string;
  metadata?: {
    input_preview?: string;
    expected_output_preview?: string;
    description?: string;
    timeout_ms?: number;
    memory_limit_kb?: number;
    [key: string]: unknown;
  };
}

export interface ServerProblem {
  id: string;
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  languages: ProblemLanguageItem[];
  test_cases: ProblemTestCaseItem[];
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// PRODUCTION-GRADE SEED PROBLEMS WITH ALL 6 LANGUAGES & HIDDEN TESTS
// ============================================================================

const SEED_PROBLEMS: ServerProblem[] = [
  {
    id: 'seed-1',
    slug: 'two-sum',
    title: 'Two Sum',
    statement:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    input_format:
      'Line 1: N (number of integers in array)\nLine 2: N space-separated integers\nLine 3: target integer',
    output_format: 'Print the two zero-based indices separated by a space (e.g. 0 1).',
    constraints:
      '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.',
    difficulty: 'easy',
    tags: ['Arrays', 'Hash Map'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] == 9, so output 0 1.' },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] == 6, so output 1 2.' },
      { input: '2\n3 3\n6', output: '0 1', explanation: 'nums[0] + nums[1] == 6, so output 0 1.' },
    ],
    explanation:
      'A hash map can store elements and their indices in O(N) time and O(N) space, checking for target - nums[i].',
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    seen = {}
    for i in range(len(nums)):
        num = nums[i]
        diff = target - num
        if diff in seen:
            print "%d %d" % (seen[diff], i)
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    
    unordered_map<int, int> seen;
    for (int i = 0; i < n; i++) {
        int diff = target - nums[i];
        if (seen.count(diff)) {
            cout << seen[diff] << " " << i << "\n";
            return 0;
        }
        seen[nums[i]] = i;
    }
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int *nums = (int *)malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }
    int target;
    scanf("%d", &target);
    
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                free(nums);
                return 0;
            }
        }
    }
    free(nums);
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line1 = reader.readLine();
        if (line1 == null) return;
        int n = Integer.parseInt(line1.trim());
        String[] parts = reader.readLine().trim().split("\\\\s+");
        int target = Integer.parseInt(reader.readLine().trim());
        
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int num = Integer.parseInt(parts[i]);
            int diff = target - num;
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(num, i);
        }
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    const target = parseInt(input[n + 1], 10);
    
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) {
            console.log(seen.get(diff) + " " + i);
            return;
        }
        seen.set(nums[i], i);
    }
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-1-sample-1',
        problem_id: 'seed-1',
        storage_path: 'inline://4%0A2%207%2011%2015%0A9',
        visibility: 'sample',
        input_data: '4\n2 7 11 15\n9',
        expected_output: '0 1',
        metadata: {
          input_preview: '4\n2 7 11 15\n9',
          expected_output_preview: '0 1',
          description: 'Standard positive case',
        },
      },
      {
        id: 'tc-1-sample-2',
        problem_id: 'seed-1',
        storage_path: 'inline://3%0A3%202%204%0A6',
        visibility: 'sample',
        input_data: '3\n3 2 4\n6',
        expected_output: '1 2',
        metadata: {
          input_preview: '3\n3 2 4\n6',
          expected_output_preview: '1 2',
          description: 'Subsequent elements case',
        },
      },
      {
        id: 'tc-1-hidden-1',
        problem_id: 'seed-1',
        storage_path: 'inline://5%0A1%20-2%203%2010%20-5%0A-7',
        visibility: 'hidden',
        input_data: '5\n1 -2 3 10 -5\n-7',
        expected_output: '1 4',
        metadata: {
          input_preview: '5\n1 -2 3 10 -5\n-7',
          expected_output_preview: '1 4',
          description: 'Negative numbers sum test',
        },
      },
      {
        id: 'tc-1-hidden-2',
        problem_id: 'seed-1',
        storage_path: 'inline://6%0A100%20200%20300%20400%20500%20600%0A1100',
        visibility: 'hidden',
        input_data: '6\n100 200 300 400 500 600\n1100',
        expected_output: '4 5',
        metadata: {
          input_preview: '6\n100 200 300 400 500 600\n1100',
          expected_output_preview: '4 5',
          description: 'End of array elements',
        },
      },
    ],
  },
  {
    id: 'seed-2',
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    statement:
      'You are given two non-empty lists representing two non-negative integers. The digits are stored in reverse order, and each of their elements contains a single digit. Add the two numbers and return the sum as a reverse-ordered list.',
    input_format:
      'Line 1: N (number of digits in list 1)\nLine 2: N space-separated digits\nLine 3: M (number of digits in list 2)\nLine 4: M space-separated digits',
    output_format: 'Digits of the sum in reverse order, space-separated.',
    constraints:
      '1 <= N, M <= 100\n0 <= digit <= 9\nNumbers do not contain leading zeros except for zero itself.',
    difficulty: 'medium',
    tags: ['Linked Lists', 'Math'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      { input: '3\n2 4 3\n3\n5 6 4', output: '7 0 8', explanation: '342 + 465 = 807, reversed: 7 0 8' },
      { input: '1\n0\n1\n0', output: '0', explanation: '0 + 0 = 0' },
    ],
    explanation: 'Simulate elementary school addition with a carry digit.',
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 4:
        return
    l1 = [int(x) for x in lines[1].split()]
    l2 = [int(x) for x in lines[3].split()]
    
    carry = 0
    res = []
    i, j = 0, 0
    while i < len(l1) or j < len(l2) or carry:
        v1 = l1[i] if i < len(l1) else 0
        v2 = l2[j] if j < len(l2) else 0
        total = v1 + v2 + carry
        carry = total // 10
        res.append(str(total % 10))
        i += 1
        j += 1
    print(" ".join(res))

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 4:
        return
    l1 = [int(x) for x in lines[1].split()]
    l2 = [int(x) for x in lines[3].split()]
    
    carry = 0
    res = []
    i, j = 0, 0
    while i < len(l1) or j < len(l2) or carry:
        v1 = l1[i] if i < len(l1) else 0
        v2 = l2[j] if j < len(l2) else 0
        total = v1 + v2 + carry
        carry = total // 10
        res.append(str(total % 10))
        i += 1
        j += 1
    print " ".join(res)

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n, m;
    if (!(cin >> n)) return 0;
    vector<int> l1(n);
    for (int i = 0; i < n; i++) cin >> l1[i];
    if (!(cin >> m)) return 0;
    vector<int> l2(m);
    for (int i = 0; i < m; i++) cin >> l2[i];
    
    vector<int> res;
    int carry = 0, i = 0, j = 0;
    while (i < n || j < m || carry) {
        int v1 = (i < n) ? l1[i++] : 0;
        int v2 = (j < m) ? l2[j++] : 0;
        int sum = v1 + v2 + carry;
        carry = sum / 10;
        res.push_back(sum % 10);
    }
    for (size_t k = 0; k < res.size(); k++) {
        cout << res[k] << (k + 1 == res.size() ? "" : " ");
    }
    cout << "\\n";
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    int *l1 = (int *)malloc(sizeof(int) * n);
    for (int i = 0; i < n; i++) scanf("%d", &l1[i]);
    if (scanf("%d", &m) != 1) return 0;
    int *l2 = (int *)malloc(sizeof(int) * m);
    for (int i = 0; i < m; i++) scanf("%d", &l2[i]);
    
    int res[300];
    int res_len = 0;
    int carry = 0, i = 0, j = 0;
    while (i < n || j < m || carry) {
        int v1 = (i < n) ? l1[i++] : 0;
        int v2 = (j < m) ? l2[j++] : 0;
        int sum = v1 + v2 + carry;
        carry = sum / 10;
        res[res_len++] = sum % 10;
    }
    for (int k = 0; k < res_len; k++) {
        printf("%d%s", res[k], (k + 1 == res_len) ? "" : " ");
    }
    printf("\\n");
    free(l1);
    free(l2);
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] l1 = new int[n];
        for (int i = 0; i < n; i++) l1[i] = sc.nextInt();
        int m = sc.nextInt();
        int[] l2 = new int[m];
        for (int i = 0; i < m; i++) l2[i] = sc.nextInt();
        
        List<Integer> res = new ArrayList<>();
        int carry = 0, i = 0, j = 0;
        while (i < n || j < m || carry > 0) {
            int v1 = (i < n) ? l1[i++] : 0;
            int v2 = (j < m) ? l2[j++] : 0;
            int sum = v1 + v2 + carry;
            carry = sum / 10;
            res.add(sum % 10);
        }
        for (int k = 0; k < res.size(); k++) {
            System.out.print(res.get(k) + (k + 1 == res.size() ? "" : " "));
        }
        System.out.println();
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 4) return;
    const l1 = lines[1].trim().split(/\\s+/).map(Number);
    const l2 = lines[3].trim().split(/\\s+/).map(Number);
    
    let carry = 0, i = 0, j = 0;
    const res = [];
    while (i < l1.length || j < l2.length || carry) {
        const v1 = i < l1.length ? l1[i++] : 0;
        const v2 = j < l2.length ? l2[j++] : 0;
        const sum = v1 + v2 + carry;
        carry = Math.floor(sum / 10);
        res.push(sum % 10);
    }
    console.log(res.join(' '));
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-2-sample-1',
        problem_id: 'seed-2',
        storage_path: 'inline://3%0A2%204%203%0A3%0A5%206%204',
        visibility: 'sample',
        input_data: '3\n2 4 3\n3\n5 6 4',
        expected_output: '7 0 8',
        metadata: { input_preview: '3\n2 4 3\n3\n5 6 4', expected_output_preview: '7 0 8' },
      },
      {
        id: 'tc-2-hidden-1',
        problem_id: 'seed-2',
        storage_path: 'inline://7%0A9%209%209%209%209%209%209%0A4%0A9%209%209%209',
        visibility: 'hidden',
        input_data: '7\n9 9 9 9 9 9 9\n4\n9 9 9 9',
        expected_output: '8 9 9 9 0 0 0 1',
        metadata: { input_preview: '9s with carry chain', expected_output_preview: '8 9 9 9 0 0 0 1' },
      },
    ],
  },
  {
    id: 'seed-3',
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    statement:
      'Given a string `s`, find the length of the longest substring without duplicate characters.',
    input_format: 'A single line containing the string `s`.',
    output_format: 'An integer representing the maximum length.',
    constraints: '0 <= s.length <= 5 * 10^4\n`s` consists of English letters, digits, symbols and spaces.',
    difficulty: 'medium',
    tags: ['Sliding Window', 'Strings', 'Hash Table'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      { input: 'abcabcbb', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 'bbbbb', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 'pwwkew', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    explanation: 'Use a sliding window with two pointers and a character index map.',
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def solve():
    s = sys.stdin.readline().rstrip('\\r\\n')
    used = {}
    max_len = 0
    start = 0
    for i, char in enumerate(s):
        if char in used and start <= used[char]:
            start = used[char] + 1
        else:
            max_len = max(max_len, i - start + 1)
        used[char] = i
    print(max_len)

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def solve():
    s = sys.stdin.readline().rstrip('\\r\\n')
    used = {}
    max_len = 0
    start = 0
    for i in range(len(s)):
        char = s[i]
        if char in used and start <= used[char]:
            start = used[char] + 1
        else:
            max_len = max(max_len, i - start + 1)
        used[char] = i
    print max_len

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    string s;
    if (!getline(cin, s)) {
        cout << 0 << endl;
        return 0;
    }
    vector<int> last(256, -1);
    int max_len = 0, start = 0;
    for (int i = 0; i < (int)s.length(); i++) {
        unsigned char c = s[i];
        if (last[c] >= start) {
            start = last[c] + 1;
        } else {
            max_len = max(max_len, i - start + 1);
        }
        last[c] = i;
    }
    cout << max_len << endl;
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <string.h>

int main() {
    char s[60000];
    if (!fgets(s, sizeof(s), stdin)) {
        printf("0\\n");
        return 0;
    }
    int len = strlen(s);
    if (len > 0 && s[len - 1] == '\\n') s[--len] = '\\0';
    if (len > 0 && s[len - 1] == '\\r') s[--len] = '\\0';
    
    int last[256];
    for (int i = 0; i < 256; i++) last[i] = -1;
    int max_len = 0, start = 0;
    for (int i = 0; i < len; i++) {
        unsigned char c = (unsigned char)s[i];
        if (last[c] >= start) {
            start = last[c] + 1;
        } else {
            int cur = i - start + 1;
            if (cur > max_len) max_len = cur;
        }
        last[c] = i;
    }
    printf("%d\\n", max_len);
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, start = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (map.containsKey(c) && map.get(c) >= start) {
                start = map.get(c) + 1;
            } else {
                maxLen = Math.max(maxLen, i - start + 1);
            }
            map.put(c, i);
        }
        System.out.println(maxLen);
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8');
    const s = input.split(/\\r?\\n/)[0] || '';
    const map = new Map();
    let maxLen = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (map.has(c) && map.get(c) >= start) {
            start = map.get(c) + 1;
        } else {
            maxLen = Math.max(maxLen, i - start + 1);
        }
        map.set(c, i);
    }
    console.log(maxLen);
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-3-sample-1',
        problem_id: 'seed-3',
        storage_path: 'inline://abcabcbb',
        visibility: 'sample',
        input_data: 'abcabcbb',
        expected_output: '3',
        metadata: { input_preview: 'abcabcbb', expected_output_preview: '3' },
      },
      {
        id: 'tc-3-hidden-1',
        problem_id: 'seed-3',
        storage_path: 'inline://tmmzuxt',
        visibility: 'hidden',
        input_data: 'tmmzuxt',
        expected_output: '5',
        metadata: { input_preview: 'tmmzuxt', expected_output_preview: '5' },
      },
    ],
  },
  {
    id: 'seed-4',
    slug: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    statement:
      'Given two sorted arrays `nums1` and `nums2` of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
    input_format:
      'Line 1: N (size of nums1)\nLine 2: N space-separated sorted numbers (empty if N=0)\nLine 3: M (size of nums2)\nLine 4: M space-separated sorted numbers (empty if M=0)',
    output_format: 'The median formatted to 1 decimal place (e.g. 2.0 or 2.5).',
    constraints: 'nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000',
    difficulty: 'hard',
    tags: ['Binary Search', 'Divide and Conquer', 'Arrays'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      { input: '2\n1 3\n1\n2', output: '2.0', explanation: 'merged array = [1,2,3] and median is 2.0.' },
      { input: '2\n1 2\n2\n3 4', output: '2.5', explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.' },
    ],
    explanation: 'Binary search for the partition on the smaller array.',
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    idx = 0
    n = int(tokens[idx]); idx += 1
    a = [int(tokens[idx + i]) for i in range(n)]; idx += n
    m = int(tokens[idx]); idx += 1
    b = [int(tokens[idx + i]) for i in range(m)]; idx += m
    
    merged = sorted(a + b)
    total = len(merged)
    if total % 2 == 1:
        ans = float(merged[total // 2])
    else:
        ans = (merged[total // 2 - 1] + merged[total // 2]) / 2.0
    print(f"{ans:.1f}")

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    idx = 0
    n = int(tokens[idx]); idx += 1
    a = [int(tokens[idx + i]) for i in range(n)]; idx += n
    m = int(tokens[idx]); idx += 1
    b = [int(tokens[idx + i]) for i in range(m)]; idx += m
    
    merged = sorted(a + b)
    total = len(merged)
    if total % 2 == 1:
        ans = float(merged[total // 2])
    else:
        ans = (merged[total // 2 - 1] + merged[total // 2]) / 2.0
    print "%.1f" % ans

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int m;
    cin >> m;
    vector<int> b(m);
    for (int i = 0; i < m; i++) cin >> b[i];
    
    vector<int> c(n + m);
    merge(a.begin(), a.end(), b.begin(), b.end(), c.begin());
    int total = n + m;
    double median;
    if (total % 2 == 1) {
        median = c[total / 2];
    } else {
        median = (c[total / 2 - 1] + c[total / 2]) / 2.0;
    }
    cout << fixed << setprecision(1) << median << "\n";
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    int *a = (int *)malloc(sizeof(int) * (n + 1));
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    scanf("%d", &m);
    int *b = (int *)malloc(sizeof(int) * (m + 1));
    for (int i = 0; i < m; i++) scanf("%d", &b[i]);
    
    int *c = (int *)malloc(sizeof(int) * (n + m + 1));
    int i = 0, j = 0, k = 0;
    while (i < n && j < m) {
        if (a[i] <= b[j]) c[k++] = a[i++];
        else c[k++] = b[j++];
    }
    while (i < n) c[k++] = a[i++];
    while (j < m) c[k++] = b[j++];
    
    int total = n + m;
    double median;
    if (total % 2 == 1) {
        median = c[total / 2];
    } else {
        median = (c[total / 2 - 1] + c[total / 2]) / 2.0;
    }
    printf("%.1f\\n", median);
    free(a); free(b); free(c);
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        int m = sc.nextInt();
        int[] b = new int[m];
        for (int i = 0; i < m; i++) b[i] = sc.nextInt();
        
        int[] c = new int[n + m];
        int i = 0, j = 0, k = 0;
        while (i < n && j < m) {
            c[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];
        }
        while (i < n) c[k++] = a[i++];
        while (j < m) c[k++] = b[j++];
        
        int total = n + m;
        double median = (total % 2 == 1) ? c[total / 2] : (c[total / 2 - 1] + c[total / 2]) / 2.0;
        System.out.printf(Locale.US, "%.1f\\n", median);
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!tokens || tokens.length === 0 || tokens[0] === '') return;
    let idx = 0;
    const n = parseInt(tokens[idx++], 10);
    const a = [];
    for (let i = 0; i < n; i++) a.push(parseInt(tokens[idx++], 10));
    const m = parseInt(tokens[idx++], 10);
    const b = [];
    for (let i = 0; i < m; i++) b.push(parseInt(tokens[idx++], 10));
    
    const c = [...a, ...b].sort((x, y) => x - y);
    const total = c.length;
    const ans = total % 2 === 1 ? c[Math.floor(total / 2)] : (c[total / 2 - 1] + c[total / 2]) / 2;
    console.log(ans.toFixed(1));
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-4-sample-1',
        problem_id: 'seed-4',
        storage_path: 'inline://2%0A1%203%0A1%0A2',
        visibility: 'sample',
        input_data: '2\n1 3\n1\n2',
        expected_output: '2.0',
        metadata: { input_preview: '2\n1 3\n1\n2', expected_output_preview: '2.0' },
      },
      {
        id: 'tc-4-hidden-1',
        problem_id: 'seed-4',
        storage_path: 'inline://0%0A2%0A1%202',
        visibility: 'hidden',
        input_data: '0\n\n2\n1 2',
        expected_output: '1.5',
        metadata: { input_preview: 'Empty first array', expected_output_preview: '1.5' },
      },
    ],
  },
  {
    id: 'seed-5',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    statement:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    input_format: 'A single line containing the string s.',
    output_format: 'Print "true" if the string is valid, or "false" otherwise.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only: ()[]{}',
    difficulty: 'easy',
    tags: ['Stack', 'Strings'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      { input: '()', output: 'true', explanation: 'Single matched pair.' },
      { input: '()[]{}', output: 'true', explanation: 'All pairs properly open and close.' },
      { input: '(]', output: 'false', explanation: 'Mismatched closing bracket.' },
    ],
    explanation: 'Use a stack to match brackets in LIFO order.',
    languages: [
      {
        language: 'python',
        starter_code: `import sys

def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s.strip():
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print("true" if isValid(s) else "false")
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def isValid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s.strip():
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return len(stack) == 0

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print "true" if isValid(s) else "false"
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <string>
#include <stack>

using namespace std;

bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << "\\n";
    }
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool isValid(const char *s) {
    char stack[10005];
    int top = -1;
    for (int i = 0; s[i] != '\\0'; i++) {
        char c = s[i];
        if (c == '(' || c == '{' || c == '[') {
            stack[++top] = c;
        } else {
            if (top == -1) return false;
            char t = stack[top--];
            if (c == ')' && t != '(') return false;
            if (c == '}' && t != '{') return false;
            if (c == ']' && t != '[') return false;
        }
    }
    return top == -1;
}

int main() {
    char s[10005];
    if (scanf("%s", s) == 1) {
        printf("%s\\n", isValid(s) ? "true" : "false");
    }
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        Stack<Character> stack = new Stack<>();
        boolean ok = true;
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') stack.push(c);
            else {
                if (stack.isEmpty()) { ok = false; break; }
                char top = stack.pop();
                if (c == ')' && top != '(') { ok = false; break; }
                if (c == '}' && top != '{') { ok = false; break; }
                if (c == ']' && top != '[') { ok = false; break; }
            }
        }
        if (!stack.isEmpty()) ok = false;
        System.out.println(ok ? "true" : "false");
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) return;
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (c === '(' || c === '{' || c === '[') {
            stack.push(c);
        } else {
            if (stack.length === 0 || stack.pop() !== map[c]) {
                console.log("false");
                return;
            }
        }
    }
    console.log(stack.length === 0 ? "true" : "false");
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-5-sample-1',
        problem_id: 'seed-5',
        storage_path: 'inline://%28%29',
        visibility: 'sample',
        input_data: '()',
        expected_output: 'true',
        metadata: { input_preview: '()', expected_output_preview: 'true' },
      },
      {
        id: 'tc-5-sample-2',
        problem_id: 'seed-5',
        storage_path: 'inline://%28%5D',
        visibility: 'sample',
        input_data: '(]',
        expected_output: 'false',
        metadata: { input_preview: '(]', expected_output_preview: 'false' },
      },
      {
        id: 'tc-5-hidden-1',
        problem_id: 'seed-5',
        storage_path: 'inline://%7B%5B%5D%7D',
        visibility: 'hidden',
        input_data: '{[]}',
        expected_output: 'true',
        metadata: { input_preview: '{[]}', expected_output_preview: 'true' },
      },
    ],
  },
  {
    id: 'seed-6',
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    statement:
      'You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    input_format:
      'Line 1: K (number of lists)\nNext K lines: First integer M (size of list), followed by M space-separated integers.',
    output_format: 'Space-separated integers of the merged sorted list.',
    constraints: 'k >= 0\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nTotal nodes <= 10^4',
    difficulty: 'hard',
    tags: ['Linked Lists', 'Heap', 'Divide and Conquer'],
    status: 'published',
    created_by: 'system',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    examples: [
      {
        input: '3\n3 1 4 5\n3 1 3 4\n2 2 6',
        output: '1 1 2 3 4 4 5 6',
        explanation: 'The lists are merged in ascending order.',
      },
    ],
    explanation: 'Use a priority queue / min-heap of size K to merge lists in O(N log K) time.',
    languages: [
      {
        language: 'python',
        starter_code: `import sys
import heapq

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    k = int(lines[0].strip())
    all_elements = []
    for i in range(1, k + 1):
        if i >= len(lines):
            break
        parts = [int(x) for x in lines[i].split()]
        if len(parts) > 1:
            all_elements.extend(parts[1:])
    all_elements.sort()
    print(" ".join(str(x) for x in all_elements))

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'python2',
        starter_code: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    k = int(lines[0].strip())
    all_elements = []
    for i in range(1, k + 1):
        if i >= len(lines):
            break
        parts = [int(x) for x in lines[i].split()]
        if len(parts) > 1:
            all_elements.extend(parts[1:])
    all_elements.sort()
    print " ".join(str(x) for x in all_elements)

if __name__ == '__main__':
    solve()
`,
      },
      {
        language: 'cpp',
        starter_code: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    int k;
    if (!(cin >> k)) return 0;
    vector<int> all_nums;
    for (int i = 0; i < k; i++) {
        int m;
        cin >> m;
        for (int j = 0; j < m; j++) {
            int val;
            cin >> val;
            all_nums.push_back(val);
        }
    }
    sort(all_nums.begin(), all_nums.end());
    for (size_t i = 0; i < all_nums.size(); i++) {
        cout << all_nums[i] << (i + 1 == all_nums.size() ? "" : " ");
    }
    cout << "\\n";
    return 0;
}
`,
      },
      {
        language: 'c',
        starter_code: `#include <stdio.h>
#include <stdlib.h>

int cmp(const void *a, const void *b) {
    return (*(int *)a - *(int *)b);
}

int main() {
    int k;
    if (scanf("%d", &k) != 1) return 0;
    int *nums = (int *)malloc(sizeof(int) * 50000);
    int total = 0;
    for (int i = 0; i < k; i++) {
        int m;
        scanf("%d", &m);
        for (int j = 0; j < m; j++) {
            scanf("%d", &nums[total++]);
        }
    }
    qsort(nums, total, sizeof(int), cmp);
    for (int i = 0; i < total; i++) {
        printf("%d%s", nums[i], (i + 1 == total) ? "" : " ");
    }
    printf("\\n");
    free(nums);
    return 0;
}
`,
      },
      {
        language: 'java',
        starter_code: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int k = sc.nextInt();
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            int m = sc.nextInt();
            for (int j = 0; j < m; j++) {
                list.add(sc.nextInt());
            }
        }
        Collections.sort(list);
        for (int i = 0; i < list.size(); i++) {
            System.out.print(list.get(i) + (i + 1 == list.size() ? "" : " "));
        }
        System.out.println();
    }
}
`,
      },
      {
        language: 'javascript',
        starter_code: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (input.length === 0 || input[0] === '') return;
    const k = parseInt(input[0], 10);
    const all = [];
    for (let i = 1; i <= k; i++) {
        if (i >= input.length) break;
        const parts = input[i].trim().split(/\\s+/).map(Number);
        if (parts.length > 1) {
            all.push(...parts.slice(1));
        }
    }
    all.sort((a, b) => a - b);
    console.log(all.join(' '));
}

solve();
`,
      },
    ],
    test_cases: [
      {
        id: 'tc-6-sample-1',
        problem_id: 'seed-6',
        storage_path: 'inline://3%0A3%201%204%205%0A3%201%203%204%0A2%202%206',
        visibility: 'sample',
        input_data: '3\n3 1 4 5\n3 1 3 4\n2 2 6',
        expected_output: '1 1 2 3 4 4 5 6',
        metadata: { input_preview: '3 lists', expected_output_preview: '1 1 2 3 4 4 5 6' },
      },
      {
        id: 'tc-6-hidden-1',
        problem_id: 'seed-6',
        storage_path: 'inline://2%0A1%20-5%0A1%20-10',
        visibility: 'hidden',
        input_data: '2\n1 -5\n1 -10',
        expected_output: '-10 -5',
        metadata: { input_preview: 'Negative numbers merge', expected_output_preview: '-10 -5' },
      },
    ],
  },
];

// In-memory store for problems (synchronized across server and active sessions)
const problemStore = new Map<string, ServerProblem>();

// Initialize default seed problems into store
for (const p of SEED_PROBLEMS) {
  problemStore.set(p.id, p);
  problemStore.set(p.slug, p);
}

// ============================================================================
// SERVER ENGINE FUNCTIONS
// ============================================================================

/**
 * Get all problems with role-based filtering.
 * Students only get published problems.
 */
export async function getProblems(
  role: UserRole = 'student',
  filter?: { status?: string; difficulty?: string; search?: string },
  supabase?: SupabaseClient
): Promise<ServerProblem[]> {
  // 1. Try Supabase query if available
  if (supabase) {
    try {
      let query = supabase.from('problems').select('*').order('created_at', { ascending: false });
      if (role === 'student') {
        query = query.eq('status', 'published');
      } else if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.difficulty && filter.difficulty !== 'All') {
        query = query.eq('difficulty', filter.difficulty.toLowerCase());
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Return DB data merged with languages
        return data as ServerProblem[];
      }
    } catch {
      // Fall through to memory store
    }
  }

  // 2. Memory store
  const uniqueProblems: ServerProblem[] = [];
  const seenIds = new Set<string>();

  for (const problem of problemStore.values()) {
    if (seenIds.has(problem.id)) continue;
    seenIds.add(problem.id);

    // Role check: Students can only view published problems
    if (role === 'student' && problem.status !== 'published') {
      continue;
    }

    if (filter?.status && filter.status !== 'all' && problem.status !== filter.status) {
      continue;
    }

    if (
      filter?.difficulty &&
      filter.difficulty !== 'All' &&
      problem.difficulty.toLowerCase() !== filter.difficulty.toLowerCase()
    ) {
      continue;
    }

    if (filter?.search) {
      const s = filter.search.toLowerCase();
      const match =
        problem.title.toLowerCase().includes(s) ||
        problem.slug.toLowerCase().includes(s) ||
        problem.tags.some((t) => t.toLowerCase().includes(s));
      if (!match) continue;
    }

    uniqueProblems.push(problem);
  }

  return uniqueProblems.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Get problem by slug or ID with strict hidden test protection for students.
 */
export async function getProblemBySlugOrId(
  slugOrId: string,
  role: UserRole = 'student',
  supabase?: SupabaseClient
): Promise<ServerProblem | null> {
  if (!slugOrId) return null;

  // 1. Try Supabase
  if (supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const query = supabase.from('problems').select('*');
      const { data: dbProblem, error } = isUuid
        ? await query.eq('id', slugOrId).maybeSingle()
        : await query.eq('slug', slugOrId).maybeSingle();

      if (!error && dbProblem) {
        // Check access
        if (role === 'student' && dbProblem.status !== 'published') {
          return null;
        }

        // Fetch languages
        const { data: languages } = await supabase
          .from('problem_languages')
          .select('language, starter_code')
          .eq('problem_id', dbProblem.id);

        // Fetch test cases (RLS already enforces sample-only for students)
        const { data: testCases } = await supabase
          .from('test_cases')
          .select('*')
          .eq('problem_id', dbProblem.id);

        const safeTestCases = (testCases || []).filter((tc: any) =>
          role === 'student' ? tc.visibility === 'sample' : true
        );

        return {
          ...dbProblem,
          languages: (languages as ProblemLanguageItem[]) || [],
          test_cases: safeTestCases as ProblemTestCaseItem[],
        };
      }
    } catch {
      // Fall through
    }
  }

  // 2. Memory store
  const found = problemStore.get(slugOrId);
  if (!found) return null;

  // Role check
  if (role === 'student' && found.status !== 'published') {
    return null;
  }

  // Filter hidden test cases for students
  const filteredTestCases = found.test_cases.filter((tc) =>
    role === 'student' ? tc.visibility === 'sample' : true
  );

  return {
    ...found,
    test_cases: filteredTestCases,
  };
}

/**
 * Get problem WITH hidden test cases for authoritative server-side judge execution.
 * Never exposed to client API responses.
 */
export function getProblemForJudging(slugOrId: string): ServerProblem | null {
  return problemStore.get(slugOrId) || null;
}

/**
 * Create a new problem (Coordinator & Admin only).
 */
export async function createProblem(
  data: Partial<ServerProblem>,
  creatorUser: { id: string; email?: string; role: UserRole },
  supabase?: SupabaseClient
): Promise<{ success: boolean; data?: ServerProblem; error?: string }> {
  if (creatorUser.role !== 'admin' && creatorUser.role !== 'coordinator') {
    return { success: false, error: 'FORBIDDEN: Event Coordinator or Platform Administrator privileges required.' };
  }

  if (!data.title || data.title.trim().length < 3) {
    return { success: false, error: 'Problem title must be at least 3 characters.' };
  }

  const slug = data.slug || generateSlug(data.title);
  const now = new Date().toISOString();
  const problemId = `prob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newProblem: ServerProblem = {
    id: problemId,
    title: data.title.trim(),
    slug,
    statement: data.statement || '',
    input_format: data.input_format || '',
    output_format: data.output_format || '',
    constraints: data.constraints || '',
    examples: data.examples || [],
    explanation: data.explanation || '',
    difficulty: data.difficulty || 'easy',
    tags: data.tags || [],
    status: data.status || 'draft',
    created_by: creatorUser.id,
    created_at: now,
    updated_at: now,
    languages: data.languages || [],
    test_cases: (data.test_cases || []).map((tc, idx) => ({
      id: tc.id || `tc-${problemId}-${idx}`,
      problem_id: problemId,
      storage_path: tc.storage_path || `inline://${encodeURIComponent(tc.input_data || '')}`,
      visibility: tc.visibility || 'sample',
      input_data: tc.input_data,
      expected_output: tc.expected_output,
      metadata: tc.metadata || {},
    })),
  };

  // 1. Try Supabase write
  if (supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from('problems')
        .insert({
          title: newProblem.title,
          slug: newProblem.slug,
          statement: newProblem.statement,
          input_format: newProblem.input_format,
          output_format: newProblem.output_format,
          constraints: newProblem.constraints,
          examples: newProblem.examples,
          explanation: newProblem.explanation,
          difficulty: newProblem.difficulty,
          tags: newProblem.tags,
          status: newProblem.status,
          created_by: creatorUser.id,
        })
        .select()
        .single();

      if (!error && inserted) {
        newProblem.id = inserted.id;

        // Languages
        if (newProblem.languages.length > 0) {
          await supabase.from('problem_languages').insert(
            newProblem.languages.map((l) => ({
              problem_id: inserted.id,
              language: l.language,
              starter_code: l.starter_code,
            }))
          );
        }

        // Test Cases
        if (newProblem.test_cases.length > 0) {
          await supabase.from('test_cases').insert(
            newProblem.test_cases.map((tc) => ({
              problem_id: inserted.id,
              storage_path: tc.storage_path,
              visibility: tc.visibility,
              metadata: tc.metadata || {},
            }))
          );
        }
      }
    } catch {
      // Memory store fallback
    }
  }

  // 2. Persist in memory store
  problemStore.set(newProblem.id, newProblem);
  problemStore.set(newProblem.slug, newProblem);

  return { success: true, data: newProblem };
}

/**
 * Update an existing problem (Coordinator & Admin only).
 */
export async function updateProblem(
  idOrSlug: string,
  data: Partial<ServerProblem>,
  updaterUser: { id: string; role: UserRole },
  supabase?: SupabaseClient
): Promise<{ success: boolean; data?: ServerProblem; error?: string }> {
  if (updaterUser.role !== 'admin' && updaterUser.role !== 'coordinator') {
    return { success: false, error: 'FORBIDDEN: Event Coordinator or Platform Administrator privileges required.' };
  }

  const existing = problemStore.get(idOrSlug);
  if (!existing) {
    return { success: false, error: 'Problem not found.' };
  }

  const now = new Date().toISOString();
  const updated: ServerProblem = {
    ...existing,
    ...data,
    updated_at: now,
    languages: data.languages || existing.languages,
    test_cases: data.test_cases || existing.test_cases,
  };

  // Try Supabase update
  if (supabase) {
    try {
      await supabase
        .from('problems')
        .update({
          title: updated.title,
          slug: updated.slug,
          statement: updated.statement,
          input_format: updated.input_format,
          output_format: updated.output_format,
          constraints: updated.constraints,
          examples: updated.examples,
          explanation: updated.explanation,
          difficulty: updated.difficulty,
          tags: updated.tags,
          status: updated.status,
          updated_at: now,
        })
        .eq('id', existing.id);
    } catch {
      // Fallback
    }
  }

  problemStore.set(updated.id, updated);
  problemStore.set(updated.slug, updated);

  return { success: true, data: updated };
}

/**
 * Delete a problem (Admin only).
 */
export async function deleteProblem(
  idOrSlug: string,
  deleterUser: { id: string; role: UserRole },
  supabase?: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  if (deleterUser.role !== 'admin') {
    return { success: false, error: 'FORBIDDEN: Platform Administrator privileges required to delete problems.' };
  }

  const existing = problemStore.get(idOrSlug);
  if (!existing) {
    return { success: false, error: 'Problem not found.' };
  }

  if (supabase) {
    try {
      await supabase.from('problems').delete().eq('id', existing.id);
    } catch {}
  }

  problemStore.delete(existing.id);
  problemStore.delete(existing.slug);

  return { success: true };
}
