/**
 * Contest Live Arena Page — Exact Implementation of Reference Panel 05
 *
 * Distraction-free, full-screen server-authoritative tournament workspace.
 * Features:
 * 1. Live Countdown Timer (02 : 15 : 32)
 * 2. Problem selector bar (1. Two Sum, 2. Good Subarrays, etc.)
 * 3. Integrated Monaco editor + Judge0 execution pipeline
 * 4. Academic integrity proctoring & mandatory full-screen mode
 * 5. Standings drawer and "End Contest" action
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
  Maximize2,
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
import { useRealtimeLeaderboard } from '@/src/features/leaderboard';

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
  const [isServerDisqualified, setIsServerDisqualified] = useState(false);

  const {
    standings,
    isLoading: isLoadingStandings,
    isRealtimeConnected,
    refresh: refreshStandings,
  } = useRealtimeLeaderboard<ContestLeaderboardRow>({
    contestId,
    enabled: Boolean(contestId),
  });

  const fetchContest = useCallback(async () => {
    if (!contestId || !session?.access_token) return;
    setIsLoadingContest(true);
    const { data } = await contestService.getContest(contestId, session.access_token);
    if (data) {
      setContest(data);
      if (data.userParticipantStatus === 'disqualified' || (data.userWarnings && data.userWarnings >= 3)) {
        setIsServerDisqualified(true);
        setIsLoadingContest(false);
        return;
      }
      const startRes = await contestService.startParticipation(contestId, session.access_token);
      if (!startRes.success && startRes.isDisqualified) {
        setIsServerDisqualified(true);
      }
    }
    setIsLoadingContest(false);
  }, [contestId, session?.access_token]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  useEffect(() => {
    if (!contest?.problems || contest.problems.length === 0) return;

    let target = contest.problems[0];
    if (problemSlug) {
      const match = contest.problems.find((p) => p.slug === problemSlug);
      if (match) target = match;
    }

    setActiveProblemSummary(target);
  }, [contest, problemSlug]);

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

  const { state: timerState, formattedTime, isCritical } = useContestTimer(
    contest?.startAt || new Date().toISOString(),
    contest?.endAt || new Date().toISOString()
  );

  const {
    warnings,
    maxWarnings,
    isDisqualified,
    activeNotice,
    dismissNotice,
    reportViolation,
  } = useContestProctoring({
    contestId: contestId || '',
    scopeType: 'contest',
    enabled: true,
    rules: contest?.rules,
    initialWarnings: contest?.userParticipantStatus === 'disqualified' ? 3 : contest?.userWarnings || 0,
    isContestLive: timerState === 'live',
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(document.fullscreenElement));
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && timerState === 'live' && !isDisqualified) {
        reportViolation('fullscreen_exit', { reason: 'Exited mandatory tournament full-screen mode' });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [timerState, isDisqualified, reportViolation]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(true);
    }
  };

  const handleOpenLeaderboard = () => {
    setIsLeaderboardOpen(true);
    refreshStandings();
  };

  const handleProblemChange = (prob: ContestProblemSummary) => {
    setActiveProblemSummary(prob);
    navigate(`/contests/${contestId}/arena/${prob.slug}`, { replace: true });
  };

  const handleSubmissionSuccess = () => {
    fetchContest();
    refreshStandings();
  };

  if (isLoadingContest) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-3">
        <Trophy className="w-8 h-8 text-[#7C3AED] animate-spin" />
        <p className="text-xs text-[#94A3B8] font-mono">Initializing Contest Arena...</p>
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

  if (isDisqualified || isServerDisqualified || contest.userParticipantStatus === 'disqualified') {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#EF4444]/60 bg-[#150707] p-8 space-y-4 text-center shadow-2xl">
          <ShieldAlert className="w-14 h-14 text-[#EF4444] mx-auto animate-pulse" />
          <div className="inline-block px-3 py-1 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-xs font-mono font-bold uppercase">
            3 Strikes Enforced
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Participation Permanently Revoked</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            You have reached the maximum allowed proctoring violations ({maxWarnings}). Your active participation has been permanently revoked.
          </p>
          <div className="pt-2">
            <Link
              to="/contests"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Contests</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-[#08051A]">
      {/* ----------------- TOP ARENA BAR (Panel 05) ----------------- */}
      <header className="h-16 border-b border-[#241D4D] bg-[#0E0B28] px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 z-20">
        {/* Left: Contest Title & Problem Navigator */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <span className="font-extrabold text-[#F8FAFC] text-sm sm:text-base whitespace-nowrap">
            {contest.title}
          </span>

          <span className="text-[#241D4D] hidden md:inline">|</span>

          {/* Problem Selector Pills */}
          <div className="flex items-center gap-1.5">
            {contest.problems?.map((prob, idx) => {
              const isSelected = activeProblemSummary?.problemId === prob.problemId;
              const label = `${idx + 1}. ${prob.title}`;

              return (
                <button
                  key={prob.problemId}
                  type="button"
                  onClick={() => handleProblemChange(prob)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
                      : prob.solved
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25'
                      : 'bg-[#15103A] text-[#94A3B8] border border-[#241D4D] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{label}</span>
                  {prob.solved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <span className="text-[10px] opacity-75 font-mono">{prob.points}p</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Timer, Strikes & End Contest Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Synchronized Live Countdown Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-extrabold border border-[#241D4D] bg-[#15103A] text-[#F8FAFC]">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <span>{formattedTime}</span>
          </div>

          {/* Strikes Badge */}
          <div
            title={`Integrity strikes: ${warnings} of ${maxWarnings} allowed`}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono border ${
              warnings > 0
                ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 font-bold'
                : 'bg-[#15103A] text-[#94A3B8] border-[#241D4D]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              {warnings}/{maxWarnings}
            </span>
          </div>

          {/* Standings Button */}
          <button
            type="button"
            onClick={handleOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#241D4D] bg-[#15103A] hover:bg-[#1E174E] text-xs font-bold text-[#F59E0B] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Standings</span>
          </button>

          {/* End Contest Button (Panel 05) */}
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="px-4 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            End Contest
          </button>
        </div>
      </header>

      {/* ----------------- WORKSPACE BODY ----------------- */}
      <main className="flex-1 relative overflow-hidden">
        {isLoadingProblem || !activeProblemFull ? (
          <div className="h-full flex items-center justify-center space-y-2">
            <Code2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
            <p className="text-xs text-[#94A3B8] font-mono">Loading problem statement and editor...</p>
          </div>
        ) : (
          <WorkspaceLayout
            key={activeProblemFull.id}
            problem={activeProblemFull}
            userId={user?.id || 'anon'}
            contestId={contest.id}
            onSubmissionSuccess={handleSubmissionSuccess}
            backUrl={`/contests/${contest.id}`}
            backLabel="Lobby"
          />
        )}
      </main>

      {/* ----------------- MANDATORY FULL-SCREEN MODAL OVERLAY ----------------- */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-3xl border border-[#7C3AED]/50 bg-[#0E0B28] p-8 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center text-[#A855F7] mx-auto shadow-inner">
              <Maximize2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Mandatory Full-Screen Mode</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Contest integrity rules require participants to operate in browser full-screen mode throughout the entire tournament.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={enterFullscreen}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Enter Full-Screen Arena</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] text-xs transition-colors"
              >
                <span>Return to Tournament Lobby</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- EXIT CONFIRMATION MODAL ----------------- */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl border border-[#241D4D] bg-[#0E0B28] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Exit Tournament Arena?</h3>
                <p className="text-xs text-[#94A3B8]">
                  Your tournament timer will continue running in the lobby.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] bg-[#08051A] p-3.5 rounded-xl border border-[#241D4D] leading-relaxed font-mono">
              You can return to the arena before the countdown expires. Any submitted solutions remain saved.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#241D4D] bg-[#15103A] text-[#F8FAFC] text-xs font-semibold hover:bg-[#1E174E] transition-colors"
              >
                Stay in Arena
              </button>
              <button
                type="button"
                onClick={() => navigate(`/contests/${contest.id}`)}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-colors"
              >
                Exit to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- LEADERBOARD DRAWER ----------------- */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#0E0B28] border-l border-[#241D4D] h-full flex flex-col p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#241D4D] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Tournament Standings</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshStandings}
                  disabled={isLoadingStandings}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC]"
                  title="Refresh Standings"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingStandings ? 'animate-spin text-[#F59E0B]' : ''}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ContestLeaderboardTable
                standings={standings}
                problems={contest.problems}
                onRefresh={refreshStandings}
                isLoading={isLoadingStandings}
                isRealtimeConnected={isRealtimeConnected}
              />
            </div>
          </div>
        </div>
      )}

      {/* Violation Warning Modal */}
      {activeNotice && (
        <ViolationWarningModal
          notice={activeNotice}
          onAcknowledge={dismissNotice}
          exitUrl="/contests"
          exitLabel="Return to Contests"
        />
      )}
    </div>
  );
}
