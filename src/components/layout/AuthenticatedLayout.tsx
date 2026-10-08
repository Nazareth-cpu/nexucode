/**
 * Authenticated Layout — Complete Purple & Amber Reference Implementation
 *
 * Implements persistent left sidebar navigation, top header with search & profile,
 * matching the approved Nexus Code design reference.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { NexusCodeLogo } from '@/src/components/common/NexusCodeLogo';
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
  Award,
  Users,
  Bell,
  Sparkles,
  Loader2,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: Code2 },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
];

export function AuthenticatedLayout() {
  const { user, profile, session, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  const managementNavItems = [
    ...(isStaff
      ? [{ to: '/problems/manage', label: 'Manage Problems', icon: FolderCode }]
      : []),
    ...(isStaff
      ? [{ to: '/events/manage', label: 'Manage Events', icon: CalendarCheck2 }]
      : []),
    ...(isStaff
      ? [{ to: '/certificates/manage', label: 'Certificates', icon: Award }]
      : []),
    ...(isAdmin
      ? [{ to: '/contests/manage', label: 'Manage Contests', icon: Trophy }]
      : []),
    ...(isAdmin
      ? [{ to: '/admin', label: 'Admin Control', icon: ShieldCheck }]
      : []),
  ];

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Vedavyas Mahendrada';

  return (
    <div className="min-h-screen bg-[#08051A] text-[#F8FAFC] flex flex-col lg:flex-row font-sans selection:bg-[#F59E0B] selection:text-[#08051A]">
      {/* ----------------- MOBILE TOP BAR ----------------- */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A061E] border-b border-[#241D4D] z-50">
        <Link to="/dashboard">
          <NexusCodeLogo variant="horizontal" size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-[#15103A] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#241D4D]"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ----------------- PERSISTENT LEFT SIDEBAR ----------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#08051A] border-r border-[#241D4D] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Area */}
          <div className="p-5 border-b border-[#241D4D]/60 flex items-center justify-between">
            <Link to="/dashboard" className="focus:outline-none">
              <NexusCodeLogo variant="full" size="md" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1" aria-label="Main Navigation">
            {MAIN_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={label}
                  to={to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F59E0B] text-[#08051A] font-extrabold shadow-md shadow-[#F59E0B]/20'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#130F35]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#08051A]' : 'text-[#A855F7]'}`} />
                  <span>{label}</span>
                </NavLink>
              );
            })}

            {/* Management & Admin Section */}
            {managementNavItems.length > 0 && (
              <div className="pt-4 mt-3 border-t border-[#241D4D]">
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#A855F7] font-bold mb-2">
                  Management
                </p>
                {managementNavItems.map(({ to, label, icon: Icon }) => {
                  const isActive = location.pathname === to || location.pathname.startsWith(to);
                  return (
                    <NavLink
                      key={label}
                      to={to}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all mb-1 ${
                        isActive
                          ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30 font-bold'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#130F35]'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#F59E0B]" />
                      <span>{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3.5 border-t border-[#241D4D] bg-[#0E0B28]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-xs font-bold font-mono shrink-0 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#F8FAFC] truncate leading-tight">
                  {displayName}
                </p>
                <span className="inline-block text-[10px] font-mono text-[#F59E0B] font-bold uppercase">
                  {role}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#15103A] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* First Administrator Setup Banner */}
        {bootstrapAvailable && role === 'student' && (
          <div className="bg-gradient-to-r from-[#581C87] to-[#7C3AED] border-b border-[#F59E0B]/50 px-4 py-3 sm:px-6 shadow-lg z-30">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B] text-[#08051A] flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#FBBF24]">First Administrator Bootstrap Ready</p>
                  <p className="text-[11px] text-white/80">
                    Establish this deployment account as the Platform Administrator to unlock management controls.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickBootstrap}
                disabled={isBootstrapping}
                className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60 whitespace-nowrap"
              >
                {isBootstrapping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Promoting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Establish Administrator</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Global Top Header (Exact replica of reference) */}
        <header className="sticky top-0 z-30 h-16 bg-[#08051A]/90 backdrop-blur-md border-b border-[#241D4D] px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Global Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search problems, contests, events..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E0B28] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
              />
            </div>
          </div>

          {/* Top Right: Notifications & Profile Header */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              title="Notifications"
              className="relative p-2 rounded-xl bg-[#0E0B28] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#15103A] border border-[#241D4D] transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#08051A]" />
            </button>

            {/* Profile Chip (Matches Reference Top Right) */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-[#0E0B28] border border-[#241D4D] hover:border-[#7C3AED]/60 transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-xs font-bold font-mono shrink-0 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition-colors leading-tight truncate max-w-[130px]">
                  {displayName}
                </span>
                <span className="inline-flex items-center self-start text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-[#08051A] uppercase tracking-wider font-mono">
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden sm:block group-hover:text-[#F8FAFC]" />
            </Link>
          </div>
        </header>

        {/* Page Main Routed Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
