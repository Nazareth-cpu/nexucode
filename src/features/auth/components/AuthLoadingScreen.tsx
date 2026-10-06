/**
 * Authentication Loading Screen (Amber + Emerald + Charcoal Design)
 *
 * Displays a clean, technical amber/charcoal loading indicator during session hydration
 * to prevent premature redirects and visual flicker.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({
  message = 'Verifying authentication session...',
}: AuthLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#08051A] text-[#F8FAFC] flex flex-col items-center justify-center p-4 selection:bg-[#F59E0B] selection:text-[#08051A]"
    >
      <div className="flex flex-col items-center text-center space-y-5 max-w-sm">
        {/* Technical Amber Brand Mark */}
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-[#F59E0B] text-[#08051A] flex items-center justify-center font-mono font-bold text-lg shadow-sm">
            &lt;/&gt;
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0E0B28] border border-[#241D4D] flex items-center justify-center text-[#F59E0B]">
            <Loader2 className="w-3 h-3 animate-spin text-[#F59E0B]" />
          </div>
        </div>

        {/* Status Copy */}
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-[#F8FAFC]">
            Student Chapter <span className="text-[#F59E0B]">Coding Platform</span>
          </h2>
          <p className="text-xs text-[#9CA3AF] font-medium">
            {message}
          </p>
        </div>

        {/* Controlled Amber to Emerald Indicator */}
        <div className="w-44 h-1 bg-[#130F35] border border-[#241D4D] rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-[#F59E0B] to-[#10B981] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
