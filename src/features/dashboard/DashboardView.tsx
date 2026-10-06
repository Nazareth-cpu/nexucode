/**
 * Dashboard View — Exact Implementation of Reference Panel 01
 *
 * Implements:
 * - Dynamic Time-Aware Greeting with Typewriter Tagline
 * - Purple Mountain Hero Art with Sunset Sun & "Discipline today, mastery tomorrow."
 * - 4 Metric Stat Cards (Problems Solved, Contest Rank, Daily Streak, Upcoming Events)
 * - "Continue Your Journey" 4 Interactive Navigation Cards
 * - Dark Elevated Surfaces (bg-[#0E0B28], border-[#241D4D]) with Purple + Amber Glows
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  Code2,
  Trophy,
  Calendar,
  Flame,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
} from 'lucide-react';

export function DashboardView() {
  const { user, profile } = useAuth();
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Vedavyas';

  // Dynamic Time-aware greeting
  const [greeting, setGreeting] = useState('Good evening');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Typewriter effect tagline
  const [taglineIndex, setTaglineIndex] = useState(0);
  const taglines = [
    'Code | Compete | Create | Grow',
    'Master Algorithms | Build Skills',
    'Conquer Challenges | Lead the Pack',
  ];
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTagline = taglines[taglineIndex];
    const speed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(currentTagline.slice(0, displayedText.length + 1));
        if (displayedText.length + 1 === currentTagline.length) {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        setDisplayedText(currentTagline.slice(0, displayedText.length - 1));
        if (displayedText.length === 0) {
          setIsDeleting(false);
          setTaglineIndex((prev) => (prev + 1) % taglines.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, taglineIndex]);

  return (
    <div className="space-y-6">
      {/* ----------------- TOP HERO CARD (Panel 01) ----------------- */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#170E3B] via-[#12092E] to-[#1E0F45] text-[#F8FAFC] p-6 sm:p-8 shadow-xl overflow-hidden border border-[#241D4D]">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#7C3AED]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-64 h-64 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Greeting & Tagline */}
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
              {greeting},{' '}
              <span className="text-[#FBBF24] font-extrabold">{displayName}</span> 👋
            </h1>

            {/* Typewriter Tagline */}
            <div className="h-6 flex items-center">
              <p className="text-xs sm:text-sm font-semibold text-[#A855F7] font-mono tracking-wide">
                {displayedText}
                <span className="inline-block w-1.5 h-4 bg-[#F59E0B] ml-1 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Right Mountain Landscape Graphic & Quote */}
          <div className="flex items-center gap-6 self-center lg:self-auto">
            {/* Stylized Glowing Purple & Amber Geometric Mountain SVG */}
            <div className="relative w-56 sm:w-72 h-28 hidden sm:flex items-end justify-center">
              <svg viewBox="0 0 280 120" fill="none" className="w-full h-full drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                {/* Background Sunset Sun */}
                <circle cx="140" cy="55" r="32" fill="url(#sunGradDashboard)" />

                {/* Stars / Dust in Sky */}
                <circle cx="45" cy="25" r="1" fill="#FBBF24" opacity="0.8" />
                <circle cx="85" cy="18" r="1.5" fill="#DDD6FE" opacity="0.9" />
                <circle cx="210" cy="22" r="1" fill="#FBBF24" opacity="0.7" />
                <circle cx="245" cy="35" r="1.5" fill="#DDD6FE" opacity="0.8" />
                <circle cx="175" cy="15" r="1" fill="#DDD6FE" opacity="0.9" />

                {/* Back Mountain Range */}
                <polygon points="30,110 110,35 190,110" fill="url(#dashMountainGrad1)" opacity="0.7" />
                {/* Middle Mountain Range */}
                <polygon points="0,110 75,45 160,110" fill="url(#dashMountainGrad2)" opacity="0.9" />
                {/* Front Mountain Range */}
                <polygon points="100,110 175,40 260,110" fill="url(#dashMountainGrad3)" />
                {/* Far Right Mountain */}
                <polygon points="180,110 235,55 280,110" fill="url(#dashMountainGrad2)" opacity="0.8" />

                <defs>
                  <linearGradient id="sunGradDashboard" x1="140" y1="23" x2="140" y2="87" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="40%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="dashMountainGrad1" x1="110" y1="35" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#4C1D95" />
                  </linearGradient>
                  <linearGradient id="dashMountainGrad2" x1="75" y1="45" x2="75" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#2E1065" />
                  </linearGradient>
                  <linearGradient id="dashMountainGrad3" x1="175" y1="40" x2="175" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#1E0B4B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="text-right hidden md:block">
              <p className="text-xs font-medium italic text-[#C4B5FD] max-w-[170px] leading-snug">
                &ldquo;Discipline today, mastery tomorrow.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- 4 METRICS CARDS (Panel 01) ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Problems Solved */}
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 flex items-center justify-between shadow-sm hover:border-[#7C3AED]/60 hover:shadow-lg hover:shadow-[#7C3AED]/10 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#94A3B8]">Problems Solved</p>
            <p className="text-3xl font-extrabold text-[#F8FAFC] font-mono">14</p>
            <p className="text-[11px] font-bold text-[#34D399] flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> +3 this week
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 flex items-center justify-center font-mono font-bold text-lg">
            &lt;/&gt;
          </div>
        </div>

        {/* Metric 2: Contest Rank */}
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 flex items-center justify-between shadow-sm hover:border-[#F59E0B]/60 hover:shadow-lg hover:shadow-[#F59E0B]/10 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#94A3B8]">Contest Rank</p>
            <p className="text-3xl font-extrabold text-[#F8FAFC] font-mono">#12</p>
            <p className="text-[11px] font-bold text-[#FBBF24] font-mono">
              Top 5% in chapter
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Daily Streak */}
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 flex items-center justify-between shadow-sm hover:border-[#F97316]/60 hover:shadow-lg hover:shadow-[#F97316]/10 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#94A3B8]">Daily Streak</p>
            <p className="text-3xl font-extrabold text-[#F8FAFC] font-mono">5 Days</p>
            <p className="text-[11px] font-bold text-[#FB923C] font-mono">
              Keep it up!
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EA580C]/20 text-[#FB923C] border border-[#EA580C]/40 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Upcoming Events */}
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 flex items-center justify-between shadow-sm hover:border-[#A855F7]/60 hover:shadow-lg hover:shadow-[#A855F7]/10 transition-all">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#94A3B8]">Upcoming Events</p>
            <p className="text-3xl font-extrabold text-[#F8FAFC] font-mono">2</p>
            <p className="text-[11px] font-bold text-[#C084FC] font-mono">
              Don&apos;t miss out!
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ----------------- CONTINUE YOUR JOURNEY SECTION (Panel 01) ----------------- */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#F8FAFC]">Continue Your Journey</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Solve Problems */}
          <Link
            to="/problems"
            className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/15 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 flex items-center justify-center group-hover:scale-105 transition-transform font-mono font-bold text-sm">
                &lt;/&gt;
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FBBF24] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                Solve Problems
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Sharpen your skills</p>
            </div>
          </Link>

          {/* Card 2: Contests */}
          <Link
            to="/contests"
            className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 hover:border-[#F59E0B] hover:shadow-lg hover:shadow-[#F59E0B]/15 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FBBF24] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                Contests
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Test your limits</p>
            </div>
          </Link>

          {/* Card 3: Events */}
          <Link
            to="/events"
            className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 hover:border-[#7C3AED] hover:shadow-lg hover:shadow-[#7C3AED]/15 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FBBF24] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                Events
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">Participate &amp; Learn</p>
            </div>
          </Link>

          {/* Card 4: Leaderboard */}
          <Link
            to="/leaderboard"
            className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-5 hover:border-[#F59E0B] hover:shadow-lg hover:shadow-[#F59E0B]/15 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FBBF24] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                Leaderboard
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">See where you stand</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ----------------- RECOMMENDED PROBLEMS & CONTEST BANNER ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Problems */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-base">
              <Code2 className="w-5 h-5 text-[#A855F7]" />
              <span>Recommended Practice Problems</span>
            </div>
            <Link
              to="/problems"
              className="text-xs font-bold text-[#F59E0B] hover:text-[#FBBF24] flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#241D4D]/60">
            {[
              {
                slug: 'two-sum',
                title: 'Two Sum',
                difficulty: 'Easy',
                diffBadge: 'bg-[#064E3B]/40 text-[#34D399] border-[#059669]/50',
                tags: ['Array', 'Hash Map'],
                acceptance: '49.8%',
              },
              {
                slug: 'longest-substring-without-repeating-characters',
                title: 'Longest Substring Without Repeating Characters',
                difficulty: 'Medium',
                diffBadge: 'bg-[#78350F]/40 text-[#FBBF24] border-[#D97706]/50',
                tags: ['String', 'Sliding Window'],
                acceptance: '34.2%',
              },
              {
                slug: 'median-of-two-sorted-arrays',
                title: 'Median of Two Sorted Arrays',
                difficulty: 'Hard',
                diffBadge: 'bg-[#881337]/40 text-[#FB7185] border-[#E11D48]/50',
                tags: ['Array', 'Divide & Conquer'],
                acceptance: '37.1%',
              },
            ].map((p) => (
              <Link
                key={p.slug}
                to={`/problems/${p.slug}`}
                className="py-3.5 flex items-center justify-between hover:bg-[#15103A]/60 px-3 rounded-xl transition-colors group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors">
                      {p.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${p.diffBadge}`}
                    >
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-[#181242] border border-[#2A205E] px-2 py-0.5 rounded-md text-[#C4B5FD] font-mono text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="font-mono text-[11px] text-[#64748B]">• {p.acceptance} pass rate</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#FBBF24] transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Next Chapter Tournament Card */}
        <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#F8FAFC] font-bold text-base">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
              <span>Next Chapter Tournament</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#15103A] text-[#F8FAFC] border border-[#2A205E] space-y-2.5">
              <span className="inline-block text-[10px] uppercase font-mono tracking-wider text-[#08051A] font-extrabold bg-[#F59E0B] px-2.5 py-0.5 rounded-full">
                Round #4 • 3 Hours
              </span>
              <h3 className="text-base font-bold text-[#F8FAFC]">Algorithms Chapter Cup 2026</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                4 algorithmic challenges. Individual participation with strict deterministic judging and live leaderboard.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-[#34D399] font-mono font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Starts Oct 10, 2026 • 10:00 AM</span>
              </div>
            </div>
          </div>

          <Link
            to="/contests"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs transition-all shadow-md shadow-[#F59E0B]/20 active:scale-[0.99]"
          >
            <span>Register for Contest</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

