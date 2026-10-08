-- ============================================================================
-- Migration: 20260927000000_phase2_complete_schema_and_rls.sql
-- Project: Nexus Code — Contest & Event Platform
-- Phase: 2 — Unified Core Schema, Constraints, RLS Policies, and Triggers
-- Description: Consolidated, idempotent migration for immediate deployment
--              via Supabase SQL Editor or Supabase CLI (`supabase db push`).
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SCHEMAS & TABLES
-- ============================================================================

-- 1.1 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  college_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_profiles_role CHECK (role IN ('student', 'coordinator', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 1.2 Problems
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  statement TEXT NOT NULL,
  input_format TEXT NOT NULL,
  output_format TEXT NOT NULL,
  constraints TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  difficulty TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_problems_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
  CONSTRAINT chk_problems_status CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_created_by ON public.problems(created_by);
CREATE INDEX IF NOT EXISTS idx_problems_status ON public.problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);

-- 1.3 Problem Languages
CREATE TABLE IF NOT EXISTS public.problem_languages (
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  starter_code TEXT NOT NULL,
  PRIMARY KEY (problem_id, language),
  CONSTRAINT chk_problem_languages_lang CHECK (
    language IN ('javascript', 'typescript', 'python', 'cpp', 'java', 'c', 'go', 'rust')
  )
);

CREATE INDEX IF NOT EXISTS idx_problem_languages_problem_id ON public.problem_languages(problem_id);

-- 1.4 Test Cases
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'hidden',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_test_cases_visibility CHECK (visibility IN ('sample', 'hidden'))
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON public.test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_visibility ON public.test_cases(visibility);

-- 1.5 Contests
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_contests_status CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'archived')),
  CONSTRAINT chk_contest_schedule CHECK (end_at > start_at AND registration_deadline <= end_at)
);

CREATE INDEX IF NOT EXISTS idx_contests_created_by ON public.contests(created_by);
CREATE INDEX IF NOT EXISTS idx_contests_status ON public.contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_start_at ON public.contests(start_at);
CREATE INDEX IF NOT EXISTS idx_contests_end_at ON public.contests(end_at);

-- 1.6 Contest Problems
CREATE TABLE IF NOT EXISTS public.contest_problems (
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  PRIMARY KEY (contest_id, problem_id),
  CONSTRAINT uq_contest_problem_order UNIQUE (contest_id, order_index),
  CONSTRAINT chk_contest_problems_points CHECK (points >= 0)
);

CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON public.contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON public.contest_problems(problem_id);

-- 1.7 Contest Participants
CREATE TABLE IF NOT EXISTS public.contest_participants (
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'registered',
  warnings INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ,
  disqualified_at TIMESTAMPTZ,
  PRIMARY KEY (contest_id, user_id),
  CONSTRAINT chk_contest_participants_status CHECK (
    status IN ('registered', 'active', 'completed', 'disqualified')
  ),
  CONSTRAINT chk_contest_participants_warnings CHECK (warnings >= 0)
);

CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_id ON public.contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user_id ON public.contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_status ON public.contest_participants(status);

-- 1.8 Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER NOT NULL DEFAULT 0,
  execution_time INTEGER,
  memory INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_submissions_status CHECK (
    status IN ('pending', 'processing', 'evaluated', 'error')
  ),
  CONSTRAINT chk_submissions_score CHECK (score >= 0)
);

