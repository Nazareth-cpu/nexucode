/**
 * Contests Listing Page — Exact Implementation of Reference Panel 03
 *
 * Implements:
 * - Header: "Contests" + "+ Create Contest"
 * - Tabs: Upcoming, Live, Past
 * - High-Impact Card Layout with Golden Trophy Art and Purple + Amber accents
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import type { ContestItem } from '../types';
import { ContestCard } from '../components/ContestCard';
import { StaffContestEditorModal } from '../components/StaffContestEditorModal';

export function ContestsListPage() {
  const { session, user, profile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const isStaff = profile?.role === 'coordinator' || profile?.role === 'admin';

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
      {/* ----------------- TOP HEADER (Panel 03) ----------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Contests
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Compete, learn and climb the leaderboard with chapter coding tournaments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isStaff && (
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Contest</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchContests}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#241D4D] bg-[#0E0B28] hover:bg-[#15103A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Refresh Contests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------- TABS ROW (Panel 03) ----------------- */}
      <div className="flex items-center gap-2 bg-[#0E0B28] p-1.5 rounded-2xl border border-[#241D4D] self-start w-fit">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'live', label: 'Live' },
          { id: 'past', label: 'Past' },
          { id: 'all', label: 'All' },
        ].map((tab) => {
          const isActive = (filter === 'all' && tab.id === 'all') || filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition-all ${
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

      {/* Contests List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-64 rounded-3xl bg-[#0E0B28] border border-[#241D4D]" />
          <div className="h-64 rounded-3xl bg-[#0E0B28] border border-[#241D4D]" />
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#241D4D] bg-[#0E0B28]/60 p-12 text-center space-y-3">
          <Trophy className="w-12 h-12 text-[#94A3B8]/40 mx-auto" />
          <h3 className="text-base font-bold text-[#F8FAFC]">No tournaments found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            {filter === 'live'
              ? 'There are no active tournaments running right now. Check upcoming tournaments!'
              : 'No tournaments match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
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
