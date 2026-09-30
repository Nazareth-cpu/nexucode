/**
 * Contest Leaderboard Table (Phase 6)
 *
 * Implements deterministic ICPC-style standings:
 * Ranked by Total Points (descending), then Penalty Time (ascending).
 */

import React, { useState } from 'react';
import { Trophy, Medal, Search, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import type { ContestLeaderboardRow, ContestProblemSummary } from '../types';

interface ContestLeaderboardTableProps {
  standings: ContestLeaderboardRow[];
  problems?: ContestProblemSummary[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ContestLeaderboardTable({
  standings,
  problems = [],
  onRefresh,
  isLoading = false,
}: ContestLeaderboardTableProps) {
  const [search, setSearch] = useState('');

  const filtered = standings.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.displayName.toLowerCase().includes(q) ||
      (row.collegeId && row.collegeId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contender or college ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:bg-[#12221E] text-xs font-mono text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Live Refresh'}</span>
          </button>
        )}
      </div>

      {/* Standings Table */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#263833] bg-[#07110F] text-[#9CA3AF] text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Contender</th>
                <th className="py-3 px-4 text-center">Solved</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Penalty</th>

                {/* Problem Columns */}
                {problems.map((p, idx) => (
                  <th key={p.problemId || idx} className="py-3 px-3 text-center min-w-[70px]">
                    <span className="font-mono text-[#F8FAFC]">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="block text-[10px] text-[#9CA3AF] font-normal font-mono">
                      {p.points}pt
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263833]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + problems.length}
                    className="py-10 text-center text-xs text-[#9CA3AF]"
                  >
                    No tournament contenders found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.userId}
                    className={`hover:bg-[#12221E] transition-colors ${
                      row.isDisqualified ? 'opacity-40 bg-[#180A0A]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {row.isDisqualified ? (
                        <span className="text-[10px] font-mono text-[#EF4444] uppercase">DQ</span>
                      ) : row.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 text-xs">
                          1
                        </span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-xs">
                          2
                        </span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#12221E] text-[#F8FAFC] border border-[#263833] text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">{row.rank}</span>
                      )}
                    </td>

                    {/* Contender Name & College ID */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                        <span>{row.displayName}</span>
                        {row.isDisqualified && (
                          <span
                            title="Disqualified for integrity violations"
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            DQ
                          </span>
                        )}
                      </div>
                      {row.collegeId && (
                        <div className="text-[11px] font-mono text-[#9CA3AF]">
                          {row.collegeId}
                        </div>
                      )}
                    </td>

                    {/* Solved Count */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#F8FAFC]">
                      {row.solvedCount}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#F59E0B]">
                      {row.totalScore}
                    </td>

                    {/* Penalty */}
                    <td className="py-3 px-4 text-center font-mono text-xs text-[#9CA3AF]">
                      {row.penaltyTime}m
                    </td>

                    {/* Problem Status Columns */}
                    {problems.map((p, idx) => {
                      const probKey = p.problemId || p.slug;
                      const stat = row.problems ? row.problems[probKey] : undefined;

                      if (!stat || stat.status === 'unattempted') {
                        return (
                          <td key={probKey || idx} className="py-3 px-3 text-center text-[#9CA3AF]/40 font-mono">
                            -
                          </td>
                        );
                      }

                      if (stat.status === 'accepted') {
                        return (
                          <td key={probKey || idx} className="py-3 px-3 text-center">
                            <div className="inline-block px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-mono text-xs font-bold">
                              +{stat.attempts > 1 ? stat.attempts - 1 : ''}
                              <span className="block text-[9px] font-normal text-[#10B981]/80">
                                {stat.timeMinutes ?? 0}m
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Failed / Rejected attempts
                      return (
                        <td key={probKey || idx} className="py-3 px-3 text-center">
                          <div className="inline-block px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-mono text-xs">
                            -{stat.attempts}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
