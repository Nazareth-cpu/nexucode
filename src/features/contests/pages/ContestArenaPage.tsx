/**
 * Contest Live Arena Page (Phase 6)
 *
 * Distraction-free, server-authoritative tournament workspace.
 * Features:
 * 1. Synchronized countdown timer
 * 2. Problem selector bar (A, B, C, D) with point allocations and solved status
 * 3. Integrated Monaco editor + Judge0 execution pipeline passing contestId
 * 4. Academic integrity proctoring (tab switch & paste detection) with strike enforcement
 * 5. In-arena live leaderboard drawer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  ShieldAlert,
  BarChart3,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Code2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import { problemService } from '@/src/features/problems/services/problemService';
import type { ProblemWithRelations } from '@/src/features/problems';
import type { ContestDetail, ContestLeaderboardRow, ContestProblemSummary } from '../types';
import { useContestTimer } from '../hooks/useContestTimer';
import { useContestProctoring } from '../hooks/useContestProctoring';
import { ViolationWarningModal } from '../components/ViolationWarningModal';
import { ContestLeaderboardTable } from '../components/ContestLeaderboardTable';
import { WorkspaceLayout } from '@/src/features/workspace/components/WorkspaceLayout';

export function ContestArenaPage() {
  const { id: contestId, problemSlug } = useParams<{ id: string; problemSlug?: string }>();
  const navigate = useNavigate();
  const { session, user } = useAuth();

  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [activeProblemSummary, setActiveProblemSummary] = useState<ContestProblemSummary | null>(null);
  const [activeProblemFull, setActiveProblemFull] = useState<ProblemWithRelations | null>(null);
  const [isLoadingContest, setIsLoadingContest] = useState(true);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [standings, setStandings] = useState<ContestLeaderboardRow[]>([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);

  // 1. Fetch contest and start participation
  const fetchContest = useCallback(async () => {
    if (!contestId || !session?.access_token) return;
    setIsLoadingContest(true);
    const { data } = await contestService.getContest(contestId, session.access_token);
    if (data) {
      setContest(data);
      // Mark participation active
      await contestService.startParticipation(contestId, session.access_token);
    }
    setIsLoadingContest(false);
  }, [contestId, session?.access_token]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  // 2. Select active problem
  useEffect(() => {
    if (!contest?.problems || contest.problems.length === 0) return;

    let target = contest.problems[0];
    if (problemSlug) {
      const match = contest.problems.find((p) => p.slug === problemSlug);
      if (match) target = match;
    }

    setActiveProblemSummary(target);
  }, [contest, problemSlug]);

  // 3. Fetch full problem definition for Monaco workspace
  useEffect(() => {
    if (!activeProblemSummary?.slug) return;

    let isCancelled = false;
    setIsLoadingProblem(true);

    problemService.getProblemBySlug(activeProblemSummary.slug).then((res) => {
      if (!isCancelled && res.data) {
        setActiveProblemFull(res.data);
      }
      if (!isCancelled) {
        setIsLoadingProblem(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeProblemSummary?.slug]);

  // 4. Timer setup
  const { state: timerState, formattedTime, isCritical } = useContestTimer(
    contest?.startAt || new Date().toISOString(),
    contest?.endAt || new Date().toISOString()
  );

  // 5. Proctoring Hook
  const {
    warnings,
    maxWarnings,
    isDisqualified,
    activeNotice,
    dismissNotice,
  } = useContestProctoring({
    contestId: contestId || '',
    enabled: true,
    rules: contest?.rules,
    initialWarnings: contest?.userWarnings || 0,
    isContestLive: timerState === 'live',
  });

  // 6. Fetch standings for in-arena drawer
  const fetchLeaderboard = useCallback(async () => {
    if (!contestId) return;
    setIsLoadingStandings(true);
    const { data } = await contestService.getLeaderboard(contestId, session?.access_token);
    setStandings(data);
    setIsLoadingStandings(false);
  }, [contestId, session?.access_token]);

  const handleOpenLeaderboard = () => {
    setIsLeaderboardOpen(true);
    fetchLeaderboard();
  };

  const handleProblemChange = (prob: ContestProblemSummary) => {
    setActiveProblemSummary(prob);
    navigate(`/contests/${contestId}/arena/${prob.slug}`, { replace: true });
  };

  const handleSubmissionSuccess = () => {
    // Refresh contest details to reflect updated solved flags and scores
    fetchContest();
  };

  if (isLoadingContest) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-3">
        <Trophy className="w-8 h-8 text-[#10B981] animate-spin" />
        <p className="text-xs text-[#9CA3AF] font-mono">Initializing Contest Arena...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-[#EF4444]">Contest not found or could not be loaded.</p>
        <Link to="/contests" className="text-xs text-[#F59E0B] underline">
          Return to Contests
        </Link>
      </div>
    );
  }

  if (isDisqualified) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#EF4444]/60 bg-[#180A0A] p-6 space-y-4 text-center">
          <ShieldAlert className="w-12 h-12 text-[#EF4444] mx-auto" />
          <h2 className="text-xl font-bold text-[#F8FAFC]">Disqualified from Tournament</h2>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            You have reached the maximum allowed proctoring violations ({maxWarnings}). Access to the tournament arena has been revoked.
          </p>
          <Link
            to="/contests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC]"
          >
            <span>Return to Contests</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-[#07110F]">
      {/* ----------------- TOP ARENA BAR ----------------- */}
      <header className="h-14 border-b border-[#263833] bg-[#0D1A17] px-4 flex items-center justify-between gap-3 flex-shrink-0 z-20">
        {/* Left: Contest Title & Problem Navigator */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <Link
            to={`/contests/${contest.id}`}
            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors p-1 rounded hover:bg-[#12221E] flex-shrink-0"
            title="Exit Arena to Lobby"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span className="hidden md:inline font-mono font-bold text-[#F8FAFC]">
              {contest.title}
            </span>
          </Link>

          <span className="text-[#263833] hidden md:inline">|</span>

          {/* Problem Selector Pills */}
          <div className="flex items-center gap-1.5">
            {contest.problems?.map((prob, idx) => {
              const isSelected = activeProblemSummary?.problemId === prob.problemId;
              const letter = String.fromCharCode(65 + idx);

              return (
                <button
                  key={prob.problemId}
                  type="button"
                  onClick={() => handleProblemChange(prob)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-[#F59E0B] text-[#07110F] font-bold shadow-sm'
                      : prob.solved
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25'
                      : 'bg-[#07110F] text-[#9CA3AF] border border-[#263833] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{letter}</span>
                  {prob.solved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <span className="text-[10px] opacity-75">{prob.points}p</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Timer, Strikes & Standings Drawer */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Synchronized Live Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
              timerState === 'live'
                ? isCritical
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 animate-pulse'
                  : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                : 'bg-[#07110F] text-[#9CA3AF] border-[#263833]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>

          {/* Strikes Badge */}
          <div
            title={`Integrity strikes: ${warnings} of ${maxWarnings} allowed`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border ${
              warnings > 0
                ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40'
                : 'bg-[#07110F] text-[#9CA3AF] border-[#263833]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {warnings}/{maxWarnings}
            </span>
          </div>

          {/* Standings Button */}
          <button
            type="button"
            onClick={handleOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#263833] bg-[#07110F] hover:bg-[#12221E] text-xs font-mono text-[#F59E0B] transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Standings</span>
          </button>
        </div>
      </header>

      {/* ----------------- WORKSPACE BODY ----------------- */}
      <main className="flex-1 relative overflow-hidden">
        {isLoadingProblem || !activeProblemFull ? (
          <div className="h-full flex items-center justify-center space-y-2">
            <Code2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
            <p className="text-xs text-[#9CA3AF] font-mono">Loading problem statement and editor...</p>
          </div>
        ) : (
          <WorkspaceLayout
            problem={activeProblemFull}
            userId={user?.id || 'anon'}
            contestId={contest.id}
            onSubmissionSuccess={handleSubmissionSuccess}
            backUrl={`/contests/${contest.id}`}
            backLabel="Lobby"
          />
        )}
      </main>

      {/* ----------------- LEADERBOARD DRAWER ----------------- */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-[#0D1A17] border-l border-[#263833] h-full flex flex-col p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#263833] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Tournament Standings</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchLeaderboard}
                  disabled={isLoadingStandings}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#F8FAFC]"
                  title="Refresh Standings"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingStandings ? 'animate-spin text-[#F59E0B]' : ''}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="p-1 rounded text-[#9CA3AF] hover:text-[#F8FAFC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ContestLeaderboardTable
                standings={standings}
                problems={contest.problems}
                onRefresh={fetchLeaderboard}
                isLoading={isLoadingStandings}
              />
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIOLATION WARNING MODAL ----------------- */}
      {activeNotice && (
        <ViolationWarningModal
          notice={activeNotice}
          onAcknowledge={dismissNotice}
        />
      )}
    </div>
  );
}
