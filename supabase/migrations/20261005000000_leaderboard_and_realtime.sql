-- ============================================================================
-- Migration: 20261005000000_leaderboard_and_realtime.sql
-- Enables Supabase Realtime publication and replica identity for contest_scores
-- ============================================================================

-- Ensure contest_scores has full replica identity for comprehensive realtime payloads
ALTER TABLE IF EXISTS public.contest_scores REPLICA IDENTITY FULL;

-- Add contest_scores to the supabase_realtime publication if not already present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'contest_scores'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_scores;
    END IF;
  END IF;
END $$;
