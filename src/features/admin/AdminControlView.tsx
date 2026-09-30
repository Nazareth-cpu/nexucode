/**
 * Platform Administrator Control Panel (/admin)
 *
 * Dedicated control interface strictly restricted to Platform Administrators.
 * Features:
 * 1. Club Member Identity & Staff Onboarding Console (One-time token provisioning)
 * 2. Secure Server-Authoritative User Role Provisioning Console
 * 3. Master Authorization Matrix Verification Card
 * 4. Direct Shortcuts to Problems, Contests, and Event Management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  ShieldCheck,
  Shield,
  Users,
  Code2,
  Calendar,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Lock,
  Plus,
  Copy,
  Check,
  KeyRound,
  UserX,
  UserPlus,
  Clock,
  Sparkles,
  ExternalLink,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface PlatformUser {
  id: string;
  display_name: string | null;
  email: string;
  role: 'student' | 'coordinator' | 'admin';
  college_id?: string | null;
  created_at: string;
}

interface ClubMember {
  id: string;
  memberId: string;
  fullName: string;
  email: string;
  assignedRole: 'coordinator' | 'admin';
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  userId: string | null;
  claimedAt: string | null;
  createdAt: string;
}

interface ProvisionedCredentials {
  memberId: string;
  assignedRole: string;
  token: string;
}

const AUTHORIZATION_MATRIX = [
  {
    feature: 'Problems',
    description: 'Create & manage problem definitions, tests, starter code',
    student: false,
    coordinator: true,
    admin: true,
  },
  {
    feature: 'Contests',
    description: 'Create & configure tournaments, scoring rules, proctoring',
    student: false,
    coordinator: false,
    admin: true,
  },
  {
    feature: 'Events',
    description: 'Schedule & administer hackathons, workshops, bootcamps',
    student: false,
    coordinator: true,
    admin: true,
  },
  {
    feature: 'Admin Control',
    description: 'Staff onboarding, role provisioning, system governance',
    student: false,
    coordinator: false,
    admin: true,
  },
];

export function AdminControlView() {
  const { user, session } = useAuth();

  // Active view tab: 'staff' | 'roles' | 'matrix'
  const [activeTab, setActiveTab] = useState<'staff' | 'roles' | 'matrix'>('staff');

  // Club Members State
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    memberId: '',
    fullName: '',
    email: '',
    assignedRole: 'coordinator' as 'coordinator' | 'admin',
  });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newCredentials, setNewCredentials] = useState<ProvisionedCredentials | null>(null);

  // Platform Users State
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Status notification
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchClubMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/club-members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClubMembers(data.members || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchClubMembers();
    fetchUsers();
  }, [session]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionForm.memberId.trim()) return;

    setIsProvisioning(true);
    setStatusMessage(null);

    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/club-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(provisionForm),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewCredentials({
          memberId: data.member.memberId,
          assignedRole: data.member.assignedRole,
          token: data.activationToken,
        });
        setIsProvisionModalOpen(false);
        setProvisionForm({
          memberId: '',
          fullName: '',
          email: '',
          assignedRole: 'coordinator',
        });
        await fetchClubMembers();
      } else {
        setStatusMessage({ text: data.error || 'Failed to provision staff member.', type: 'error' });
      }
    } catch (err: unknown) {
      setStatusMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/admin/club-members/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setStatusMessage({ text: `Staff status updated to ${nextStatus}.`, type: 'success' });
        await fetchClubMembers();
      }
    } catch (err: unknown) {
      setStatusMessage({ text: (err as Error).message, type: 'error' });
    }
  };

  const handleRegenerateToken = async (id: string, memberId: string, assignedRole: string) => {
    try {
      const token = session?.access_token;
      const res = await fetch(`/api/admin/club-members/${id}/regenerate-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewCredentials({
          memberId,
          assignedRole,
          token: data.activationToken,
        });
        setStatusMessage({ text: `New activation token generated for ${memberId}.`, type: 'success' });
        await fetchClubMembers();
      }
    } catch (err: unknown) {
      setStatusMessage({ text: (err as Error).message, type: 'error' });
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'student' | 'coordinator' | 'admin') => {
    setUpdatingUserId(targetUserId);
    setStatusMessage(null);

    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId, newRole }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
        );
        setStatusMessage({
          text: `Role updated to ${newRole.toUpperCase()} for user.`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: `Role update error: ${(err as Error).message}`,
        type: 'error',
      });
    } finally {
      setUpdatingUserId(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="border-b border-[#263833] pb-5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#EF4444] font-semibold bg-[#12221E] px-2.5 py-0.5 rounded border border-[#EF4444]/40">
            Administrative Master Control
          </span>
          <span className="text-xs text-[#9CA3AF]">•</span>
          <span className="text-xs text-[#10B981] font-mono">Privileged Security Boundary</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] mt-1.5 flex items-center gap-2.5">
          <ShieldCheck className="w-8 h-8 text-[#F59E0B]" />
          <span>Administrator Control Panel</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1 max-w-2xl">
          Authoritative governance of club members, staff onboarding, platform roles, tournaments, and security policies.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl border text-xs ${
            statusMessage.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/problems/manage"
          className="p-5 rounded-xl border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B] transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#F59E0B] uppercase tracking-wider">
              Coordinator &amp; Admin
            </span>
            <Code2 className="w-5 h-5 text-[#F59E0B] group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-base font-bold text-[#F8FAFC] mt-2">Problem Management</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Author and publish algorithmic challenges, test suites, and starter templates.
          </p>
        </Link>

        <Link
          to="/contests/manage"
          className="p-5 rounded-xl border border-[#263833] bg-[#0D1A17] hover:border-[#EF4444] transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#EF4444] uppercase tracking-wider">
              Admin ONLY
            </span>
            <Trophy className="w-5 h-5 text-[#EF4444] group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-base font-bold text-[#F8FAFC] mt-2">Contest Management</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Create tournaments, configure ICPC scoring, and monitor proctoring deterrence.
          </p>
        </Link>

        <Link
          to="/events/manage"
          className="p-5 rounded-xl border border-[#263833] bg-[#0D1A17] hover:border-[#10B981] transition-all group shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#10B981] uppercase tracking-wider">
              Coordinator &amp; Admin
            </span>
            <Calendar className="w-5 h-5 text-[#10B981] group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-base font-bold text-[#F8FAFC] mt-2">Event Management</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Schedule hackathons, technical workshops, and chapter engineering summits.
          </p>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#263833] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'staff'
              ? 'bg-[#F59E0B] text-[#07110F] shadow-sm'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Staff Onboarding &amp; Club Members</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#07110F]/30">
            {clubMembers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'roles'
              ? 'bg-[#F59E0B] text-[#07110F] shadow-sm'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Platform User Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'matrix'
              ? 'bg-[#F59E0B] text-[#07110F] shadow-sm'
              : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Authorization Matrix</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Staff Onboarding & Club Members                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#F59E0B]" />
                <span>Club Members &amp; Staff Provisioning</span>
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Admin-controlled staff creation. One-time activation tokens are securely hashed and never stored in plaintext.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchClubMembers}
                disabled={isLoadingMembers}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#263833] bg-[#07110F] hover:border-[#F59E0B] text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMembers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs transition-all shadow-sm active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Provision Staff Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto border border-[#263833] rounded-lg">
            <table className="w-full text-left text-xs text-[#9CA3AF]">
              <thead className="bg-[#07110F] border-b border-[#263833] text-[11px] font-mono uppercase tracking-wider text-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-3.5">Member ID</th>
                  <th className="px-4 py-3.5">Designated Name &amp; Email</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Account Claimed</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263833]/60">
                {clubMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#12221E]/50">
                    <td className="px-5 py-4 font-mono font-semibold text-[#F59E0B]">
                      {m.memberId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-sm text-[#F8FAFC]">
                        {m.fullName || 'Unassigned Name'}
                      </div>
                      <div className="text-[11px] font-mono text-[#9CA3AF]">
                        {m.email || 'No email specified'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                          m.assignedRole === 'admin'
                            ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                            : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                        }`}
                      >
                        {m.assignedRole === 'admin' ? 'Administrator' : 'Event Coordinator'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                          m.status === 'ACTIVE'
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : m.status === 'PENDING'
                            ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px]">
                      {m.claimedAt ? (
                        <div className="text-[#10B981]">
                          {new Date(m.claimedAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-[#9CA3AF]">Pending Activation</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {m.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleRegenerateToken(m.id, m.memberId, m.assignedRole)}
                          className="text-[11px] text-[#F59E0B] hover:text-[#FBBF24] font-medium"
                          title="Generate a new one-time activation token"
                        >
                          Regen Token
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(m.id, m.status)}
                        className={`text-[11px] font-medium ${
                          m.status === 'DISABLED'
                            ? 'text-[#10B981] hover:underline'
                            : 'text-[#EF4444] hover:underline'
                        }`}
                      >
                        {m.status === 'DISABLED' ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: User Role Provisioning Console                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'roles' && (
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F59E0B]" />
                <span>Platform User Accounts</span>
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Authoritative view of active accounts and their profile roles in <code className="text-[#F59E0B]">public.profiles</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#07110F] hover:border-[#F59E0B] text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh Roster</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-[#263833] rounded-lg">
            <table className="w-full text-left text-xs text-[#9CA3AF]">
              <thead className="bg-[#07110F] border-b border-[#263833] text-[11px] font-mono uppercase tracking-wider text-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Student / College ID</th>
                  <th className="px-4 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5 text-right">Assign Platform Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263833]/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#12221E]/50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-[#F8FAFC]">
                        {u.display_name || 'Member'}
                      </div>
                      <div className="text-[11px] font-mono text-[#9CA3AF]">{u.email}</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-[#F8FAFC]">
                      {u.college_id || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                          u.role === 'admin'
                            ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                            : u.role === 'coordinator'
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#12221E] text-[#F59E0B] border-[#263833]'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'Administrator'
                          : u.role === 'coordinator'
                          ? 'Event Coordinator'
                          : 'Student'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) =>
                          handleRoleChange(
                            u.id,
                            e.target.value as 'student' | 'coordinator' | 'admin'
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="coordinator">Event Coordinator</option>
                        <option value="admin">Platform Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: Master Authorization Matrix                             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] overflow-hidden shadow-xl space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F59E0B]" />
              <span>Master Authorization Matrix</span>
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Authoritatively enforced across UI, Client Routes, Server-Side Endpoints, and PostgreSQL Row-Level Security.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#263833] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07110F] border-b border-[#263833] text-[11px] font-mono uppercase tracking-wider text-[#F8FAFC]">
                <tr>
                  <th className="px-5 py-3.5">Permission Domain</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5 text-center">Student</th>
                  <th className="px-4 py-3.5 text-center">Event Coordinator</th>
                  <th className="px-4 py-3.5 text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263833]/60">
                {AUTHORIZATION_MATRIX.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#12221E]/50">
                    <td className="px-5 py-3.5 font-semibold text-sm text-[#F8FAFC]">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#9CA3AF]">{row.description}</td>
                    <td className="px-4 py-3.5 text-center">
                      {row.student ? (
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-mono font-bold">
                          <CheckCircle2 className="w-4 h-4" /> YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-mono font-bold">
                          <XCircle className="w-4 h-4" /> NO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.coordinator ? (
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-mono font-bold">
                          <CheckCircle2 className="w-4 h-4" /> YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-mono font-bold">
                          <XCircle className="w-4 h-4" /> NO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.admin ? (
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-mono font-bold">
                          <CheckCircle2 className="w-4 h-4" /> YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-mono font-bold">
                          <XCircle className="w-4 h-4" /> NO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Provision Staff Member Form                           */}
      {/* ------------------------------------------------------------- */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0D1A17] border border-[#263833] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#263833] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Provision Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Unique Member ID <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NC-STAFF-ADMIN-04"
                  value={provisionForm.memberId}
                  onChange={(e) =>
                    setProvisionForm((p) => ({ ...p, memberId: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#F8FAFC] uppercase placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                />
                <p className="text-[11px] text-[#9CA3AF]">
                  Official organizational identifier for verification.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Designated Staff Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Marcus Lee"
                  value={provisionForm.fullName}
                  onChange={(e) =>
                    setProvisionForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Expected Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. marcus.lee@nexuscode.edu"
                  value={provisionForm.email}
                  onChange={(e) =>
                    setProvisionForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Assigned Platform Role <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={provisionForm.assignedRole}
                  onChange={(e) =>
                    setProvisionForm((p) => ({
                      ...p,
                      assignedRole: e.target.value as 'coordinator' | 'admin',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                >
                  <option value="coordinator">Event Coordinator (Problem &amp; Event Management)</option>
                  <option value="admin">Platform Administrator (Full Authority &amp; Contests)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#07110F] border border-[#263833] text-[11px] text-[#9CA3AF] space-y-1">
                <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Security Guarantee</span>
                </div>
                <p>
                  A cryptographically random one-time activation token will be generated. Only its SHA-256 hash is saved to the database.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#263833] text-xs text-[#9CA3AF] hover:text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning || !provisionForm.memberId.trim()}
                  className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {isProvisioning ? 'Generating Token...' : 'Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: One-Time Activation Credentials View                  */}
      {/* ------------------------------------------------------------- */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D1A17] border-2 border-[#F59E0B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  Staff Credentials Generated!
                </h3>
                <p className="text-xs text-[#EF4444] font-semibold">
                  ⚠️ This activation token will NEVER be shown again. Copy it now and deliver securely to the staff member.
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-[#07110F] border border-[#263833] text-xs">
              <div>
                <span className="text-[11px] text-[#9CA3AF]">Staff Member ID:</span>
                <div className="flex items-center justify-between font-mono font-bold text-[#F59E0B] mt-0.5">
                  <span>{newCredentials.memberId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newCredentials.memberId, 'mid')}
                    className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-[#F8FAFC]"
                  >
                    {copiedKey === 'mid' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'mid' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#9CA3AF]">Assigned Role:</span>
                <div className="font-semibold text-[#F8FAFC] uppercase text-[11px] mt-0.5">
                  {newCredentials.assignedRole}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#9CA3AF]">One-Time Activation Token:</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-[#10B981] bg-[#12221E] p-2.5 rounded-lg border border-[#263833] break-all mt-1">
                  <span>{newCredentials.token}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(newCredentials.token, 'token')}
                    className="ml-2 flex items-center gap-1 text-[11px] text-[#F59E0B] hover:text-[#FBBF24] shrink-0"
                  >
                    {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'token' ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#9CA3AF]">Direct Activation Link:</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-[#9CA3AF] bg-[#12221E] p-2.5 rounded-lg border border-[#263833] break-all mt-1">
                  <span className="truncate mr-2">
                    {`${window.location.origin}/staff/activate?memberId=${newCredentials.memberId}&token=${newCredentials.token}`}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}/staff/activate?memberId=${newCredentials.memberId}&token=${newCredentials.token}`,
                        'link'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-[#F59E0B] hover:text-[#FBBF24] shrink-0"
                  >
                    {copiedKey === 'link' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'link' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setNewCredentials(null)}
                className="px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs shadow-sm transition-all active:scale-[0.99]"
              >
                I Have Safely Saved These Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
