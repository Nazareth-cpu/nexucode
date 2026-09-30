/**
 * Platform Overview Shell (Amber + Emerald + Charcoal Design)
 *
 * Implements the technical, high-contrast competitive programming visual identity.
 * Charcoal background: #07110F
 * Surfaces: #0D1A17 / #12221E
 * Primary Accent: Amber #F59E0B / #FBBF24
 * Secondary Accent: Emerald #10B981 / #047857
 * Border: #263833
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  Database,
  Lock,
  Server,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  LogOut,
  Mail,
  GraduationCap,
  Search,
  Code2,
  Terminal,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export function PlatformOverview() {
  const { isConfigured, isLoading, isAuthenticated, user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student Member';
  const collegeId = user?.user_metadata?.college_id;
  const isEmailConfirmed = Boolean(user?.email_confirmed_at);
  const authProvider = user?.app_metadata?.provider || 'email';

  return (
    <div className="min-h-screen bg-[#07110F] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-[#07110F]">
      {/* ----------------- HEADER ----------------- */}
      <header className="border-b border-[#263833] bg-[#0D1A17]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Identity & Logo */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#F59E0B] rounded-lg p-1"
              aria-label="Nexus Code Home"
            >
              {/* Official Nexus Code Platform Logo */}
              <img
                src="/image.png"
                alt="Nexus Code - Contest & Event Platform"
                className="h-10 w-auto max-h-10 object-contain rounded-sm transition-transform duration-200 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </Link>

            {/* Desktop Horizontal Navigation */}
            <nav className="hidden xl:flex items-center gap-1 pl-2" aria-label="Main Navigation">
              {[
                { to: '/', label: 'Home', active: true },
                { to: '/contests', label: 'Contests' },
                { to: '/problems', label: 'Problems' },
                { to: '/events', label: 'Events' },
                { to: '/leaderboard', label: 'Leaderboard' },
              ].map(({ to, label, active }) => (
                <Link
                  key={label}
                  to={to}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/25'
                      : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Middle: Compact Search Field */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          {/* Right: Actions / Auth Status */}
          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <span className="text-xs text-[#9CA3AF] animate-pulse">Checking session...</span>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-[#F8FAFC] truncate max-w-[140px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#F59E0B] font-mono">
                    Student Member
                  </span>
                </div>

                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs transition-all shadow-sm active:scale-[0.99]"
                >
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  aria-label="Sign out"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B]/50 hover:text-[#F59E0B] text-[#9CA3AF] text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B] hover:text-[#FBBF24] text-[#F8FAFC] text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] active:scale-[0.99]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ----------------- HERO / PHASE CARD ----------------- */}
        <div className="relative rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 sm:p-8 overflow-hidden shadow-xl">
          {/* Extremely subtle atmospheric accent toward right/bottom (Charcoal -> Amber -> Emerald) */}
          <div
            className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full pointer-events-none opacity-40 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%)',
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* LEFT: Logo Showcase, Title, Description */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-2xl">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-[#263833] bg-[#07110F] p-2 flex items-center justify-center flex-shrink-0 shadow-lg">
                <img
                  src="/image.png"
                  alt="Nexus Code Official Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
                    Nexus <span className="text-[#F59E0B]">Code</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#12221E] text-[#10B981] border border-[#263833]">
                    Contest &amp; Event Platform
                  </span>
                </div>

                <div className="space-y-1 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                  <p>
                    Production-grade competitive programming and technical event platform for chapter students and coordinators.
                  </p>
                  <p className="text-[#9CA3AF]/90">
                    Solve curated challenges, participate in timed tournaments, and climb the chapter leaderboard.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: CTA Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isAuthenticated && user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
                >
                  <span>Enter Student Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    to="/login"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B] hover:text-[#FBBF24] text-[#F8FAFC] font-medium text-xs sm:text-sm transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
                  >
                    Create Student Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ----------------- STATUS CARDS (3 Columns) ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: Supabase Client */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#263833]/80 pb-3">
              <div className="flex items-center gap-2 text-[#F8FAFC] font-semibold text-sm">
                <Database className="w-4 h-4 text-[#F59E0B]" />
                <span>Supabase Client</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="text-[#9CA3AF]">Singleton Instance</span>
                <span className="text-[#10B981] font-medium">Initialized</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="font-mono text-[#9CA3AF] text-[11px]">VITE_SUPABASE_URL</span>
                <span
                  className={`font-mono text-xs ${
                    isConfigured ? 'text-[#10B981]' : 'text-[#F59E0B]'
                  }`}
                >
                  {isConfigured ? 'Configured' : 'Awaiting in .env.local'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="font-mono text-[#9CA3AF] text-[11px]">
                  VITE_SUPABASE_PUBLISHABLE_KEY
                </span>
                <span
                  className={`font-mono text-xs ${
                    isConfigured ? 'text-[#10B981]' : 'text-[#F59E0B]'
                  }`}
                >
                  {isConfigured ? 'Configured' : 'Awaiting in .env.local'}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Session & Provider */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#263833]/80 pb-3">
              <div className="flex items-center gap-2 text-[#F8FAFC] font-semibold text-sm">
                <Lock className="w-4 h-4 text-[#F59E0B]" />
                <span>Session &amp; Provider</span>
              </div>
              {isAuthenticated ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="text-[#9CA3AF]">Loading State</span>
                <span className="text-[#F8FAFC] font-mono">
                  {isLoading ? 'Hydrating session...' : 'Idle (Hydrated)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="text-[#9CA3AF]">Auth Status</span>
                <span
                  className={`font-medium ${
                    isAuthenticated ? 'text-[#10B981]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {isAuthenticated ? 'Authenticated' : 'Unauthenticated'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#9CA3AF]">Provider</span>
                <span className="text-[#F59E0B] font-medium capitalize">{authProvider}</span>
              </div>
            </div>
          </div>

          {/* CARD 3: Identity Details */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#263833]/80 pb-3">
              <div className="flex items-center gap-2 text-[#F8FAFC] font-semibold text-sm">
                <Server className="w-4 h-4 text-[#F59E0B]" />
                <span>Identity Details</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="text-[#9CA3AF]">Email Confirmed</span>
                <span
                  className={`font-medium ${
                    user ? (isEmailConfirmed ? 'text-[#10B981]' : 'text-[#F59E0B]') : 'text-[#9CA3AF]'
                  }`}
                >
                  {user ? (isEmailConfirmed ? 'Yes' : 'Pending Verification') : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#263833]/60">
                <span className="text-[#9CA3AF]">User ID</span>
                <span className="font-mono text-[#F8FAFC] text-xs truncate max-w-[140px]">
                  {user ? user.id : 'None'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#9CA3AF]">Role Assigned</span>
                <span className="text-[#F59E0B] font-semibold">Student (Public Default)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- ARCHITECTURE & SECURITY BOUNDARY ----------------- */}
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17]/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
              Phase 1.4 Architecture &amp; Route Protection Scope
            </h2>
            <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
              Route Guards Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg border border-[#263833] bg-[#07110F] space-y-1">
              <span className="text-[#F59E0B] font-semibold block text-[11px]">
                Registration Form
              </span>
              <p className="text-[#F8FAFC] font-medium">Validations &amp; Feedback</p>
              <p className="text-[#9CA3AF] text-[11px]">
                Validates name, RFC email, min 6-char password, and matching confirmation.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#263833] bg-[#07110F] space-y-1">
              <span className="text-[#F59E0B] font-semibold block text-[11px]">
                Role Integrity
              </span>
              <p className="text-[#F8FAFC] font-medium">Zero Client Role Selection</p>
              <p className="text-[#9CA3AF] text-[11px]">
                No role dropdown. All public registrants are student members.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#263833] bg-[#07110F] space-y-1">
              <span className="text-[#F59E0B] font-semibold block text-[11px]">
                Open-Redirect Defense
              </span>
              <p className="text-[#F8FAFC] font-medium">URL Sanitization</p>
              <p className="text-[#9CA3AF] text-[11px]">
                Strictly verifies internal destinations; rejects external and protocol escapes.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#263833] bg-[#07110F] space-y-1">
              <span className="text-[#F59E0B] font-semibold block text-[11px]">
                Google OAuth
              </span>
              <p className="text-[#F8FAFC] font-medium">Native Supabase Redirect</p>
              <p className="text-[#9CA3AF] text-[11px]">
                Initiates official Google sign-in without client secrets.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="border-t border-[#263833] bg-[#07110F] text-[#9CA3AF] text-xs py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Nexus Code — Contest &amp; Event Platform.</p>
          <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF]">
            <Link to="/coordinator" className="hover:text-[#F59E0B] transition-colors">
              Coordinator Portal
            </Link>
            <Link to="/admin" className="hover:text-[#F59E0B] transition-colors">
              Admin Portal
            </Link>
            <Link to="/dashboard" className="hover:text-[#F8FAFC] transition-colors">
              Student Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
