-- ============================================================================
-- Migration: 20261006000000_integrity_and_violations.sql
-- Enhances violations schema and RLS for comprehensive anti-misuse enforcement
-- ============================================================================

-- 1. Update check constraint on violations table to include all violation types
ALTER TABLE IF EXISTS public.violations DROP CONSTRAINT IF EXISTS chk_violations_type;
ALTER TABLE IF EXISTS public.violations ADD CONSTRAINT chk_violations_type CHECK (
  type IN (
    'tab_switch',
    'paste_detected',
    'fullscreen_exit',
    'unauthorized_navigation',
    'workspace_misuse',
    'multiple_ip',
    'plagiarism',
    'other'
  )
);

-- 2. Allow event_id on violations for Technical Events integrity tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'violations' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.violations ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_violations_event_id ON public.violations(event_id);
  END IF;
END $$;

-- 3. Make contest_id nullable to support event-scoped violations
ALTER TABLE IF EXISTS public.violations ALTER COLUMN contest_id DROP NOT NULL;

-- 4. Enable Supabase Realtime on violations table for proctoring monitoring
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'violations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.violations;
    END IF;
  END IF;
END $$;
