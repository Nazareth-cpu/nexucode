/**
 * Submission History Modal (Phase 5)
 *
 * Displays a student's previous submissions for the current problem,
 * showing status, verdict, runtime, memory, and submission timestamp.
 */

import React from 'react';
import {
  X,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  Code2,
} from 'lucide-react';
import type { SubmissionHistoryItem } from '../types';

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SubmissionHistoryItem[];
  isLoading: boolean;
  problemTitle: string;
}

export function SubmissionHistoryModal({
  isOpen,
  onClose,
  history,
  isLoading,
  problemTitle,
}: SubmissionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-[#241D4D] bg-[#08051A] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#241D4D] bg-[#0E0B28]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F8FAFC]">Submission History</h2>
              <p className="text-xs text-[#9CA3AF] truncate max-w-md">{problemTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#130F35] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#F59E0B] mx-auto" />
              <p className="text-xs text-[#9CA3AF] font-mono">Loading previous submissions...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Code2 className="w-10 h-10 text-[#241D4D] mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">No Submissions Yet</p>
                <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto">
                  You have not submitted a solution for this problem yet. Write your code and click Submit to test against authoritative cases.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((sub, idx) => {
                const isAccepted = sub.score === 100;
                const dateStr = new Date(sub.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sub.id || idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#241D4D] bg-[#0E0B28] hover:border-[#F59E0B]/30 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isAccepted
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {isAccepted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isAccepted
                                ? 'text-[#10B981]'
                                : sub.status === 'pending' || sub.status === 'processing'
                                ? 'text-[#F59E0B]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {isAccepted
                              ? 'Accepted'
                              : sub.verdict
                              ? sub.verdict.replace(/_/g, ' ').toUpperCase()
                              : sub.status === 'pending'
                              ? 'QUEUED'
                              : sub.status === 'processing'
                              ? 'EVALUATING'
                              : 'Failed'}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF] px-1.5 py-0.5 rounded bg-[#08051A] border border-[#241D4D] uppercase">
                            {sub.language}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">{dateStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-[#9CA3AF]">Score</div>
                        <div
                          className={`font-bold ${
                            isAccepted ? 'text-[#10B981]' : 'text-[#F59E0B]'
                          }`}
                        >
                          {sub.score} / 100
                        </div>
                      </div>

                      {sub.execution_time !== null && (
                        <div className="hidden sm:block space-y-0.5">
                          <div className="text-[11px] text-[#9CA3AF]">Runtime</div>
                          <div className="text-[#F8FAFC]">{sub.execution_time} ms</div>
                        </div>
                      )}

                      {sub.memory !== null && (
                        <div className="hidden sm:block space-y-0.5">
                          <div className="text-[11px] text-[#9CA3AF]">Memory</div>
                          <div className="text-[#F8FAFC]">
                            {Math.round(sub.memory / 1024 * 10) / 10} MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#241D4D] bg-[#0E0B28] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#130F35] hover:bg-[#1A312B] text-xs font-semibold text-[#F8FAFC] border border-[#241D4D] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
