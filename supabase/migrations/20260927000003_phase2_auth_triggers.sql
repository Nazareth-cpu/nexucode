-- ============================================================================
-- Migration: 20260927000003_phase2_auth_triggers.sql
-- Project: Nexus Code — Contest & Event Platform
-- Phase: 2.3 — Triggers, Auto-Profile Creation & Privilege Escalation Defense
-- Description: Establishes auth user lifecycle triggers, strictly enforces
--              the 'student' default role on registration, protects against
--              unauthorized role escalation, and creates automatic timestamp triggers.
-- ============================================================================

-- ============================================================================
-- 1. AUTOMATIC PROFILE CREATION TRIGGER (auth.users -> public.profiles)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
  v_college_id TEXT;
BEGIN
  -- Safely extract user metadata provided during registration or OAuth sign-in
  v_display_name := COALESCE(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  v_college_id := new.raw_user_meta_data->>'college_id';

  -- Insert profile with strictly defaulted 'student' role.
  -- Idempotent upsert ensures subsequent logins or duplicate events do not fail or duplicate.
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    avatar_url,
    role,
    college_id,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    v_display_name,
    COALESCE(new.email, ''),
    v_avatar_url,
    'student', -- HARDCODED: Public signup can NEVER default to coordinator or admin
    v_college_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = now();

  RETURN new;
END;
$$;

-- Connect trigger to auth.users if permissions allow (in standard Supabase environment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping auth.users trigger setup (requires superuser / auth schema privileges)';
END;
$$;

-- ============================================================================
-- 2. DEFENSE-IN-DEPTH: STRICT ROLE ESCALATION PREVENTION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent privilege escalation on UPDATE:
  -- Only an established administrator can change any profile's role.
  IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege Violation: Only administrators can modify platform roles.';
    END IF;
  END IF;

  -- Prevent non-student role injection on direct INSERT:
  -- If a non-admin client tries to insert with role != 'student', force to 'student'.
  IF (TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'student') THEN
    IF NOT public.is_admin() THEN
      NEW.role := 'student';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_protection();

-- ============================================================================
-- 3. AUDIT LOGGING HELPER FUNCTION (For privileged operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Ensure actor is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Audit logging requires an authenticated actor.';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
  VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata,
    now()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- 4. AUTOMATIC updated_at TIMESTAMP REFRESH TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_problems_updated_at ON public.problems;
CREATE TRIGGER tr_set_problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_set_contests_updated_at ON public.contests;
CREATE TRIGGER tr_set_contests_updated_at
  BEFORE UPDATE ON public.contests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_set_events_updated_at ON public.events;
CREATE TRIGGER tr_set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_set_contest_scores_updated_at ON public.contest_scores;
CREATE TRIGGER tr_set_contest_scores_updated_at
  BEFORE UPDATE ON public.contest_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
