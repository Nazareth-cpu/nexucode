-- ============================================================================
-- Migration: 20261006120000_fix_bootstrap_and_role_persistence.sql
-- Project: Nexus Code — Contest & Event Platform
-- Feature: Authoritative Role Persistence & First-Admin Bootstrap Permanent Sealing
-- ============================================================================
--
-- Fixes:
-- 1. Explicitly grants execute on public.is_bootstrap_available() to anon, authenticated, service_role
--    so unauthenticated callers can check availability without being blocked by RLS.
-- 2. Hardens enforce_profile_role_protection trigger so that:
--    a. A user's existing admin or coordinator role can NEVER be demoted through
--       normal profile updates or upserts.
--    b. Only deliberate administrative operations (admin_set_user_role) can change roles.
-- 3. Provides has_system_been_bootstrapped() helper granted to anon.
-- ============================================================================

-- 1. Grant execute on is_bootstrap_available to all roles
GRANT EXECUTE ON FUNCTION public.is_bootstrap_available() TO anon, authenticated, service_role;

-- 2. System bootstrapped check helper function
CREATE OR REPLACE FUNCTION public.has_system_been_bootstrapped()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.system_bootstrap_audit
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_system_been_bootstrapped() TO anon, authenticated, service_role;

-- 3. Hardened Role Protection Trigger
-- Defends against accidental demotion of established Admins/Coordinators via upserts or self-edits.
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_bootstrap_permitted BOOLEAN;
BEGIN
  -- Handle INSERT:
  IF (TG_OP = 'INSERT') THEN
    -- If a non-admin client tries to insert with role != 'student', enforce 'student'
    IF NEW.role IS DISTINCT FROM 'student' THEN
      IF NOT public.is_admin() THEN
        NEW.role := 'student';
      END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Handle UPDATE:
  IF (TG_OP = 'UPDATE') THEN
    -- Check if role is attempting to change
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      -- Exception: Check if First-Admin Bootstrap is in progress (zero admins exist)
      SELECT public.is_bootstrap_available() INTO v_is_bootstrap_permitted;

      IF v_is_bootstrap_permitted THEN
        -- During initial bootstrap window, only promotion to 'admin' is permitted
        IF NEW.role <> 'admin' THEN
          RAISE EXCEPTION 'Privilege Violation: Bootstrap can only promote to admin.';
        END IF;
      ELSE
        -- Outside bootstrap window: ONLY an administrator can change roles
        IF NOT public.is_admin() THEN
          RAISE EXCEPTION 'Privilege Violation: Only administrators can modify platform roles.';
        END IF;

        -- Even an administrator cannot self-demote their own admin status via profile update
        IF OLD.id = auth.uid() AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
          RAISE EXCEPTION 'Privilege Violation: Administrators cannot demote their own role.';
        END IF;
      END IF;
    ELSE
      -- Role is unchanged; preserve old role strictly
      NEW.role := OLD.role;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_protection();
