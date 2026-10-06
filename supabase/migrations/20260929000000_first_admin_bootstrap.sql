-- ============================================================================
-- Migration: 20260929000000_first_admin_bootstrap.sql
-- Project: Nexus Code — Contest & Event Platform
-- Feature: Secure One-Time First Admin Bootstrap
-- ============================================================================
--
-- Requirements:
-- 1. First-admin bootstrap is permitted ONLY when ZERO active administrators exist.
-- 2. Once the first administrator is promoted, bootstrap is permanently disabled.
-- 3. Atomically protects against race conditions using transaction-level locking.
-- 4. Records a permanent audit record of who initialized the system.
-- 5. Does NOT weaken existing RLS policies or role-protection triggers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. System Bootstrap Audit Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_bootstrap_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT,
  bootstrapped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.system_bootstrap_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_bootstrap_audit_admin_select" ON public.system_bootstrap_audit;
CREATE POLICY "system_bootstrap_audit_admin_select" ON public.system_bootstrap_audit
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. Helper: Check if First-Admin Bootstrap is Currently Available
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_bootstrap_available()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.system_bootstrap_audit
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. Update Profile Role Protection Trigger to Accommodate Initial Bootstrap
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent privilege escalation on UPDATE:
  -- Only an established administrator can change any profile's role.
  -- Exception: If ZERO administrators exist in the entire system, the bootstrap mechanism is permitted to assign the initial admin.
  IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT public.is_admin() THEN
      IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        RAISE EXCEPTION 'Privilege Violation: Only administrators can modify platform roles.';
      ELSE
        -- During initial bootstrap, only promotion to 'admin' is permitted
        IF NEW.role <> 'admin' THEN
          RAISE EXCEPTION 'Privilege Violation: Bootstrap can only promote to admin.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- Prevent non-student role injection on direct INSERT:
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

-- ----------------------------------------------------------------------------
-- 4. Atomic Stored Procedure: bootstrap_first_admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count INT;
  v_user_profile RECORD;
  v_user_email TEXT;
BEGIN
  -- Acquire an advisory transaction lock on a unique hash key to prevent concurrent race conditions
  PERFORM pg_advisory_xact_lock(hashtext('nexus_code_bootstrap_first_admin'));

  -- Verify that ZERO administrators currently exist
  SELECT count(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin';
  IF v_admin_count > 0 THEN
    RAISE EXCEPTION 'Bootstrap unavailable: One or more administrators already exist in the system.';
  END IF;

  -- Verify audit record does not already exist
  IF EXISTS (SELECT 1 FROM public.system_bootstrap_audit) THEN
    RAISE EXCEPTION 'Bootstrap unavailable: Initial administrator setup has already been completed.';
  END IF;

  -- Verify target user exists and lock the row
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found. User must register before bootstrapping.';
  END IF;

  -- Retrieve email for audit log
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  -- Authoritatively promote target user to 'admin'
  UPDATE public.profiles
  SET role = 'admin',
      updated_at = now()
  WHERE id = p_user_id;

  -- Record audit trail
  INSERT INTO public.system_bootstrap_audit (
    admin_user_id,
    admin_email,
    bootstrapped_at,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    COALESCE(v_user_email, v_user_profile.email),
    now(),
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'previous_role', v_user_profile.role,
      'display_name', v_user_profile.display_name,
      'college_id', v_user_profile.college_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'First administrator successfully established.',
    'userId', p_user_id,
    'role', 'admin',
    'bootstrappedAt', now()
  );
END;
$$;
