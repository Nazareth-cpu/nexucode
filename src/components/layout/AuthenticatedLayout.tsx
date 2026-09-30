/**
 * Authenticated Application Shell Layout (Amber + Emerald + Charcoal Design)
 *
 * Provides persistent top navigation, active route highlighting, user identity chip,
 * and sign-out controls for all protected platform routes.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  LayoutDashboard,
  Code2,
  Trophy,
  BarChart3,
  Calendar,
  LogOut,
  Search,
  ShieldCheck,
  FolderCode,
  CalendarCheck2,
  Sparkles,
  Loader2,
} from 'lucide-react';

const STUDENT_NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
];

export function AuthenticatedLayout() {
  const { user, profile, session, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bootstrap/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.available) setBootstrapAvailable(true);
      })
      .catch(() => {});
  }, []);

  const handleQuickBootstrap = async () => {
    if (!user || isBootstrapping) return;
    setIsBootstrapping(true);
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
        await refreshProfile();
        setBootstrapAvailable(false);
        navigate('/admin');
      }
    } catch {
      // Ignore
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const role = profile?.role || 'student';
  const isCoordinator = role === 'coordinator';
  const isAdmin = role === 'admin';
  const isStaff = isCoordinator || isAdmin;

  // Role-Specific Navigation items per Master Authorization Matrix
  const roleNavItems = [
    // Problem Management (Coordinator, Admin)
    ...(isStaff
      ? [{ to: '/problems/manage', label: 'Manage Problems', icon: FolderCode }]
      : []),
    // Event Management (Coordinator, Admin)
    ...(isStaff
      ? [{ to: '/events/manage', label: 'Manage Events', icon: CalendarCheck2 }]
      : []),
    // Contest Management (Admin ONLY)
    ...(isAdmin
      ? [{ to: '/contests/manage', label: 'Manage Contests', icon: Trophy }]
      : []),
    // Administrative Controls (Admin ONLY)
    ...(isAdmin
      ? [{ to: '/admin', label: 'Admin Control', icon: ShieldCheck }]
      : []),
  ];

  const allNavLinks = [...STUDENT_NAV_LINKS, ...roleNavItems];

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Student Member';

  return (
    <div className="min-h-screen bg-[#07110F] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-[#07110F]">
      {/* First Administrator Setup Banner (Only visible when 0 admins exist on platform) */}
      {bootstrapAvailable && role === 'student' && (
        <div className="bg-[#12221E] border-b border-[#F59E0B]/50 px-4 py-3 sm:px-6 shadow-md relative z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#F8FAFC]">
                  <span className="text-[#F59E0B]">Deployment Setup:</span> Zero administrators exist on this deployment.
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  You are currently authenticated as <span className="font-mono text-[#F8FAFC]">{user?.email}</span> (role: student).
                  Establish this account as the First Platform Administrator to unlock administrative controls.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickBootstrap}
              disabled={isBootstrapping}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isBootstrapping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Promoting Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Establish as Platform Administrator</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Top Application Navbar */}
      <header className="border-b border-[#263833] bg-[#0D1A17]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Identity & Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#F59E0B] rounded-lg p-1"
              aria-label="Nexus Code Dashboard"
            >
              {/* Official Nexus Code Platform Logo */}
              <img
                src="/image.png"
                alt="Nexus Code - Contest & Event Platform"
                className="h-10 w-auto max-h-10 object-contain rounded-sm transition-transform duration-200 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 pl-2" aria-label="Main Navigation">
              {STUDENT_NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 shadow-sm'
                        : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </NavLink>
              ))}

              {/* Role-Specific Management Items (Separated visually) */}
              {roleNavItems.length > 0 && (
                <div className="flex items-center gap-1 pl-2 border-l border-[#263833] ml-1">
                  {roleNavItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#F59E0B] text-[#07110F] font-semibold shadow-sm'
                            : to === '/admin' || to === '/contests/manage'
                            ? 'text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30'
                            : 'text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </nav>
          </div>

          {/* Middle: Compact Search */}
          <div className="hidden xl:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>

          {/* Right Section: Role chip, Profile, Sign Out */}
          <div className="flex items-center gap-3">
            {/* Membership badge */}
            <span
              title={`Platform Role: ${role}`}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                role === 'admin'
                  ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                  : role === 'coordinator'
                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#12221E] text-[#F59E0B] border-[#263833]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  role === 'admin'
                    ? 'bg-[#EF4444]'
                    : role === 'coordinator'
                    ? 'bg-[#10B981]'
                    : 'bg-[#F59E0B]'
                }`}
              />
              {role === 'admin'
                ? 'Administrator'
                : role === 'coordinator'
                ? 'Event Coordinator'
                : 'Student Member'}
            </span>

            {/* Profile Link */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                    : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
                }`
              }
            >
              <div className="w-6 h-6 rounded-full bg-[#0D1A17] border border-[#263833] flex items-center justify-center text-[#F59E0B] text-xs font-bold uppercase font-mono">
                {displayName.charAt(0)}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate">{displayName}</span>
            </NavLink>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B] hover:text-[#FBBF24] text-[#9CA3AF] text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden border-t border-[#263833]/80 px-4 py-2 flex items-center gap-1.5 overflow-x-auto bg-[#07110F]">
          {allNavLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                    : 'text-[#9CA3AF] hover:text-[#F8FAFC]'
                }`
              }
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Routed Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Chapter Platform Footer */}
      <footer className="border-t border-[#263833] bg-[#07110F] text-[#9CA3AF] text-xs py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Nexus Code — Contest &amp; Event Platform.</p>
          <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF]">
            {isStaff && (
              <Link to="/problems/manage" className="hover:text-[#F59E0B] transition-colors">
                Staff Portal
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="hover:text-[#EF4444] transition-colors">
                Admin Control
              </Link>
            )}
            <Link to="/" className="hover:text-[#F8FAFC] transition-colors">
              Platform Overview
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
