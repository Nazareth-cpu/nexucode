/**
 * Problems Catalog View (Protected)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Search, Filter, ArrowRight, CheckCircle2, Circle, Settings2, Plus } from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { problemService } from './services/problemService';

const SEED_PROBLEMS = [
  {
    id: 'seed-1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Arrays', 'Hash Map'],
    acceptance: '49.8%',
    status: 'Solved',
  },
  {
    id: 'seed-2',
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    tags: ['Linked Lists', 'Math'],
    acceptance: '40.3%',
    status: 'Attempted',
  },
  {
    id: 'seed-3',
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['Sliding Window', 'Strings'],
    acceptance: '34.2%',
    status: 'Todo',
  },
  {
    id: 'seed-4',
    slug: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    tags: ['Binary Search', 'Divide & Conquer'],
    acceptance: '37.1%',
    status: 'Todo',
  },
  {
    id: 'seed-5',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'Strings'],
    acceptance: '40.5%',
    status: 'Solved',
  },
  {
    id: 'seed-6',
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    tags: ['Linked Lists', 'Heap'],
    acceptance: '51.2%',
    status: 'Todo',
  },
];

export function ProblemsView() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [allProblems, setAllProblems] = useState(SEED_PROBLEMS);

  const isStaff = profile?.role === 'coordinator' || profile?.role === 'admin';

  useEffect(() => {
    problemService.getProblems({ status: 'published' }).then(({ data }) => {
      if (data && data.length > 0) {
        // Map published problems from database
        const publishedFormatted = data.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1),
          tags: p.tags || [],
          acceptance: '65.0%',
          status: 'Todo',
        }));

        // Merge published problems with seeds avoiding duplicate slugs
        const publishedSlugs = new Set(publishedFormatted.map((p) => p.slug));
        const nonDuplicateSeeds = SEED_PROBLEMS.filter((s) => !publishedSlugs.has(s.slug));
        setAllProblems([...publishedFormatted, ...nonDuplicateSeeds]);
      }
    });
  }, []);

  const filteredProblems = allProblems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff =
      selectedDifficulty === 'All' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Staff Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
            <Code2 className="w-7 h-7 text-[#F59E0B]" />
            <span>Problem Bank</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Curated algorithmic problems for chapter training, contest preparation, and technical interview readiness.
          </p>
        </div>

        {isStaff && (
          <Link
            to="/problems/manage"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#12221E] hover:bg-[#12221E]/80 text-[#F59E0B] hover:text-[#FBBF24] border border-[#263833] text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Staff Problem Management</span>
          </Link>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D1A17] p-3 rounded-xl border border-[#263833]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search problems by name or tag (e.g., Arrays, Hash Map)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDifficulty === diff
                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 shadow-sm'
                  : 'bg-[#07110F] text-[#9CA3AF] border border-[#263833] hover:text-[#F8FAFC]'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#263833] bg-[#07110F] text-[#9CA3AF] text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Problem Title</th>
                <th className="py-3 px-4 w-28">Difficulty</th>
                <th className="py-3 px-4 hidden md:table-cell">Tags</th>
                <th className="py-3 px-4 w-28 text-right">Acceptance</th>
                <th className="py-3 px-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263833]/60">
              {filteredProblems.map((prob) => (
                <tr
                  key={prob.slug}
                  className="hover:bg-[#12221E] transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 text-center">
                    {prob.status === 'Solved' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] mx-auto" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#9CA3AF]/30 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#F8FAFC]">
                    <Link
                      to={`/problems/${prob.slug}`}
                      className="group-hover:text-[#F59E0B] transition-colors hover:underline"
                    >
                      {prob.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                        prob.difficulty === 'Easy'
                          ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                          : prob.difficulty === 'Medium'
                          ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
                          : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell text-[#9CA3AF]">
                    <div className="flex flex-wrap gap-1">
                      {prob.tags.map((t) => (
                        <span
                          key={t}
                          className="bg-[#07110F] border border-[#263833] px-2 py-0.5 rounded text-[10px] font-mono text-[#9CA3AF]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#F8FAFC] text-xs">
                    {prob.acceptance}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/problems/${prob.slug}`}
                      className="text-[#9CA3AF] group-hover:text-[#F59E0B] transition-colors inline-block"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
