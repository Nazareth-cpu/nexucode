-- ============================================================================
-- Migration: 20260928000000_role_and_permission_hierarchy.sql
-- Project: Nexus Code — Contest & Event Platform
-- Master Role & Permission Hierarchy Implementation
-- ============================================================================
--
-- Roles:
--   1. student (Default)
--   2. coordinator (Event Coordinator)
--   3. admin (Platform Administrator)
--
-- Authorization Matrix:
--                Student   Coordinator   Admin
--   Problems       NO          YES        YES
--   Contests       NO          NO         YES
--   Events         NO          YES        YES
--   Admin control  NO          NO         YES
--
-- ============================================================================

-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
      AND role IN ('coordinator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(role, 'student') FROM public.profiles WHERE id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 1. PROFILES & ROLE PROVISIONING RLS & TRIGGERS
-- ----------------------------------------------------------------------------

-- Enforce that profiles role can only be modified by admins
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

-- Secure administrative role provisioning procedure
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can provision user roles.';
  END IF;

  IF p_new_role NOT IN ('student', 'coordinator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be student, coordinator, or admin.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role,
      updated_at = now()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  RETURN jsonb_build_object('success', true, 'userId', p_target_user_id, 'newRole', p_new_role);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. PROBLEMS POLICIES (Coordinator: YES, Admin: YES, Student: NO)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "problems_select" ON public.problems;
CREATE POLICY "problems_select" ON public.problems
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "problems_insert" ON public.problems;
CREATE POLICY "problems_insert" ON public.problems
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_coordinator_or_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "problems_update" ON public.problems;
CREATE POLICY "problems_update" ON public.problems
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND public.is_coordinator_or_admin())
    OR public.is_admin()
  )
  WITH CHECK (
    (created_by = auth.uid() AND public.is_coordinator_or_admin())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "problems_delete" ON public.problems;
CREATE POLICY "problems_delete" ON public.problems
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. CONTESTS POLICIES (Coordinator: NO, Admin: YES, Student: NO)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "contests_select" ON public.contests;
CREATE POLICY "contests_select" ON public.contests
  FOR SELECT TO authenticated
  USING (
    status IN ('scheduled', 'live', 'ended', 'archived')
    OR created_by = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contests_insert" ON public.contests;
CREATE POLICY "contests_insert" ON public.contests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "contests_update" ON public.contests;
CREATE POLICY "contests_update" ON public.contests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_delete" ON public.contests;
CREATE POLICY "contests_delete" ON public.contests
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contest_problems_write" ON public.contest_problems;
CREATE POLICY "contest_problems_write" ON public.contest_problems
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. EVENTS POLICIES (Coordinator: YES, Admin: YES, Student: NO)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_coordinator_or_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "events_update" ON public.events;
CREATE POLICY "events_update" ON public.events
  FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND public.is_coordinator_or_admin())
    OR public.is_admin()
  )
  WITH CHECK (
    (created_by = auth.uid() AND public.is_coordinator_or_admin())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_delete" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_admin());
