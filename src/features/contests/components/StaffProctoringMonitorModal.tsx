/**
 * Staff Proctoring Monitor Modal (Phase 6)
 *
 * Real-time monitoring dashboard for Chapter Coordinators & Admins to view
 * participant status, examine violation logs, and issue manual disqualifications or reinstatements.
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle, Users, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import type { ContestParticipantItem, ContestViolationRecord } from '../types';

interface StaffProctoringMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  contestTitle: string;
}

export function StaffProctoringMonitorModal({
  isOpen,
  onClose,
  contestId,
  contestTitle,
}: StaffProctoringMonitorModalProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'participants' | 'violations'>('participants');
  const [participants, setParticipants] = useState<ContestParticipantItem[]>([]);
  const [violations, setViolations] = useState<ContestViolationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.access_token || !contestId) return;
    setIsLoading(true);
    const { participants: pts, violations: vios } = await contestService.getStaffProctoringData(
      contestId,
      session.access_token
    );
    setParticipants(pts);
    setViolations(vios);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, contestId, session?.access_token]);

  if (!isOpen) return null;

  const handleAction = async (
    userId: string,
    action: 'disqualify' | 'reinstate' | 'reset_warnings'
  ) => {
    if (!session?.access_token) return;
    setActionInProgress(userId);
    await contestService.updateParticipantStatus(contestId, userId, action, session.access_token);
    await loadData();
    setActionInProgress(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl border border-[#241D4D] bg-[#0E0B28] p-6 space-y-5 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#241D4D] pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-[#EF4444]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                Proctoring &amp; Integrity Console
              </h2>
              <p className="text-xs text-[#9CA3AF] truncate max-w-md">{contestTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#130F35] transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#130F35] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#241D4D] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'participants'
                ? 'bg-[#130F35] text-[#F59E0B] border border-[#241D4D]'
                : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
            }`}
          >
            Participants ({participants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('violations')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === 'violations'
                ? 'bg-[#130F35] text-[#EF4444] border border-[#241D4D]'
                : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
            }`}
          >
            Violation Incidents ({violations.length})
          </button>
        </div>

        {/* Tab 1: Participants List */}
        {activeTab === 'participants' && (
          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9CA3AF]">
                No registered participants for this tournament yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#241D4D]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#08051A] text-[#9CA3AF] uppercase font-mono border-b border-[#241D4D]">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Strikes</th>
                      <th className="py-2.5 px-3 text-right">Staff Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#241D4D]/60 bg-[#0E0B28]">
                    {participants.map((p) => {
                      const isDQ = p.status === 'disqualified';
                      return (
                        <tr key={p.userId} className="hover:bg-[#130F35] transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#F8FAFC]">{p.displayName}</div>
                            {p.collegeId && (
                              <div className="text-[11px] font-mono text-[#9CA3AF]">{p.collegeId}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                isDQ
                                  ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                                  : p.status === 'active'
                                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                                  : 'bg-[#130F35] text-[#9CA3AF]'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span
                              className={
                                p.warnings >= 3
                                  ? 'text-[#EF4444]'
                                  : p.warnings > 0
                                  ? 'text-[#F59E0B]'
                                  : 'text-[#9CA3AF]'
                              }
                            >
                              {p.warnings}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {isDQ ? (
                              <button
                                type="button"
                                disabled={actionInProgress === p.userId}
                                onClick={() => handleAction(p.userId, 'reinstate')}
                                className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30 font-medium text-[11px] transition-colors"
                              >
                                Reinstate
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionInProgress === p.userId}
                                onClick={() => handleAction(p.userId, 'disqualify')}
                                className="px-2.5 py-1 rounded bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444]/30 font-medium text-[11px] transition-colors"
                              >
                                Disqualify
                              </button>
                            )}

                            {p.warnings > 0 && (
                              <button
                                type="button"
                                disabled={actionInProgress === p.userId}
                                onClick={() => handleAction(p.userId, 'reset_warnings')}
                                className="px-2 py-1 rounded border border-[#241D4D] text-[#9CA3AF] hover:text-[#F8FAFC] text-[11px] transition-colors"
                              >
                                Reset Strikes
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Violations Log */}
        {activeTab === 'violations' && (
          <div className="space-y-3">
            {violations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9CA3AF]">
                No proctoring infractions logged for this tournament.
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-[#08051A] border border-[#241D4D] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono uppercase font-bold text-[#EF4444] px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[10px]">
                          {v.type.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-[#F8FAFC]">
                          {v.userDisplayName || 'Contender'}
                        </span>
                        <span className="text-[11px] font-mono text-[#9CA3AF]">
                          Strike #{v.warningNumber}
                        </span>
                      </div>
                      <div className="text-[#9CA3AF] font-mono text-[11px]">
                        {new Date(v.occurredAt).toLocaleTimeString()} •{' '}
                        {JSON.stringify(v.evidence)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