CREATE INDEX IF NOT EXISTS idx_submissions_contest_id ON public.submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- 1.9 Submission Results
CREATE TABLE IF NOT EXISTS public.submission_results (
  submission_id UUID PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
  test_count INTEGER NOT NULL DEFAULT 0,
  passed_count INTEGER NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL DEFAULT 'pending',
  judge_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_submission_results_counts CHECK (test_count >= 0 AND passed_count >= 0 AND passed_count <= test_count),
  CONSTRAINT chk_submission_results_verdict CHECK (
    verdict IN (
      'pending',
      'accepted',
      'wrong_answer',
      'time_limit_exceeded',
      'memory_limit_exceeded',
      'compilation_error',
      'runtime_error',
      'internal_error'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_submission_results_verdict ON public.submission_results(verdict);

-- 1.10 Contest Scores
CREATE TABLE IF NOT EXISTS public.contest_scores (
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  penalty_time INTEGER NOT NULL DEFAULT 0,
  solved_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (contest_id, user_id),
  CONSTRAINT chk_contest_scores_values CHECK (score >= 0 AND penalty_time >= 0 AND solved_count >= 0),
  CONSTRAINT chk_contest_scores_rank CHECK (rank IS NULL OR rank > 0)
);

CREATE INDEX IF NOT EXISTS idx_contest_scores_contest_id ON public.contest_scores(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_scores_user_id ON public.contest_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_scores_leaderboard ON public.contest_scores(contest_id, score DESC, penalty_time ASC);

-- 1.11 Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'workshop',
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_events_type CHECK (type IN ('hackathon', 'workshop', 'webinar', 'meetup', 'contest')),
  CONSTRAINT chk_events_schedule CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON public.events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- 1.12 Event Participants
CREATE TABLE IF NOT EXISTS public.event_participants (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (event_id, user_id),
  CONSTRAINT chk_event_participants_status CHECK (status IN ('registered', 'attended', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);

-- 1.13 Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_achievements_name ON public.achievements(name);

-- 1.14 User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- 1.15 Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  rank INTEGER,
  file_path TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_certificates_rank CHECK (rank IS NULL OR rank > 0)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_token ON public.certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);

-- 1.16 Violations
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  warning_number INTEGER NOT NULL DEFAULT 1,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_violations_type CHECK (
    type IN ('tab_switch', 'paste_detected', 'multiple_ip', 'plagiarism', 'other')
  ),
  CONSTRAINT chk_violations_severity CHECK (
    severity IN ('low', 'warning', 'critical', 'disqualification')
  ),
  CONSTRAINT chk_violations_warning_number CHECK (warning_number >= 1)
);

CREATE INDEX IF NOT EXISTS idx_violations_contest_id ON public.violations(contest_id);
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON public.violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_occurred_at ON public.violations(occurred_at DESC);

-- 1.17 Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR RLS & ROLE IDENTIFICATION
-- ============================================================================

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
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
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
-- 4. RLS POLICIES
-- ============================================================================

-- 4.1 Profiles
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "profiles_insert_own_student" ON public.profiles;
CREATE POLICY "profiles_insert_own_student" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND (role = 'student' OR public.is_admin()));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- 4.2 Problems
DROP POLICY IF EXISTS "problems_select" ON public.problems;
CREATE POLICY "problems_select" ON public.problems
  FOR SELECT TO authenticated
  USING (status = 'published' OR created_by = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "problems_insert" ON public.problems;
CREATE POLICY "problems_insert" ON public.problems
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator_or_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS "problems_update" ON public.problems;
CREATE POLICY "problems_update" ON public.problems
  FOR UPDATE TO authenticated
  USING ((created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin())
  WITH CHECK ((created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin());

DROP POLICY IF EXISTS "problems_delete" ON public.problems;
CREATE POLICY "problems_delete" ON public.problems
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.3 Problem Languages
DROP POLICY IF EXISTS "problem_languages_select" ON public.problem_languages;
CREATE POLICY "problem_languages_select" ON public.problem_languages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_languages.problem_id
        AND (p.status = 'published' OR p.created_by = auth.uid() OR public.is_coordinator_or_admin())
    )
  );

DROP POLICY IF EXISTS "problem_languages_write" ON public.problem_languages;
CREATE POLICY "problem_languages_write" ON public.problem_languages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_languages.problem_id
        AND ((p.created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin())
    )
  );

-- 4.4 Test Cases
DROP POLICY IF EXISTS "test_cases_select_sample" ON public.test_cases;
CREATE POLICY "test_cases_select_sample" ON public.test_cases
  FOR SELECT TO authenticated
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
  FOR SELECT TO authenticated
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
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = test_cases.problem_id
        AND ((p.created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin())
    )
  );

-- 4.5 Contests
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
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_update" ON public.contests;
CREATE POLICY "contests_update" ON public.contests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contests_delete" ON public.contests;
CREATE POLICY "contests_delete" ON public.contests
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.6 Contest Problems
DROP POLICY IF EXISTS "contest_problems_select" ON public.contest_problems;
CREATE POLICY "contest_problems_select" ON public.contest_problems
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contests c
      WHERE c.id = contest_problems.contest_id
        AND (c.status IN ('scheduled', 'live', 'ended', 'archived') OR c.created_by = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "contest_problems_write" ON public.contest_problems;
CREATE POLICY "contest_problems_write" ON public.contest_problems
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.7 Contest Participants
DROP POLICY IF EXISTS "contest_participants_select" ON public.contest_participants;
CREATE POLICY "contest_participants_select" ON public.contest_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "contest_participants_insert_self" ON public.contest_participants;
CREATE POLICY "contest_participants_insert_self" ON public.contest_participants
  FOR INSERT TO authenticated
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
  FOR UPDATE TO authenticated
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
  FOR DELETE TO authenticated
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

-- 4.8 Submissions
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
CREATE POLICY "submissions_select" ON public.submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "submissions_insert_student" ON public.submissions;
CREATE POLICY "submissions_insert_student" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND score = 0
    AND execution_time IS NULL
    AND memory IS NULL
  );

DROP POLICY IF EXISTS "submissions_update_judge_only" ON public.submissions;
CREATE POLICY "submissions_update_judge_only" ON public.submissions
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "submissions_delete_admin_only" ON public.submissions;
CREATE POLICY "submissions_delete_admin_only" ON public.submissions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.9 Submission Results
DROP POLICY IF EXISTS "submission_results_select" ON public.submission_results;
CREATE POLICY "submission_results_select" ON public.submission_results
  FOR SELECT TO authenticated
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
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.10 Contest Scores
DROP POLICY IF EXISTS "contest_scores_select_leaderboard" ON public.contest_scores;
CREATE POLICY "contest_scores_select_leaderboard" ON public.contest_scores
  FOR SELECT TO authenticated
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
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.11 Events
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator_or_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS "events_update" ON public.events;
CREATE POLICY "events_update" ON public.events
  FOR UPDATE TO authenticated
  USING ((created_by = auth.uid() AND public.is_coordinator_or_admin()) OR public.is_admin());

DROP POLICY IF EXISTS "events_delete" ON public.events;
CREATE POLICY "events_delete" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4.12 Event Participants
DROP POLICY IF EXISTS "event_participants_select" ON public.event_participants;
CREATE POLICY "event_participants_select" ON public.event_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "event_participants_insert_self" ON public.event_participants;
CREATE POLICY "event_participants_insert_self" ON public.event_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND status = 'registered')
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "event_participants_update" ON public.event_participants;
CREATE POLICY "event_participants_update" ON public.event_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin())
  WITH CHECK (
    (user_id = auth.uid() AND status = 'cancelled')
    OR public.is_coordinator_or_admin()
  );

