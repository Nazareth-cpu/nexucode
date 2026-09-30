/**
 * Staff Onboarding & Account Activation Page (/staff/activate)
 *
 * Implements the secure staff onboarding workflow:
 * 1. Takes unique member_id + one-time activation token.
 * 2. Cryptographically verifies against server database (hashed token check).
 * 3. Binds identity to Supabase Auth account.
 * 4. Assigns authoritative role ('coordinator' or 'admin').
 * 5. Invalidates activation token permanently.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  ShieldCheck,
  KeyRound,
  UserCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface VerifiedMemberInfo {
  memberId: string;
  fullName: string;
  email: string;
  assignedRole: 'coordinator' | 'admin';
}

export function StaffActivationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();

  const [memberId, setMemberId] = useState(searchParams.get('memberId') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedMemberInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-verify if both params are present in URL query
  useEffect(() => {
    const qMemberId = searchParams.get('memberId');
    const qToken = searchParams.get('token');
    if (qMemberId && qToken && !verifiedInfo && !isVerifying) {
      handleVerify(qMemberId, qToken);
    }
  }, [searchParams]);

  const handleVerify = async (midToVerify?: string, tokenToVerify?: string) => {
    const targetMemberId = (midToVerify || memberId).trim().toUpperCase();
    const targetToken = (tokenToVerify || token).trim();

    if (!targetMemberId || !targetToken) {
      setErrorMessage('Please provide both your Member ID and one-time Activation Token.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/staff-activate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: targetMemberId, token: targetToken }),
      });

      const data = await res.json();

      if (res.ok && data.valid && data.member) {
        setVerifiedInfo(data.member);
        if (data.member.email && !email) {
          setEmail(data.member.email);
        }
        if (data.member.fullName && !displayName) {
          setDisplayName(data.member.fullName);
        }
      } else {
        setErrorMessage(data.error || 'Invalid, expired, or already claimed activation token.');
        setVerifiedInfo(null);
      }
    } catch (err: unknown) {
      setErrorMessage('Network or server error verifying activation credentials.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedInfo) return;

    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/staff-activate/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('sb-token') || ''}` } : {}),
        },
        body: JSON.stringify({
          memberId: verifiedInfo.memberId,
          token: token.trim(),
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Staff account activated successfully!');
        await refreshProfile();
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setErrorMessage(data.error || 'Failed to claim staff activation.');
      }
    } catch (err: unknown) {
      setErrorMessage('Failed to finalize activation: ' + (err as Error).message);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07110F] text-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#F59E0B] selection:text-[#07110F]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link
          to="/"
          className="inline-block hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#F59E0B] rounded-xl p-1"
        >
          <img
            src="/image.png"
            alt="Nexus Code"
            className="h-16 sm:h-20 w-auto mx-auto object-contain drop-shadow-md"
          />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Staff Member Activation
        </h2>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Claim your pre-provisioned Event Coordinator or Administrator platform credentials
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0D1A17] border border-[#263833] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-2.5 text-xs text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-start gap-2.5 text-xs text-[#10B981]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage} Redirecting to your dashboard...</span>
            </div>
          )}

          {!verifiedInfo ? (
            /* Step 1: Input & Verify Member ID + Token */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Staff Member ID
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. NC-STAFF-ADMIN-02"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#F8FAFC] uppercase placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  One-Time Activation Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Paste your 43-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  Supplied securely by your platform administrator during invitation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={isVerifying || !memberId || !token}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] shadow-sm disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Token Hash...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Step 2: Confirmation & Account Linking */
            <form onSubmit={handleClaim} className="space-y-4">
              <div className="p-3.5 rounded-xl border border-[#10B981]/30 bg-[#12221E] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#10B981] font-semibold uppercase">
                    Invitation Verified
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#07110F] border border-[#263833] text-[#F59E0B] font-bold uppercase">
                    {verifiedInfo.assignedRole === 'admin'
                      ? 'Administrator'
                      : 'Event Coordinator'}
                  </span>
                </div>
                <div className="text-xs text-[#F8FAFC] font-semibold">
                  Member ID: <span className="font-mono text-[#F59E0B]">{verifiedInfo.memberId}</span>
                </div>
                {verifiedInfo.fullName && (
                  <div className="text-xs text-[#9CA3AF]">
                    Designated Name: {verifiedInfo.fullName}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@nexuscode.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Full Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Devon Vance"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#F8FAFC]">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F8FAFC]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isClaiming || !password || !email}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-50"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Claiming Role &amp; Activating...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Staff Account</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVerifiedInfo(null)}
                className="w-full text-center text-xs text-[#9CA3AF] hover:text-[#F8FAFC] pt-1"
              >
                Use different credentials
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-[#263833] text-center">
            <Link
              to="/login"
              className="text-xs text-[#9CA3AF] hover:text-[#F59E0B] transition-colors"
            >
              Already activated? Sign in to your account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
