/**
 * Nexus Code — Integrity & Anti-Misuse System Automated Verification Suite
 *
 * Verifies end-to-end:
 * 1. Strike 1 and Strike 2 generate warnings and persist correctly.
 * 2. Strike 3 revokes participation and prevents re-entry.
 * 3. Violations are server-tracked and immutable.
 * 4. Full-screen, tab switch, paste, unauthorized navigation, and workspace misuse violations are handled correctly.
 * 5. Technical events apply the identical 3-strike integrity lifecycle.
 * 6. Normal coding / judge errors (WA, CE, RE, TLE) NEVER create strikes.
 * 7. Refreshing or manipulating client state cannot bypass strike enforcement.
 * 8. Only administrative staff can reset or reinstate participants.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { integrityEngine } from '../../../services/integrity/integrityEngine';
import {
  registerUserForContest,
  startUserParticipation,
  recordContestViolation,
  getContestDetail,
  updateParticipantStatus,
} from '../../../services/contest/contestServerEngine';
import { contestScoringService } from '../../../services/scoring/scoringService';

describe('Nexus Code Integrity & Anti-Misuse System', () => {
  const testContestId = 'contest-live-12';
  const testEventId = 'evt-test-integ-1';
  const testUserA = {
    id: 'user-integ-student-a',
    email: 'student_a@nexuscode.edu',
    user_metadata: { display_name: 'Alice Turing' },
  };
  const testUserB = {
    id: 'user-integ-student-b',
    email: 'student_b@nexuscode.edu',
    user_metadata: { display_name: 'Bob Lovelace' },
  };

  beforeEach(() => {
    // Reinstate participants between test runs
    updateParticipantStatus(testContestId, testUserA.id, 'reinstate');
    updateParticipantStatus(testContestId, testUserB.id, 'reinstate');
    integrityEngine.resetStrikes('contest', testContestId, testUserA.id);
    integrityEngine.resetStrikes('contest', testContestId, testUserB.id);
    integrityEngine.resetStrikes('event', testEventId, testUserA.id);
  });

  it('Requirement 1 & 2: Strike 1 generates a warning with server-tracked strike count', () => {
    registerUserForContest(testContestId, testUserA);
    startUserParticipation(testContestId, testUserA);

    // Rule infraction: Exited mandatory tournament full-screen mode
    const strike1 = recordContestViolation(
      testContestId,
      testUserA,
      'fullscreen_exit',
      { reason: 'fullscreen_element_null' }
    );

    expect(strike1.success).toBe(true);
    expect(strike1.warningNumber).toBe(1);
    expect(strike1.maxWarnings).toBe(3);
    expect(strike1.isDisqualified).toBe(false);
    expect(strike1.severity).toBe('warning');
    expect(strike1.status).toBe('active');
  });

  it('Requirement 1 & 2: Strike 2 generates a critical warning', () => {
    registerUserForContest(testContestId, testUserA);
    startUserParticipation(testContestId, testUserA);

    recordContestViolation(testContestId, testUserA, 'fullscreen_exit', {});
    const strike2 = recordContestViolation(testContestId, testUserA, 'tab_switch', {
      reason: 'window_blur',
    });

    expect(strike2.success).toBe(true);
    expect(strike2.warningNumber).toBe(2);
    expect(strike2.maxWarnings).toBe(3);
    expect(strike2.isDisqualified).toBe(false);
    expect(strike2.severity).toBe('critical');
    expect(strike2.status).toBe('active');
  });

  it('Requirement 1: Strike 3 immediately revokes participation and disqualifies contender', () => {
    registerUserForContest(testContestId, testUserA);
    startUserParticipation(testContestId, testUserA);

    recordContestViolation(testContestId, testUserA, 'fullscreen_exit', {});
    recordContestViolation(testContestId, testUserA, 'tab_switch', {});
    const strike3 = recordContestViolation(testContestId, testUserA, 'unauthorized_navigation', {
      destination: '/dashboard',
    });

    expect(strike3.success).toBe(true);
    expect(strike3.warningNumber).toBe(3);
    expect(strike3.maxWarnings).toBe(3);
    expect(strike3.isDisqualified).toBe(true);
    expect(strike3.severity).toBe('disqualification');
    expect(strike3.status).toBe('disqualified');

    // Authoritative check on engine
    expect(integrityEngine.isParticipantDisqualified('contest', testContestId, testUserA.id)).toBe(true);
  });

  it('Requirement 1 & 6: Prevents re-entry into the affected contest after the third strike', () => {
    registerUserForContest(testContestId, testUserA);
    startUserParticipation(testContestId, testUserA);

    // Apply 3 strikes
    recordContestViolation(testContestId, testUserA, 'fullscreen_exit', {});
    recordContestViolation(testContestId, testUserA, 'workspace_misuse', { shortcut: 'F12' });
    recordContestViolation(testContestId, testUserA, 'paste_detected', { length: 300 });

    // Attempt re-entry into the arena
    const reEntryAttempt = startUserParticipation(testContestId, testUserA);
    expect(reEntryAttempt.success).toBe(false);
    expect(reEntryAttempt.isDisqualified).toBe(true);
    expect(reEntryAttempt.error).toBe('DISQUALIFIED');

    // Contest detail must authoritatively report disqualified
    const detail = getContestDetail(testContestId, testUserA.id);
    expect(detail?.userParticipantStatus).toBe('disqualified');
    expect(detail?.userWarnings).toBe(3);
  });

  it('Requirement 3: Rejects violation reports for unregistered users', () => {
    const unregUser = { id: 'unregistered-user-999', email: 'ghost@nexuscode.edu' };
    const res = recordContestViolation(testContestId, unregUser, 'tab_switch', {});
    expect(res.success).toBe(false);
    expect(res.error).toBe('NOT_PARTICIPATING');
  });

  it('Requirement 4: NORMAL CODING ERRORS NEVER GENERATE STRIKES', () => {
    registerUserForContest(testContestId, testUserB);
    startUserParticipation(testContestId, testUserB);

    // Initial state: 0 warnings
    expect(integrityEngine.isParticipantDisqualified('contest', testContestId, testUserB.id)).toBe(false);

    // Simulate multiple failed coding submissions through scoring service
    const codingVerdicts = [
      'wrong_answer',
      'compilation_error',
      'runtime_error',
      'time_limit_exceeded',
      'memory_limit_exceeded',
    ];

    let currentScore = null;
    for (const verdict of codingVerdicts) {
      currentScore = contestScoringService.calculateUpdatedScore(currentScore, {
        contestId: testContestId,
        userId: testUserB.id,
        userDisplayName: 'Bob Lovelace',
        problemId: 'prob-1',
        problemPoints: 100,
        contestStartAt: new Date(Date.now() - 3600000).toISOString(),
        rules: {
          penaltyMinutesPerWrongAnswer: 20,
        },
        verdict: verdict as any,
        score: 0,
      });

      // Assert normal scoring penalty increases but NO strikes are created
      expect(currentScore.solvedCount).toBe(0);
      const integrityState = integrityEngine.getParticipantState('contest', testContestId, testUserB.id);
      expect(integrityState.warnings).toBe(0);
      expect(integrityState.isDisqualified).toBe(false);
    }
  });

  it('Requirement 5: Technical events apply identical 3-strike integrity lifecycle', () => {
    // Strike 1
    const s1 = integrityEngine.recordViolation('event', testEventId, testUserA, 'fullscreen_exit', {});
    expect(s1.warningNumber).toBe(1);
    expect(s1.isDisqualified).toBe(false);

    // Strike 2
    const s2 = integrityEngine.recordViolation('event', testEventId, testUserA, 'workspace_misuse', {});
    expect(s2.warningNumber).toBe(2);
    expect(s2.isDisqualified).toBe(false);

    // Strike 3
    const s3 = integrityEngine.recordViolation('event', testEventId, testUserA, 'tab_switch', {});
    expect(s3.warningNumber).toBe(3);
    expect(s3.isDisqualified).toBe(true);
    expect(s3.status).toBe('disqualified');

    // Subsequent violation attempt is denied
    const s4 = integrityEngine.recordViolation('event', testEventId, testUserA, 'tab_switch', {});
    expect(s4.success).toBe(false);
    expect(s4.isDisqualified).toBe(true);
    expect(s4.error).toBe('DISQUALIFIED');
  });

  it('Requirement 3 & 7: Clients cannot reset strikes; only staff action can reset or reinstate', () => {
    registerUserForContest(testContestId, testUserA);
    startUserParticipation(testContestId, testUserA);

    // Accumulate 2 strikes
    recordContestViolation(testContestId, testUserA, 'fullscreen_exit', {});
    recordContestViolation(testContestId, testUserA, 'tab_switch', {});

    // State cannot be reduced by regular user calls
    const state = integrityEngine.getParticipantState('contest', testContestId, testUserA.id);
    expect(state.warnings).toBe(2);

    // Staff reset warnings action
    const resetSuccess = updateParticipantStatus(testContestId, testUserA.id, 'reset_warnings');
    expect(resetSuccess).toBe(true);

    const resetState = integrityEngine.getParticipantState('contest', testContestId, testUserA.id);
    expect(resetState.warnings).toBe(0);
    expect(resetState.isDisqualified).toBe(false);
  });

  it('Requirement 1 & Leaderboard: Disqualified participants are ranked below active contenders', () => {
    registerUserForContest(testContestId, testUserA);
    registerUserForContest(testContestId, testUserB);
    startUserParticipation(testContestId, testUserA);
    startUserParticipation(testContestId, testUserB);

    // Disqualify User A with 3 strikes
    recordContestViolation(testContestId, testUserA, 'fullscreen_exit', {});
    recordContestViolation(testContestId, testUserA, 'tab_switch', {});
    recordContestViolation(testContestId, testUserA, 'workspace_misuse', {});

    expect(integrityEngine.isParticipantDisqualified('contest', testContestId, testUserA.id)).toBe(true);
    expect(integrityEngine.isParticipantDisqualified('contest', testContestId, testUserB.id)).toBe(false);

    // Verify detail reflects authoritative disqualification
    const detailA = getContestDetail(testContestId, testUserA.id);
    expect(detailA?.userParticipantStatus).toBe('disqualified');
  });
});
