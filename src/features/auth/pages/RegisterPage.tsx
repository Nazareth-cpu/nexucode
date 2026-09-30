/**
 * Registration Page View
 *
 * Professional coding platform registration card. Decoupled from direct Supabase SDK calls;
 * consumes Phase 1.2 AuthContext state.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { Terminal, Shield, LogOut, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

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
          Create student account
        </h2>
        <p className="mt-1.5 text-xs text-[#9CA3AF]">
          Register to participate in coding tournaments, hackathons, and chapter leaderboards
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0D1A17] border border-[#263833] rounded-2xl p-6 sm:p-8 shadow-2xl">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" />
              <p className="text-xs text-[#9CA3AF]">Checking authentication session...</p>
            </div>
          ) : isAuthenticated && user ? (
            /* Prevent contradictory authentication state if user is already signed in */
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
          ) : (
            <RegisterForm />
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
