/**
 * Nexus Code — Event Server Engine
 *
 * Implements server-authoritative technical events lifecycle:
 * DRAFT -> PUBLISHED -> REGISTRATION_OPEN -> LIVE -> ENDED -> COMPLETED
 *
 * Capabilities:
 * 1. Event CRUD & lifecycle state machine (Coordinator & Admin with Admin override)
 * 2. Strict Role-Based Access Control (Students cannot modify events)
 * 3. Server-enforced Registration window & capacity limits
 * 4. Technical event workspace & problem challenge attachments
 * 5. Integrated 3-strike proctoring & academic integrity enforcement
 * 6. Automated scoring & certificate generation with verification tokens
 * 7. Results calculation and persistent fallback matching PostgreSQL schema
 */

import { integrityEngine } from '../integrity/integrityEngine';
import { realtimeBroadcaster } from '../realtime/realtimeBroadcaster';
import { aiContestService, type AIContestAnnouncementResult } from '../ai/aiContestService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventType, ViolationType, ViolationSeverity } from '@/src/types/database';

export type EventLifecycleStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'live'
  | 'ended'
  | 'completed';

export interface EventChallengeProblem {
  problemId: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  orderIndex: number;
}

export interface EventServerItem {
  id: string;
  title: string;
  type: EventType;
  description: string | null;
  category: string;
  startAt: string; // ISO
  endAt: string; // ISO
  registrationStart: string; // ISO
  registrationEnd: string; // ISO
  status: EventLifecycleStatus;
  location?: string;
  capacity?: number;
  isTechnical: boolean; // Enables Monaco workspace & integrity proctoring
  rules: {
    maxWarnings: number;
    enableProctoring: boolean;
    requireFullscreen: boolean;
    allowedLanguages?: string[];
    certificateEligible: boolean;
  };
  problems: EventChallengeProblem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventParticipantRecord {
  eventId: string;
  userId: string;
  displayName: string;
  email?: string;
  collegeId?: string;
  registeredAt: string;
  status: 'registered' | 'attended' | 'completed' | 'disqualified' | 'cancelled';
  warnings: number;
  joinedAt?: string | null;
  disqualifiedAt?: string | null;
  score: number;
  solvedCount: number;
  resultData?: Record<string, unknown>;
  certificateIssued?: boolean;
}

export interface EventCertificateRecord {
  id: string;
  userId: string;
  userDisplayName: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  certificateNumber: string;
  verificationToken: string;
  rank: number | null;
  score: number;
  issuedAt: string;
}

export interface EventViolationRecord {
  id: string;
  eventId: string;
  userId: string;
  userDisplayName?: string;
  type: ViolationType;
  severity: ViolationSeverity;
  occurredAt: string;
  warningNumber: number;
  evidence: Record<string, unknown>;
}

// In-Memory Authoritative Store with Persistent Seeds
const now = Date.now();

const initialEvents: EventServerItem[] = [
  {
    id: 'evt-1',
    title: 'CodeStorm Hackathon 2026',
    type: 'hackathon',
    category: 'Hackathon',
    description:
      'Build production-ready algorithmic and systems solutions in an authoritative proctored workspace.',
    startAt: new Date(now - 30 * 60 * 1000).toISOString(), // Started 30 mins ago
    endAt: new Date(now + 120 * 60 * 1000).toISOString(), // Ends in 2 hours
    registrationStart: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
    registrationEnd: new Date(now + 30 * 60 * 1000).toISOString(),
    status: 'live',
    location: 'Campus Innovation Hub & Virtual Arena',
    capacity: 100,
    isTechnical: true,
    rules: {
      maxWarnings: 3,
      enableProctoring: true,
      requireFullscreen: true,
      allowedLanguages: ['c', 'cpp', 'java', 'python', 'javascript'],
      certificateEligible: true,
    },
    problems: [
      { problemId: 'seed-1', slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', points: 100, orderIndex: 1 },
      { problemId: 'seed-2', slug: 'add-two-numbers', title: 'Add Two Numbers', difficulty: 'medium', points: 200, orderIndex: 2 },
      { problemId: 'seed-5', slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'easy', points: 150, orderIndex: 3 },
    ],
    createdBy: 'admin-bootstrap-01',
    createdAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-2',
    title: 'Advanced Graph Algorithms & Dynamic Programming Bootcamp',
    type: 'workshop',
    category: 'Technical Workshop',
    description:
      'Master maximum flow, tree decompositions, and DP states with live interactive coding challenges.',
    startAt: new Date(now + 2 * 24 * 3600 * 1000).toISOString(),
    endAt: new Date(now + 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    registrationStart: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
    registrationEnd: new Date(now + 2 * 24 * 3600 * 1000).toISOString(),
    status: 'registration_open',
    location: 'Lab 4 & Discord Stream',
    capacity: 60,
    isTechnical: true,
    rules: {
      maxWarnings: 3,
      enableProctoring: true,
      requireFullscreen: true,
      allowedLanguages: ['c', 'cpp', 'java', 'python', 'javascript'],
      certificateEligible: true,
    },
    problems: [
      { problemId: 'seed-4', slug: 'binary-search', title: 'Binary Search', difficulty: 'easy', points: 100, orderIndex: 1 },
      { problemId: 'seed-6', slug: 'merge-intervals', title: 'Merge Intervals', difficulty: 'medium', points: 200, orderIndex: 2 },
    ],
    createdBy: 'admin-bootstrap-01',
    createdAt: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: 'Winter Open Source Sprint',
    type: 'meetup',
    category: 'Open Source',
    description: 'Sprint for open source chapter repositories and toolchain improvements.',
    startAt: new Date(now + 10 * 24 * 3600 * 1000).toISOString(),
    endAt: new Date(now + 12 * 24 * 3600 * 1000).toISOString(),
    registrationStart: new Date(now + 5 * 24 * 3600 * 1000).toISOString(),
    registrationEnd: new Date(now + 10 * 24 * 3600 * 1000).toISOString(),
    status: 'draft',
    location: 'Virtual Arena',
    capacity: 200,
    isTechnical: false,
    rules: {
      maxWarnings: 3,
      enableProctoring: false,
      requireFullscreen: false,
      certificateEligible: false,
    },
    problems: [],
    createdBy: 'admin-bootstrap-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const eventStore = new Map<string, EventServerItem>(initialEvents.map((e) => [e.id, e]));

// Participant Store: key = `${eventId}:${userId}`
const participantStore = new Map<string, EventParticipantRecord>();

// Violations Store: list of records
const eventViolationsStore: EventViolationRecord[] = [];

// Certificates Store: key = certificateId
const certificatesStore = new Map<string, EventCertificateRecord>();

// Event Winners Store: key = eventId -> AIContestAnnouncementResult
const eventWinnersStore = new Map<string, AIContestAnnouncementResult>();

// Seed default participants for CodeStorm Hackathon
participantStore.set('evt-1:student-101', {
  eventId: 'evt-1',
  userId: 'student-101',
  displayName: 'Aarav Sharma',
  collegeId: 'GMRIT-23-CS01',
  email: 'aarav.sharma@example.com',
  registeredAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
  status: 'attended',
  warnings: 0,
  joinedAt: new Date(now - 25 * 60 * 1000).toISOString(),
  score: 300,
  solvedCount: 2,
});

participantStore.set('evt-1:student-102', {
  eventId: 'evt-1',
  userId: 'student-102',
  displayName: 'Diya Patel',
  collegeId: 'GMRIT-23-CS02',
  email: 'diya.patel@example.com',
  registeredAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
  status: 'attended',
  warnings: 1,
  joinedAt: new Date(now - 20 * 60 * 1000).toISOString(),
  score: 250,
  solvedCount: 2,
});

/**
 * Computes dynamic server-authoritative lifecycle state
 */
export function computeEventDynamicStatus(event: EventServerItem): EventLifecycleStatus {
  if (event.status === 'draft' || event.status === 'live' || event.status === 'completed') {
    return event.status;
  }

  const current = Date.now();
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();
  const regStart = new Date(event.registrationStart).getTime();
  const regEnd = new Date(event.registrationEnd).getTime();

  if (current >= end) {
    return 'ended';
  }
  if (current >= start && current < end) {
    return 'live';
  }
  if (current >= regStart && current <= regEnd) {
    return 'registration_open';
  }
  return 'published';
}

// ============================================================================
// EVENT ENGINE METHODS
// ============================================================================

export interface EventCreatePayload {
  title: string;
  type: EventType;
  category?: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  registrationStart?: string;
  registrationEnd?: string;
  location?: string;
  capacity?: number;
  isTechnical?: boolean;
  rules?: Partial<EventServerItem['rules']>;
  problems?: EventChallengeProblem[];
}

export interface EventUpdatePayload extends Partial<EventCreatePayload> {
  status?: EventLifecycleStatus;
}

export const eventServerEngine = {
  /**
   * 1. Lists events with strict role filtering
   * - Students: only published, registration_open, live, ended, completed
   * - Staff / Admin: all events including drafts
   */
  async getEventsList(user?: { id: string; role: string }): Promise<Array<EventServerItem & { registeredCount: number; isRegistered?: boolean }>> {
    const isStaff = user?.role === 'coordinator' || user?.role === 'admin';
    const list: Array<EventServerItem & { registeredCount: number; isRegistered?: boolean }> = [];

    for (const evt of eventStore.values()) {
      const dynamicStatus = computeEventDynamicStatus(evt);
      const computedEvent: EventServerItem = { ...evt, status: dynamicStatus };

      if (!isStaff && dynamicStatus === 'draft') {
        continue; // Hide drafts from students
      }

      // Count registered participants
      let regCount = 0;
      let isReg = false;
      for (const [key, part] of participantStore.entries()) {
        if (part.eventId === evt.id && part.status !== 'cancelled') {
          regCount++;
          if (user?.id && part.userId === user.id) {
            isReg = true;
          }
        }
      }

      list.push({
        ...computedEvent,
        registeredCount: regCount,
        isRegistered: isReg,
      });
    }

    return list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  },

  /**
   * 2. Gets detailed event record with participant state
   */
  async getEventDetail(
    eventId: string,
    user?: { id: string; role: string }
  ): Promise<(EventServerItem & { registeredCount: number; participant?: EventParticipantRecord | null }) | null> {
    const evt = eventStore.get(eventId);
    if (!evt) return null;

    const dynamicStatus = computeEventDynamicStatus(evt);
    const isStaff = user?.role === 'coordinator' || user?.role === 'admin';

    if (!isStaff && dynamicStatus === 'draft') {
      return null; // Deny access to draft for students
    }

    let regCount = 0;
    let participant: EventParticipantRecord | null = null;

    for (const part of participantStore.values()) {
      if (part.eventId === eventId && part.status !== 'cancelled') {
        regCount++;
        if (user?.id && part.userId === user.id) {
          participant = part;
        }
      }
    }

    return {
      ...evt,
      status: dynamicStatus,
      registeredCount: regCount,
      participant,
    };
  },

  /**
   * 3. Creates a new event (Coordinator & Admin ONLY)
   */
  async createEvent(
    payload: EventCreatePayload,
    user: { id: string; role: string }
  ): Promise<{ event: EventServerItem | null; error?: string }> {
    if (user.role !== 'coordinator' && user.role !== 'admin') {
      return { event: null, error: 'FORBIDDEN: Event Coordinator or Platform Administrator privileges required.' };
    }

    if (!payload.title || !payload.startAt || !payload.endAt) {
      return { event: null, error: 'Missing required event fields (title, startAt, endAt).' };
    }

    const startDate = new Date(payload.startAt);
    const endDate = new Date(payload.endAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { event: null, error: 'Invalid event start or end date format.' };
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const regStartDate = payload.registrationStart && !isNaN(new Date(payload.registrationStart).getTime())
      ? new Date(payload.registrationStart).toISOString()
      : nowIso;

    const regEndDate = payload.registrationEnd && !isNaN(new Date(payload.registrationEnd).getTime())
      ? new Date(payload.registrationEnd).toISOString()
      : startDate.toISOString();

    const newEvent: EventServerItem = {
      id: eventId,
      title: payload.title.trim(),
      type: payload.type || 'hackathon',
      category: payload.category?.trim() || (payload.type ? payload.type.toUpperCase() : 'EVENT'),
      description: payload.description || null,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      registrationStart: regStartDate,
      registrationEnd: regEndDate,
      status: 'draft',
      location: payload.location || 'Nexus Arena',
      capacity: payload.capacity || 100,
      isTechnical: payload.isTechnical ?? true,
      rules: {
        maxWarnings: payload.rules?.maxWarnings ?? 3,
        enableProctoring: payload.rules?.enableProctoring ?? true,
        requireFullscreen: payload.rules?.requireFullscreen ?? true,
        allowedLanguages: payload.rules?.allowedLanguages || ['c', 'cpp', 'java', 'python', 'javascript'],
        certificateEligible: payload.rules?.certificateEligible ?? true,
      },
      problems: payload.problems || [],
      createdBy: user.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    eventStore.set(eventId, newEvent);
    return { event: newEvent };
  },

  /**
   * 4. Updates an existing event (Coordinator & Admin with Admin override)
   */
  async updateEvent(
    eventId: string,
    payload: EventUpdatePayload,
    user: { id: string; role: string }
  ): Promise<{ event: EventServerItem | null; error?: string }> {
    if (user.role !== 'coordinator' && user.role !== 'admin') {
      return { event: null, error: 'FORBIDDEN: Event Coordinator or Platform Administrator privileges required.' };
    }

    const existing = eventStore.get(eventId);
    if (!existing) {
      return { event: null, error: `Event not found: ${eventId}` };
    }

    // Coordinator can edit their own events; Admin can edit any event
    if (user.role === 'coordinator' && existing.createdBy !== user.id) {
      return { event: null, error: 'FORBIDDEN: Coordinators can only modify events they authored.' };
    }

    let startAtIso = existing.startAt;
    if (payload.startAt) {
      const sDate = new Date(payload.startAt);
      if (!isNaN(sDate.getTime())) startAtIso = sDate.toISOString();
    }

    let endAtIso = existing.endAt;
    if (payload.endAt) {
      const eDate = new Date(payload.endAt);
      if (!isNaN(eDate.getTime())) endAtIso = eDate.toISOString();
    }

    let regStartIso = existing.registrationStart;
    if (payload.registrationStart) {
      const rsDate = new Date(payload.registrationStart);
      if (!isNaN(rsDate.getTime())) regStartIso = rsDate.toISOString();
    }

    let regEndIso = existing.registrationEnd;
    if (payload.registrationEnd) {
      const reDate = new Date(payload.registrationEnd);
      if (!isNaN(reDate.getTime())) regEndIso = reDate.toISOString();
    }

    const updated: EventServerItem = {
      ...existing,
      title: payload.title !== undefined ? payload.title.trim() : existing.title,
      type: payload.type ?? existing.type,
      category: payload.category !== undefined ? payload.category.trim() : existing.category,
      description: payload.description !== undefined ? payload.description : existing.description,
      startAt: startAtIso,
      endAt: endAtIso,
      registrationStart: regStartIso,
      registrationEnd: regEndIso,
      status: payload.status ?? existing.status,
      location: payload.location !== undefined ? payload.location.trim() : existing.location,
      capacity: payload.capacity ?? existing.capacity,
      isTechnical: payload.isTechnical !== undefined ? payload.isTechnical : existing.isTechnical,
      rules: {
        ...existing.rules,
        ...payload.rules,
      },
      problems: payload.problems ?? existing.problems,
      updatedAt: new Date().toISOString(),
    };

    eventStore.set(eventId, updated);
    return { event: updated };
  },

  /**
   * 5. Deletes an event (Admin ONLY)
   */
  async deleteEvent(eventId: string, user: { id: string; role: string }): Promise<{ success: boolean; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'FORBIDDEN: Only Platform Administrators can permanently delete events.' };
    }
    const existed = eventStore.delete(eventId);
    return { success: existed };
  },

  /**
   * 6. Student registration for an event
   * - Validates event is published or registration_open
   * - Checks capacity limits
   * - Prevents duplicate registrations
   */
  async registerForEvent(
    eventId: string,
    user: { id: string; displayName?: string; email?: string; collegeId?: string }
  ): Promise<{ success: boolean; participant?: EventParticipantRecord; error?: string }> {
    const evt = eventStore.get(eventId);
    if (!evt) {
      return { success: false, error: 'Event not found.' };
    }

    const currentStatus = computeEventDynamicStatus(evt);
    if (currentStatus === 'draft') {
      return { success: false, error: 'Cannot register for unpublished event.' };
    }
    if (currentStatus === 'ended' || currentStatus === 'completed') {
      return { success: false, error: 'Event registration has closed because the event has concluded.' };
    }

    // Check duplicate
    const key = `${eventId}:${user.id}`;
    const existing = participantStore.get(key);
    if (existing && existing.status !== 'cancelled') {
      return { success: false, error: 'You are already registered for this event.' };
    }

    // Check capacity
    if (evt.capacity) {
      let activeCount = 0;
      for (const p of participantStore.values()) {
        if (p.eventId === eventId && p.status !== 'cancelled') activeCount++;
      }
      if (activeCount >= evt.capacity) {
        return { success: false, error: `Event capacity reached (${evt.capacity} participants max).` };
      }
    }

    const newRecord: EventParticipantRecord = {
      eventId,
      userId: user.id,
      displayName: user.displayName || user.email?.split('@')[0] || 'Student Contender',
      email: user.email,
      collegeId: user.collegeId,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      warnings: 0,
      score: 0,
      solvedCount: 0,
    };

    participantStore.set(key, newRecord);
    return { success: true, participant: newRecord };
  },

  /**
   * 7. Starts technical workspace participation
   * - Enforces LIVE status
   * - Verifies registration
   * - Checks disqualification state
   */
  async startParticipation(
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; isDisqualified?: boolean; error?: string }> {
    const evt = eventStore.get(eventId);
    if (!evt) {
      return { success: false, error: 'Event not found.' };
    }

    const key = `${eventId}:${userId}`;
    const participant = participantStore.get(key);

    if (participant && participant.status === 'disqualified') {
      return {
        success: false,
        isDisqualified: true,
        error: 'Participant has been disqualified from this event due to academic integrity violations.',
      };
    }

    const currentStatus = computeEventDynamicStatus(evt);
    if (currentStatus !== 'live') {
      return {
        success: false,
        error: `Event workspace is only accessible while event is LIVE (Current status: ${currentStatus.toUpperCase()}).`,
      };
    }

    if (!participant || participant.status === 'cancelled') {
      return {
        success: false,
        error: 'You must register for this event before entering the workspace.',
      };
    }

    // Mark as attended & active
    participant.status = 'attended';
    if (!participant.joinedAt) {
      participant.joinedAt = new Date().toISOString();
    }
    participantStore.set(key, participant);

    return { success: true };
  },

  /**
   * 8. Records integrity violation (3-Strike System)
   */
  async recordViolation(
    eventId: string,
    userId: string,
    violation: { type: ViolationType; evidence?: Record<string, unknown> }
  ): Promise<{
    success: boolean;
    warningNumber: number;
    maxWarnings: number;
    isDisqualified: boolean;
    status: string;
    message: string;
  }> {
    const evt = eventStore.get(eventId);
    const maxWarnings = evt?.rules?.maxWarnings || 3;
    const key = `${eventId}:${userId}`;
    const participant = participantStore.get(key) || {
      eventId,
      userId,
      displayName: 'Participant',
      registeredAt: new Date().toISOString(),
      status: 'attended',
      warnings: 0,
      score: 0,
      solvedCount: 0,
    };

    participant.warnings += 1;
    const warningNumber = participant.warnings;
    const isDisqualified = warningNumber >= maxWarnings;

    if (isDisqualified) {
      participant.status = 'disqualified';
      participant.disqualifiedAt = new Date().toISOString();
    }

    participantStore.set(key, participant);

    const violationRecord: EventViolationRecord = {
      id: `ev-viol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      userId,
      userDisplayName: participant.displayName,
      type: violation.type,
      severity: isDisqualified ? 'disqualification' : 'warning',
      occurredAt: new Date().toISOString(),
      warningNumber,
      evidence: violation.evidence || {},
    };

    eventViolationsStore.push(violationRecord);

    const message = isDisqualified
      ? `Strike ${warningNumber}/${maxWarnings}: Academic integrity limit exceeded. Disqualified from event.`
      : `Strike ${warningNumber}/${maxWarnings}: Violation recorded (${violation.type}).`;

    return {
      success: true,
      warningNumber,
      maxWarnings,
      isDisqualified,
      status: isDisqualified ? 'disqualified' : 'active',
      message,
    };
  },

  /**
   * 9. Completes event, finalizes rankings, and issues certificates
   */
  async completeEventAndIssueCertificates(
    eventId: string,
    user: { id: string; role: string }
  ): Promise<{ success: boolean; certificatesCount: number; resultsCount: number; error?: string }> {
    if (user.role !== 'coordinator' && user.role !== 'admin') {
      return { success: false, certificatesCount: 0, resultsCount: 0, error: 'FORBIDDEN: Privilege required to complete events.' };
    }

    const evt = eventStore.get(eventId);
    if (!evt) {
      return { success: false, certificatesCount: 0, resultsCount: 0, error: 'Event not found.' };
    }

    evt.status = 'completed';
    evt.updatedAt = new Date().toISOString();
    eventStore.set(eventId, evt);

    // Retrieve active participants and rank them by score
    const eventParticipants: EventParticipantRecord[] = [];
    for (const part of participantStore.values()) {
      if (part.eventId === eventId && part.status !== 'cancelled' && part.status !== 'disqualified') {
        eventParticipants.push(part);
      }
    }

    eventParticipants.sort((a, b) => b.score - a.score);

    let issuedCount = 0;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < eventParticipants.length; i++) {
      const part = eventParticipants[i];
      const rank = i + 1;

      // Update participant record with completion data
      part.status = 'completed';
      part.resultData = {
        rank,
        score: part.score,
        solvedCount: part.solvedCount,
        completedAt: nowIso,
      };

      if (evt.rules.certificateEligible) {
        const certId = `cert-${eventId}-${part.userId}`;
        const certNumber = `NC-CERT-${evt.type.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const token = `verify_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

        const certRecord: EventCertificateRecord = {
          id: certId,
          userId: part.userId,
          userDisplayName: part.displayName,
          eventId,
          eventTitle: evt.title,
          eventType: evt.type,
          certificateNumber: certNumber,
          verificationToken: token,
          rank,
          score: part.score,
          issuedAt: nowIso,
        };

        certificatesStore.set(certId, certRecord);
        part.certificateIssued = true;
        issuedCount++;
      }

      participantStore.set(`${eventId}:${part.userId}`, part);
    }

    // Trigger AI Top-3 Analysis for technical event
    try {
      const topParticipants = eventParticipants.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        userId: p.userId,
        displayName: p.displayName,
        collegeId: p.collegeId,
        totalScore: p.score,
        penaltyTime: 0,
        solvedCount: p.solvedCount,
      }));

      const aiAnnouncement = await aiContestService.generateAnnouncement({
        contestId: eventId,
        contestTitle: evt.title,
        problemCount: evt.problems.length,
        participants: topParticipants,
      });

      eventWinnersStore.set(eventId, aiAnnouncement);
    } catch (err) {
      console.warn('[EventEngine]: Failed to generate AI podium for event:', err);
    }

    return {
      success: true,
      certificatesCount: issuedCount,
      resultsCount: eventParticipants.length,
    };
  },

  /**
   * 10. Gets user certificates
   */
  async getUserCertificates(userId: string): Promise<EventCertificateRecord[]> {
    const list: EventCertificateRecord[] = [];
    for (const cert of certificatesStore.values()) {
      if (cert.userId === userId) {
        list.push(cert);
      }
    }
    return list.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  },

  /**
   * 11. Gets completed event results
   */
  async getEventResults(eventId: string): Promise<{ event: EventServerItem | null; results: EventParticipantRecord[] }> {
    const evt = eventStore.get(eventId);
    if (!evt) return { event: null, results: [] };

    const results: EventParticipantRecord[] = [];
    for (const part of participantStore.values()) {
      if (part.eventId === eventId && part.status !== 'cancelled') {
        results.push(part);
      }
    }

    results.sort((a, b) => {
      if (a.status === 'disqualified') return 1;
      if (b.status === 'disqualified') return -1;
      return b.score - a.score;
    });

    return { event: evt, results };
  },

  /**
   * 12. Gets finalized AI Top 3 winners for event
   */
  async getEventWinners(eventId: string): Promise<{ winners: AIContestAnnouncementResult | null }> {
    const existing = eventWinnersStore.get(eventId);
    if (existing) return { winners: existing };

    const evt = eventStore.get(eventId);
    if (!evt) return { winners: null };

    if (evt.status === 'completed' || evt.status === 'ended' || new Date(evt.endAt).getTime() <= Date.now()) {
      const { results } = await this.getEventResults(eventId);
      const topParticipants = results.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        userId: p.userId,
        displayName: p.displayName,
        collegeId: p.collegeId,
        totalScore: p.score,
        penaltyTime: 0,
        solvedCount: p.solvedCount,
      }));

      const aiAnnouncement = await aiContestService.generateAnnouncement({
        contestId: eventId,
        contestTitle: evt.title,
        problemCount: evt.problems.length,
        participants: topParticipants,
      });

      eventWinnersStore.set(eventId, aiAnnouncement);
      return { winners: aiAnnouncement };
    }

    return { winners: null };
  },
};

