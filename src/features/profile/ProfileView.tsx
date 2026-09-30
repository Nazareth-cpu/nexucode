/**
 * Student Profile View (Protected: /profile)
 */

import React from 'react';
import { useAuth } from '@/src/features/auth';
import { User, Mail, GraduationCap, ShieldCheck, Calendar, KeyRound, Award } from 'lucide-react';

export function ProfileView() {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student Member';
  const collegeId = user?.user_metadata?.college_id || 'Not specified';
  const email = user?.email || 'N/A';
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
          <User className="w-7 h-7 text-[#F59E0B]" />
          <span>Student Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
          Your authenticated student chapter profile and verification credentials.
        </p>
      </div>

      {/* Profile Summary Card */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-6 space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#12221E] border border-[#263833] flex items-center justify-center text-[#F59E0B] text-xl font-bold font-mono uppercase shadow-sm">
            {displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#F59E0B] font-medium bg-[#12221E] border border-[#263833] px-2 py-0.5 rounded">
                Chapter Student Member
              </span>
              <span className="text-xs text-[#9CA3AF] font-mono">
                ID: {user?.id?.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#263833]">
          <div className="p-3.5 rounded-lg bg-[#07110F] border border-[#263833] space-y-1">
            <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
              Email Address
            </span>
            <p className="text-sm font-medium text-[#F8FAFC]">{email}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#07110F] border border-[#263833] space-y-1">
            <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#F59E0B]" />
              Student Roll / College ID
            </span>
            <p className="text-sm font-medium text-[#F8FAFC] font-mono">{collegeId}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#07110F] border border-[#263833] space-y-1">
            <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
              Member Since
            </span>
            <p className="text-sm font-medium text-[#F8FAFC]">{createdAt}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#07110F] border border-[#263833] space-y-1">
            <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              Authentication Provider
            </span>
            <p className="text-sm font-medium text-[#F8FAFC] capitalize">
              {user?.app_metadata?.provider || 'Email/Password'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
