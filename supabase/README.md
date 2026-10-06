# Nexus Code — Database Architecture & Migrations (Phase 2)

This directory contains the authoritative PostgreSQL migrations, Row Level Security (RLS) policies, lifecycle triggers, and verification suites for **Nexus Code — Contest & Event Platform**.

---

## 1. Migration Directory Layout

```
supabase/
├── migrations/
│   ├── 20260927000000_phase2_complete_schema_and_rls.sql  # Consolidated one-click migration
│   ├── 20260927000001_phase2_core_schema.sql             # Table DDL, constraints, foreign keys, indexes
│   ├── 20260927000002_phase2_rls_policies.sql            # RLS enablement & fine-grained security policies
│   └── 20260927000003_phase2_auth_triggers.sql           # User lifecycle, auto-profile, role protection triggers
├── tests/
│   ├── rls_policy_test.sql                                # Transactional SQL test suite for Student/Coordinator/Admin/Anon
│   └── verify_schema.ts                                   # Automated schema integrity verification runner
└── README.md                                              # This documentation
```

---

## 2. Core Tables (17 Normalized Entities)

| Table | Primary Key | Relationships & Ownership | Access Summary |
|---|---|---|---|
| `profiles` | `id (UUID)` | `auth.users(id)` ON DELETE CASCADE | Users view/edit own profile; Admins/Coordinators view all; role modifications strictly restricted to Admins. |
| `problems` | `id (UUID)` | `created_by -> profiles(id)` | Published problems readable by authenticated users; draft problems restricted to author/staff. |
| `problem_languages` | `(problem_id, language)` | `problems(id)` ON DELETE CASCADE | Inherits problem visibility. |
| `test_cases` | `id (UUID)` | `problems(id)` ON DELETE CASCADE | Sample test cases viewable by students; **hidden test cases strictly restricted to coordinators and admins**. |
| `contests` | `id (UUID)` | `created_by -> profiles(id)` | Scheduled/Live/Ended readable by authenticated users; drafts restricted to creator/staff. |
| `contest_problems` | `(contest_id, problem_id)` | `contests(id)`, `problems(id)` | Inherits contest visibility. |
| `contest_participants`| `(contest_id, user_id)` | `contests(id)`, `profiles(id)` | Students self-register for open contests; staff view/manage all; disqualification/warnings protected. |
| `submissions` | `id (UUID)` | `contests(id)`, `problems(id)`, `profiles(id)` | Students create pending submissions; submissions are immutable for students; judge engine updates score. |
| `submission_results` | `submission_id (UUID)` | `submissions(id)` ON DELETE CASCADE | Raw judging data; students read results of own submissions; only judge/admin can insert/update. |
| `contest_scores` | `(contest_id, user_id)` | `contests(id)`, `profiles(id)` | Derived leaderboard rankings; readable for live/ended contests; only judge/backend can write. |
| `events` | `id (UUID)` | `created_by -> profiles(id)` | Viewable by authenticated users; created/updated by coordinators/admins. |
| `event_participants` | `(event_id, user_id)` | `events(id)`, `profiles(id)` | Students self-register or cancel; coordinators manage. |
| `achievements` | `id (UUID)` | None | Read-only definitions for users; managed by admins. |
| `user_achievements` | `(user_id, achievement_id)` | `profiles(id)`, `achievements(id)`, `events(id)` | Students view own; staff award. |
| `certificates` | `id (UUID)` | `profiles(id)`, `events(id)` | Students view own; public verification by unique `verification_token`; issued by staff. |
| `violations` | `id (UUID)` | `contests(id)`, `profiles(id)` | Integrity monitoring; students view own; created/reviewed by staff. |
| `audit_logs` | `id (UUID)` | `actor_id -> profiles(id)` | System audit trail; readable by admins only; immutable (no updates or deletions permitted). |

---

## 3. How to Apply Migrations

### Option A: Via Supabase SQL Editor (Recommended)
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Navigate to the **SQL Editor** in the left sidebar.
4. Copy the entire content of `supabase/migrations/20260927000000_phase2_complete_schema_and_rls.sql`.
5. Click **Run**. All 17 tables, indexes, constraints, helper functions, RLS policies, and triggers will be deployed idempotently.

### Option B: Via Supabase CLI
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

---

## 4. Running the Verification Suite
To run the automated schema verification:
```bash
npx tsx supabase/tests/verify_schema.ts
```
To run the transactional PostgreSQL RLS test suite:
Execute `supabase/tests/rls_policy_test.sql` in the Supabase SQL Editor. It runs in a transaction block with automatic rollback.
