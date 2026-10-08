/**
 * Technical Events Client Service
 *
 * Provides API communication for event CRUD, lifecycle management,
 * registration, live workspace participation, proctoring integrity,
 * and certification issuance.
 */

import { getSupabaseClient } from '@/src/services/supabase';
import type { ViolationType, EventType } from '@/src/types/database';

async function resolveToken(token?: string): Promise<string | undefined> {
  if (token) return token;
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return data.session?.access_token || undefined;
  } catch {
    return undefined;
  }
}

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  category: string;
  description: string | null;
  startAt: string;
  endAt: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'draft' | 'published' | 'registration_open' | 'live' | 'ended' | 'completed';
  location?: string;
  capacity?: number;
  isTechnical: boolean;
  rules: {
    maxWarnings: number;
    enableProctoring: boolean;
    requireFullscreen: boolean;
    allowedLanguages?: string[];
    certificateEligible: boolean;
  };
  problems: Array<{
    problemId: string;
    slug: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    orderIndex: number;
  }>;
  registeredCount: number;
  isRegistered?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participant?: {
    status: 'registered' | 'attended' | 'completed' | 'disqualified' | 'cancelled';
    warnings: number;
    score: number;
    solvedCount: number;
    certificateIssued?: boolean;
  } | null;
}

export interface EventCertificate {
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

export interface EventViolationResponse {
  success: boolean;
  warningNumber: number;
  maxWarnings: number;
  isDisqualified: boolean;
  status: string;
  message: string;
}

export const eventService = {
  /**
   * Lists all eligible events
   */
  async getEvents(token?: string): Promise<EventItem[]> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/events', { headers });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Fetches single event detail
   */
  async getEventDetail(id: string, token?: string): Promise<EventItem | null> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${id}`, { headers });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Creates a new event (Coordinator & Admin)
   */
  async createEvent(payload: Partial<EventItem>, token?: string): Promise<{ event: EventItem | null; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { event: null, error: data.error || 'Failed to create event.' };
      }
      return { event: data };
    } catch (err: unknown) {
      return { event: null, error: (err as Error).message };
    }
  },

  /**
   * Updates an existing event (Coordinator & Admin)
   */
  async updateEvent(id: string, payload: Partial<EventItem>, token?: string): Promise<{ event: EventItem | null; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { event: null, error: data.error || 'Failed to update event.' };
      }
      return { event: data };
    } catch (err: unknown) {
      return { event: null, error: (err as Error).message };
    }
  },

  /**
   * Permanently deletes an event (Admin ONLY)
   */
  async deleteEvent(id: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete event.' };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Registers student for an event
   */
  async registerForEvent(id: string, token?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register.' };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Enters live technical workspace
   */
  async startParticipation(
    eventId: string,
    token?: string
  ): Promise<{ success: boolean; isDisqualified?: boolean; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${eventId}/start`, {
        method: 'POST',
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          isDisqualified: data.isDisqualified || res.status === 403,
          error: data.message || data.error || 'Failed to start event participation.',
        };
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Reports an integrity violation
   */
  async recordViolation(
    eventId: string,
    type: ViolationType,
    evidence: Record<string, unknown> = {},
    token?: string
  ): Promise<{ data: EventViolationResponse | null; error: string | null }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${eventId}/violations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, evidence }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 400 && res.status !== 403) {
        return { data: null, error: data.message || 'Failed to record violation' };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: (err as Error).message };
    }
  },

  /**
   * Fetches participant warning status
   */
  async getParticipantStatus(
    eventId: string,
    token?: string
  ): Promise<{ warnings: number; isDisqualified: boolean; status: string; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${eventId}/participant-status`, {
        headers,
      });

      if (!res.ok) {
        return { warnings: 0, isDisqualified: false, status: 'unregistered', error: 'Failed to fetch status' };
      }

      return await res.json();
    } catch (err: unknown) {
      return { warnings: 0, isDisqualified: false, status: 'unregistered', error: (err as Error).message };
    }
  },

  /**
   * Completes event and issues certificates (Coordinator & Admin)
   */
  async completeEvent(id: string, token?: string): Promise<{ success: boolean; certificatesCount?: number; error?: string }> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${id}/complete`, {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to complete event.' };
      }
      return { success: true, certificatesCount: data.certificatesCount };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  /**
   * Fetches completed event standings
   */
  async getEventResults(id: string): Promise<{ event: EventItem | null; results: any[] }> {
    try {
      const res = await fetch(`/api/events/${id}/results`);
      if (!res.ok) return { event: null, results: [] };
      return await res.json();
    } catch {
      return { event: null, results: [] };
    }
  },

  /**
   * Gets user's earned certificates
   */
  async getUserCertificates(token?: string): Promise<EventCertificate[]> {
    try {
      const authToken = await resolveToken(token);
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/certificates', {
        headers,
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};
