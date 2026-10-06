/**
 * Registration Page View — Purple & Amber Edition
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { NexusCodeLogo } from '@/src/components/common/NexusCodeLogo';
import { Shield, LogOut, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#08051A] text-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#F59E0B] selection:text-[#08051A]">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-block hover:opacity-95 transition-opacity focus:outline-none rounded-2xl p-1"
          aria-label="Nexus Code Home"
        >
          <NexusCodeLogo variant="full" size="lg" />
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
          Create student account
        </h2>
        <p className="mt-1.5 text-xs text-[#94A3B8]">
          Register to participate in coding tournaments, hackathons, and chapter leaderboards
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#0E0B28] border border-[#241D4D] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
              <p className="text-xs text-[#94A3B8]">Checking authentication session...</p>
            </div>
          ) : isAuthenticated && user ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#A855F7] mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#F8FAFC]">Already Signed In</h3>
                <p className="text-xs text-[#94A3B8]">
                  You are currently authenticated as{' '}
                  <span className="font-mono text-[#F8FAFC]">{user.email}</span>
                </p>
              </div>
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#A855F7] text-white font-extrabold text-sm transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#241D4D] hover:bg-[#15103A] text-[#94A3B8] hover:text-[#EF4444] font-medium text-xs transition-colors"
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
              className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors inline-flex items-center gap-1 font-bold"
            >
              Invited as Chapter Staff? Activate credentials →
            </Link>
          </div>
          <div>
            <Link
              to="/"
              className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors inline-flex items-center gap-1 font-medium"
            >
              ← Return to Chapter Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
