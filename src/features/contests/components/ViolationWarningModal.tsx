/**
 * Proctoring Violation Warning Modal (Phase 6)
 *
 * Displays high-visibility warning notification when tab switch or external paste is detected.
 * Alerts user of strike count and enforces academic integrity.
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, XCircle, Check } from 'lucide-react';
import type { ActiveViolationNotice } from '../hooks/useContestProctoring';

interface ViolationWarningModalProps {
  notice: ActiveViolationNotice;
  onAcknowledge: () => void;
}

export function ViolationWarningModal({ notice, onAcknowledge }: ViolationWarningModalProps) {
  const isLastWarning = notice.warningNumber === notice.maxWarnings && !notice.isDisqualified;
  const isDisqualified = notice.isDisqualified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl ${
          isDisqualified
            ? 'bg-[#180A0A] border-[#EF4444]/60 text-[#F8FAFC]'
            : isLastWarning
            ? 'bg-[#1A1108] border-[#F59E0B]/60 text-[#F8FAFC]'
            : 'bg-[#0D1A17] border-[#263833] text-[#F8FAFC]'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              isDisqualified
                ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
            }`}
          >
            {isDisqualified ? (
              <XCircle className="w-7 h-7" />
            ) : (
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isDisqualified
                  ? 'bg-[#EF4444] text-black'
                  : 'bg-[#F59E0B] text-black'
              }`}
            >
              {isDisqualified ? 'Disqualified' : `Strike ${notice.warningNumber} of ${notice.maxWarnings}`}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
              {isDisqualified ? 'Tournament Disqualification' : notice.title}
            </h3>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs sm:text-sm text-[#9CA3AF] space-y-2 leading-relaxed">
          <p className="text-[#F8FAFC]">{notice.message}</p>
          {isDisqualified ? (
            <p className="text-[#EF4444] font-medium">
              You have exceeded the maximum allowed violations ({notice.maxWarnings}). Your tournament participation has been terminated and recorded.
            </p>
          ) : (
            <p className="text-[#F59E0B]">
              Warning: Exceeding {notice.maxWarnings} infractions results in immediate tournament disqualification and score voiding.
            </p>
          )}
        </div>

        <div>
          {isDisqualified ? (
            <a
              href="/contests"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <span>Return to Contests</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onAcknowledge}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>I Understand — Return to Arena</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
