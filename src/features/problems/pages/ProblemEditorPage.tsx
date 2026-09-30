/**
 * Problem Authoring & Editing Workspace Page (Phase 3)
 *
 * Serves both /problems/manage/new and /problems/manage/:slug/edit
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import type { ProblemWithRelations } from '../types';
import { problemService } from '../services/problemService';
import { ProblemForm } from '../components/ProblemForm';

export function ProblemEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(slug);

  const [problemData, setProblemData] = useState<ProblemWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !slug) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    problemService
      .getProblemBySlug(slug)
      .then(({ data, error: err }) => {
        if (!isMounted) return;
        if (err || !data) {
          setError(err?.message || 'Failed to load problem details.');
        } else {
          setProblemData(data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'An unexpected error occurred.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isEditMode]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#F59E0B] mx-auto" />
        <p className="text-xs text-[#9CA3AF]">Loading problem authoring workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="p-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <h2 className="text-base font-bold text-[#F8FAFC]">Problem Not Found</h2>
          <p className="text-xs text-[#9CA3AF]">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/problems/manage')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-semibold text-[#F8FAFC] hover:border-[#F59E0B]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Problem Management</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProblemForm
      initialData={
        problemData
          ? {
              title: problemData.title,
              slug: problemData.slug,
              statement: problemData.statement,
              input_format: problemData.input_format,
              output_format: problemData.output_format,
              constraints: problemData.constraints,
              examples: (problemData.examples as any) || [],
              explanation: problemData.explanation || '',
              difficulty: problemData.difficulty,
              tags: problemData.tags || [],
              status: problemData.status,
              test_cases: problemData.test_cases || [],
              languages: problemData.languages || [],
            }
          : undefined
      }
      problemId={problemData?.id}
      isEditMode={isEditMode}
    />
  );
}
