/**
 * NexusCode Dynamic Streak Service
 * Computes daily streak based on system time and actual user activity/submissions.
 * Defaults to 1 Day for today's active student session and increments continuously.
 */

import { useState, useEffect, useCallback } from "react";

const STREAK_STORAGE_KEY = "nexucode_activity_dates";

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates consecutive active days ending today or yesterday
 */
export function calculateStreak(dates: string[], referenceDate: Date = new Date()): {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  history: string[];
} {
  const todayStr = formatLocalDate(referenceDate);

  if (!dates || dates.length === 0) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      isActiveToday: true,
      history: [todayStr],
    };
  }

  const uniqueSortedDates = Array.from(new Set(dates)).sort().reverse();

  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  const isActiveToday = uniqueSortedDates.includes(todayStr);
  const isActiveYesterday = uniqueSortedDates.includes(yesterdayStr);

  if (!isActiveToday && !isActiveYesterday) {
    return {
      currentStreak: 0,
      longestStreak: calculateLongestStreak(uniqueSortedDates),
      isActiveToday: false,
      history: uniqueSortedDates,
    };
  }

  // Count consecutive days backward
  let currentStreak = 0;
  let checkDate = new Date(referenceDate);

  if (!isActiveToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkStr = formatLocalDate(checkDate);
    if (uniqueSortedDates.includes(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak: Math.max(1, currentStreak),
    longestStreak: Math.max(currentStreak, calculateLongestStreak(uniqueSortedDates), 1),
    isActiveToday: true,
    history: uniqueSortedDates,
  };
}

function calculateLongestStreak(sortedDescDates: string[]): number {
  if (sortedDescDates.length === 0) return 1;
  let max = 1;
  let curr = 1;

  for (let i = 0; i < sortedDescDates.length - 1; i++) {
    const d1 = new Date(sortedDescDates[i]);
    const d2 = new Date(sortedDescDates[i + 1]);
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      curr++;
      if (curr > max) max = curr;
    } else if (diffDays > 1) {
      curr = 1;
    }
  }
  return max;
}

export const streakService = {
  getActivityDates(): string[] {
    try {
      const raw = localStorage.getItem(STREAK_STORAGE_KEY);
      const today = formatLocalDate();
      if (!raw) {
        const initDates = [today];
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(initDates));
        return initDates;
      }
      const parsed: string[] = JSON.parse(raw);
      // Clean up legacy 5-day mock data if found
      if (parsed.length > 3 && !parsed.includes(today)) {
        const fresh = [today];
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    } catch {
      return [formatLocalDate()];
    }
  },

  recordTodayActivity(): { currentStreak: number; isActiveToday: boolean } {
    const today = formatLocalDate();
    const existing = this.getActivityDates();
    if (!existing.includes(today)) {
      const updated = [today, ...existing];
      try {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save activity date", e);
      }
      window.dispatchEvent(new Event("nexucode_streak_updated"));
    }
    const res = calculateStreak(this.getActivityDates());
    return { currentStreak: res.currentStreak, isActiveToday: res.isActiveToday };
  },

  getStreakInfo() {
    const dates = this.getActivityDates();
    return calculateStreak(dates);
  },
};

/**
 * React hook for live dynamic streak synced with system clock
 */
export function useUserStreak() {
  const [streakInfo, setStreakInfo] = useState(() => streakService.getStreakInfo());

  const refresh = useCallback(() => {
    setStreakInfo(streakService.getStreakInfo());
  }, []);

  useEffect(() => {
    window.addEventListener("nexucode_streak_updated", refresh);
    const interval = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("nexucode_streak_updated", refresh);
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    ...streakInfo,
    recordActivity: streakService.recordTodayActivity.bind(streakService),
    refresh,
  };
}
