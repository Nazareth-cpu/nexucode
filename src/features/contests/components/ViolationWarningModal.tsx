/**
 * Nexus Code — Integrity & Proctoring Violation Modal
 *
 * Implements the 3-Strike Warning & Disqualification UX:
 * - Strike 1: Warning with clear reason and remaining strikes disclosure.
 * - Strike 2: Critical warning alerting that the next infraction revokes participation.
 * - Strike 3: Permanent disqualification notice with immediate workspace revocation.
 *             Non-dismissible; forces return to public portal.
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, XCircle, Check, LogOut, Lock } from 'lucide-react';
import type { ActiveViolationNotice } from '../hooks/useContestProctoring';

interface ViolationWarningModalProps {
  notice: ActiveViolationNotice;
  onAcknowledge: () => void;
  exitUrl?: string;
  exitLabel?: string;
}

export function ViolationWarningModal({
  notice,
  onAcknowledge,
  exitUrl = '/contests',
  exitLabel = 'Return to Contests',
}: ViolationWarningModalProps) {
  const isStrike1 = notice.warningNumber === 1 && !notice.isDisqualified;
  const isStrike2 = notice.warningNumber === 2 && !notice.isDisqualified;
  const isDisqualified = notice.isDisqualified || notice.warningNumber >= notice.maxWarnings;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl ${
          isDisqualified
            ? 'bg-[#180A0A] border-[#EF4444]/70 text-[#F8FAFC]'
            : isStrike2
            ? 'bg-[#1A1108] border-[#F59E0B]/70 text-[#F8FAFC]'
            : 'bg-[#0E0B28] border-[#241D4D] text-[#F8FAFC]'
        }`}
      >
        {/* Header Icon + Strike Badge */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              isDisqualified
                ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                : isStrike2
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
            }`}
          >
            {isDisqualified ? (
              <XCircle className="w-8 h-8 animate-pulse text-[#EF4444]" />
            ) : isStrike2 ? (
              <ShieldAlert className="w-8 h-8 animate-pulse text-[#F59E0B]" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isDisqualified
                  ? 'bg-[#EF4444] text-white'
                  : isStrike2
                  ? 'bg-[#F59E0B] text-black animate-pulse'
                  : 'bg-[#F59E0B]/80 text-black'
              }`}
            >
              {isDisqualified
                ? 'Strike 3 of 3 • Revoked'
                : `Strike ${notice.warningNumber} of ${notice.maxWarnings}`}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
              {isDisqualified ? 'Participation Permanently Revoked' : notice.title}
            </h3>
          </div>
        </div>

        {/* Violation Notice Details */}
        <div className="p-4 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs sm:text-sm text-[#9CA3AF] space-y-2.5 leading-relaxed">
          <p className="text-[#F8FAFC] font-medium">{notice.message}</p>

          {isDisqualified ? (
            <div className="pt-2 border-t border-[#EF4444]/30 space-y-1 text-[#EF4444]">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Session Terminated (Maximum Strikes Exceeded)</span>
              </p>
              <p className="text-xs text-[#EF4444]/90">
                You have reached 3 strikes. Your active participation in this session has been revoked and re-entry is denied.
              </p>
            </div>
          ) : isStrike2 ? (
            <div className="pt-2 border-t border-[#F59E0B]/30 text-[#F59E0B] space-y-1">
              <p className="font-bold">CRITICAL WARNING:</p>
              <p className="text-xs">
                You have 1 strike remaining. Any further rule infractions (full-screen exit, tab switch, unauthorized navigation) will trigger immediate disqualification and permanent removal.
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#241D4D]/80 text-[#9CA3AF] text-xs">
              <p>
                Please maintain full focus in the coding workspace. Continued infractions will increment strike count toward disqualification.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div>
          {isDisqualified ? (
            <a
              href={exitUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>{exitLabel}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onAcknowledge}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all active:scale-[0.99] ${
                isStrike2
                  ? 'bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A]'
                  : 'bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isStrike2 ? 'I Acknowledge Final Warning — Return to Workspace' : 'I Understand — Return to Workspace'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
