-- ============================================================================
-- Migration: 20260927000002_phase2_rls_policies.sql
-- Project: Nexus Code — Contest & Event Platform
-- Phase: 2.2 — Row Level Security (RLS) & Role-Based Authorization Policies
-- Description: Enables RLS on all 17 private tables, defines security definer
--              role check helper functions, and implements least-privilege
--              access policies for Student, Coordinator, Admin, and Public users.
-- ============================================================================

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

-- Helper: Check if a user has administrator role
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

-- Helper: Check if a user has coordinator or administrator role
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

-- Helper: Retrieve current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL 17 TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "profiles_insert_own_student" ON public.profiles;
CREATE POLICY "profiles_insert_own_student" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (role = 'student' OR public.is_admin())
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- ============================================================================
-- 2. PROBLEMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "problems_select" ON public.problems;
CREATE POLICY "problems_select" ON public.problems
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "problems_insert" ON public.problems;
CREATE POLICY "problems_insert" ON public.problems
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_coordinator_or_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "problems_update" ON public.problems;
CREATE POLICY "problems_update" ON public.problems
  FOR UPDATE
  TO authenticated
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
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 3. PROBLEM_LANGUAGES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "problem_languages_select" ON public.problem_languages;
CREATE POLICY "problem_languages_select" ON public.problem_languages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_languages.problem_id
        AND (p.status = 'published' OR p.created_by = auth.uid() OR public.is_coordinator_or_admin())
    )
  );

DROP POLICY IF EXISTS "problem_languages_write" ON public.problem_languages;
CREATE POLICY "problem_languages_write" ON public.problem_languages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_languages.problem_id
        AND ((p.created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin())
    )
  );

-- ============================================================================
-- 4. TEST_CASES POLICIES (Strict protection of hidden judging assets)
-- ============================================================================
DROP POLICY IF EXISTS "test_cases_select_sample" ON public.test_cases;
CREATE POLICY "test_cases_select_sample" ON public.test_cases
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'sample'
    AND EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = test_cases.problem_id
        AND (p.status = 'published' OR p.created_by = auth.uid() OR public.is_coordinator_or_admin())
    )
  );

DROP POLICY IF EXISTS "test_cases_select_hidden_staff_only" ON public.test_cases;
CREATE POLICY "test_cases_select_hidden_staff_only" ON public.test_cases
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'hidden'
    AND (
      public.is_coordinator_or_admin()
      OR EXISTS (
        SELECT 1 FROM public.problems p
        WHERE p.id = test_cases.problem_id AND p.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "test_cases_write_staff_only" ON public.test_cases;
CREATE POLICY "test_cases_write_staff_only" ON public.test_cases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = test_cases.problem_id
        AND ((p.created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin())
    )
  );

-- ============================================================================
-- 5. CONTESTS POLICIES
-- ============================================================================
-- Authorization Matrix: Contests can ONLY be created, updated, or managed by Platform Administrators.
-- Coordinators and Students MUST NOT create or manage contests.
DROP POLICY IF EXISTS "contests_select" ON public.contests;
CREATE POLICY "contests_select" ON public.contests
  FOR SELECT
  TO authenticated
  USING (
    status IN ('scheduled', 'live', 'ended', 'archived')
    OR created_by = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contests_insert" ON public.contests;
CREATE POLICY "contests_insert" ON public.contests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "contests_update" ON public.contests;
CREATE POLICY "contests_update" ON public.contests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_delete" ON public.contests;
CREATE POLICY "contests_delete" ON public.contests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 6. CONTEST_PROBLEMS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "contest_problems_select" ON public.contest_problems;
CREATE POLICY "contest_problems_select" ON public.contest_problems
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_problems.contest_id
        AND (c.status IN ('scheduled', 'live', 'ended', 'archived') OR c.created_by = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "contest_problems_write" ON public.contest_problems;
CREATE POLICY "contest_problems_write" ON public.contest_problems
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- ============================================================================
-- 7. CONTEST_PARTICIPANTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "contest_participants_select" ON public.contest_participants;
CREATE POLICY "contest_participants_select" ON public.contest_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "contest_participants_insert_self" ON public.contest_participants;
CREATE POLICY "contest_participants_insert_self" ON public.contest_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id = auth.uid()
      AND status = 'registered'
      AND warnings = 0
      AND joined_at IS NULL
      AND disqualified_at IS NULL
      AND EXISTS (
        SELECT 1 FROM public.contests c
        WHERE c.id = contest_participants.contest_id
          AND c.status IN ('scheduled', 'live')
          AND timezone('utc'::text, now()) <= c.registration_deadline
      )
    )
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "contest_participants_update" ON public.contest_participants;
CREATE POLICY "contest_participants_update" ON public.contest_participants
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid() AND status IN ('registered', 'active'))
    OR public.is_admin()
  )
  WITH CHECK (
    (
      user_id = auth.uid()
      AND status IN ('registered', 'active')
      AND warnings = (SELECT warnings FROM public.contest_participants cp WHERE cp.contest_id = contest_participants.contest_id AND cp.user_id = auth.uid())
      AND disqualified_at IS NULL
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "contest_participants_delete" ON public.contest_participants;
CREATE POLICY "contest_participants_delete" ON public.contest_participants
  FOR DELETE
  TO authenticated
  USING (
    (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.contests c
        WHERE c.id = contest_participants.contest_id
          AND c.status = 'scheduled'
      )
    )
    OR public.is_coordinator_or_admin()
  );

-- ============================================================================
-- 8. SUBMISSIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
CREATE POLICY "submissions_select" ON public.submissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
CREATE POLICY "submissions_insert_student" ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND score = 0
    AND execution_time IS NULL
    AND memory IS NULL
  );

