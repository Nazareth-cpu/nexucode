/**
 * Problem Statement Panel — Exact Implementation of Reference Panel 04
 *
 * Implements:
 * - Tabs: Description, Editorial, Submissions, Discuss
 * - Collapsible / formatted sections for Statement, Input Format, Output Format, Constraints
 * - Dark Elevated Surface (bg-[#0E0B28], border-[#241D4D]) with High Contrast Typography
 */

import React, { useState } from 'react';
import { Tag, BookOpen, AlertCircle, Copy, Check, FileText, MessageSquare, History, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProblemWithRelations } from '@/src/features/problems';

interface ProblemStatementPanelProps {
  problem: ProblemWithRelations;
}

export function ProblemStatementPanel({ problem }: ProblemStatementPanelProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'submissions' | 'discuss'>('description');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [isStatementOpen, setIsStatementOpen] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(true);

  const diffBadge =
    problem.difficulty === 'easy'
      ? 'bg-[#064E3B]/40 text-[#34D399] border-[#059669]/50'
      : problem.difficulty === 'medium'
      ? 'bg-[#78350F]/40 text-[#FBBF24] border-[#D97706]/50'
      : 'bg-[#881337]/40 text-[#FB7185] border-[#E11D48]/50';

  const examplesList = (problem.examples as any[]) || [];

  const handleCopyInput = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="h-full flex flex-col rounded-2xl bg-[#0E0B28] border border-[#241D4D] overflow-hidden shadow-xl text-[#F8FAFC]">
      {/* Top Problem Header & Badges */}
      <div className="p-5 border-b border-[#241D4D] space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
            {problem.title}
          </h1>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border capitalize ${diffBadge}`}
          >
            {problem.difficulty}
          </span>
          {problem.tags &&
            problem.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono font-medium bg-[#181242] text-[#C4B5FD] border border-[#2A205E] px-2.5 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
        </div>

        {/* Tab Navigation (Panel 04: Description, Editorial, Submissions, Discuss) */}
        <div className="flex items-center gap-1 border-b border-[#241D4D] pt-1 -mb-5">
          {[
            { id: 'description', label: 'Description', icon: BookOpen },
            { id: 'editorial', label: 'Editorial', icon: FileText },
            { id: 'submissions', label: 'Submissions', icon: History },
            { id: 'discuss', label: 'Discuss', icon: MessageSquare },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? 'border-[#F59E0B] text-[#FBBF24] font-extrabold'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        {activeTab === 'description' && (
          <div className="space-y-4">
            {/* Problem Statement Section */}
            <div className="border border-[#241D4D] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setIsStatementOpen(!isStatementOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-[#15103A] font-bold text-xs text-[#F8FAFC] hover:bg-[#1E174D] transition-colors text-left"
              >
                <span>Problem Statement</span>
                {isStatementOpen ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
              </button>
              {isStatementOpen && (
                <div className="p-4 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap bg-[#08051A]/60 font-sans">
                  {problem.statement}
                </div>
              )}
            </div>

            {/* Input Format Section */}
            {problem.input_format && (
              <div className="border border-[#241D4D] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsInputOpen(!isInputOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-[#15103A] font-bold text-xs text-[#F8FAFC] hover:bg-[#1E174D] transition-colors text-left"
                >
                  <span>Input Format</span>
                  {isInputOpen ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                </button>
                {isInputOpen && (
                  <div className="p-4 text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap bg-[#08051A]/60 font-mono">
                    {problem.input_format}
                  </div>
                )}
              </div>
            )}

            {/* Output Format Section */}
            {problem.output_format && (
              <div className="border border-[#241D4D] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsOutputOpen(!isOutputOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-[#15103A] font-bold text-xs text-[#F8FAFC] hover:bg-[#1E174D] transition-colors text-left"
                >
                  <span>Output Format</span>
                  {isOutputOpen ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                </button>
                {isOutputOpen && (
                  <div className="p-4 text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap bg-[#08051A]/60 font-mono">
                    {problem.output_format}
                  </div>
                )}
              </div>
            )}

            {/* Constraints Section */}
            {problem.constraints && (
              <div className="border border-[#241D4D] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsConstraintsOpen(!isConstraintsOpen)}
                  className="w-full flex items-center justify-between p-3.5 bg-[#15103A] font-bold text-xs text-[#F8FAFC] hover:bg-[#1E174D] transition-colors text-left"
                >
                  <span>Constraints</span>
                  {isConstraintsOpen ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                </button>
                {isConstraintsOpen && (
                  <div className="p-4 text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap bg-[#08051A]/60 font-mono">
                    {problem.constraints}
                  </div>
                )}
              </div>
            )}

            {/* Sample Examples */}
            {examplesList.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
                  Sample Examples
                </h3>
                {examplesList.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="rounded-xl border border-[#241D4D] bg-[#15103A] p-3.5 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between font-bold text-[#FBBF24]">
                      <span>Example {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyInput(ex.input, idx)}
                        className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        {copiedIdx === idx ? (
                          <span className="text-[#34D399] font-bold">Copied!</span>
                        ) : (
                          <span>Copy Input</span>
                        )}
                      </button>
                    </div>

                    <div>
                      <span className="text-[#94A3B8] block mb-1">Input:</span>
                      <pre className="p-2.5 rounded-lg bg-[#08051A] border border-[#241D4D] text-[#34D399] whitespace-pre-wrap font-mono">
                        {ex.input || '(empty)'}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[#94A3B8] block mb-1">Output:</span>
                      <pre className="p-2.5 rounded-lg bg-[#08051A] border border-[#241D4D] text-[#FBBF24] whitespace-pre-wrap font-mono">
                        {ex.output || '(empty)'}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className="p-6 text-center space-y-2 text-xs text-[#94A3B8]">
            <FileText className="w-8 h-8 text-[#A855F7] mx-auto opacity-70" />
            <h4 className="font-bold text-[#F8FAFC]">Problem Editorial</h4>
            <p>
              {problem.explanation || 'Official chapter solution and approach notes will appear here.'}
            </p>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="p-6 text-center space-y-2 text-xs text-[#94A3B8]">
            <History className="w-8 h-8 text-[#F59E0B] mx-auto opacity-70" />
            <h4 className="font-bold text-[#F8FAFC]">Your Past Submissions</h4>
            <p>Run or submit your solution from the editor to see your verdict history.</p>
          </div>
        )}

        {activeTab === 'discuss' && (
          <div className="p-6 text-center space-y-2 text-xs text-[#94A3B8]">
            <MessageSquare className="w-8 h-8 text-[#A855F7] mx-auto opacity-70" />
            <h4 className="font-bold text-[#F8FAFC]">Chapter Community Discussion</h4>
            <p>Discuss edge cases and alternative time/space complexities with peers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

