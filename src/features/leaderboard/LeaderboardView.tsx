/**
 * Leaderboard View — Authentic Live Tournament Standings
 *
 * Requirements:
 * - Only displays rankings for contests/events that are currently live.
 * - Shows authentic real-time participation data (zero synthetic mock data).
 * - Displays a clean, informative state when no contests/events are currently active.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  RefreshCw,
  Clock,
  ArrowRight,
  Radio,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { useRealtimeLeaderboard } from './hooks/useRealtimeLeaderboard';
import { contestService } from '@/src/features/contests/services/contestService';
import { eventService, type EventItem } from '@/src/features/events/services/eventService';
import type { ContestItem, ContestDetail, ContestLeaderboardRow } from '@/src/features/contests/types';
import { ContestLeaderboardTable } from '@/src/features/contests/components/ContestLeaderboardTable';

export function LeaderboardView() {
  const navigate = useNavigate();
  const { user, profile, session } = useAuth();

  const [liveContests, setLiveContests] = useState<ContestItem[]>([]);
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedTournamentDetail, setSelectedTournamentDetail] = useState<ContestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 1. Fetch live contests and live events
  const discoverLiveTournaments = useCallback(async () => {
    setIsDiscovering(true);
    try {
      const [contestRes, eventList] = await Promise.all([
        contestService.getContests('all', session?.access_token),
        eventService.getEvents(session?.access_token),
      ]);

      const activeContests = (contestRes.data || []).filter((c) => c.status === 'live');
      const activeEvents = (eventList || []).filter((e) => e.status === 'live' && e.isTechnical);

      setLiveContests(activeContests);
      setLiveEvents(activeEvents);

      // Default selection if current selected tournament is not in the active list
      const allActiveIds = [...activeContests.map((c) => c.id), ...activeEvents.map((e) => e.id)];
      if (allActiveIds.length > 0) {
        if (!selectedTournamentId || !allActiveIds.includes(selectedTournamentId)) {
          setSelectedTournamentId(allActiveIds[0]);
        }
      } else {
        setSelectedTournamentId(null);
        setSelectedTournamentDetail(null);
      }
    } catch {
      setLiveContests([]);
      setLiveEvents([]);
      setSelectedTournamentId(null);
    } finally {
      setIsDiscovering(false);
    }
  }, [session?.access_token, selectedTournamentId]);

  useEffect(() => {
    discoverLiveTournaments();
  }, [discoverLiveTournaments]);

  // 2. Fetch full detail (problems, rules) for the active selected contest
  useEffect(() => {
    if (!selectedTournamentId) {
      setSelectedTournamentDetail(null);
      return;
    }

    let isCancelled = false;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      const res = await contestService.getContest(selectedTournamentId, session?.access_token);
      if (!isCancelled && res.data) {
        setSelectedTournamentDetail(res.data);
      }
      if (!isCancelled) {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
    return () => {
      isCancelled = true;
    };
  }, [selectedTournamentId, session?.access_token]);

  // 3. Connect to authoritative real-time leaderboard for the active live contest
  const {
    standings,
    isLoading: isLeaderboardLoading,
    isRealtimeConnected,
    refresh: refreshStandings,
  } = useRealtimeLeaderboard<ContestLeaderboardRow>({
    contestId: selectedTournamentId || undefined,
    enabled: Boolean(selectedTournamentId),
  });

  const selectedContest = useMemo(() => {
    return liveContests.find((c) => c.id === selectedTournamentId) || null;
  }, [liveContests, selectedTournamentId]);

  // Calculate user's live performance in this tournament
  const currentUserId = user?.id;
  const userStanding = useMemo(() => {
    if (!currentUserId || !standings) return null;
    return standings.find((s) => s.userId === currentUserId) || null;
  }, [currentUserId, standings]);

  const totalProblemsCount = selectedTournamentDetail?.problems?.length || selectedContest?.problemCount || 0;
  const userSolvedCount = userStanding?.solvedCount || 0;
  const solvePercentage = totalProblemsCount > 0 ? Math.round((userSolvedCount / totalProblemsCount) * 100) : 0;

  const handleManualRefresh = () => {
    discoverLiveTournaments();
    if (selectedTournamentId) {
      refreshStandings();
    }
  };

  const hasLiveTournaments = liveContests.length > 0 || liveEvents.length > 0;

  return (
    <div className="space-y-6">
      {/* ----------------- TOP HEADER ----------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
            Live Tournament Standings
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Real-time rankings and point progression during active chapter contests.
          </p>
        </div>

        {/* Action Controls & Live Status */}
        <div className="flex items-center gap-2.5">
          {hasLiveTournaments ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>Live Now</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#64748B]/15 border border-[#64748B]/40 text-[#94A3B8] text-xs font-medium font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>No Live Arena</span>
            </div>
          )}

          {hasLiveTournaments && selectedContest && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-[#A855F7] text-xs font-bold font-mono">
              <Users className="w-3.5 h-3.5" />
              <span>{selectedContest.participantCount || standings.length} Participants</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isDiscovering || isLeaderboardLoading}
            className="p-2 rounded-xl border border-[#241D4D] bg-[#0E0B28] hover:bg-[#15103A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isDiscovering || isLeaderboardLoading ? 'animate-spin text-[#F59E0B]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* ----------------- STATE 1: LOADING DISCOVERY ----------------- */}
      {isDiscovering && !hasLiveTournaments ? (
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-12 text-center space-y-4 shadow-xl">
          <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#94A3B8]">
            Scanning for active live tournaments and real-time arenas...
          </p>
        </div>
      ) : !hasLiveTournaments ? (
        /* ----------------- STATE 2: AUTHENTIC EMPTY STATE (NO LIVE CONTESTS) ----------------- */
        <div className="rounded-3xl border border-dashed border-[#241D4D] bg-[#0E0B28]/80 p-10 sm:p-14 text-center space-y-6 shadow-2xl backdrop-blur-sm">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#7C3AED]/10 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-full bg-[#15103A] border border-[#7C3AED]/30 flex items-center justify-center text-[#A855F7]">
              <Radio className="w-8 h-8" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[#F8FAFC]">
              No Live Contests Currently Active
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Leaderboards and ranking tables only activate when a contest or event is live and participants are actively competing and submitting solutions.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/contests')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-lg shadow-[#7C3AED]/25 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Browse Upcoming Contests</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#241D4D] bg-[#15103A] hover:bg-[#1E174E] text-[#F8FAFC] text-xs font-bold transition-all"
            >
              <span>View Technical Events</span>
            </button>
          </div>
        </div>
      ) : (
        /* ----------------- STATE 3: LIVE TOURNAMENT ACTIVE ----------------- */
        <div className="space-y-6">
          {/* Tournament Switcher Tabs (if multiple tournaments are active simultaneously) */}
          {(liveContests.length > 1 || liveEvents.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 bg-[#0E0B28] p-1.5 rounded-2xl border border-[#241D4D]">
              {liveContests.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedTournamentId(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedTournamentId === c.id
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Split Layout: Live Table & Real Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Real-time Contest Standings Table */}
            <div className="lg:col-span-2">
              <ContestLeaderboardTable
                standings={standings}
                problems={selectedTournamentDetail?.problems || []}
                onRefresh={refreshStandings}
                isLoading={isLeaderboardLoading || isLoadingDetail}
                isRealtimeConnected={isRealtimeConnected}
              />
            </div>

            {/* Right Column (1 Col): Real User Progress & Arena Info */}
            <div className="space-y-6">
              {/* Active Tournament Card */}
              {selectedContest && (
                <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#A855F7] font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Live Arena
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/contests/${selectedContest.id}/arena`)}
                      className="text-xs font-bold text-[#F59E0B] hover:text-[#FBBF24] inline-flex items-center gap-1"
                    >
                      <span>Enter Arena</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-[#F8FAFC]">
                      {selectedContest.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                      {selectedContest.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#241D4D]">
                    <div className="p-2.5 rounded-xl bg-[#08051A] border border-[#241D4D]">
                      <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                        Problems
                      </span>
                      <span className="text-sm font-extrabold font-mono text-[#F8FAFC]">
                        {totalProblemsCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#08051A] border border-[#241D4D]">
                      <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                        Contenders
                      </span>
                      <span className="text-sm font-extrabold font-mono text-[#10B981]">
                        {selectedContest.participantCount || standings.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Your Live Progress Card (Computed strictly from live submissions) */}
              <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  Your Live Progress
                </h3>

                {userStanding ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-3xl font-extrabold text-[#F8FAFC] font-mono">
                          {userSolvedCount}{' '}
                          <span className="text-[#64748B] text-lg font-normal">
                            / {totalProblemsCount}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#94A3B8] mt-1">
                          Problems Solved
                        </p>
                      </div>

                      {/* Accurate Progress Ring */}
                      <div className="relative w-18 h-18 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-[#241D4D]"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#7C3AED]"
                            strokeDasharray={`${solvePercentage}, 100`}
                            strokeLinecap="round"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute font-mono font-extrabold text-xs text-[#FBBF24]">
                          {solvePercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#241D4D] text-xs">
                      <div className="p-2 rounded-lg bg-[#08051A] border border-[#241D4D]">
                        <span className="text-[10px] text-[#64748B] block font-mono uppercase">
                          Current Rank
                        </span>
                        <span className="font-mono font-bold text-[#F59E0B]">
                          #{userStanding.rank}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#08051A] border border-[#241D4D]">
                        <span className="text-[10px] text-[#64748B] block font-mono uppercase">
                          Total Score
                        </span>
                        <span className="font-mono font-bold text-[#F8FAFC]">
                          {userStanding.totalScore} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-[#94A3B8]">
                      You haven't submitted any solutions for this live tournament yet.
                    </p>
                    {selectedContest && (
                      <button
                        type="button"
                        onClick={() => navigate(`/contests/${selectedContest.id}/arena`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20"
                      >
                        <span>Join Live Arena</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

