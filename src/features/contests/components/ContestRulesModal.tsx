/**
 * Contest Rules & Proctoring Disclosure Modal (Phase 6)
 */

import React from 'react';
import { X, ShieldCheck, Clock, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ContestRuleConfig } from '../types';

interface ContestRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules?: ContestRuleConfig;
  title?: string;
}

export function ContestRulesModal({
  isOpen,
  onClose,
  rules,
  title = 'Tournament Rules & Integrity Guidelines',
}: ContestRulesModalProps) {
  if (!isOpen) return null;

  const penaltyMin = rules?.penaltyMinutesPerWrongAnswer ?? 20;
  const maxWarnings = rules?.maxWarnings ?? 3;
  const proctoringEnabled = rules?.enableProctoring ?? true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 space-y-6 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#263833] pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#10B981]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
          {/* Section 1: Scoring */}
          <div className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] space-y-2">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span>Scoring &amp; Problem Weights</span>
            </h3>
            <p>
              Each problem is awarded a fixed point value upon passing all test cases. Standings are ranked first by <strong>Total Score</strong>, and ties are broken by lowest <strong>Total Penalty Time</strong>.
            </p>
          </div>

          {/* Section 2: ICPC Penalty Time */}
          <div className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] space-y-2">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#10B981]" />
              <span>Penalty Calculation</span>
            </h3>
            <p>
              For each solved problem, the penalty equals the elapsed time (in minutes from contest start) at which the first accepted submission was sent, plus <strong>+{penaltyMin} minutes</strong> for each rejected attempt submitted prior to acceptance.
            </p>
            <p className="text-[11px] text-[#9CA3AF]/80 italic">
              Unsolved problems incur zero penalty time.
            </p>
          </div>

          {/* Section 3: Proctoring & Integrity */}
          <div className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] space-y-2">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              <span>Integrity &amp; Anti-Cheat Proctoring</span>
            </h3>
            {proctoringEnabled ? (
              <ul className="space-y-1.5 list-disc list-inside text-xs">
                <li>
                  <strong>Focus Retention:</strong> Switching tabs or minimizing the browser window during the live tournament triggers automated integrity strikes.
                </li>
                <li>
                  <strong>External Paste Monitoring:</strong> Bulk pasting external source code into the editor is flagged for coordinator review.
                </li>
                <li>
                  <strong>Disqualification Policy:</strong> Accumulating <strong>{maxWarnings} strikes</strong> results in immediate, irreversible tournament disqualification.
                </li>
              </ul>
            ) : (
              <p>Proctoring is relaxed for this practice session.</p>
            )}
          </div>

          {/* Section 4: Compiler Execution */}
          <div className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] space-y-1.5">
            <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Authoritative Compilation &amp; Testing</span>
            </h3>
            <p>
              All code is evaluated on isolated Judge0 container runtimes with verified CPU and memory constraints. Supported languages include Python 3, C++ 17, Java 17, C, TypeScript, and JavaScript.
            </p>
          </div>
        </div>

        <div className="border-t border-[#263833] pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all"
          >
            I Acknowledge Rules
          </button>
        </div>
      </div>
    </div>
  );
}
