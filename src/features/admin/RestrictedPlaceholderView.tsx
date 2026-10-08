/**
 * Restricted Administrative Route Placeholder (/admin & /coordinator)
 *
 * Explicitly protects administrative surfaces while clearly communicating that
 * role-based authorization (Student / Coordinator / Admin) and privileged
 * database access policies will be introduced in Phase 2 with PostgreSQL RLS.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Database, Lock, KeyRound } from 'lucide-react';

export function RestrictedPlaceholderView() {
  const location = useLocation();
  const isCoordinator = location.pathname.includes('coordinator');
  const portalName = isCoordinator ? 'Coordinator Management Workspace' : 'Administrator Control Panel';

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="rounded-2xl border border-[#241D4D] bg-[#0E0B28] p-6 sm:p-8 space-y-5 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#130F35] border border-[#241D4D] text-[#F59E0B] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#F59E0B] font-semibold bg-[#130F35] px-2.5 py-0.5 rounded border border-[#241D4D]">
            Phase 1.4 Route Protection • Privileged Boundary
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">{portalName}</h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-lg mx-auto leading-relaxed">
            You have accessed a protected chapter administration route. Privileged multi-role
            authorization (Student, Coordinator, and Admin) and database access enforcement
            will be authoritatively governed via Supabase PostgreSQL and Row Level Security in Phase 2.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#241D4D] bg-[#08051A] text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#F59E0B] font-medium font-mono">
            <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Architecture &amp; Security Boundary:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#9CA3AF] pl-1 text-[11px] leading-relaxed">
            <li>Frontend route guards serve as UX gates; they are never trusted for privileged data access.</li>
            <li>No client-side role override or simulated administrative elevation is permitted in Phase 1.</li>
            <li>Database migrations, profiles table, and PostgreSQL RLS policies will be deployed in Phase 2.</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Student Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
