/**
 * Contest Management Page (Platform Administrators ONLY)
 *
 * Dedicated administrative dashboard for Platform Administrators to schedule,
 * configure, and oversee competitive coding tournaments and ICPC rounds.
 *
 * Authorization Matrix Rule:
 * - Student: NO
 * - Event Coordinator: NO (MUST NOT create/manage contests)
 * - Admin: YES
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ContestAdminItem {
  id: string;
  title: string;
  status: 'live' | 'scheduled' | 'ended';
  startTime: string;
  durationMinutes: number;
  participantsCount: number;
  problemsCount: number;
}

const INITIAL_CONTESTS: ContestAdminItem[] = [
  {
    id: 'contest-live-12',
    title: 'Algorithms Chapter Cup 2026',
    status: 'live',
    startTime: 'Live Now',
    durationMinutes: 120,
    participantsCount: 4,
    problemsCount: 4,
  },
  {
    id: 'contest-upcoming-13',
    title: 'Speedrun Coding Challenge #8',
    status: 'scheduled',
    startTime: 'Oct 11, 2026 • 2:00 PM',
    durationMinutes: 90,
    participantsCount: 18,
    problemsCount: 3,
  },
  {
    id: 'contest-past-11',
    title: 'Sprint Cup Qualification Round 1',
    status: 'ended',
    startTime: 'Sep 18, 2026',
    durationMinutes: 120,
    participantsCount: 52,
    problemsCount: 4,
  },
];

export function ContestManagementPage() {
  const { profile } = useAuth();
  const [contests, setContests] = useState<ContestAdminItem[]>(INITIAL_CONTESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredContests = contests.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263833] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#EF4444] font-semibold bg-[#12221E] px-2 py-0.5 rounded border border-[#EF4444]/40">
              Admin Exclusive Portal
            </span>
            <span className="text-xs text-[#9CA3AF]">•</span>
            <span className="text-xs text-[#F59E0B] font-mono">Authorization Matrix Enforced</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] mt-1 flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
            <span>Contest Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Authoritative tournament administration, problem binding, and proctoring oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setNotice('Contest creation wizard ready. Platform administrator credentials confirmed.');
              setTimeout(() => setNotice(null), 3500);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Security Rule Notice Banner */}
      <div className="p-4 rounded-xl border border-[#263833] bg-[#0D1A17] flex items-start gap-3.5">
        <Lock className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[#9CA3AF]">
          <p className="font-semibold text-[#F8FAFC]">
            Strict Role Hierarchy Notice:
          </p>
          <p className="leading-relaxed">
            Contest creation, problem attachment, penalty scoring rules, and proctoring strike adjustments
            are restricted exclusively to <span className="text-[#EF4444] font-semibold font-mono">Administrators</span>.
            Event Coordinators and Student members cannot access this console or modify tournament configurations.
          </p>
        </div>
      </div>

      {/* Contests Table */}
      <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#263833]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#9CA3AF]">
            <thead className="bg-[#07110F] border-b border-[#263833] text-[11px] font-mono uppercase tracking-wider text-[#F8FAFC]">
              <tr>
                <th className="px-5 py-3.5">Tournament Title</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Problems</th>
                <th className="px-4 py-3.5">Enrolled Contenders</th>
                <th className="px-5 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263833]/60">
              {filteredContests.map((c) => (
                <tr key={c.id} className="hover:bg-[#12221E]/60 transition-colors">
                  <td className="px-5 py-4 font-semibold text-sm text-[#F8FAFC]">
                    {c.title}
                    <div className="text-[11px] font-mono font-normal text-[#9CA3AF] mt-0.5">
                      ID: {c.id}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        c.status === 'live'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                          : c.status === 'scheduled'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                          : 'bg-[#9CA3AF]/10 text-[#9CA3AF] border border-[#263833]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#F8FAFC]">
                    {c.durationMinutes} mins
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#F8FAFC]">
                    {c.problemsCount} Challenges
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#10B981]">
                    {c.participantsCount} Registered
                  </td>
                  <td className="px-5 py-4 text-right space-x-3">
                    <Link
                      to={`/contests/${c.id}`}
                      className="text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
                    >
                      Lobby
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(`Opening tournament administrator settings for ${c.title}.`);
                        setTimeout(() => setNotice(null), 3000);
                      }}
                      className="text-xs text-[#F59E0B] hover:text-[#FBBF24] font-medium transition-colors"
                    >
                      Configure
                    </button>
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