DROP POLICY IF EXISTS "submissions_update_judge_only" ON public.submissions;
CREATE POLICY "submissions_update_judge_only" ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "submissions_delete_admin_only" ON public.submissions;
CREATE POLICY "submissions_delete_admin_only" ON public.submissions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 9. SUBMISSION_RESULTS POLICIES (Authoritative raw judging data)
-- ============================================================================
DROP POLICY IF EXISTS "submission_results_select" ON public.submission_results;
CREATE POLICY "submission_results_select" ON public.submission_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_results.submission_id
        AND s.user_id = auth.uid()
    )
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "submission_results_write_judge_only" ON public.submission_results;
CREATE POLICY "submission_results_write_judge_only" ON public.submission_results
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 10. CONTEST_SCORES POLICIES (Authoritative derived leaderboard)
-- ============================================================================
DROP POLICY IF EXISTS "contest_scores_select_leaderboard" ON public.contest_scores;
CREATE POLICY "contest_scores_select_leaderboard" ON public.contest_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_scores.contest_id
        AND c.status IN ('live', 'ended', 'archived')
    )
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "contest_scores_write_engine_only" ON public.contest_scores;
CREATE POLICY "contest_scores_write_engine_only" ON public.contest_scores
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 11. EVENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_coordinator_or_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "events_update" ON public.events;
CREATE POLICY "events_update" ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    (created_by = auth.uid() AND public.is_coordinator_or_admin())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_delete" ON public.events
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 12. EVENT_PARTICIPANTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "event_participants_select" ON public.event_participants;
CREATE POLICY "event_participants_select" ON public.event_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "event_participants_insert_self" ON public.event_participants;
CREATE POLICY "event_participants_insert_self" ON public.event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND status = 'registered')
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "event_participants_update" ON public.event_participants;
CREATE POLICY "event_participants_update" ON public.event_participants
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() AND status = 'cancelled')
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "event_participants_delete" ON public.event_participants;
CREATE POLICY "event_participants_delete" ON public.event_participants
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

-- ============================================================================
-- 13. ACHIEVEMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "achievements_write_admin_only" ON public.achievements;
CREATE POLICY "achievements_write_admin_only" ON public.achievements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 14. USER_ACHIEVEMENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;
CREATE POLICY "user_achievements_select" ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "user_achievements_write_staff_only" ON public.user_achievements;
CREATE POLICY "user_achievements_write_staff_only" ON public.user_achievements
  FOR ALL
  TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- ============================================================================
-- 15. CERTIFICATES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "certificates_select_own_or_staff" ON public.certificates;
CREATE POLICY "certificates_select_own_or_staff" ON public.certificates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

-- Allow public verification of certificates by unique verification token
DROP POLICY IF EXISTS "certificates_verify_public" ON public.certificates;
CREATE POLICY "certificates_verify_public" ON public.certificates
  FOR SELECT
  TO anon
  USING (verification_token IS NOT NULL);

DROP POLICY IF EXISTS "certificates_write_staff_only" ON public.certificates;
CREATE POLICY "certificates_write_staff_only" ON public.certificates
  FOR ALL
  TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- ============================================================================
-- 16. VIOLATIONS POLICIES (Security-sensitive contest proctoring)
-- ============================================================================
DROP POLICY IF EXISTS "violations_select" ON public.violations;
CREATE POLICY "violations_select" ON public.violations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "violations_write_staff_only" ON public.violations;
CREATE POLICY "violations_write_staff_only" ON public.violations
  FOR ALL
  TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- ============================================================================
-- 17. AUDIT_LOGS POLICIES (Immutable system audit trail)
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_only" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_staff" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_staff" ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_coordinator_or_admin());

-- Audit logs are strictly immutable: NO UPDATE OR DELETE POLICIES EXIST!
