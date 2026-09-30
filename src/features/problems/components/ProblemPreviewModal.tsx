/**
 * Student-View Problem Preview Modal (Phase 3)
 *
 * Renders problem content exactly as seen by a student candidate.
 * Strictly excludes hidden test cases, storage paths, and administrative metadata.
 */

import React from 'react';
import { X, Code2, Eye, Tag, AlertCircle } from 'lucide-react';
import type { ProblemFormData } from '../types';

interface ProblemPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Partial<ProblemFormData>;
}

export function ProblemPreviewModal({
  isOpen,
  onClose,
  problem,
}: ProblemPreviewModalProps) {
  if (!isOpen) return null;

  const difficultyColors = {
    easy: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
    medium: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    hard: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
  };

  const diffClass =
    difficultyColors[problem.difficulty as keyof typeof difficultyColors] ||
    difficultyColors.easy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#263833] bg-[#0D1A17] text-[#F8FAFC] shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263833] bg-[#07110F]">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
              Student Perspective Preview
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Problem Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3 pb-4 border-b border-[#263833]">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border uppercase ${diffClass}`}
              >
                {problem.difficulty || 'Easy'}
              </span>
              <span className="text-xs text-[#9CA3AF] font-mono">
                Time Limit: 1.0s
              </span>
              <span className="text-xs text-[#9CA3AF] font-mono">
                Memory: 256MB
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              {problem.title || 'Untitled Problem'}
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
              {problem.statement || (
                <span className="italic text-[#9CA3AF]/60">No statement provided.</span>
              )}
            </div>
          </div>

          {/* Input & Output Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#263833] bg-[#07110F] space-y-2">
              <h3 className="text-xs font-semibold text-[#F8FAFC]">Input Format</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {problem.input_format || (
                  <span className="italic text-[#9CA3AF]/60">No input format specified.</span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#263833] bg-[#07110F] space-y-2">
              <h3 className="text-xs font-semibold text-[#F8FAFC]">Output Format</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {problem.output_format || (
                  <span className="italic text-[#9CA3AF]/60">No output format specified.</span>
                )}
              </p>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Constraints</h2>
            <pre className="p-3 rounded-xl bg-[#07110F] border border-[#263833] text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap">
              {problem.constraints || 'No constraints specified.'}
            </pre>
          </div>

          {/* Examples */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Examples</h2>
            {(!problem.examples || problem.examples.length === 0) ? (
              <p className="text-xs text-[#9CA3AF] italic">No public examples defined.</p>
            ) : (
              problem.examples.map((ex, idx) => (
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
            <div className="space-y-2 pt-2 border-t border-[#263833]">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Explanation &amp; Approach Notes</h2>
              <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {problem.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#263833] bg-[#07110F] flex items-center justify-between text-xs text-[#9CA3AF]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Hidden tests and administrative metadata are concealed from this view.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#12221E] hover:bg-[#263833] text-[#F8FAFC] font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
