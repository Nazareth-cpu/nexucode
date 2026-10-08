/**
 * Nexus Code — Real-Time Leaderboard Hook
 *
 * Connects to both Supabase Realtime postgres_changes (when configured)
 * and server WebSocket channel on port 3000 to push authoritative score
 * and rank updates with zero manual page refreshing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/src/features/auth';
import { getOptionalSupabaseClient } from '@/src/services/supabase/client';
import { leaderboardService } from '../services/leaderboardService';
import type { ChapterLeaderboardRow } from '@/src/services/ranking/rankingService';
import type { ContestLeaderboardRow } from '@/src/features/contests/types';

interface UseRealtimeLeaderboardOptions {
  contestId?: string;
  enabled?: boolean;
}

export function useRealtimeLeaderboard<T = ContestLeaderboardRow | ChapterLeaderboardRow>({
  contestId,
  enabled = true,
}: UseRealtimeLeaderboardOptions = {}) {
  const { session } = useAuth();
  const [standings, setStandings] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 1. Initial Authoritative Fetch
  const fetchStandings = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);

    try {
      if (contestId) {
        const { data, error: err } = await leaderboardService.getContestLeaderboard(
          contestId,
          session?.access_token
        );
        if (isMountedRef.current) {
          if (err) setError(err);
          else {
            setStandings(data as unknown as T[]);
            setLastUpdated(new Date().toISOString());
            setError(null);
          }
        }
      } else {
        const { data, error: err } = await leaderboardService.getGlobalLeaderboard(
          session?.access_token
        );
        if (isMountedRef.current) {
          if (err) setError(err);
          else {
            setStandings(data as unknown as T[]);
            setLastUpdated(new Date().toISOString());
            setError(null);
          }
        }
      }
    } catch (e: unknown) {
      if (isMountedRef.current) {
        setError((e as Error).message || 'Failed to load standings');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [contestId, session?.access_token, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStandings();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchStandings]);

  // 2. WebSocket Realtime Connection
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const room = contestId ? `contest:${contestId}` : 'leaderboard:chapter';
    let socket: WebSocket | null = null;
    let isTerminated = false;

    const connectWebSocket = () => {
      if (isTerminated) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isTerminated) return;
          setIsRealtimeConnected(true);
          // Subscribe to target room
          socket?.send(
            JSON.stringify({
              action: 'subscribe',
              room,
              userId: session?.user?.id,
            })
          );
        };

        socket.onmessage = (event) => {
          if (isTerminated) return;
          try {
            const data = JSON.parse(event.data);

            if (
              data.event === 'contest_leaderboard:update' &&
              contestId &&
              data.contestId === contestId
            ) {
              setStandings(data.standings as unknown as T[]);
              setLastUpdated(data.timestamp || new Date().toISOString());
            } else if (
              data.event === 'chapter_leaderboard:update' &&
              !contestId
            ) {
              setStandings(data.standings as unknown as T[]);
              setLastUpdated(data.timestamp || new Date().toISOString());
            }
          } catch {
            // Ignore format errors
          }
        };

        socket.onclose = () => {
          if (isTerminated) return;
          setIsRealtimeConnected(false);
          // Auto-reconnect with 3-second delay
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
          if (isTerminated) return;
          setIsRealtimeConnected(false);
        };
      } catch {
        setIsRealtimeConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      isTerminated = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'unsubscribe', room }));
        socket.close();
      }
      wsRef.current = null;
    };
  }, [contestId, enabled, session?.user?.id]);

  // 3. Supabase Realtime fallback subscription (when Supabase client is live)
  useEffect(() => {
    if (!enabled || !contestId) return;

    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`contest_scores_realtime_${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_scores',
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          // Re-fetch authoritative calculated standings
          fetchStandings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId, enabled, fetchStandings]);

  return {
    standings,
    isLoading,
    isRealtimeConnected,
    lastUpdated,
    error,
    refresh: fetchStandings,
  };
}
