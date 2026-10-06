/**
 * Synchronized Contest Timer Hook (Phase 6)
 *
 * Provides high-precision countdown timers for both scheduled start and live contest remaining time.
 * Calculates time state: 'upcoming' | 'live' | 'ended'
 */

import { useState, useEffect, useMemo } from 'react';

export interface UseContestTimerResult {
  state: 'upcoming' | 'live' | 'ended';
  timeRemainingMs: number;
  formattedTime: string;
  isCritical: boolean; // < 10 minutes remaining during live
  percentageElapsed: number;
}

export function useContestTimer(
  startAtIso: string,
  endAtIso: string,
  onContestStart?: () => void,
  onContestEnd?: () => void
): UseContestTimerResult {
  const [now, setNow] = useState<number>(Date.now());

  const startTimeMs = useMemo(() => new Date(startAtIso).getTime(), [startAtIso]);
  const endTimeMs = useMemo(() => new Date(endAtIso).getTime(), [endAtIso]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const state = useMemo<'upcoming' | 'live' | 'ended'>(() => {
    if (now < startTimeMs) return 'upcoming';
    if (now >= endTimeMs) return 'ended';
    return 'live';
  }, [now, startTimeMs, endTimeMs]);

  // Trigger optional callbacks on transitions
  useEffect(() => {
    if (state === 'live' && onContestStart) {
      onContestStart();
    } else if (state === 'ended' && onContestEnd) {
      onContestEnd();
    }
  }, [state, onContestStart, onContestEnd]);

  const timeRemainingMs = useMemo(() => {
    if (state === 'upcoming') {
      return Math.max(0, startTimeMs - now);
    }
    if (state === 'live') {
      return Math.max(0, endTimeMs - now);
    }
    return 0;
  }, [state, startTimeMs, endTimeMs, now]);

  const percentageElapsed = useMemo(() => {
    const totalDuration = endTimeMs - startTimeMs;
    if (totalDuration <= 0) return 100;
    if (now < startTimeMs) return 0;
    if (now >= endTimeMs) return 100;
    return Math.min(100, Math.max(0, ((now - startTimeMs) / totalDuration) * 100));
  }, [now, startTimeMs, endTimeMs]);

  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [timeRemainingMs]);

  const isCritical = state === 'live' && timeRemainingMs <= 10 * 60 * 1000;

  return {
    state,
    timeRemainingMs,
    formattedTime,
    isCritical,
    percentageElapsed,
  };
}
