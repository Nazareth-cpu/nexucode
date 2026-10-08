/**
 * Student Profile & Certificates View (Protected: /profile)
 *
 * Purple & Amber Visual System Edition
 */

import React from 'react';
import { useAuth } from '@/src/features/auth';
import { User, Mail, GraduationCap, ShieldCheck, Calendar, Award, Trophy, CheckCircle2, Sparkles } from 'lucide-react';
import { useUserStreak } from '@/src/services/streak/streakService';

export function ProfileView() {
  const { user, profile } = useAuth();
  const { currentStreak } = useUserStreak();

  const displayName =
    profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Vedavyas Mahendrada';
  const collegeId = profile?.college_id || user?.user_metadata?.college_id || '22B91A0584';
  const role = profile?.role || 'student';
  const email = user?.email || 'vedavyas@gmrit.edu.in';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'September 2026';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
          <User className="w-7 h-7 text-[#7C3AED]" />
          <span>Profile &amp; Achievements</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Your authenticated student chapter profile, badges, and verified credentials.
        </p>
      </div>

      {/* Profile Summary Card */}
      <div className="rounded-3xl bg-[#0E0B28] border border-[#241D4D] p-6 sm:p-8 space-y-6 shadow-xl text-[#F8FAFC]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-2xl font-extrabold font-mono shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#F8FAFC]">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#08051A] font-extrabold bg-[#F59E0B] px-2.5 py-0.5 rounded-full uppercase font-mono">
                  {role}
                </span>
                <span className="text-xs text-[#94A3B8] font-mono">
                  ID: {user?.id?.slice(0, 8) || 'student-active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] text-xs font-bold font-mono border border-[#10B981]/40">
              <CheckCircle2 className="w-4 h-4" />
              Verified Chapter Member
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#241D4D]">
          <div className="p-4 rounded-2xl bg-[#15103A] border border-[#241D4D] space-y-1">
            <span className="text-[11px] font-bold text-[#94A3B8] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#A855F7]" />
              Email Address
            </span>
            <p className="text-xs font-bold text-[#F8FAFC] truncate">{email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#15103A] border border-[#241D4D] space-y-1">
            <span className="text-[11px] font-bold text-[#94A3B8] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#F59E0B]" />
              College Roll / ID
            </span>
            <p className="text-xs font-bold text-[#F8FAFC] font-mono">{collegeId}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#15103A] border border-[#241D4D] space-y-1">
            <span className="text-[11px] font-bold text-[#94A3B8] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
              Member Since
            </span>
            <p className="text-xs font-bold text-[#F8FAFC]">{createdAt}</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#15103A] border border-[#241D4D] space-y-1">
            <span className="text-[11px] font-bold text-[#94A3B8] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              Auth Status
            </span>
            <p className="text-xs font-bold text-[#34D399] capitalize">
              {user?.app_metadata?.provider || 'Active / Verified'}
            </p>
          </div>
        </div>
      </div>

      {/* Verified Chapter Certificates & Badges Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-[#F8FAFC] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#F59E0B]" />
          <span>Earned Certificates &amp; Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#F59E0B]/60 p-5 space-y-3 shadow-xl text-[#F8FAFC] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#F8FAFC]">Algorithms Chapter Cup 2026</h4>
              <p className="text-xs text-[#94A3B8]">Top 5% Qualifier Badge • 320 Pts</p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-[#FBBF24] bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full">
              Verified Certificate
            </span>
          </div>

          <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#7C3AED]/60 p-5 space-y-3 shadow-xl text-[#F8FAFC] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#F8FAFC]">
                {currentStreak}-Day Problem Solving Streak
              </h4>
              <p className="text-xs text-[#94A3B8]">Consistency Achievement</p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-[#FBBF24] bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-2.5 py-0.5 rounded-full">
              {currentStreak > 0 ? "Active Milestone" : "Start Today"}
            </span>
          </div>

          <div className="rounded-2xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#34D399]/60 p-5 space-y-3 shadow-xl text-[#F8FAFC] transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#F8FAFC]">DSA Induction Workshop</h4>
              <p className="text-xs text-[#94A3B8]">Chapter Certification</p>
            </div>
            <span className="inline-block text-[10px] font-mono font-bold text-[#34D399] bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-0.5 rounded-full">
              Completed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

