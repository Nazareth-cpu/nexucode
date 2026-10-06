/**
 * Leaderboard View — Exact Implementation of Reference Panel 06
 *
 * Implements:
 * - Header: Live Leaderboard + Live Status & Participant Count
 * - Left: Live Ranking Table (#, Participant avatar/name, Score, Solved, Last Submission)
 * - Right: "Your Progress" Circular 40% Ring & "Rank Over Time" Trend Chart
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Trophy,
  Search,
  RefreshCw,
  Users,
  Award,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { useRealtimeLeaderboard } from './hooks/useRealtimeLeaderboard';
import type { ChapterLeaderboardRow } from '@/src/services/ranking/rankingService';

export function LeaderboardView() {
  const { user, profile } = useAuth();
  const { standings, isLoading, isRealtimeConnected, refresh } =
    useRealtimeLeaderboard<ChapterLeaderboardRow>();

  const [search, setSearch] = useState('');

  const currentUserName =
    profile?.display_name || user?.user_metadata?.display_name || 'Vedavyas Mahendrada';

  // Seed reference table data matching Panel 06
  const referenceLeaderboard = [
    { rank: 1, name: 'Aryan Sharma', score: 560, solved: 4, lastSub: '2 min ago', avatar: 'A', isCurrentUser: false },
    { rank: 2, name: 'Meera Iyer', score: 520, solved: 4, lastSub: '5 min ago', avatar: 'M', isCurrentUser: false },
    { rank: 3, name: 'Rohan Verma', score: 480, solved: 3, lastSub: '7 min ago', avatar: 'R', isCurrentUser: false },
    { rank: 12, name: currentUserName, score: 320, solved: 2, lastSub: '12 min ago', avatar: 'V', isCurrentUser: true },
    { rank: 13, name: 'Karthik Reddy', score: 300, solved: 2, lastSub: '14 min ago', avatar: 'K', isCurrentUser: false },
    { rank: 14, name: 'Ananya Deshmukh', score: 280, solved: 2, lastSub: '18 min ago', avatar: 'A', isCurrentUser: false },
    { rank: 15, name: 'Siddharth Patel', score: 260, solved: 2, lastSub: '22 min ago', avatar: 'S', isCurrentUser: false },
  ];

  const displayData = standings && standings.length > 0
    ? standings.map((s) => ({
        rank: s.rank,
        name: s.name,
        score: s.score,
        solved: s.solved,
        lastSub: 'Just now',
        avatar: s.name.charAt(0).toUpperCase(),
        isCurrentUser: s.name.toLowerCase().includes(currentUserName.toLowerCase()),
      }))
    : referenceLeaderboard;

  const filteredData = displayData.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ----------------- TOP HEADER (Panel 06) ----------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Live Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Real-time rankings and point progression during chapter contests.
          </p>
        </div>

        {/* Live Badges */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>Live</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-[#A855F7] text-xs font-bold font-mono">
            <Users className="w-3.5 h-3.5" />
            <span>312 Participants</span>
          </div>

          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-[#241D4D] bg-[#0E0B28] hover:bg-[#15103A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------- SPLIT LAYOUT (Panel 06) ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Ranking Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0E0B28] border border-[#241D4D] overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="p-4 border-b border-[#241D4D] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contender..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-[#241D4D] bg-[#0A061E]/90 text-[#94A3B8] text-xs uppercase font-bold font-mono">
                <tr>
                  <th className="py-3 px-4 w-12 text-center text-[#64748B]">#</th>
                  <th className="py-3 px-4 text-[#94A3B8]">Participant</th>
                  <th className="py-3 px-4 text-center text-[#94A3B8]">Score</th>
                  <th className="py-3 px-4 text-center text-[#94A3B8]">Solved</th>
                  <th className="py-3 px-4 text-right text-[#94A3B8]">Last Submission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#241D4D]/60 text-[#F8FAFC]">
                {filteredData.map((row) => (
                  <tr
                    key={row.rank + row.name}
                    className={`transition-colors ${
                      row.isCurrentUser
                        ? 'bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 font-bold text-[#FBBF24] border-l-2 border-[#F59E0B]'
                        : 'hover:bg-[#15103A]/60'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {row.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F59E0B] text-[#08051A] text-xs font-extrabold shadow-sm">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#94A3B8] text-[#08051A] text-xs font-bold">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#B45309] text-white text-xs font-bold">
                          3
                        </span>
                      ) : (
                        <span className="text-[#64748B]">{row.rank}</span>
                      )}
                    </td>

                    {/* Participant Avatar & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            row.isCurrentUser
                              ? 'bg-[#F59E0B] text-[#08051A]'
                              : 'bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40'
                          }`}
                        >
                          {row.avatar}
                        </div>
                        <span className="font-bold text-[#F8FAFC]">{row.name}</span>
                        {row.isCurrentUser && (
                          <span className="text-[10px] font-mono uppercase bg-[#F59E0B] text-[#08051A] px-1.5 py-0.2 rounded font-extrabold">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#F59E0B]">
                      {row.score}
                    </td>

                    {/* Solved */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#F8FAFC]">
                      {row.solved}
                    </td>

                    {/* Last Submission */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#94A3B8]">
                      {row.lastSub}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Progress & Rank-Over-Time Cards (Panel 06) */}
        <div className="space-y-6">
          {/* Your Progress Card */}
          <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F8FAFC]">Your Progress</h3>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-extrabold text-[#F8FAFC] font-mono">
                  2 <span className="text-[#64748B] text-lg font-normal">/ 5</span>
                </div>
                <p className="text-xs font-semibold text-[#94A3B8] mt-1">Problems Solved</p>
              </div>

              {/* 40% Circular Progress Indicator SVG */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-[#241D4D]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Arc (40%) */}
                  <path
                    className="text-[#7C3AED]"
                    strokeDasharray="40, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-extrabold text-sm text-[#FBBF24]">
                  40%
                </span>
              </div>
            </div>
          </div>

          {/* Rank Over Time Trend Card (Panel 06) */}
          <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F8FAFC]">Rank Over Time</h3>
              <span className="text-xs font-bold text-[#34D399] flex items-center gap-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" /> Climbing #12
              </span>
            </div>

            {/* Rank Trend SVG Line Chart */}
            <div className="pt-2">
              <svg viewBox="0 0 260 100" className="w-full h-24 overflow-visible">
                <defs>
                  <linearGradient id="rankLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="50%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="20" y1="20" x2="250" y2="20" stroke="#241D4D" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="50" x2="250" y2="50" stroke="#241D4D" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="80" x2="250" y2="80" stroke="#241D4D" strokeWidth="1" strokeDasharray="3,3" />

                {/* Y-axis labels */}
                <text x="5" y="24" className="text-[8px] font-mono fill-[#64748B]">1</text>
                <text x="5" y="54" className="text-[8px] font-mono fill-[#64748B]">20</text>
                <text x="5" y="84" className="text-[8px] font-mono fill-[#64748B]">50</text>

                {/* Trend line curve from rank 45 to rank 12 */}
                <path
                  d="M 30 75 Q 80 65, 120 40 T 190 35 T 240 28"
                  fill="none"
                  stroke="url(#rankLineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="30" cy="75" r="3.5" fill="#7C3AED" />
                <circle cx="85" cy="58" r="3.5" fill="#7C3AED" />
                <circle cx="140" cy="40" r="3.5" fill="#A855F7" />
                <circle cx="190" cy="35" r="3.5" fill="#F59E0B" />
                <circle cx="240" cy="28" r="4.5" fill="#FBBF24" stroke="#7C3AED" strokeWidth="2" />
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between text-[9px] font-mono text-[#64748B] pt-2 px-2">
                <span>0</span>
                <span>30m</span>
                <span>1h</span>
                <span>2h</span>
                <span>3h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
