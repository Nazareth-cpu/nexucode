/**
 * Problem Statement Panel (Phase 4)
 *
 * Renders the published problem description for student problem solving.
 * Strictly excludes hidden test cases and administrative metadata.
 */

import React, { useState } from 'react';
import { Tag, BookOpen, AlertCircle, Copy, Check } from 'lucide-react';
import type { ProblemWithRelations } from '@/src/features/problems';

interface ProblemStatementPanelProps {
  problem: ProblemWithRelations;
}

export function ProblemStatementPanel({ problem }: ProblemStatementPanelProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const difficultyColors = {
    easy: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
    medium: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
    hard: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
  };

  const diffClass =
    difficultyColors[problem.difficulty as keyof typeof difficultyColors] ||
    difficultyColors.easy;

  const examplesList = (problem.examples as any[]) || [];

  const handleCopyInput = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="h-full flex flex-col rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#263833] bg-[#07110F] select-none">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="font-semibold text-xs text-[#F8FAFC]">Problem Statement</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${diffClass}`}
          >
            {problem.difficulty}
          </span>
        </div>
      </div>

      {/* Scrollable Problem Content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
        {/* Title & Metadata */}
        <div className="space-y-3 pb-4 border-b border-[#263833]/80">
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
            {problem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#9CA3AF] font-mono">
            <span>Time Limit: 1.0s</span>
            <span>•</span>
            <span>Memory: 256MB</span>
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
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

        {/* Statement Body */}
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
            Description
          </h2>
          <div className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
            {problem.statement}
          </div>
        </div>

        {/* Input & Output Format */}
        <div className="grid grid-cols-1 gap-3">
          {problem.input_format && (
            <div className="p-3.5 rounded-xl border border-[#263833] bg-[#07110F] space-y-1">
              <h3 className="text-xs font-mono font-semibold text-[#F59E0B] uppercase">
                Input Format
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {problem.input_format}
              </p>
            </div>
          )}

          {problem.output_format && (
            <div className="p-3.5 rounded-xl border border-[#263833] bg-[#07110F] space-y-1">
              <h3 className="text-xs font-mono font-semibold text-[#F59E0B] uppercase">
                Output Format
              </h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
                {problem.output_format}
              </p>
            </div>
          )}
        </div>

        {/* Constraints */}
        {problem.constraints && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
              Constraints
            </h2>
            <pre className="p-3 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap">
              {problem.constraints}
            </pre>
          </div>
        )}

        {/* Public Examples */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
            Examples
          </h2>
          {examplesList.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] italic">No public examples defined.</p>
          ) : (
            examplesList.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="rounded-xl border border-[#263833] bg-[#07110F] p-4 space-y-2.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-[#F59E0B] font-semibold">
                  <span>Example {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyInput(ex.input, idx)}
                    className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
                    title="Copy sample input"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3 h-3 text-[#10B981]" />
                        <span className="text-[#10B981]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy input</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <span className="text-[#9CA3AF] block mb-1">Input:</span>
                  <pre className="p-2.5 rounded-lg bg-[#0D1A17] border border-[#263833] text-[#F8FAFC] overflow-x-auto whitespace-pre-wrap">
                    {ex.input || '(empty)'}
                  </pre>
                </div>

                <div>
                  <span className="text-[#9CA3AF] block mb-1">Output:</span>
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
            ))
          )}
        </div>

        {/* Explanation */}
        {problem.explanation && (
          <div className="space-y-1.5 pt-2 border-t border-[#263833]/80">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
              Approach Notes
            </h2>
            <p className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap">
              {problem.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