DROP POLICY IF EXISTS "event_participants_delete" ON public.event_participants;
CREATE POLICY "event_participants_delete" ON public.event_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

-- 4.13 Achievements
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "achievements_write_admin_only" ON public.achievements;
CREATE POLICY "achievements_write_admin_only" ON public.achievements
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.14 User Achievements
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;
CREATE POLICY "user_achievements_select" ON public.user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "user_achievements_write_staff_only" ON public.user_achievements;
CREATE POLICY "user_achievements_write_staff_only" ON public.user_achievements
  FOR ALL TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- 4.15 Certificates
DROP POLICY IF EXISTS "certificates_select_own_or_staff" ON public.certificates;
CREATE POLICY "certificates_select_own_or_staff" ON public.certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "certificates_verify_public" ON public.certificates;
CREATE POLICY "certificates_verify_public" ON public.certificates
  FOR SELECT TO anon
  USING (verification_token IS NOT NULL);

DROP POLICY IF EXISTS "certificates_write_staff_only" ON public.certificates;
CREATE POLICY "certificates_write_staff_only" ON public.certificates
  FOR ALL TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- 4.16 Violations
DROP POLICY IF EXISTS "violations_select" ON public.violations;
CREATE POLICY "violations_select" ON public.violations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "violations_write_staff_only" ON public.violations;
CREATE POLICY "violations_write_staff_only" ON public.violations
  FOR ALL TO authenticated
  USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- 4.17 Audit Logs
DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_only" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_staff" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_staff" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coordinator_or_admin());

-- ============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================================

-- 5.1 Profile creation on user signup
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
    'student',
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
    RAISE NOTICE 'Skipping auth.users trigger setup';
END;
$$;

-- 5.2 Strict role protection trigger
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege Violation: Only administrators can modify platform roles.';
    END IF;
  END IF;

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

-- 5.3 Audit log helper
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

-- 5.4 Timestamps
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
