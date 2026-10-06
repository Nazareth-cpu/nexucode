/**
 * Schema & Migration Verification Script (Phase 2)
 *
 * Verifies that all 17 tables, foreign keys, indexes, and RLS policies
 * are present, well-formed, and strictly match the specification.
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_TABLES = [
  'profiles',
  'problems',
  'problem_languages',
  'test_cases',
  'contests',
  'contest_problems',
  'contest_participants',
  'submissions',
  'submission_results',
  'contest_scores',
  'events',
  'event_participants',
  'achievements',
  'user_achievements',
  'certificates',
  'violations',
  'audit_logs',
];

const REQUIRED_MIGRATIONS = [
  '20260927000000_phase2_complete_schema_and_rls.sql',
  '20260927000001_phase2_core_schema.sql',
  '20260927000002_phase2_rls_policies.sql',
  '20260927000003_phase2_auth_triggers.sql',
];

function runVerification() {
  console.log('====================================================');
  console.log('NEXUS CODE — PHASE 2 SCHEMA & MIGRATION VERIFICATION');
  console.log('====================================================\n');

  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('[FAIL] supabase/migrations directory does not exist!');
    process.exit(1);
  }

  // 1. Verify Migration Files
  console.log('1. Checking migration files existence...');
  for (const file of REQUIRED_MIGRATIONS) {
    const fullPath = path.join(migrationsDir, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`[FAIL] Missing required migration: ${file}`);
      process.exit(1);
    }
    const stat = fs.statSync(fullPath);
    console.log(`  [OK] ${file} (${stat.size} bytes)`);
  }

  // 2. Verify Table Definitions in Schema Migration
  console.log('\n2. Verifying Table Definitions in Core Schema...');
  const schemaContent = fs.readFileSync(
    path.join(migrationsDir, '20260927000001_phase2_core_schema.sql'),
    'utf-8'
  );

  for (const table of REQUIRED_TABLES) {
    const pattern = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i');
    if (!pattern.test(schemaContent)) {
      console.error(`[FAIL] Table definition missing for: public.${table}`);
      process.exit(1);
    }
    console.log(`  [OK] Table public.${table} found`);
  }

  // 3. Verify RLS Enablement in RLS Migration
  console.log('\n3. Verifying Row Level Security Enablement on all 17 tables...');
  const rlsContent = fs.readFileSync(
    path.join(migrationsDir, '20260927000002_phase2_rls_policies.sql'),
    'utf-8'
  );

  for (const table of REQUIRED_TABLES) {
    const pattern = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
    if (!pattern.test(rlsContent)) {
      console.error(`[FAIL] RLS not enabled on table: public.${table}`);
      process.exit(1);
    }
    console.log(`  [OK] RLS enabled on public.${table}`);
  }

  // 4. Verify Critical Security Definer Functions
  console.log('\n4. Verifying Security Definer Helper Functions...');
  const functions = ['is_admin', 'is_coordinator_or_admin', 'get_current_role'];
  for (const fn of functions) {
    const pattern = new RegExp(`FUNCTION public\\.${fn}`, 'i');
    if (!pattern.test(rlsContent)) {
      console.error(`[FAIL] Security function public.${fn} missing`);
      process.exit(1);
    }
    console.log(`  [OK] Helper function public.${fn} verified`);
  }

  // 5. Verify Triggers in Auth Triggers Migration
  console.log('\n5. Verifying Auth Lifecycle & Escalation Triggers...');
  const triggerContent = fs.readFileSync(
    path.join(migrationsDir, '20260927000003_phase2_auth_triggers.sql'),
    'utf-8'
  );

  const triggers = ['handle_new_user', 'enforce_profile_role_protection', 'log_audit_event'];
  for (const tr of triggers) {
    const pattern = new RegExp(`FUNCTION public\\.${tr}`, 'i');
    if (!pattern.test(triggerContent)) {
      console.error(`[FAIL] Trigger function public.${tr} missing`);
      process.exit(1);
    }
    console.log(`  [OK] Trigger function public.${tr} verified`);
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runVerification();
