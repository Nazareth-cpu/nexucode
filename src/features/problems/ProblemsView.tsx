/**
 * Problems Catalog View — Exact Implementation of Reference Panel 02
 *
 * Implements:
 * - Clean "Practice Problems" Header with icon, inline search & "+ Add Problem" Amber Action
 * - Tag Filter Pills (All [Amber], Arrays, Strings, DP, Graph, Math, Sorting, Search, More)
 * - Dark Elevated Problems Table Container (bg-[#0E0B28], border-[#241D4D])
 * - Columns: #, Title, Tags, Acceptance, Difficulty, Navigation Indicator
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Search,
  Plus,
  RefreshCw,
  FileCode,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import type { ProblemRow } from '@/src/types/database';
import { problemService } from './services/problemService';

const FILTER_TAGS = [
  'All',
  'Arrays',
  'Strings',
  'DP',
  'Graph',
  'Math',
  'Sorting',
  'Search',
];

export function ProblemsView() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isStaff = profile?.role === 'coordinator' || profile?.role === 'admin';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    problemService
      .getProblems({ status: 'published' })
      .then(({ data }) => {
        if (!isMounted) return;
        setProblems(data || []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProblems = problems.filter((p) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(s) ||
      p.slug.toLowerCase().includes(s) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(s)));

    const matchesTag =
      selectedTag === 'All' ||
      (p.tags &&
        p.tags.some(
          (t) =>
            t.toLowerCase().includes(selectedTag.toLowerCase()) ||
            (selectedTag === 'Arrays' && t.toLowerCase().includes('array')) ||
            (selectedTag === 'Strings' && t.toLowerCase().includes('string'))
        ));

    const matchesDiff =
      selectedDifficulty === 'All' ||
      p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesTag && matchesDiff;
  });

  return (
    <div className="space-y-6">
      {/* ----------------- TOP HEADER (Panel 02) ----------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A855F7] flex items-center justify-center font-mono font-bold text-base shrink-0 mt-0.5">
            &lt;/&gt;
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
              Practice Problems
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
              Enhance your problem solving skills with curated challenges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search problems input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0E0B28] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>

          {/* Add Problem Action */}
          {isStaff && (
            <Link
              to="/problems/manage/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] text-xs font-extrabold transition-all shadow-md shadow-[#F59E0B]/20 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Problem</span>
            </Link>
          )}
        </div>
      </div>

      {/* ----------------- TAG FILTERS & SEARCH ROW (Panel 02) ----------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tag Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-[#F59E0B] text-[#08051A] font-extrabold shadow-md shadow-[#F59E0B]/20'
                  : 'bg-[#0E0B28] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] border border-[#241D4D]'
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0E0B28] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] border border-[#241D4D] flex items-center gap-1 whitespace-nowrap"
          >
            <span>More</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1 bg-[#0E0B28] p-1 rounded-xl border border-[#241D4D] self-start md:self-auto">
          {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDifficulty === diff
                  ? 'bg-[#7C3AED] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------- PROBLEMS TABLE (Panel 02) ----------------- */}
      <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#F59E0B] mx-auto" />
            <p className="text-xs text-[#94A3B8] font-mono font-semibold">
              Loading problems from database...
            </p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <FileCode className="w-10 h-10 text-[#64748B] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#F8FAFC]">No problems found</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              No problems match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[#241D4D] bg-[#0A061E]/90 text-[#94A3B8] text-xs uppercase font-bold font-mono">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center text-[#64748B]">#</th>
                  <th className="py-3.5 px-4 text-[#94A3B8]">Title</th>
                  <th className="py-3.5 px-4 text-[#94A3B8]">Tags</th>
                  <th className="py-3.5 px-4 w-28 text-[#94A3B8]">Acceptance</th>
                  <th className="py-3.5 px-4 w-28 text-[#94A3B8]">Difficulty</th>
                  <th className="py-3.5 px-4 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#241D4D]/60 text-[#F8FAFC]">
                {filteredProblems.map((prob, idx) => {
                  const diff = prob.difficulty.toLowerCase();
                  const diffBadge =
                    diff === 'easy'
                      ? 'bg-[#064E3B]/40 text-[#34D399] border-[#059669]/50'
                      : diff === 'medium'
                      ? 'bg-[#78350F]/40 text-[#FBBF24] border-[#D97706]/50'
                      : 'bg-[#881337]/40 text-[#FB7185] border-[#E11D48]/50';

                  return (
                    <tr
                      key={prob.id || prob.slug}
                      className="hover:bg-[#15103A]/60 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4 text-center font-mono text-xs text-[#64748B] font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#F8FAFC]">
                        <Link
                          to={`/problems/${prob.slug}`}
                          className="group-hover:text-[#FBBF24] transition-colors block"
                        >
                          {prob.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {prob.tags && prob.tags.length > 0 ? (
                            prob.tags.map((t) => (
                              <span
                                key={t}
                                className="bg-[#181242] border border-[#2A205E] px-2.5 py-0.5 rounded-md text-[11px] font-mono text-[#C4B5FD] font-medium"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#64748B] italic">General</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#94A3B8] font-semibold">
                        49.8%
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border capitalize ${diffBadge}`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/problems/${prob.slug}`}
                          className="text-[#64748B] group-hover:text-[#FBBF24] group-hover:translate-x-0.5 transition-transform inline-block"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

