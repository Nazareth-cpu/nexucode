/**
 * First Administrator Bootstrap Card Component
 *
 * One-time setup component embedded directly in the platform UI (e.g. LoginPage).
 * Features:
 * 1. Checks server-side bootstrap availability.
 * 2. When ZERO admins exist and user is authenticated: provides 1-click promotion
 *    directly from the login page into the Admin Control Panel.
 * 3. When ZERO admins exist and user is unauthenticated: guides the operator to sign in
 *    or register first.
 * 4. Permanently vanishes or displays confirmed status once the first admin is established.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  ShieldCheck,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Trophy,
  Code2,
  Calendar,
  Users,
} from 'lucide-react';

interface BootstrapStatus {
  available: boolean;
  adminCount: number;
  reason?: string;
  adminUserId?: string | null;
  adminEmail?: string | null;
}

export interface FirstAdminBootstrapCardProps {
  onBootstrapSuccess?: () => void;
  className?: string;
}

export function FirstAdminBootstrapCard({ onBootstrapSuccess, className = '' }: FirstAdminBootstrapCardProps) {
  const navigate = useNavigate();
  const { user, profile, session, refreshProfile } = useAuth();

  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/admin/bootstrap/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Ignore network errors in status probe
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleEstablishAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConfirmed || isSubmitting || !user) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = session?.access_token;
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('First Administrator established successfully!');
        // Refresh authoritative profile
        await refreshProfile();
        if (onBootstrapSuccess) {
          onBootstrapSuccess();
        } else {
          setTimeout(() => {
            navigate('/admin');
          }, 1200);
        }
      } else {
        setErrorMessage(data.message || data.error || 'Failed to establish administrator.');
        await checkStatus();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Bootstrap request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading or bootstrap is not available AND user is not the confirmed admin, render nothing (standard UI)
  if (isLoadingStatus) return null;
  if (!status?.available && profile?.role !== 'admin') return null;

  // Case A: User is already established as Platform Administrator
  if (profile?.role === 'admin') {
    return (
      <div className={`p-4 rounded-xl border border-[#10B981]/40 bg-[#12221E]/80 text-[#F8FAFC] space-y-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              Platform Initialized
            </span>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Administrator Status Active</h4>
          </div>
        </div>
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
          You are authenticated as the Platform Administrator. You have full access to manage tournaments, author challenges, and onboard staff.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-bold text-xs transition-all shadow-sm active:scale-[0.99]"
        >
          <span>Open Admin Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Case B: Zero administrators exist, but user is NOT authenticated yet
  if (!user) {
    return (
      <div className={`p-4 rounded-xl border border-[#F59E0B]/40 bg-[#12221E]/90 text-[#F8FAFC] space-y-2.5 ${className}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#F59E0B] font-bold">
            One-Time Deployment Initialization
          </span>
        </div>
        <h4 className="text-sm font-bold text-[#F8FAFC]">Zero Administrators Detected</h4>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          This Nexus Code deployment does not have an administrator yet. Sign in or sign up with your operator account below to establish it as the <strong className="text-[#F8FAFC]">First Platform Administrator</strong>.
        </p>
      </div>
    );
  }

  // Case C: Zero administrators exist AND user IS authenticated -> Directly establish here!
  return (
    <div className={`p-5 rounded-2xl border-2 border-[#F59E0B]/60 bg-[#07110F] text-[#F8FAFC] space-y-4 shadow-xl ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#12221E] border border-[#263833] text-[#F59E0B]">
              <span>One-Time Setup</span>
            </div>
            <h3 className="text-sm font-bold text-[#F8FAFC] mt-0.5">Establish First Administrator</h3>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2 text-xs text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-2 text-xs text-[#10B981]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{successMessage}</p>
            <p className="text-[11px] mt-0.5 text-[#10B981]/80">Routing to Administrator Control Panel...</p>
          </div>
        </div>
      )}

      {/* Target Account Summary */}
      <div className="p-3 rounded-xl border border-[#263833] bg-[#0D1A17] space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#9CA3AF]">Target Operator Identity:</span>
          <span className="font-mono text-[#F59E0B] font-semibold">{user.email}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#9CA3AF]">Current Status:</span>
          <span className="font-mono text-[#9CA3AF] uppercase text-[10px] px-1.5 py-0.5 rounded bg-[#12221E] border border-[#263833]">
            {profile?.role || 'student'}
          </span>
        </div>
      </div>

      {/* Privileges Highlights */}
      <div className="space-y-1.5 text-xs text-[#9CA3AF]">
        <span className="text-[11px] font-semibold text-[#F8FAFC]">Privileges Granted:</span>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <Trophy className="w-3.5 h-3.5" />
            <span>Contest Management</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <Code2 className="w-3.5 h-3.5" />
            <span>Problem Authoring</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Event Scheduling</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <Users className="w-3.5 h-3.5" />
            <span>Staff Provisioning</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleEstablishAdmin} className="space-y-3 pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg border border-[#F59E0B]/30 bg-[#12221E]">
          <input
            type="checkbox"
            checked={hasConfirmed}
            onChange={(e) => setHasConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#263833] bg-[#07110F] text-[#F59E0B] focus:ring-[#F59E0B] cursor-pointer"
          />
          <span className="text-[11px] text-[#F8FAFC] leading-snug">
            I confirm that I am authorized to initialize this platform and establish this account as the First Administrator.
          </span>
        </label>

        <button
          type="submit"
          disabled={!hasConfirmed || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Establishing Administrator...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Establish as First Administrator</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
