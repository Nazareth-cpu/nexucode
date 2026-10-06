/**
 * Contest Card — Exact Implementation of Reference Panel 03
 *
 * Implements:
 * - Badges: LIVE | ROUND #4
 * - Golden Trophy Vector Artwork
 * - Metadata row: Date, Duration, Registered Contenders
 * - Amber "Enter Contest ->" Button & "Participating" Badge
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { ContestItem } from '../types';
import { ContestRulesModal } from './ContestRulesModal';

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
  const isDisqualified =
    contest.userParticipantStatus === 'disqualified' ||
    (contest.userWarnings !== undefined && contest.userWarnings >= 3);

  const registrationDeadlinePassed =
    new Date(contest.registrationDeadline).getTime() < Date.now();

  const handleRegisterClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRegister && !isRegistering) {
      await onRegister(contest.id);
    }
  };

  return (
    <div className="relative rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-6 sm:p-8 shadow-xl overflow-hidden transition-all duration-200 hover:border-[#7C3AED]/60 hover:shadow-2xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Info Column */}
        <div className="space-y-4 max-w-2xl flex-1 z-10">
          {/* Top Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40">
                UPCOMING
              </span>
            )}

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#181242] text-[#C4B5FD] border border-[#2A205E] uppercase font-mono">
              ROUND #4
            </span>

            {isRegistered && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                Participating
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight hover:text-[#FBBF24] transition-colors">
              {contest.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              {contest.description ||
                'A 3-hour competitive programming contest organized by the Coding Club. Solve algorithmic challenges and climb the leaderboard.'}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-xs font-bold font-mono text-[#94A3B8]">
            <div className="flex items-center gap-1.5 text-[#C4B5FD]">
              <Calendar className="w-4 h-4 text-[#A855F7]" />
              <span>
                {new Date(contest.startAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span>3 Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#64748B]" />
              <span>{contest.participantCount || 312} Registered</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 flex items-center gap-3">
            {isDisqualified ? (
              <span className="px-4 py-2.5 rounded-xl bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Disqualified (3 Warnings)
              </span>
            ) : isLive ? (
              <Link
                to={`/contests/${contest.id}/arena`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#F59E0B]/30 active:scale-95"
              >
                <span>Enter Contest</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isRegistered ? (
              <Link
                to={`/contests/${contest.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#7C3AED]/30 active:scale-95"
              >
                <span>Enter Lobby</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleRegisterClick}
                disabled={isRegistering || registrationDeadlinePassed}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#F59E0B]/30 active:scale-95 disabled:opacity-50"
              >
                <span>{isRegistering ? 'Registering...' : 'Register for Tournament'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="px-4 py-3 rounded-xl bg-[#15103A] hover:bg-[#1E174D] border border-[#241D4D] text-[#94A3B8] hover:text-[#F8FAFC] font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#A855F7]" />
              <span>Rules</span>
            </button>
          </div>
        </div>

        {/* Right Trophy Artwork (Panel 03) */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center shrink-0 self-center lg:self-auto">
          {/* Glowing Aura */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(124, 58, 237, 0.2) 60%, transparent 80%)',
            }}
          />

          {/* Stylized Golden Trophy SVG */}
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full relative z-10 drop-shadow-xl">
            <defs>
              <linearGradient id="goldGrad1" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="30%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id="purplePedestal" x1="30" y1="90" x2="90" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
            </defs>

            {/* Trophy Cup Body */}
            <path
              d="M 35 25 L 85 25 L 80 65 C 80 80, 60 85, 60 85 C 60 85, 40 80, 40 65 Z"
              fill="url(#goldGrad1)"
            />

            {/* Left Handle */}
            <path
              d="M 35 32 C 18 32, 18 55, 38 58"
              stroke="#F59E0B"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Handle */}
            <path
              d="M 85 32 C 102 32, 102 55, 82 58"
              stroke="#FBBF24"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Cup Stem & Base */}
            <rect x="56" y="82" width="8" height="16" rx="2" fill="url(#goldGrad1)" />
            <polygon points="42,98 78,98 84,110 36,110" fill="url(#purplePedestal)" />
            <rect x="34" y="108" width="52" height="6" rx="2" fill="#F59E0B" />

            {/* Star on Cup */}
            <path
              d="M 60 42 L 62 47 L 67 47 L 63 50 L 65 55 L 60 52 L 55 55 L 57 50 L 53 47 L 58 47 Z"
              fill="#FFFBEB"
            />
          </svg>
        </div>
      </div>

      <ContestRulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        rules={contest.rules}
        title={`${contest.title} — Rules`}
      />
    </div>
  );
}
