/**
 * Contest Timer Display Component (Phase 6)
 *
 * Renders formatted live countdown badge or header component.
 */

import React from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useContestTimer } from '../hooks/useContestTimer';

interface ContestTimerDisplayProps {
  startAt: string;
  endAt: string;
  compact?: boolean;
  onContestStart?: () => void;
  onContestEnd?: () => void;
}

export function ContestTimerDisplay({
  startAt,
  endAt,
  compact = false,
  onContestStart,
  onContestEnd,
}: ContestTimerDisplayProps) {
  const { state, formattedTime, isCritical, percentageElapsed } = useContestTimer(
    startAt,
    endAt,
    onContestStart,
    onContestEnd
  );

  if (compact) {
    if (state === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#12221E] text-[#F59E0B] border border-[#263833]">
          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Starts in {formattedTime}</span>
        </span>
      );
    }
    if (state === 'live') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
            isCritical
              ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 animate-pulse'
              : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-[#EF4444]' : 'bg-[#10B981]'} animate-ping`} />
          <span>{formattedTime}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#07110F] text-[#9CA3AF] border border-[#263833]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Ended</span>
      </span>
    );
  }

  // Full detailed display
  return (
    <div
      className={`rounded-xl border p-4 space-y-2.5 shadow-sm transition-all ${
        state === 'live'
          ? isCritical
            ? 'bg-[#180A0A] border-[#EF4444]/50'
            : 'bg-[#0D1A17] border-[#10B981]/40'
          : 'bg-[#0D1A17] border-[#263833]'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-[#9CA3AF]">
          {state === 'upcoming' && <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />}
          {state === 'live' && (
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-[#EF4444]' : 'bg-[#10B981]'
              } animate-ping`}
            />
          )}
          {state === 'ended' && <CheckCircle2 className="w-3.5 h-3.5 text-[#9CA3AF]" />}

          <span>
            {state === 'upcoming'
              ? 'Starts In'
              : state === 'live'
              ? isCritical
                ? 'Final Minutes'
                : 'Time Remaining'
              : 'Tournament Concluded'}
          </span>
        </span>

        {state === 'live' && (
          <span
            className={`font-mono text-[11px] font-semibold ${
              isCritical ? 'text-[#EF4444]' : 'text-[#10B981]'
            }`}
          >
            {Math.round(percentageElapsed)}% Elapsed
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${
            state === 'live'
              ? isCritical
                ? 'text-[#EF4444]'
                : 'text-[#10B981]'
              : state === 'upcoming'
              ? 'text-[#F59E0B]'
              : 'text-[#9CA3AF]'
          }`}
        >
          {state === 'ended' ? '00:00:00' : formattedTime}
        </span>
      </div>

      {state === 'live' && (
        <div className="w-full h-1.5 bg-[#07110F] rounded-full overflow-hidden border border-[#263833]">
          <div
            className={`h-full transition-all duration-1000 ${
              isCritical ? 'bg-[#EF4444]' : 'bg-[#10B981]'
            }`}
            style={{ width: `${percentageElapsed}%` }}
          />
        </div>
      )}
    </div>
  );
}
