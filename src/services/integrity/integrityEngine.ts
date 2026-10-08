/**
 * Nexus Code — Server-Authoritative Integrity & Anti-Misuse Engine
 *
 * Enforces the strict 3-Strike System across Contests and Technical Events:
 * - Strike 1: Warning logged and displayed.
 * - Strike 2: Critical warning logged and displayed.
 * - Strike 3: Immediate revocation of participation, forceful removal from active workspace,
 *             and permanent denial of re-entry.
 *
 * Normal coding errors (Wrong Answer, TLE, Compilation Error) NEVER generate strikes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ViolationType, ViolationSeverity } from '@/src/types/database';
import { realtimeBroadcaster } from '../realtime/realtimeBroadcaster';

export interface IntegrityViolationRecord {
  id: string;
  scopeType: 'contest' | 'event';
  scopeId: string;
  userId: string;
  userDisplayName: string;
  type: ViolationType;
  severity: ViolationSeverity;
  occurredAt: string;
  warningNumber: number; // 1, 2, or 3
  maxWarnings: number;   // 3
  evidence: Record<string, unknown>;
}

export interface ParticipantIntegrityState {
  scopeType: 'contest' | 'event';
  scopeId: string;
  userId: string;
  displayName: string;
  email?: string;
  warnings: number;
  maxWarnings: number;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
  isDisqualified: boolean;
  joinedAt?: string | null;
  disqualifiedAt?: string | null;
}

export interface ViolationEvaluationResult {
  success: boolean;
  warningNumber: number;
  maxWarnings: number;
  isDisqualified: boolean;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
  severity: ViolationSeverity;
  message: string;
  violationRecord?: IntegrityViolationRecord;
  error?: string;
}

// In-Memory store keyed by `scopeType:scopeId:userId`
const participantIntegrityStore = new Map<string, ParticipantIntegrityState>();
// Violations log keyed by `scopeType:scopeId`
const violationsStore = new Map<string, IntegrityViolationRecord[]>();

const MAX_STRIKES = 3;

export class IntegrityEngine {
  private getKey(scopeType: 'contest' | 'event', scopeId: string, userId: string): string {
    return `${scopeType}:${scopeId}:${userId}`;
  }

  private getScopeKey(scopeType: 'contest' | 'event', scopeId: string): string {
    return `${scopeType}:${scopeId}`;
  }

  /**
   * Retrieves participant integrity state or initializes it if not found.
   */
  public getParticipantState(
    scopeType: 'contest' | 'event',
    scopeId: string,
    userId: string,
    userDisplayName?: string,
    email?: string
  ): ParticipantIntegrityState {
    const key = this.getKey(scopeType, scopeId, userId);
    let state = participantIntegrityStore.get(key);

    if (!state) {
      state = {
        scopeType,
        scopeId,
        userId,
        displayName: userDisplayName || 'Contender',
        email,
        warnings: 0,
        maxWarnings: MAX_STRIKES,
        status: 'active',
        isDisqualified: false,
        joinedAt: new Date().toISOString(),
      };
      participantIntegrityStore.set(key, state);
    }

    return state;
  }

  /**
   * Authoritative check: has participant been disqualified?
   */
  public isParticipantDisqualified(
    scopeType: 'contest' | 'event',
    scopeId: string,
    userId: string
  ): boolean {
    const key = this.getKey(scopeType, scopeId, userId);
    const state = participantIntegrityStore.get(key);
    return state ? state.isDisqualified || state.warnings >= MAX_STRIKES : false;
  }

  /**
   * Records a verified integrity rule violation and authoritatively increments strikes.
   * Strikes:
   * - Strike 1 -> warning
   * - Strike 2 -> critical warning
   * - Strike 3 -> immediate disqualification & revocation of participation
   */
  public recordViolation(
    scopeType: 'contest' | 'event',
    scopeId: string,
    user: { id: string; email?: string; user_metadata?: any },
    type: ViolationType,
    evidence: Record<string, unknown> = {},
    supabase?: SupabaseClient
  ): ViolationEvaluationResult {
    const key = this.getKey(scopeType, scopeId, user.id);
    const displayName =
      user.user_metadata?.display_name || user.email?.split('@')[0] || 'Contender';

    let state = participantIntegrityStore.get(key);
    if (!state) {
      state = this.getParticipantState(scopeType, scopeId, user.id, displayName, user.email);
    }

    // If already disqualified, immediately deny and reject
    if (state.isDisqualified || state.warnings >= MAX_STRIKES) {
      state.isDisqualified = true;
      state.status = 'disqualified';
      return {
        success: false,
        warningNumber: state.warnings,
        maxWarnings: MAX_STRIKES,
        isDisqualified: true,
        status: 'disqualified',
        severity: 'disqualification',
        message: 'Participation has been permanently revoked due to prior integrity strikes.',
        error: 'DISQUALIFIED',
      };
    }

    // Authoritative increment of strike counter
    state.warnings += 1;
    const warningNumber = state.warnings;
    const isDisqualified = warningNumber >= MAX_STRIKES;

    let severity: ViolationSeverity = 'warning';
    let message = `Strike ${warningNumber} of ${MAX_STRIKES}: Integrity violation logged (${type.replace('_', ' ')}).`;

    if (isDisqualified) {
      state.isDisqualified = true;
      state.status = 'disqualified';
      state.disqualifiedAt = new Date().toISOString();
      severity = 'disqualification';
      message = `Strike 3 of 3: Disqualification enforced. Active participation permanently revoked.`;
    } else if (warningNumber === 2) {
      severity = 'critical';
      message = `Strike 2 of 3: CRITICAL WARNING! A third infraction will result in immediate disqualification and workspace removal.`;
    }

    // Create immutable violation record
    const record: IntegrityViolationRecord = {
      id: `vio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scopeType,
      scopeId,
      userId: user.id,
      userDisplayName: displayName,
      type,
      severity,
      occurredAt: new Date().toISOString(),
      warningNumber,
      maxWarnings: MAX_STRIKES,
      evidence: {
        ...evidence,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    };

    // Store in memory
    const scopeKey = this.getScopeKey(scopeType, scopeId);
    let vios = violationsStore.get(scopeKey);
    if (!vios) {
      vios = [];
      violationsStore.set(scopeKey, vios);
    }
    vios.push(record);

    // Persist to Supabase if client available
    if (supabase) {
      const payload: any = {
        user_id: user.id,
        type,
        severity,
        warning_number: warningNumber,
        evidence: record.evidence,
        occurred_at: record.occurredAt,
      };

      if (scopeType === 'contest') {
        payload.contest_id = scopeId;
      } else {
        payload.event_id = scopeId;
      }

      supabase
        .from('violations')
        .insert(payload)
        .then(
          () => {},
          (err: unknown) => {
            console.warn('[IntegrityEngine]: DB violation insert warning:', err);
          }
        );

      // Update participant status in DB
      if (scopeType === 'contest') {
        supabase
          .from('contest_participants')
          .update({
            warnings: state.warnings,
            status: state.status,
            disqualified_at: state.disqualifiedAt || null,
          })
          .eq('contest_id', scopeId)
          .eq('user_id', user.id)
          .then(
            () => {},
            () => {}
          );
      }
    }

    return {
      success: true,
      warningNumber,
      maxWarnings: MAX_STRIKES,
      isDisqualified,
      status: state.status,
      severity,
      message,
      violationRecord: record,
    };
  }

  /**
   * Resets strikes for a user (Staff action only).
   */
  public resetStrikes(scopeType: 'contest' | 'event', scopeId: string, userId: string): boolean {
    const key = this.getKey(scopeType, scopeId, userId);
    const state = participantIntegrityStore.get(key);
    if (!state) return false;

    state.warnings = 0;
    state.status = 'active';
    state.isDisqualified = false;
    state.disqualifiedAt = null;
    return true;
  }

  /**
   * Manually disqualifies a user (Staff action only).
   */
  public disqualifyUser(scopeType: 'contest' | 'event', scopeId: string, userId: string): boolean {
    const key = this.getKey(scopeType, scopeId, userId);
    const state = participantIntegrityStore.get(key);
    if (!state) return false;

    state.warnings = MAX_STRIKES;
    state.status = 'disqualified';
    state.isDisqualified = true;
    state.disqualifiedAt = new Date().toISOString();
    return true;
  }

  /**
   * Retrieves all logged violations for a contest or event.
   */
  public getViolations(scopeType: 'contest' | 'event', scopeId: string): IntegrityViolationRecord[] {
    const scopeKey = this.getScopeKey(scopeType, scopeId);
    return violationsStore.get(scopeKey) || [];
  }
}

export const integrityEngine = new IntegrityEngine();
