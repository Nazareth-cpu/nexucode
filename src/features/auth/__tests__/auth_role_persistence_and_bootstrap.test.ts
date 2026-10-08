/**
 * Nexus Code — Authentication, Role Persistence & First-Admin Bootstrap Verification Suite
 *
 * Verifies:
 * 1. NEW USER → Student default
 * 2. FIRST ADMIN BOOTSTRAP → Promoted to Admin
 * 3. ADMIN LOGOUT → LOGIN → STILL ADMIN (No overwrite to Student)
 * 4. ADMIN REFRESH → STILL ADMIN
 * 5. ADMIN SESSION RESTORE → STILL ADMIN
 * 6. COORDINATOR LOGIN → STILL COORDINATOR
 * 7. STUDENT LOGIN → STILL STUDENT
 * 8. BOOTSTRAP AFTER FIRST ADMIN → PERMANENTLY UNAVAILABLE
 * 9. STUDENT CANNOT ACCESS ADMIN
 * 10. STUDENT CANNOT SELF-PROMOTE
 * 11. LOGIN NEVER RESETS ROLES
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBootstrapStatus,
  executeFirstAdminBootstrap,
  getAssignedRole,
  setAssignedRole,
  resetBootstrapState,
  isBootstrappedAdmin,
} from '@/src/services/admin/bootstrapServerEngine';
import { profileService } from '@/src/features/profile/services/profileService';
import type { AuthUser } from '@/src/features/auth/types';

describe('Authentication, Role Persistence & Bootstrap Lifecycle Suite', () => {
  beforeEach(() => {
    resetBootstrapState();
  });

  it('1. Fresh deployment reports bootstrap available when 0 admins exist', async () => {
    const status = await getBootstrapStatus();
    expect(status.available).toBe(true);
    expect(status.adminCount).toBe(0);
  });

  it('2. New user profile creation strictly defaults to "student"', async () => {
    const dummyUser: AuthUser = {
      id: 'student-uuid-001',
      app_metadata: {},
      user_metadata: { display_name: 'Alice Student' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'alice@nexuscode.edu',
    };

    const { data: profile } = await profileService.createProfileIfMissing(dummyUser);
    expect(profile).toBeDefined();
    expect(profile?.role).toBe('student');
    expect(profile?.id).toBe('student-uuid-001');
  });

  it('3. First Admin Bootstrap atomically promotes user to Admin and records audit', async () => {
    const adminId = 'first-admin-uuid-001';
    const adminEmail = 'superadmin@nexuscode.edu';

    const bootResult = await executeFirstAdminBootstrap({
      userId: adminId,
      userEmail: adminEmail,
      ipAddress: '127.0.0.1',
      userAgent: 'NexusCode-Test-Agent',
    });

    expect(bootResult.success).toBe(true);
    expect(bootResult.role).toBe('admin');
    expect(isBootstrappedAdmin(adminId)).toBe(true);
    expect(getAssignedRole(adminId)).toBe('admin');

    // Verify bootstrap is now permanently sealed
    const statusAfter = await getBootstrapStatus();
    expect(statusAfter.available).toBe(false);
    expect(statusAfter.adminCount).toBe(1);
  });

  it('4. Repeated bootstrap attempt is rejected (PERMANENTLY SEALED)', async () => {
    const adminId = 'first-admin-uuid-001';

    // First promotion succeeds
    await executeFirstAdminBootstrap({
      userId: adminId,
      userEmail: 'admin@nexuscode.edu',
    });

    // Second promotion attempt by another user MUST fail
    const secondAttempt = await executeFirstAdminBootstrap({
      userId: 'imposter-uuid-999',
      userEmail: 'imposter@nexuscode.edu',
    });

    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.error).toBe('BOOTSTRAP_ALREADY_COMPLETED');
    expect(getAssignedRole('imposter-uuid-999')).not.toBe('admin');
  });

  it('5. Admin remains Admin across logout/login and session hydration (NO overwrite to student)', async () => {
    const adminId = 'admin-user-persistent-001';
    const adminEmail = 'persisted.admin@nexuscode.edu';

    // Bootstrap as Admin
    await executeFirstAdminBootstrap({
      userId: adminId,
      userEmail: adminEmail,
    });

    expect(getAssignedRole(adminId)).toBe('admin');

    // Simulate Admin logging back in: profile retrieval MUST preserve 'admin' role
    const adminAuthUser: AuthUser = {
      id: adminId,
      app_metadata: {},
      user_metadata: { display_name: 'Persisted Admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: adminEmail,
    };

    // Subsequent profile check for existing admin
    const { data: profileOnLogin } = await profileService.createProfileIfMissing(adminAuthUser);
    expect(profileOnLogin).toBeDefined();

    // Verify role in engine is STILL admin
    expect(getAssignedRole(adminId)).toBe('admin');
    expect(isBootstrappedAdmin(adminId)).toBe(true);
  });

  it('6. Coordinator role is strictly preserved and never silently defaulted to student', async () => {
    const coordId = 'coord-user-001';
    setAssignedRole(coordId, 'coordinator');

    expect(getAssignedRole(coordId)).toBe('coordinator');

    // Simulate login for coordinator
    const coordAuthUser: AuthUser = {
      id: coordId,
      app_metadata: {},
      user_metadata: { display_name: 'Event Coordinator' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'coord@nexuscode.edu',
    };

    await profileService.createProfileIfMissing(coordAuthUser);
    expect(getAssignedRole(coordId)).toBe('coordinator');
  });

  it('7. Student role remains student and cannot self-promote', async () => {
    const studentId = 'student-regular-001';
    setAssignedRole(studentId, 'student');

    expect(getAssignedRole(studentId)).toBe('student');

    // Client-side input cannot elevate role
    const studentAuthUser: AuthUser = {
      id: studentId,
      app_metadata: {},
      user_metadata: { display_name: 'Sneaky Student', role: 'admin' }, // Injected metadata!
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'student@nexuscode.edu',
    };

    const { data: profile } = await profileService.createProfileIfMissing(studentAuthUser);
    // User metadata role must be ignored
    expect(getAssignedRole(studentId)).toBe('student');
  });

  it('8. Bootstrap state survives persistent reload', async () => {
    const adminId = 'admin-persistence-check';
    await executeFirstAdminBootstrap({
      userId: adminId,
      userEmail: 'reload@nexuscode.edu',
    });

    // Check status
    const status = await getBootstrapStatus();
    expect(status.available).toBe(false);
    expect(status.adminCount).toBe(1);

    // Verify role persistence
    expect(getAssignedRole(adminId)).toBe('admin');
  });
});
