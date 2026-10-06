/**
 * Staff Problem Management Listing Page (Phase 3)
 *
 * Dedicated authorized dashboard for Coordinators and Administrators to inspect,
 * filter, create, edit, and publish problem definitions.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  FileCode,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  UploadCloud,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  AlertCircle,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import type { ProblemRow } from '@/src/types/database';
import { problemService } from '../services/problemService';

export function ProblemManagementListPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await problemService.getProblems({
        status: statusFilter,
        difficulty: difficultyFilter,
        search: searchTerm,
      });
      if (data) {
        setProblems(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [statusFilter, difficultyFilter]);

  const filteredProblems = problems.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchSearch;
  });

  const handleQuickPublish = async (problem: ProblemRow) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch full problem details with test cases
      const { data: fullProblem } = await problemService.getProblemBySlug(problem.slug);
      if (!fullProblem) {
        setActionNotice('Could not retrieve problem details.');
        return;
      }

      // Check validation
      const result = await problemService.publishProblem(
        fullProblem.id,
        {
          title: fullProblem.title,
          slug: fullProblem.slug,
          statement: fullProblem.statement,
          input_format: fullProblem.input_format,
          output_format: fullProblem.output_format,
          constraints: fullProblem.constraints,
          examples: (fullProblem.examples as any) || [],
          explanation: fullProblem.explanation || '',
          difficulty: fullProblem.difficulty,
          tags: fullProblem.tags || [],
          status: 'published',
          languages: fullProblem.languages || [],
          test_cases: fullProblem.test_cases || [],
        },
        user.id
      );

      if (result.error) {
        setActionNotice(`Cannot publish: ${result.error.message}`);
      } else {
        setActionNotice(`Problem "${problem.title}" published successfully!`);
        fetchProblems();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProblem = async (problemId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await problemService.deleteProblem(problemId);
      if (res.error) {
        setActionNotice(`Failed to delete problem: ${res.error.message}`);
      } else {
        setActionNotice(`Problem "${title}" deleted successfully.`);
        fetchProblems();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#241D4D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase bg-[#7C3AED]/15 text-[#C084FC] border border-[#7C3AED]/30 px-2 py-0.5 rounded font-semibold">
              Staff Portal • {profile?.role?.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] flex items-center gap-2.5">
            <FileCode className="w-7 h-7 text-[#F59E0B]" />
            <span>Problem Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Author algorithmic challenges, manage starter templates, attach hidden judging test cases, and publish to the student problem catalog.
          </p>
        </div>

        <Link
          to="/problems/manage/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#F59E0B]/20 active:scale-[0.99] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Author New Problem</span>
        </Link>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-xs text-[#FBBF24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="hover:underline text-[11px] font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0E0B28] p-3.5 rounded-2xl border border-[#241D4D]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search authored problems by title, slug, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'draft', 'published', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20 font-extrabold'
                  : 'bg-[#08051A] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#241D4D]'
              }`}
            >
              {st}
            </button>
          ))}

          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs text-[#94A3B8] focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="All">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problem Table */}
      <div className="rounded-2xl border border-[#241D4D] bg-[#0E0B28] overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#F59E0B] mx-auto" />
            <p className="text-xs text-[#94A3B8] font-mono">Loading problem catalog...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <FileCode className="w-8 h-8 text-[#64748B] mx-auto opacity-40" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F8FAFC]">No problems found</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                {statusFilter === 'all'
                  ? 'No authored problems exist yet. Get started by drafting your first problem challenge.'
                  : `No problems currently match the status filter "${statusFilter}".`}
              </p>
            </div>
            <Link
              to="/problems/manage/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Problem</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#241D4D] bg-[#0A061E]/90 text-[#94A3B8] font-mono uppercase text-[11px]">
                  <th className="py-3.5 px-4">Title &amp; Slug</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Tags</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#241D4D]/60 text-[#F8FAFC]">
                {filteredProblems.map((prob) => {
                  const isPublished = prob.status === 'published';
                  const diffColor =
                    prob.difficulty === 'easy'
                      ? 'bg-[#064E3B]/40 text-[#34D399] border-[#059669]/50'
                      : prob.difficulty === 'medium'
                      ? 'bg-[#78350F]/40 text-[#FBBF24] border-[#D97706]/50'
                      : 'bg-[#881337]/40 text-[#FB7185] border-[#E11D48]/50';

                  return (
                    <tr
                      key={prob.id}
                      className="hover:bg-[#15103A]/60 transition-colors group"
                    >
                      {/* Title & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                          {prob.title}
                        </div>
                        <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                          /problems/{prob.slug}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${diffColor}`}
                        >
                          {prob.difficulty}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {prob.tags && prob.tags.length > 0 ? (
                            prob.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-[#181242] text-[#C4B5FD] px-2 py-0.5 rounded border border-[#2A205E] font-mono"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#64748B] italic">None</span>
                          )}
                          {prob.tags && prob.tags.length > 3 && (
                            <span className="text-[10px] text-[#94A3B8] font-mono">
                              +{prob.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                            isPublished
                              ? 'text-[#34D399] bg-[#064E3B]/40 border-[#059669]/50'
                              : 'text-[#FBBF24] bg-[#78350F]/40 border-[#D97706]/50'
                          }`}
                        >
                          {isPublished ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{prob.status.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/problems/manage/${prob.slug}/preview`}
                            className="p-2 rounded-xl border border-[#241D4D] bg-[#15103A] hover:border-[#F59E0B] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            title="Preview Student View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/problems/manage/${prob.slug}/edit`}
                            className="p-2 rounded-xl border border-[#241D4D] bg-[#15103A] hover:border-[#7C3AED] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            title="Edit Problem"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>

                          {!isPublished && (
                            <button
                              type="button"
                              onClick={() => handleQuickPublish(prob)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white border border-[#7C3AED]/40 text-xs font-bold transition-all"
                              title="Publish problem"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          {profile?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteProblem(prob.id, prob.title)}
                              className="p-2 rounded-xl border border-[#241D4D] bg-[#15103A] hover:border-[#EF4444] text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                              title="Delete Problem (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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

