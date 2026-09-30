/**
 * Tournament Summary Card (Phase 6)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  Code2,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import type { ContestItem } from '../types';
import { ContestRulesModal } from './ContestRulesModal';
import { ContestTimerDisplay } from './ContestTimerDisplay';

interface ContestCardProps {
  contest: ContestItem;
  onRegister?: (contestId: string) => Promise<void>;
  isRegistering?: boolean;
}

export function ContestCard({ contest, onRegister, isRegistering }: ContestCardProps) {
  const [showRules, setShowRules] = useState(false);

  const isLive = contest.status === 'live';
  const isScheduled = contest.status === 'scheduled';
  const isEnded = contest.status === 'ended' || contest.status === 'archived';
  const isRegistered =
    contest.userParticipantStatus === 'registered' || contest.userParticipantStatus === 'active';
  const isDisqualified = contest.userParticipantStatus === 'disqualified';

  const registrationDeadlinePassed =
    new Date(contest.registrationDeadline).getTime() < Date.now();

  const handleRegisterClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRegister && !isRegistering) {
      await onRegister(contest.id);
    }
  };

  return (
    <div
      className={`relative rounded-xl border p-5 sm:p-6 space-y-4 shadow-xl overflow-hidden transition-all flex flex-col justify-between ${
        isLive
          ? 'bg-[#0D1A17] border-[#10B981]/50 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
          : 'bg-[#0D1A17] border-[#263833] hover:border-[#263833]/80'
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                LIVE TOURNAMENT
              </span>
            ) : isScheduled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#12221E] text-[#F59E0B] border border-[#263833]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                {registrationDeadlinePassed ? 'Registration Closed' : 'Registration Open'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#12221E] text-[#9CA3AF] border border-[#263833]">
                Tournament Concluded
              </span>
            )}

            {isRegistered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                <CheckCircle className="w-3 h-3" />
                Registered
              </span>
            )}

            {isDisqualified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                <AlertCircle className="w-3 h-3" />
                Disqualified
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
            title="Read Rules & Scoring Guidelines"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>

        {/* Title & Description */}
        <div>
          <Link
            to={isLive ? `/contests/${contest.id}/arena` : `/contests/${contest.id}`}
            className="text-lg font-bold text-[#F8FAFC] hover:text-[#F59E0B] transition-colors leading-snug"
          >
            {contest.title}
          </Link>
          <p className="text-xs text-[#9CA3AF] mt-1.5 line-clamp-2 leading-relaxed">
            {contest.description || 'Structured competitive tournament with deterministic test case scoring.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#07110F] border border-[#263833] text-center">
          <div>
            <div className="text-[10px] text-[#9CA3AF] uppercase font-mono">Problems</div>
            <div className="text-xs font-bold font-mono text-[#F8FAFC] mt-0.5">
              {contest.problemCount || 4}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#9CA3AF] uppercase font-mono">Total Points</div>
            <div className="text-xs font-bold font-mono text-[#F59E0B] mt-0.5">
              {contest.totalPoints || 400}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#9CA3AF] uppercase font-mono">Contenders</div>
            <div className="text-xs font-bold font-mono text-[#10B981] mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-[#10B981]" />
              <span>{contest.participantCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="p-3 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#9CA3AF] font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{new Date(contest.startAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          <div>
            <ContestTimerDisplay
              startAt={contest.startAt}
              endAt={contest.endAt}
              compact
            />
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-[#263833]/80">
        {isLive ? (
          <Link
            to={`/contests/${contest.id}/arena`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#07110F] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99]"
          >
            <span>Enter Live Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : isScheduled ? (
          isRegistered ? (
            <Link
              to={`/contests/${contest.id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#10B981]/50 text-[#10B981] bg-[#12221E] hover:bg-[#12221E]/80 font-medium text-xs sm:text-sm transition-all"
            >
              <span>Registered • View Lobby</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : registrationDeadlinePassed ? (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#263833] text-[#9CA3AF]/60 bg-[#07110F] font-medium text-xs sm:text-sm cursor-not-allowed"
            >
              <span>Registration Closed</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegisterClick}
              disabled={isRegistering}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              <span>{isRegistering ? 'Registering...' : 'Register for Tournament'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        ) : (
          <Link
            to={`/contests/${contest.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#263833] text-[#9CA3AF] hover:text-[#F8FAFC] hover:border-[#9CA3AF] bg-[#07110F] font-medium text-xs sm:text-sm transition-all"
          >
            <span>View Standings &amp; Problems</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Rules Modal */}
      <ContestRulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        rules={contest.rules}
        title={`${contest.title} — Rules`}
      />
    </div>
  );
}
