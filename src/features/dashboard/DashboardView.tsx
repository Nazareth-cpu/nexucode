/**
 * Student Dashboard View (Protected)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  Code2,
  Trophy,
  Calendar,
  CheckCircle2,
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export function DashboardView() {
  const { user } = useAuth();
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full pointer-events-none opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 80%)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#12221E] text-[#F59E0B] border border-[#263833]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              Protected Workspace Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Welcome back, <span className="text-[#F59E0B]">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-xl leading-relaxed">
              Your chapter coding workspace is ready. Practice algorithm challenges, register for
              upcoming chapter tournaments, and prepare for weekend hackathons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              <span>Solve Problems</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#263833] hover:border-[#F59E0B] bg-[#07110F] text-[#F8FAFC] hover:text-[#FBBF24] font-medium text-xs sm:text-sm transition-all"
            >
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span>Contests</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-[#9CA3AF] font-medium">Problems Solved</p>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">14</p>
            <p className="text-[11px] text-[#10B981] flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> +3 this week
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#12221E] border border-[#263833] text-[#F59E0B] flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-[#9CA3AF] font-medium">Chapter Contest Rank</p>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">#12</p>
            <p className="text-[11px] text-[#F59E0B] font-mono">Top 8% in Chapter</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#12221E] border border-[#263833] text-[#F59E0B] flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-[#9CA3AF] font-medium">Daily Streak</p>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">5 Days</p>
            <p className="text-[11px] text-[#10B981] flex items-center gap-1 font-mono">
              <Flame className="w-3 h-3 text-[#F59E0B]" /> Streak active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#12221E] border border-[#263833] text-[#F59E0B] flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-[#9CA3AF] font-medium">Upcoming Events</p>
            <p className="text-2xl font-bold text-[#F8FAFC] font-mono">2</p>
            <p className="text-[11px] text-[#9CA3AF] font-mono">CodeStorm Hackathon</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#12221E] border border-[#263833] text-[#10B981] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Quick Solve & Contests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Problems */}
        <div className="lg:col-span-2 rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-semibold text-sm">
              <Code2 className="w-4 h-4 text-[#F59E0B]" />
              <span>Recommended Practice Problems</span>
            </div>
            <Link
              to="/problems"
              className="text-xs text-[#F59E0B] hover:text-[#FBBF24] font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#263833]/60">
            {[
              {
                slug: 'two-sum',
                title: 'Two Sum',
                difficulty: 'Easy',
                diffColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
                tags: ['Arrays', 'Hash Map'],
                acceptance: '49.8%',
              },
              {
                slug: 'longest-substring-without-repeating-characters',
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                diffColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
                tags: ['Sliding Window', 'Strings'],
                acceptance: '34.2%',
              },
              {
                slug: 'median-of-two-sorted-arrays',
                title: 'Median of Two Sorted Arrays',
                difficulty: 'Hard',
                diffColor: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30',
                tags: ['Binary Search', 'Divide & Conquer'],
                acceptance: '37.1%',
              },
            ].map((p) => (
              <Link
                key={p.slug}
                to={`/problems/${p.slug}`}
                className="py-3 flex items-center justify-between hover:bg-[#12221E] px-2.5 rounded-lg transition-colors group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#F8FAFC] group-hover:text-[#F59E0B] transition-colors">
                      {p.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${p.diffColor}`}
                    >
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                    {p.tags.map((t) => (
                      <span key={t} className="bg-[#07110F] border border-[#263833] px-1.5 py-0.5 rounded text-[#9CA3AF] font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                    <span className="font-mono text-[11px]">• {p.acceptance} pass rate</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#F59E0B] transition-colors transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Next Contest Card */}
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-semibold text-sm">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span>Next Chapter Tournament</span>
            </div>

            <div className="p-4 rounded-xl bg-[#12221E] border border-[#263833] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#F59E0B] font-semibold block">
                Round #42 • 120 Mins
              </span>
              <h3 className="text-base font-bold text-[#F8FAFC]">Algorithms Chapter Cup 2026</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                4 algorithmic challenges. Individual participation with strict deterministic judging
                and live leaderboard.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-[#10B981] font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Starts Saturday 10:00 AM</span>
              </div>
            </div>
          </div>

          <Link
            to="/contests"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs transition-all shadow-sm active:scale-[0.99]"
          >
            <span>Register for Contest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
