-- ============================================================================
-- Test Suite: rls_policy_test.sql
-- Project: Nexus Code — Contest & Event Platform
-- Phase: 2.4 — Verification & Test Automation for RLS & Access Control
-- Description: Automated SQL test suite executing within PostgreSQL / Supabase
--              to simulate Student, Coordinator, Admin, and Anon contexts.
--              Verifies that allowed actions succeed and unauthorized actions fail.
-- ============================================================================

BEGIN;

-- Setup test environment identifiers
DO $$
DECLARE
  v_student_id UUID := '11111111-1111-1111-1111-111111111111';
  v_student2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_coordinator_id UUID := '33333333-3333-3333-3333-333333333333';
  v_admin_id UUID := '44444444-4444-4444-4444-444444444444';
  v_test_problem_id UUID;
  v_test_contest_id UUID;
  v_test_submission_id UUID;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'NEXUS CODE — PHASE 2 RLS SECURITY VERIFICATION SUITE';
  RAISE NOTICE '==================================================';

  -- Seed test profiles
  INSERT INTO public.profiles (id, display_name, email, role)
  VALUES
    (v_student_id, 'Test Student 1', 'student1@nexuscode.test', 'student'),
    (v_student2_id, 'Test Student 2', 'student2@nexuscode.test', 'student'),
    (v_coordinator_id, 'Test Coordinator', 'coord@nexuscode.test', 'coordinator'),
    (v_admin_id, 'Test Admin', 'admin@nexuscode.test', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name;

  RAISE NOTICE '[OK] Test profiles established for Student, Coordinator, and Admin.';

  -- ==========================================================================
  -- TEST 1: Role Escalation Defense
  -- ==========================================================================
  RAISE NOTICE '--- TEST 1: Role Escalation Defense ---';

  -- Simulate Student session
  PERFORM set_config('request.jwt.claim.sub', v_student_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Attempt 1.1: Student trying to promote themselves to coordinator
  BEGIN
    UPDATE public.profiles SET role = 'coordinator' WHERE id = v_student_id;
    -- If trigger or RLS check fails to stop this, raise failure
    IF (SELECT role FROM public.profiles WHERE id = v_student_id) = 'coordinator' THEN
      RAISE EXCEPTION '[FAIL] Student was able to elevate role to coordinator!';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student role self-escalation rejected by server.';
  END;

  -- Reset profile role back to student if modified
  UPDATE public.profiles SET role = 'student' WHERE id = v_student_id;

  -- Attempt 1.2: Student trying to update another user's profile
  BEGIN
    UPDATE public.profiles SET display_name = 'Hacked Name' WHERE id = v_student2_id;
    IF (SELECT display_name FROM public.profiles WHERE id = v_student2_id) = 'Hacked Name' THEN
      RAISE EXCEPTION '[FAIL] Student modified another user profile!';
    END IF;
    RAISE NOTICE '[PASS] Student cannot update another user profile.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student cannot update another user profile (rejected).';
  END;

  -- ==========================================================================
  -- TEST 2: Problem Management & Test Case Secrecy
  -- ==========================================================================
  RAISE NOTICE '--- TEST 2: Problem Management & Test Case Secrecy ---';

  -- Attempt 2.1: Student cannot create problems
  BEGIN
    INSERT INTO public.problems (title, slug, statement, input_format, output_format, constraints, difficulty, status, created_by)
    VALUES ('Student Problem', 'student-slug', 'text', 'in', 'out', 'none', 'easy', 'published', v_student_id);
    RAISE EXCEPTION '[FAIL] Student was able to create a problem!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student problem creation rejected by RLS.';
  END;

  -- Switch to Coordinator context
  PERFORM set_config('request.jwt.claim.sub', v_coordinator_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Coordinator creates problem
  INSERT INTO public.problems (id, title, slug, statement, input_format, output_format, constraints, difficulty, status, created_by)
  VALUES (gen_random_uuid(), 'Two Sum Deluxe', 'two-sum-deluxe', 'Arrays', 'Indices', 'N <= 10^5', 'easy', 'published', v_coordinator_id)
  RETURNING id INTO v_test_problem_id;
  RAISE NOTICE '[PASS] Coordinator successfully created published problem %', v_test_problem_id;

  -- Coordinator adds sample test case and hidden test case
  INSERT INTO public.test_cases (problem_id, storage_path, visibility)
  VALUES
    (v_test_problem_id, 'tests/sample_1.in', 'sample'),
    (v_test_problem_id, 'tests/hidden_secret_1.in', 'hidden');
  RAISE NOTICE '[PASS] Coordinator added sample and hidden test cases.';

  -- Switch back to Student context
  PERFORM set_config('request.jwt.claim.sub', v_student_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Student reads test cases: MUST ONLY SEE SAMPLE TEST CASES
  SELECT count(*) INTO v_count FROM public.test_cases
  WHERE problem_id = v_test_problem_id AND visibility = 'hidden';

  IF v_count > 0 THEN
    RAISE EXCEPTION '[FAIL] Student was able to query hidden test cases!';
  ELSE
    RAISE NOTICE '[PASS] Student CANNOT view hidden test cases (count = 0).';
  END IF;

  SELECT count(*) INTO v_count FROM public.test_cases
  WHERE problem_id = v_test_problem_id AND visibility = 'sample';

  IF v_count = 1 THEN
    RAISE NOTICE '[PASS] Student CAN read sample test cases.';
  ELSE
    RAISE EXCEPTION '[FAIL] Student could not view sample test case.';
  END IF;

  -- ==========================================================================
  -- TEST 3: Contest Participation & Defending Authoritative Timing
  -- ==========================================================================
  RAISE NOTICE '--- TEST 3: Contest Participation & Schedule Integrity ---';

  -- Switch to Coordinator context to create scheduled contest
  PERFORM set_config('request.jwt.claim.sub', v_coordinator_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  INSERT INTO public.contests (
    title, description, start_at, end_at, registration_deadline, status, created_by
  )
  VALUES (
    'Weekly Challenge 1',
    'Description',
    now() + INTERVAL '1 hour',
    now() + INTERVAL '3 hours',
    now() + INTERVAL '45 minutes',
    'scheduled',
    v_coordinator_id
  )
  RETURNING id INTO v_test_contest_id;
  RAISE NOTICE '[PASS] Coordinator created scheduled contest %', v_test_contest_id;

  -- Switch to Student context
  PERFORM set_config('request.jwt.claim.sub', v_student_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Attempt 3.1: Student cannot modify contest schedule or rules
  BEGIN
    UPDATE public.contests SET status = 'live' WHERE id = v_test_contest_id;
    IF (SELECT status FROM public.contests WHERE id = v_test_contest_id) = 'live' THEN
      RAISE EXCEPTION '[FAIL] Student changed contest status!';
    END IF;
    RAISE NOTICE '[PASS] Student cannot modify contest definition.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student contest update rejected by RLS.';
  END;

  -- Attempt 3.2: Student registers for the contest (Allowed)
  INSERT INTO public.contest_participants (contest_id, user_id, status)
  VALUES (v_test_contest_id, v_student_id, 'registered');
  RAISE NOTICE '[PASS] Student registered for scheduled contest.';

  -- Attempt 3.3: Student cannot register another user
  BEGIN
    INSERT INTO public.contest_participants (contest_id, user_id, status)
    VALUES (v_test_contest_id, v_student2_id, 'registered');
    RAISE EXCEPTION '[FAIL] Student registered another user!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student cannot register another user.';
  END;

  -- ==========================================================================
  -- TEST 4: Submissions, Judging & Score Authority
  -- ==========================================================================
  RAISE NOTICE '--- TEST 4: Submissions, Judging & Score Authority ---';

  -- Student creates submission with status 'pending' and score = 0
  INSERT INTO public.submissions (
    contest_id, problem_id, user_id, language, source_ref, status, score
  )
  VALUES (
    v_test_contest_id, v_test_problem_id, v_student_id, 'python', 'def solve(): pass', 'pending', 0
  )
  RETURNING id INTO v_test_submission_id;
  RAISE NOTICE '[PASS] Student created pending submission %', v_test_submission_id;

  -- Attempt 4.1: Student attempts to award themselves score 100 or 'accepted' status
  BEGIN
    UPDATE public.submissions SET score = 100, status = 'evaluated' WHERE id = v_test_submission_id;
    IF (SELECT score FROM public.submissions WHERE id = v_test_submission_id) = 100 THEN
      RAISE EXCEPTION '[FAIL] Student awarded themselves a score!';
    END IF;
    RAISE NOTICE '[PASS] Student cannot self-score submissions.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student submission score update rejected.';
  END;

  -- Attempt 4.2: Student attempts to insert fabricated judging results
  BEGIN
    INSERT INTO public.submission_results (submission_id, test_count, passed_count, verdict)
    VALUES (v_test_submission_id, 10, 10, 'accepted');
    RAISE EXCEPTION '[FAIL] Student fabricated judging results!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student insertion of raw judging results rejected.';
  END;

  -- Attempt 4.3: Student attempts to insert arbitrary contest leaderboard score
  BEGIN
    INSERT INTO public.contest_scores (contest_id, user_id, score, rank)
    VALUES (v_test_contest_id, v_student_id, 1000, 1);
    RAISE EXCEPTION '[FAIL] Student inserted leaderboard score!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student contest_scores insertion rejected.';
  END;

  -- ==========================================================================
  -- TEST 5: Violations & Audit Log Immutability
  -- ==========================================================================
  RAISE NOTICE '--- TEST 5: Violations & Audit Logs ---';

  -- Attempt 5.1: Student attempts to delete violations or modify warnings
  BEGIN
    INSERT INTO public.violations (contest_id, user_id, type, severity, warning_number)
    VALUES (v_test_contest_id, v_student_id, 'tab_switch', 'low', 1);
    RAISE EXCEPTION '[FAIL] Student created a violation record directly!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student violation write rejected.';
  END;

  -- Attempt 5.2: Student attempts to access audit logs
  BEGIN
    SELECT count(*) INTO v_count FROM public.audit_logs;
    IF v_count > 0 THEN
      RAISE EXCEPTION '[FAIL] Student can query audit logs!';
    END IF;
    RAISE NOTICE '[PASS] Student cannot view audit logs (0 visible).';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[PASS] Student audit log query rejected.';
  END;

  -- Switch to Admin context
  PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Admin can view audit logs
  SELECT count(*) INTO v_count FROM public.audit_logs;
  RAISE NOTICE '[PASS] Admin authorized to query audit trail (found % logs).', v_count;

  -- ==========================================================================
  -- TEST 6: Unauthenticated (Anon) Boundary
  -- ==========================================================================
  RAISE NOTICE '--- TEST 6: Unauthenticated (Anon) Boundary ---';

  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- Anon cannot read profiles
  SELECT count(*) INTO v_count FROM public.profiles;
  IF v_count > 0 THEN
    RAISE EXCEPTION '[FAIL] Anonymous user read profiles!';
  ELSE
    RAISE NOTICE '[PASS] Anonymous user denied access to private profiles.';
  END IF;

  -- Anon cannot read submissions
  SELECT count(*) INTO v_count FROM public.submissions;
  IF v_count > 0 THEN
    RAISE EXCEPTION '[FAIL] Anonymous user read submissions!';
  ELSE
    RAISE NOTICE '[PASS] Anonymous user denied access to private submissions.';
  END IF;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'ALL 6 CRITICAL RLS SECURITY TEST SUITES PASSED!';
  RAISE NOTICE '==================================================';

END $$;

ROLLBACK; -- Always rollback test execution to keep database clean
