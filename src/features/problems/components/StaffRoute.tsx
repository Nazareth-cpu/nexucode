/**
 * Staff-Only Route Guard (Coordinators & Administrators)
 *
 * Ensures only authorized staff can access problem authoring and management routes.
 * Students receive an explicit, beautifully styled access-denied screen.
 */

import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { AuthLoadingScreen } from '@/src/features/auth/components/AuthLoadingScreen';

export function StaffRoute() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  if (isLoading || isProfileLoading) {
    return <AuthLoadingScreen message="Verifying staff authorization..." />;
  }

  const role = profile?.role || 'student';
  const isAuthorized = role === 'coordinator' || role === 'admin';

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="rounded-2xl border border-[#241D4D] bg-[#0E0B28] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#EF4444] font-semibold bg-[#130F35] px-2.5 py-0.5 rounded border border-[#241D4D]">
              Access Restricted • Staff Only
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
              Staff Authorization Required
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
              Problem authoring, draft creation, test case attachment, and publication are restricted
              to Chapter Coordinators and Platform Administrators.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#241D4D] bg-[#08051A] text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#F59E0B] font-medium font-mono">
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Current Account Status:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#9CA3AF] pt-1">
              <div>Identity: <span className="text-[#F8FAFC] font-mono">{user?.email || 'Authenticated User'}</span></div>
              <div>Platform Role: <span className="text-[#F59E0B] font-mono uppercase font-semibold">{role}</span></div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
