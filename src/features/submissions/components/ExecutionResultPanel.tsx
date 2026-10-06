/**
 * Execution Result & Verdict Panel (Phase 5)
 *
 * Displays live feedback from Judge0:
 * - Queued / Processing states
 * - Authoritative verdicts (Accepted, Wrong Answer, TLE, MLE, Compilation Error)
 * - Score, execution time, and memory metrics
 * - Case-by-case sample test results with input, expected, and actual diffs
 * - Output logs and compilation errors
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Terminal,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  FileCode2,
  Copy,
  Check,
} from 'lucide-react';
import type {
  ExecutionState,
  RunCodeResponse,
  SubmissionExecutionResult,
} from '../types';
import type { SubmissionVerdict } from '@/src/types/database';

interface ExecutionResultPanelProps {
  state: ExecutionState;
  runResult: RunCodeResponse | null;
  submitResult: SubmissionExecutionResult | null;
  errorMessage: string | null;
  onClose?: () => void;
}

export function ExecutionResultPanel({
  state,
  runResult,
  submitResult,
  errorMessage,
  onClose,
}: ExecutionResultPanelProps) {
  const [activeTab, setActiveTab] = useState<'cases' | 'console'>('cases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // If completely idle with no prior result, don't take up full space
  if (state === 'idle' && !runResult && !submitResult && !errorMessage) {
    return null;
  }

  const isSubmitting = state === 'submitting';
  const isRunning = state === 'running';
  const isPending = isSubmitting || isRunning;

  // Determine current active result payload
  const activeResult = submitResult || runResult;
  const sampleCases = activeResult?.sampleResults || [];
  const selectedCase = sampleCases[selectedCaseIdx] || sampleCases[0];

  const verdict: SubmissionVerdict = activeResult?.verdict || 'pending';
  const isAccepted = verdict === 'accepted';

  // Formatting helpers
  const getVerdictBadge = () => {
    switch (verdict) {
      case 'accepted':
        return {
          label: 'Accepted',
          color: 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/40',
          icon: CheckCircle2,
        };
      case 'wrong_answer':
        return {
          label: 'Wrong Answer',
          color: 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/40',
          icon: XCircle,
        };
      case 'time_limit_exceeded':
        return {
          label: 'Time Limit Exceeded',
          color: 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40',
          icon: Clock,
        };
      case 'memory_limit_exceeded':
        return {
          label: 'Memory Limit Exceeded',
          color: 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40',
          icon: HardDrive,
        };
      case 'compilation_error':
        return {
          label: 'Compilation Error',
          color: 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/40',
          icon: AlertTriangle,
        };
      case 'runtime_error':
        return {
          label: 'Runtime Error',
          color: 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/40',
          icon: AlertTriangle,
        };
      default:
        return {
          label: verdict.replace(/_/g, ' ').toUpperCase(),
          color: 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/40',
          icon: AlertTriangle,
        };
    }
  };

  const badge = getVerdictBadge();
  const BadgeIcon = badge.icon;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col rounded-xl border border-[#241D4D] bg-[#0E0B28] text-xs shadow-2xl overflow-hidden transition-all duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#241D4D] bg-[#15103A] select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#F59E0B] font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Console</span>
          </span>

          {isPending && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{isSubmitting ? 'Evaluating on Judge0...' : 'Running sample tests...'}</span>
            </span>
          )}

          {!isPending && activeResult && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border ${badge.color}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>
          )}
        </div>

        {/* Tab switchers & Close */}
        <div className="flex items-center gap-2">
          {sampleCases.length > 0 && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#08051A] border border-[#241D4D]">
              <button
                type="button"
                onClick={() => setActiveTab('cases')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'cases'
                    ? 'bg-[#7C3AED] text-white font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Test Cases
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('console')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'console'
                    ? 'bg-[#7C3AED] text-white font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Log / Stderr
              </button>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4 max-h-[260px] overflow-y-auto">
        {/* Loading Spinner Screen */}
        {isPending && (
          <div className="py-8 text-center space-y-3 font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-[#F59E0B] mx-auto" />
            <div className="space-y-1">
              <p className="text-[#F8FAFC] font-semibold">
                {isSubmitting ? 'Evaluating against authoritative test suite' : 'Compiling & Running code'}
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                Dispatching source to isolated Judge0 sandbox...
              </p>
            </div>
          </div>
        )}

        {/* Error Screen */}
        {!isPending && errorMessage && (
          <div className="p-3.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Execution Error</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-mono leading-relaxed whitespace-pre-wrap">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Results Screen */}
        {!isPending && activeResult && (
          <div className="space-y-3">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {activeResult.score !== undefined && (
                <div className="p-2.5 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-0.5">
                  <span className="text-[10px] text-[#94A3B8] uppercase">Score:</span>
                  <div className="text-sm font-bold text-[#F59E0B]">
                    {activeResult.score} / 100
                  </div>
                </div>
              )}

              {activeResult.passedCount !== undefined && activeResult.testCount !== undefined && (
                <div className="p-2.5 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-0.5">
                  <span className="text-[10px] text-[#94A3B8] uppercase">Test Cases:</span>
                  <div
                    className={`text-sm font-bold ${
                      activeResult.passedCount === activeResult.testCount
                        ? 'text-[#10B981]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {activeResult.passedCount} / {activeResult.testCount} Passed
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] uppercase">Runtime:</span>
                <div className="text-sm font-bold text-[#F8FAFC]">
                  {activeResult.maxTimeMs} ms
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-0.5">
                <span className="text-[10px] text-[#94A3B8] uppercase">Peak Memory:</span>
                <div className="text-sm font-bold text-[#F8FAFC]">
                  {Math.round(activeResult.maxMemoryKb / 1024 * 10) / 10} MB
                </div>
              </div>
            </div>

            {/* Test Cases Sub-View */}
            {activeTab === 'cases' && sampleCases.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* Case Selector Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {sampleCases.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        selectedCaseIdx === idx
                          ? 'bg-[#7C3AED] text-white border border-[#7C3AED]/50'
                          : 'bg-[#15103A] text-[#94A3B8] border border-[#241D4D] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          sc.isPassed ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                        }`}
                      />
                      <span>Case {idx + 1}</span>
                    </button>
                  ))}
                </div>

                {/* Selected Case Inspection */}
                {selectedCase && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-1">
                      <span className="text-[11px] text-[#94A3B8] block font-semibold">
                        Input:
                      </span>
                      <pre className="p-2 rounded bg-[#08051A] border border-[#241D4D] text-[#F8FAFC] overflow-x-auto whitespace-pre-wrap">
                        {selectedCase.stdin || '(empty)'}
                      </pre>
                    </div>

                    <div className="p-3 rounded-lg border border-[#241D4D] bg-[#15103A] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#94A3B8] font-semibold">
                          Expected Output:
                        </span>
                        <span className="text-[11px] text-[#94A3B8] font-semibold">
                          Actual Output:
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <pre className="p-2 rounded bg-[#08051A] border border-[#241D4D] text-[#10B981] overflow-x-auto whitespace-pre-wrap">
                          {selectedCase.expectedOutput || '(empty)'}
                        </pre>
                        <pre
                          className={`p-2 rounded bg-[#08051A] border overflow-x-auto whitespace-pre-wrap ${
                            selectedCase.isPassed
                              ? 'border-[#10B981]/40 text-[#10B981]'
                              : 'border-[#EF4444]/40 text-[#EF4444]'
                          }`}
                        >
                          {selectedCase.actualOutput || '(none)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Console / Stderr Sub-View */}
            {activeTab === 'console' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                  <span>Compiler Output &amp; Stderr Stream:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedCase?.compileOutput ||
                          selectedCase?.stderr ||
                          activeResult.stderr ||
                          activeResult.compileOutput ||
                          'No output generated.'
                      )
                    }
                    className="flex items-center gap-1 hover:text-[#F8FAFC]"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy log'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#08051A] border border-[#241D4D] font-mono text-xs text-[#EF4444] overflow-x-auto max-h-[140px] whitespace-pre-wrap">
                  {selectedCase?.compileOutput ||
                    selectedCase?.stderr ||
                    activeResult.stderr ||
                    activeResult.compileOutput ||
                    selectedCase?.actualOutput ||
                    activeResult.stdout ||
                    'Standard output clean. No compiler warnings or stderr encountered.'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
