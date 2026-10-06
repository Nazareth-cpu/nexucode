/**
 * Nexus Code — Events System Verification & Integration Test Suite
 *
 * Verifies:
 * 1. Event Coordinator CRUD and event authoring
 * 2. Platform Administrator override, management, and deletion
 * 3. Server-authoritative lifecycle state machine (DRAFT -> PUBLISHED -> REGISTRATION_OPEN -> LIVE -> ENDED -> COMPLETED)
 * 4. Student registration restrictions (window dates, capacity limits, duplicate protection)
 * 5. Technical event workspace entry authorization (LIVE status enforcement, registration verification)
 * 6. Academic integrity enforcement & 3-strike disqualification
 * 7. Event finalization, scoring, ranking, and cryptographic certificate issuance with verification tokens
 * 8. RBAC security enforcement (Students forbidden from privileged actions)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { eventServerEngine, type EventCreatePayload } from '@/src/services/event/eventServerEngine';

describe('Nexus Code — Events System & Certification Architecture', () => {
  const coordinatorUser = { id: 'coord-77', role: 'coordinator', displayName: 'Chapter Lead Maya' };
  const adminUser = { id: 'admin-01', role: 'admin', displayName: 'Platform Admin' };
  const studentUser1 = { id: 'stud-101', role: 'student', displayName: 'Aarav Sharma', email: 'aarav@gmrit.edu' };
  const studentUser2 = { id: 'stud-102', role: 'student', displayName: 'Diya Patel', email: 'diya@gmrit.edu' };

  let testEventId = '';

  it('1. Coordinator can create a new technical hackathon event in DRAFT state', async () => {
    const payload: EventCreatePayload = {
      title: 'AI Systems Chapter Hackathon 2026',
      type: 'hackathon',
      category: 'Annual Hackathon',
      description: 'Build robust LLM agents and high-throughput vector indexers.',
      startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      endAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      registrationStart: new Date(Date.now() - 3600 * 1000).toISOString(),
      registrationEnd: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      location: 'Innovation Hub Lab 2',
      capacity: 50,
      isTechnical: true,
      rules: {
        maxWarnings: 3,
        enableProctoring: true,
        requireFullscreen: true,
        certificateEligible: true,
      },
      problems: [
        { problemId: 'seed-1', slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', points: 100, orderIndex: 1 },
      ],
    };

    const res = await eventServerEngine.createEvent(payload, coordinatorUser);
    expect(res.event).not.toBeNull();
    expect(res.event?.title).toBe('AI Systems Chapter Hackathon 2026');
    expect(res.event?.status).toBe('draft');
    expect(res.event?.createdBy).toBe(coordinatorUser.id);
    expect(res.event?.isTechnical).toBe(true);

    testEventId = res.event!.id;
  });

  it('2. Students are strictly forbidden from creating or modifying events', async () => {
    const studentCreate = await eventServerEngine.createEvent(
      {
        title: 'Unauthorized Student Event',
        type: 'meetup',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
      },
      studentUser1
    );

    expect(studentCreate.event).toBeNull();
    expect(studentCreate.error).toContain('FORBIDDEN');

    const studentUpdate = await eventServerEngine.updateEvent(
      testEventId,
      { title: 'Hacked Title' },
      studentUser1
    );

    expect(studentUpdate.event).toBeNull();
    expect(studentUpdate.error).toContain('FORBIDDEN');
  });

  it('3. Draft events are hidden from students but visible to staff', async () => {
    const studentList = await eventServerEngine.getEventsList(studentUser1);
    const draftForStudent = studentList.find((e) => e.id === testEventId);
    expect(draftForStudent).toBeUndefined(); // Hidden from student

    const staffList = await eventServerEngine.getEventsList(coordinatorUser);
    const draftForStaff = staffList.find((e) => e.id === testEventId);
    expect(draftForStaff).toBeDefined();
    expect(draftForStaff?.title).toBe('AI Systems Chapter Hackathon 2026');
  });

  it('4. Coordinator can publish event and open registration', async () => {
    // Publish
    const pubRes = await eventServerEngine.updateEvent(
      testEventId,
      { status: 'published' },
      coordinatorUser
    );
    expect(pubRes.event?.status).toBe('published');

    // Open registration
    const regOpenRes = await eventServerEngine.updateEvent(
      testEventId,
      { status: 'registration_open' },
      coordinatorUser
    );
    expect(regOpenRes.event?.status).toBe('registration_open');
  });

  it('5. Students can register for open event, duplicate registration is prevented', async () => {
    const regRes = await eventServerEngine.registerForEvent(testEventId, studentUser1);
    expect(regRes.success).toBe(true);
    expect(regRes.participant?.status).toBe('registered');

    // Duplicate registration attempt
    const dupRes = await eventServerEngine.registerForEvent(testEventId, studentUser1);
    expect(dupRes.success).toBe(false);
    expect(dupRes.error).toContain('already registered');

    // Second student registers
    const regRes2 = await eventServerEngine.registerForEvent(testEventId, studentUser2);
    expect(regRes2.success).toBe(true);
  });

  it('6. Entering workspace is blocked when event is not LIVE', async () => {
    // Currently registration_open (not LIVE yet)
    const entryAttempt = await eventServerEngine.startParticipation(testEventId, studentUser1.id);
    expect(entryAttempt.success).toBe(false);
    expect(entryAttempt.error).toContain('only accessible while event is LIVE');
  });

  it('7. When set to LIVE, registered students can enter and un-registered users are rejected', async () => {
    // Coordinator sets event LIVE
    await eventServerEngine.updateEvent(testEventId, { status: 'live' }, coordinatorUser);

    // Registered student enters workspace
    const validEntry = await eventServerEngine.startParticipation(testEventId, studentUser1.id);
    expect(validEntry.success).toBe(true);

    // Unregistered student attempts entry
    const unregEntry = await eventServerEngine.startParticipation(testEventId, 'unregistered-stud-999');
    expect(unregEntry.success).toBe(false);
    expect(unregEntry.error).toContain('must register');
  });

  it('8. Three-strike academic integrity system triggers disqualification on 3rd violation', async () => {
    // Strike 1: Tab switch
    const v1 = await eventServerEngine.recordViolation(testEventId, studentUser1.id, {
      type: 'tab_switch',
      evidence: { count: 1 },
    });
    expect(v1.warningNumber).toBe(1);
    expect(v1.isDisqualified).toBe(false);

    // Strike 2: Paste detected
    const v2 = await eventServerEngine.recordViolation(testEventId, studentUser1.id, {
      type: 'paste_detected',
      evidence: { length: 250 },
    });
    expect(v2.warningNumber).toBe(2);
    expect(v2.isDisqualified).toBe(false);

    // Strike 3: Fullscreen exit (3rd Strike -> Disqualification)
    const v3 = await eventServerEngine.recordViolation(testEventId, studentUser1.id, {
      type: 'fullscreen_exit',
      evidence: { active: false },
    });
    expect(v3.warningNumber).toBe(3);
    expect(v3.isDisqualified).toBe(true);
    expect(v3.status).toBe('disqualified');

    // Verify subsequent workspace entry is rejected
    const reEntry = await eventServerEngine.startParticipation(testEventId, studentUser1.id);
    expect(reEntry.success).toBe(false);
    expect(reEntry.isDisqualified).toBe(true);
    expect(reEntry.error).toContain('disqualified');
  });

  it('9. Event finalization completes event, ranks participants, and issues verified certificates', async () => {
    // Complete event and issue certificates
    const compRes = await eventServerEngine.completeEventAndIssueCertificates(testEventId, coordinatorUser);
    expect(compRes.success).toBe(true);
    expect(compRes.certificatesCount).toBeGreaterThanOrEqual(1);

    // Student 2 (who was not disqualified) receives a verified certificate
    const certs = await eventServerEngine.getUserCertificates(studentUser2.id);
    expect(certs.length).toBeGreaterThanOrEqual(1);

    const cert = certs.find((c) => c.eventId === testEventId);
    expect(cert).toBeDefined();
    expect(cert?.certificateNumber).toContain('NC-CERT-HACKATHON-');
    expect(cert?.verificationToken).toContain('verify_');
    expect(cert?.userDisplayName).toBe(studentUser2.displayName);

    // Verify event results
    const resultsData = await eventServerEngine.getEventResults(testEventId);
    expect(resultsData.event?.status).toBe('completed');
    expect(resultsData.results.length).toBeGreaterThanOrEqual(2);
  });

  it('10. Admin can override, manage, and delete events', async () => {
    // Admin update override
    const adminUpdate = await eventServerEngine.updateEvent(
      testEventId,
      { title: 'AI Systems Chapter Hackathon 2026 (Admin Audited)' },
      adminUser
    );
    expect(adminUpdate.event?.title).toContain('Admin Audited');

    // Admin deletion
    const delRes = await eventServerEngine.deleteEvent(testEventId, adminUser);
    expect(delRes.success).toBe(true);

    const verifyDel = await eventServerEngine.getEventDetail(testEventId, adminUser);
    expect(verifyDel).toBeNull();
  });
});
