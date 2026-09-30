/**
 * Dedicated Staff Problem Preview Page (Phase 3)
 *
 * Full-page student perspective preview accessible via /problems/manage/:slug/preview.
 * Conceals hidden test cases and administrative metadata.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  ArrowLeft,
  Edit3,
  UploadCloud,
  Eye,
  Tag,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import type { ProblemWithRelations } from '../types';
import { problemService } from '../services/problemService';

export function ProblemPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<ProblemWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    problemService.getProblemBySlug(slug).then(({ data, error }) => {
      if (data) {
        setProblem(data);
      }
      setIsLoading(false);
    });
  }, [slug]);

  const handlePublish = async () => {
    if (!problem || !user) return;
    setIsPublishing(true);
    setNotice(null);

    try {
      const result = await problemService.publishProblem(
        problem.id,
        {
          title: problem.title,
          slug: problem.slug,
          statement: problem.statement,
          input_format: problem.input_format,
          output_format: problem.output_format,
          constraints: problem.constraints,
          examples: (problem.examples as any) || [],
          explanation: problem.explanation || '',
          difficulty: problem.difficulty,
          tags: problem.tags || [],
          status: 'published',
          languages: problem.languages || [],
          test_cases: problem.test_cases || [],
        },
        user.id
      );

      if (result.error) {
        setNotice({ type: 'error', message: result.error.message });
      } else {
        setProblem({ ...problem, status: 'published' });
        setNotice({
          type: 'success',
          message: 'Problem published successfully! Visible to students in the catalog.',
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#F59E0B] mx-auto" />
        <p className="text-xs text-[#9CA3AF]">Loading problem preview...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 rounded-2xl border border-[#263833] bg-[#0D1A17] space-y-3">
          <AlertCircle className="w-8 h-8 text-[#F59E0B] mx-auto" />
          <h2 className="text-base font-bold text-[#F8FAFC]">Problem Not Found</h2>
          <Link
            to="/problems/manage"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#07110F] text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Problem Management</span>
          </Link>
        </div>
      </div>
    );
  }

  const isPublished = problem.status === 'published';
  const diffClass =
    problem.difficulty === 'easy'
      ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
      : problem.difficulty === 'medium'
      ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
      : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30';

  const examplesList = (problem.examples as any[]) || [];

  return (
    <div className="space-y-6">
      {/* Staff Preview Bar */}
      <div className="rounded-xl border border-[#F59E0B]/40 bg-[#12221E] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Eye className="w-5 h-5 text-[#F59E0B]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-[#F59E0B] font-bold">
                Staff Preview Mode
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                  isPublished
                    ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                    : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
                }`}
              >
                {problem.status}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Conceals hidden test cases and administrative metadata. Mirrors the exact student experience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/problems/manage/${problem.slug}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#07110F] hover:border-[#F59E0B] text-xs font-semibold text-[#F8FAFC] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in Workspace</span>
          </Link>

          {!isPublished && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#07110F] text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Problem'}</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Main Student-View Presentation */}
      <div className="rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 sm:p-8 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-3 pb-6 border-b border-[#263833]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border uppercase ${diffClass}`}
            >
              {problem.difficulty}
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">Time Limit: 1.0s</span>
            <span className="text-xs text-[#9CA3AF] font-mono">Memory: 256MB</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            {problem.title}
          </h1>

          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#12221E] text-[#9CA3AF] px-2.5 py-0.5 rounded border border-[#263833]"
                >
                  <Tag className="w-2.5 h-2.5 text-[#F59E0B]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Statement */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Problem Statement</h2>
          <div className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
            {problem.statement}
          </div>
        </div>

        {/* Input & Output Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#263833] bg-[#07110F] space-y-2">
            <h3 className="text-xs font-semibold text-[#F8FAFC]">Input Format</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
              {problem.input_format}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#263833] bg-[#07110F] space-y-2">
            <h3 className="text-xs font-semibold text-[#F8FAFC]">Output Format</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
              {problem.output_format}
            </p>
          </div>
        </div>

        {/* Constraints */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Constraints</h2>
          <pre className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap">
            {problem.constraints}
          </pre>
        </div>

        {/* Public Examples */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Examples</h2>
          {examplesList.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] italic">No public examples defined.</p>
          ) : (
            examplesList.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="rounded-xl border border-[#263833] bg-[#07110F] p-4 space-y-3"
              >
                <span className="text-xs font-mono font-semibold text-[#F59E0B]">
                  Example {idx + 1}
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[#9CA3AF] block mb-0.5">Input:</span>
                    <pre className="p-2.5 rounded-lg bg-[#0D1A17] border border-[#263833] text-[#F8FAFC] overflow-x-auto whitespace-pre-wrap">
                      {ex.input || '(empty)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block mb-0.5">Output:</span>
                    <pre className="p-2.5 rounded-lg bg-[#0D1A17] border border-[#263833] text-[#F8FAFC] overflow-x-auto whitespace-pre-wrap">
                      {ex.output || '(empty)'}
                    </pre>
                  </div>
                  {ex.explanation && (
                    <div className="pt-1 text-xs font-sans text-[#9CA3AF]">
                      <span className="text-[#F8FAFC] font-medium">Explanation: </span>
                      {ex.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Explanation */}
        {problem.explanation && (
          <div className="space-y-2 pt-4 border-t border-[#263833]">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Explanation &amp; Author Notes</h2>
            <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
              {problem.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
