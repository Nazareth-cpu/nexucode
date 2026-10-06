-- ============================================================================
-- Migration: 20260927000001_phase2_core_schema.sql
-- Project: Nexus Code — Contest & Event Platform
-- Phase: 2.1 — Core Relational Schema & Constraints
-- Description: Creates the 17 normalized tables, constraints, foreign keys,
--              and indexes according to the platform architecture specification.
-- ============================================================================

-- Ensure uuid-ossp or pgcrypto extension is active for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES (Extends / establishes Phase 1.5 profile foundation)
-- ============================================================================
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

-- ============================================================================
-- 2. PROBLEMS
-- ============================================================================
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

-- ============================================================================
-- 3. PROBLEM_LANGUAGES
-- ============================================================================
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

-- ============================================================================
-- 4. TEST_CASES (Sensitive judging assets)
-- ============================================================================
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

-- ============================================================================
-- 5. CONTESTS
-- ============================================================================
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

-- ============================================================================
-- 6. CONTEST_PROBLEMS
-- ============================================================================
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

-- ============================================================================
-- 7. CONTEST_PARTICIPANTS
-- ============================================================================
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

-- ============================================================================
-- 8. SUBMISSIONS
-- ============================================================================
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

-- ============================================================================
-- 9. SUBMISSION_RESULTS (Raw judge execution details)
-- ============================================================================
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

-- ============================================================================
-- 10. CONTEST_SCORES (Authoritative derived leaderboard data)
-- ============================================================================
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

-- ============================================================================
-- 11. EVENTS
-- ============================================================================
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

-- ============================================================================
-- 12. EVENT_PARTICIPANTS
-- ============================================================================
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

-- ============================================================================
-- 13. ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_achievements_name ON public.achievements(name);

-- ============================================================================
-- 14. USER_ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- ============================================================================
-- 15. CERTIFICATES
-- ============================================================================
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

-- ============================================================================
-- 16. VIOLATIONS (Contest proctoring and integrity monitoring)
-- ============================================================================
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

-- ============================================================================
-- 17. AUDIT_LOGS (Privileged actions & system events)
-- ============================================================================
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
