/**
 * Login Page View
 *
 * Professional coding platform login card. Decoupled from direct Supabase SDK calls;
 * consumes Phase 1.2 AuthContext state.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { FirstAdminBootstrapCard } from '@/src/features/admin';
import { Terminal, Shield, LogOut, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bootstrap/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.available) setBootstrapAvailable(true);
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#07110F] text-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#F59E0B] selection:text-[#07110F]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-block hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#F59E0B] rounded-xl p-1"
          aria-label="Nexus Code Home"
        >
          <img
            src="/image.png"
            alt="Nexus Code - Contest & Event Platform"
            className="h-20 sm:h-24 w-auto mx-auto object-contain drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Welcome back
        </h2>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          Sign in to access chapter tournaments, problem sets, and technical events
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0D1A17] border border-[#263833] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
              <p className="text-xs text-[#9CA3AF]">Checking authentication session...</p>
            </div>
          ) : isAuthenticated && user ? (
            bootstrapAvailable && profile?.role !== 'admin' ? (
              /* One-time First Administrator Establishment directly in Login UI */
              <div className="space-y-4">
                <FirstAdminBootstrapCard
                  onBootstrapSuccess={() => {
                    navigate('/admin');
                  }}
                />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#263833] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] font-medium text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out (switch operator account)</span>
                </button>
              </div>
            ) : profile?.role === 'admin' ? (
              /* Verified Administrator Active View */
              <div className="space-y-5 text-center py-2">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] mx-auto flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-semibold bg-[#12221E] px-2 py-0.5 rounded border border-[#263833]">
                    Platform Administrator
                  </span>
                  <h3 className="text-base font-semibold text-[#F8FAFC]">Administrator Signed In</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    Authenticated as <span className="font-mono text-[#F8FAFC]">{user.email}</span>
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] shadow-sm active:scale-[0.99]"
                  >
                    <span>Open Admin Control Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#263833] hover:bg-[#12221E] text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors"
                  >
                    <span>Go to Student Arena</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#263833] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] font-medium text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Already Signed In View for Students & Staff */
              <div className="space-y-5 text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-[#12221E] border border-[#263833] text-[#F59E0B] mx-auto flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#F8FAFC]">Already Signed In</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    You are currently authenticated as{' '}
                    <span className="font-mono text-[#F8FAFC]">{user.email}</span>
                  </p>
                </div>
                <div className="pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] shadow-sm active:scale-[0.99]"
                  >
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#263833] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] font-medium text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out from this session</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Unauthenticated View: Shows First Admin Setup notice right above login if 0 admins exist */
            <div className="space-y-5">
              {bootstrapAvailable && (
                <FirstAdminBootstrapCard />
              )}
              <LoginForm />
            </div>
          )}
        </div>

        {/* Back Link & Staff Onboarding */}
        <div className="mt-6 text-center space-y-2">
          <div>
            <Link
              to="/staff/activate"
              className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors inline-flex items-center gap-1 font-medium"
            >
              Invited as Chapter Staff? Activate credentials →
            </Link>
          </div>
          <div>
            <Link
              to="/"
              className="text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors inline-flex items-center gap-1 font-medium"
            >
              ← Return to Chapter Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
