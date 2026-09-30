/**
 * Contests Listing Page (Phase 6)
 *
 * Displays upcoming, live, and past competitive programming tournaments.
 * Provides self-registration, direct arena entry, and coordinator management actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, RefreshCw, Filter, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import type { ContestItem } from '../types';
import { ContestCard } from '../components/ContestCard';
import { StaffContestEditorModal } from '../components/StaffContestEditorModal';

export function ContestsListPage() {
  const { session, user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Staff Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isStaff = user?.role === 'coordinator' || user?.role === 'admin';

  const fetchContests = useCallback(async () => {
    setIsLoading(true);
    const { data } = await contestService.getContests(
      filter === 'all' ? undefined : filter,
      session?.access_token
    );
    setContests(data);
    setIsLoading(false);
  }, [filter, session?.access_token]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const handleRegister = async (contestId: string) => {
    if (!session?.access_token) {
      setFeedbackMsg({ text: 'Please sign in to register for contests.', type: 'error' });
      return;
    }

    setRegisteringId(contestId);
    const res = await contestService.register(contestId, session.access_token);
    setRegisteringId(null);

    if (res.success) {
      setFeedbackMsg({ text: 'Successfully registered for tournament!', type: 'success' });
      fetchContests();
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to register.', type: 'error' });
    }

    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263833] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
            <span>Chapter Coding Tournaments</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Structured algorithmic competitions with server-authoritative timers, deterministic evaluation, and academic integrity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isStaff && (
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] text-xs font-semibold transition-all shadow-sm active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tournament</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchContests}
            disabled={isLoading}
            className="p-2 rounded-lg border border-[#263833] bg-[#0D1A17] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
            title="Refresh Contests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-all animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['all', 'live', 'upcoming', 'past'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg capitalize font-medium transition-all ${
              filter === tab
                ? 'bg-[#12221E] text-[#F59E0B] border border-[#263833]'
                : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
            }`}
          >
            {tab === 'all'
              ? 'All Tournaments'
              : tab === 'live'
              ? '🔴 Live Now'
              : tab === 'upcoming'
              ? 'Upcoming'
              : 'Past Challenges'}
          </button>
        ))}
      </div>

      {/* Contests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
          <div className="h-64 rounded-xl bg-[#0D1A17] border border-[#263833]" />
          <div className="h-64 rounded-xl bg-[#0D1A17] border border-[#263833]" />
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#263833] bg-[#0D1A17]/50 p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-[#9CA3AF]/40 mx-auto" />
          <h3 className="text-base font-semibold text-[#F8FAFC]">No tournaments found</h3>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
            {filter === 'live'
              ? 'There are no active tournaments running right now. Check upcoming tournaments!'
              : 'No tournaments match the selected filter.'}
          </p>
          {isStaff && (
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#07110F] font-semibold text-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Tournament</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contests.map((c) => (
            <ContestCard
              key={c.id}
              contest={c}
              onRegister={handleRegister}
              isRegistering={registeringId === c.id}
            />
          ))}
        </div>
      )}

      {/* Staff Contest Editor Modal */}
      {isStaff && (
        <StaffContestEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSaved={fetchContests}
        />
      )}
    </div>
  );
}
