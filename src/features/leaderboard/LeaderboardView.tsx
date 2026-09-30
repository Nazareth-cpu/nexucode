/**
 * Leaderboard View (Protected: /leaderboard)
 */

import React from 'react';
import { BarChart3, Trophy, Medal, Search } from 'lucide-react';

const STANDINGS = [
  { rank: 1, name: 'Aarav Sharma', roll: '21CS001', solved: 48, score: 2840, badge: 'Grandmaster' },
  { rank: 2, name: 'Ananya Iyer', roll: '21CS045', solved: 45, score: 2710, badge: 'Master' },
  { rank: 3, name: 'Rohan Verma', roll: '22CS012', solved: 42, score: 2590, badge: 'Master' },
  { rank: 4, name: 'Priya Nair', roll: '21IT023', solved: 39, score: 2420, badge: 'Candidate' },
  { rank: 5, name: 'Karthik Rao', roll: '22IT009', solved: 37, score: 2310, badge: 'Candidate' },
  { rank: 6, name: 'Sneha Patel', roll: '23CS078', solved: 34, score: 2150, badge: 'Specialist' },
];

export function LeaderboardView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-[#F59E0B]" />
          <span>Chapter Leaderboard</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
          Real-time chapter standings based on verified contest performance and problem solving streaks.
        </p>
      </div>

      {/* Standings Table */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#263833] bg-[#07110F] text-[#9CA3AF] text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">College ID</th>
                <th className="py-3 px-4 text-center">Solved</th>
                <th className="py-3 px-4 text-center">Rating Tier</th>
                <th className="py-3 px-4 text-right">Contest Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263833]/60">
              {STANDINGS.map((s) => (
                <tr key={s.rank} className="hover:bg-[#12221E] transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono font-bold">
                    {s.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 text-xs">
                        1
                      </span>
                    ) : s.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-xs">
                        2
                      </span>
                    ) : s.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#12221E] text-[#F8FAFC] border border-[#263833] text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF]">{s.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#F8FAFC]">{s.name}</td>
                  <td className="py-3.5 px-4 font-mono text-[#9CA3AF] text-xs">{s.roll}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-[#F8FAFC]">{s.solved}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#12221E] text-[#F59E0B] border border-[#263833]">
                      {s.badge}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#10B981]">
                    {s.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
