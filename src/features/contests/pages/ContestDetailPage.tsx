/**
 * Contest Detail & Lobby Page (Phase 6)
 *
 * Provides tournament lobby, schedule countdown, rules disclosure,
 * problem set preview, and live standings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Users,
  Code2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Settings2,
  Eye,
  Award,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import type { ContestDetail, ContestLeaderboardRow } from '../types';
import { ContestTimerDisplay } from '../components/ContestTimerDisplay';
import { ContestLeaderboardTable } from '../components/ContestLeaderboardTable';
import { ContestRulesModal } from '../components/ContestRulesModal';
import { StaffContestEditorModal } from '../components/StaffContestEditorModal';
import { StaffProctoringMonitorModal } from '../components/StaffProctoringMonitorModal';

export function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, user } = useAuth();

  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [standings, setStandings] = useState<ContestLeaderboardRow[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'leaderboard'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProctoringOpen, setIsProctoringOpen] = useState(false);

  const isStaff = user?.role === 'coordinator' || user?.role === 'admin';

  const loadContest = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const { data, error } = await contestService.getContest(id, session?.access_token);
    if (error || !data) {
      setErrorMsg(error || 'Tournament not found.');
    } else {
      setContest(data);
    }
    setIsLoading(false);
  }, [id, session?.access_token]);

  const loadLeaderboard = useCallback(async () => {
    if (!id) return;
    const { data } = await contestService.getLeaderboard(id, session?.access_token);
    setStandings(data);
  }, [id, session?.access_token]);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, loadLeaderboard]);

  const handleRegister = async () => {
    if (!contest || !session?.access_token) return;
    setIsRegistering(true);
    const res = await contestService.register(contest.id, session.access_token);
    setIsRegistering(false);
    if (res.success) {
      loadContest();
    } else {
      alert(res.error || 'Failed to register.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Trophy className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
        <p className="text-xs text-[#9CA3AF]">Loading tournament lobby...</p>
      </div>
    );
  }

  if (errorMsg || !contest) {
    return (
      <div className="rounded-xl border border-[#EF4444]/30 bg-[#180A0A] p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto" />
        <h2 className="text-lg font-bold text-[#F8FAFC]">Contest Not Found</h2>
        <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">{errorMsg || 'Could not find tournament.'}</p>
        <Link
          to="/contests"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Contests</span>
        </Link>
      </div>
    );
  }

  const isLive = contest.status === 'live';
  const isScheduled = contest.status === 'scheduled';
  const isEnded = contest.status === 'ended' || contest.status === 'archived';
  const isRegistered =
    contest.userParticipantStatus === 'registered' || contest.userParticipantStatus === 'active';
  const isDisqualified = contest.userParticipantStatus === 'disqualified';
  const canViewProblems = isLive || isEnded || isStaff;

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/contests"
          className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </Link>

        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProctoringOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EF4444]/40 bg-[#180A0A] hover:bg-[#180A0A]/80 text-[#EF4444] text-xs font-semibold transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Proctoring Console</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] text-xs font-medium transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edit Contest</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tournament Banner */}
      <div className="relative rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 sm:p-8 space-y-6 shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  LIVE TOURNAMENT
                </span>
              ) : isScheduled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#12221E] text-[#F59E0B] border border-[#263833]">
                  Registration Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#12221E] text-[#9CA3AF] border border-[#263833]">
                  Tournament Ended
                </span>
              )}

              {isRegistered && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Registered
                </span>
              )}

              {isDisqualified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Disqualified
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              {contest.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              {contest.description || 'Chapter competitive programming tournament.'}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#9CA3AF] pt-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span>{contest.participantCount} Contenders</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#F59E0B]" />
                <span>{contest.problemCount} Problems</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#10B981]" />
                <span>{contest.totalPoints} Total Points</span>
              </span>
            </div>
          </div>

          {/* Right: Timer & Primary Action */}
          <div className="w-full lg:w-80 space-y-4">
            <ContestTimerDisplay
              startAt={contest.startAt}
              endAt={contest.endAt}
              onContestStart={loadContest}
              onContestEnd={loadContest}
            />

            <div>
              {isLive ? (
                <Link
                  to={`/contests/${contest.id}/arena`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#07110F] font-bold text-sm transition-all shadow-lg active:scale-[0.99]"
                >
                  <span>Enter Live Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isScheduled ? (
                isRegistered ? (
                  <div className="p-3 rounded-xl bg-[#12221E] border border-[#10B981]/30 text-center text-xs text-[#10B981] font-medium">
                    You are registered! Arena opens automatically at start time.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-bold text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>{isRegistering ? 'Registering...' : 'Register for Tournament'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#263833] text-[#F8FAFC] bg-[#07110F] font-semibold text-sm hover:border-[#9CA3AF] transition-colors"
                >
                  <span>View Final Standings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#263833] pb-2 text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#12221E] text-[#F59E0B] border border-[#263833]'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
          }`}
        >
          Rules &amp; Schedule
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('problems')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'problems'
              ? 'bg-[#12221E] text-[#F59E0B] border border-[#263833]'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
          }`}
        >
          Tournament Problems ({contest.problemCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-[#12221E] text-[#F59E0B] border border-[#263833]'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
          }`}
        >
          Standings &amp; Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
              <span>Schedule &amp; Deadlines</span>
            </h2>

            <div className="divide-y divide-[#263833]/60 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Tournament Starts:</span>
                <span className="font-mono text-[#F8FAFC]">
                  {new Date(contest.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Tournament Ends:</span>
                <span className="font-mono text-[#F8FAFC]">
                  {new Date(contest.endAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Registration Deadline:</span>
                <span className="font-mono text-[#F8FAFC]">
                  {new Date(contest.registrationDeadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#10B981]" />
              <span>Scoring &amp; Proctoring Summary</span>
            </h2>

            <div className="divide-y divide-[#263833]/60 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Wrong Submission Penalty:</span>
                <span className="font-mono text-[#F8FAFC]">
                  +{contest.rules?.penaltyMinutesPerWrongAnswer ?? 20} minutes
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Max Integrity Strikes:</span>
                <span className="font-mono text-[#F8FAFC]">
                  {contest.rules?.maxWarnings ?? 3} warnings before DQ
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#9CA3AF]">Tab Switch Monitoring:</span>
                <span className="font-mono text-[#10B981]">
                  {contest.rules?.enableProctoring ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="text-xs text-[#F59E0B] hover:underline pt-1 block"
            >
              Read Full Tournament Rules &amp; Regulations →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'problems' && (
        <div className="space-y-4">
          {!canViewProblems ? (
            <div className="rounded-xl border border-dashed border-[#263833] bg-[#0D1A17] p-12 text-center space-y-3">
              <Lock className="w-10 h-10 text-[#F59E0B] mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-[#F8FAFC]">Problem Statements Encrypted</h3>
              <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
                Problems are locked until the tournament begins to ensure fair competition. They will unlock automatically when the timer reaches zero.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contest.problems?.map((prob, idx) => (
                <div
                  key={prob.problemId}
                  className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-3 hover:border-[#263833]/90 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded bg-[#12221E] border border-[#263833] text-center font-mono text-xs font-bold text-[#F59E0B]">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#10B981]">
                        {prob.points} Points
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F8FAFC]">{prob.title}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          prob.difficulty === 'easy'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : prob.difficulty === 'medium'
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                            : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#263833]/80">
                    <Link
                      to={`/contests/${contest.id}/arena/${prob.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#12221E] hover:bg-[#12221E]/80 text-[#F59E0B] font-semibold text-xs border border-[#263833] transition-colors"
                    >
                      <span>Solve in Arena</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <ContestLeaderboardTable
            standings={standings}
            problems={contest.problems}
            onRefresh={loadLeaderboard}
          />
        </div>
      )}

      {/* Rules Modal */}
      <ContestRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={contest.rules}
        title={`${contest.title} — Rules`}
      />

      {/* Staff Modals */}
      {isStaff && (
        <>
          <StaffContestEditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSaved={loadContest}
            contestToEdit={contest}
          />

          <StaffProctoringMonitorModal
            isOpen={isProctoringOpen}
            onClose={() => setIsProctoringOpen(false)}
            contestId={contest.id}
            contestTitle={contest.title}
          />
        </>
      )}
    </div>
  );
}
