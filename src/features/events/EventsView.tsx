/**
 * Events View (Protected: /events)
 */

import React from 'react';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';

export function EventsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-[#F59E0B]" />
          <span>Technical Events &amp; Hackathons</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
          Chapter hackathons, algorithmic workshops, and guest engineering sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded bg-[#12221E] text-[#10B981] border border-[#263833]">
              Annual Hackathon
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono">36 Hours</span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">CodeStorm Hackathon 2026</h2>
            <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
              Build production-ready open source projects across AI, Web3, and Systems programming.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] space-y-1.5 font-mono">
            <div className="flex items-center gap-2 text-[#10B981]">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Oct 24–26, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-[#9CA3AF] text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>Campus Innovation Hub &amp; Discord</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99]"
          >
            <span>Register Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
