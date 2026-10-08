/**
 * Secure First Admin Bootstrap Page (/admin/bootstrap)
 *
 * Implements the one-time bootstrap workflow for fresh deployments:
 * 1. Checks server-side if zero administrators exist.
 * 2. Requires an active authenticated Supabase session.
 * 3. Shows the authenticated user's identity as the bootstrap target.
 * 4. Requires explicit confirmation before promotion.
 * 5. Atomically promotes the user to Platform Administrator and permanently seals the bootstrap.
 * 6. If bootstrap is already complete, hides all controls and shows an informative notice.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { NexusCodeLogo } from '@/src/components/common/NexusCodeLogo';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  KeyRound,
  UserCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Trophy,
  Users,
  Code2,
  Calendar,
} from 'lucide-react';

interface BootstrapStatus {
  available: boolean;
  adminCount: number;
  reason?: string;
}

export function AdminBootstrapPage() {
  const navigate = useNavigate();
  const { user, profile, session, refreshProfile } = useAuth();

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check bootstrap status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoadingStatus(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/bootstrap/status');
      if (res.ok) {
        const data = await res.json();
        setBootstrapStatus(data);
      } else {
        setErrorMessage('Failed to query system bootstrap status.');
      }
    } catch (err: unknown) {
      setErrorMessage('Network error checking bootstrap availability.');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConfirmed || isSubmitting) return;

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
        setSuccessMessage('First Administrator successfully established!');
        // Refresh authoritative profile in context
        await refreshProfile();
        // Redirect to Admin Dashboard
        setTimeout(() => {
          navigate('/admin');
        }, 1800);
      } else {
        setErrorMessage(data.message || data.error || 'Bootstrap operation failed.');
        // Re-check status in case another admin won the race
        await checkStatus();
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to complete bootstrap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08051A] text-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#F59E0B] selection:text-[#08051A]">
      {/* Branding Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
        <Link
          to="/"
          className="inline-block hover:opacity-95 transition-opacity focus:outline-none rounded-2xl p-1"
        >
          <NexusCodeLogo variant="full" size="lg" />
        </Link>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A855F7] font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Platform Initialization</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
          First Administrator Setup
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#94A3B8]">
          One-time bootstrap procedure for establishing the initial Platform Administrator.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-[#0E0B28] border border-[#241D4D] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Loading Indicator */}
          {isLoadingStatus && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin mx-auto" />
              <p className="text-xs text-[#9CA3AF]">Checking platform bootstrap state...</p>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-3 text-xs text-[#EF4444]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-3 text-xs text-[#10B981]">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                <p className="text-[11px] mt-0.5 text-[#10B981]/80">
                  Redirecting to the Administrator Control Panel...
                </p>
              </div>
            </div>
          )}

          {/* CASE 1: Bootstrap is NOT available (Already Completed) */}
          {!isLoadingStatus && bootstrapStatus && !bootstrapStatus.available && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] mx-auto flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#10B981] font-semibold bg-[#130F35] px-2.5 py-0.5 rounded border border-[#241D4D]">
                  Bootstrap Closed • Active Administrators Exist
                </span>
                <h2 className="text-xl font-bold text-[#F8FAFC]">
                  {profile?.role === 'admin' ? 'Administrator Status Confirmed' : 'Bootstrap Already Completed'}
                </h2>
                <p className="text-xs text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
                  {profile?.role === 'admin'
                    ? 'Your account is verified and established as the Platform Administrator. You have full access to contest management, problem authoring, and staff onboarding.'
                    : 'The initial Platform Administrator account has already been established for this Nexus Code deployment. First-admin bootstrap is permanently sealed to preserve platform security.'}
                </p>
              </div>

              {profile?.role === 'admin' ? (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/admin"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs sm:text-sm transition-all shadow-md"
                  >
                    <span>Open Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl border border-[#241D4D] bg-[#08051A] text-left text-xs text-[#9CA3AF] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#F59E0B] font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>How to Join Staff:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Additional Platform Administrators and Event Coordinators are provisioned through the official <span className="text-[#F8FAFC] font-semibold">Club Members &amp; Staff Onboarding</span> system using one-time cryptographic tokens.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <span>Go to Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/staff/activate"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#241D4D] hover:border-[#F59E0B] text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-all"
                    >
                      <span>Staff Activation</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CASE 2: Bootstrap IS available, but User is NOT authenticated */}
          {!isLoadingStatus && bootstrapStatus && bootstrapStatus.available && !user && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] mx-auto flex items-center justify-center">
                <KeyRound className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#F59E0B] font-semibold bg-[#130F35] px-2.5 py-0.5 rounded border border-[#241D4D]">
                  Zero Administrators Detected
                </span>
                <h2 className="text-xl font-bold text-[#F8FAFC]">
                  Authentication Required
                </h2>
                <p className="text-xs text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
                  To initialize this Nexus Code platform, you must first create or sign in with the standard account you wish to promote to Platform Administrator.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#241D4D] bg-[#08051A] text-left text-xs text-[#9CA3AF] space-y-2">
                <p className="font-semibold text-[#F8FAFC]">Bootstrap Architecture:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>Sign in or register your deployment operator account.</li>
                  <li>Return to this bootstrap screen.</li>
                  <li>Confirm promotion to establish the First Administrator.</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/login?redirect=/admin/bootstrap"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all shadow-sm"
                >
                  <span>Sign In &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register?redirect=/admin/bootstrap"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#241D4D] hover:border-[#F59E0B] text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-all"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          )}

          {/* CASE 3: Bootstrap IS available AND User IS authenticated */}
          {!isLoadingStatus && bootstrapStatus && bootstrapStatus.available && user && (
            <form onSubmit={handleBootstrap} className="space-y-5">
              {/* Operator Identity Card */}
              <div className="p-4 rounded-xl border border-[#241D4D] bg-[#08051A] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#F59E0B] font-semibold uppercase tracking-wider">
                    Target Administrator Account
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#130F35] border border-[#241D4D] text-[#9CA3AF] uppercase">
                    Current: {profile?.role || 'student'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#9CA3AF] text-[11px]">Email Identity:</span>
                    <div className="font-mono font-semibold text-[#F8FAFC] truncate">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] text-[11px]">User UID:</span>
                    <div className="font-mono text-[#9CA3AF] truncate text-[11px]">
                      {user.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Authority Notice */}
              <div className="space-y-2 text-xs text-[#9CA3AF] leading-relaxed">
                <p className="font-semibold text-[#F8FAFC]">
                  Authoritative Privileges Granted Upon Bootstrap:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#10B981]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Contest Administration</span>
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

              {/* Explicit Confirmation Checkbox */}
              <div className="p-3.5 rounded-xl border border-[#F59E0B]/30 bg-[#130F35] space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConfirmed}
                    onChange={(e) => setHasConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-[#241D4D] bg-[#08051A] text-[#F59E0B] focus:ring-[#F59E0B] cursor-pointer"
                  />
                  <span className="text-xs text-[#F8FAFC] font-medium leading-snug">
                    I confirm that I am authorized to initialize this deployment. I understand this action permanently closes the first-admin bootstrap window.
                  </span>
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={!hasConfirmed || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Promoting Account to Administrator...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Establish First Administrator</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="pt-3 border-t border-[#241D4D] flex items-center justify-between text-xs text-[#9CA3AF]">
            <Link to="/" className="hover:text-[#F8FAFC] transition-colors">
              ← Return Home
            </Link>
            <Link to="/login" className="hover:text-[#F59E0B] transition-colors">
              Platform Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
