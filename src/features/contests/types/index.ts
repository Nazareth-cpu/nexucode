/**
 * Nexus Code — Contest & Tournament Types (Phase 6)
 *
 * Types for contest scheduling, authoritative timing, proctoring/violations,
 * participant state machine, and ICPC-style scoring.
 */

import type { ContestStatus, ContestParticipantStatus, ViolationType, ViolationSeverity } from '@/src/types/database';
import type { SupportedWorkspaceLanguage } from '@/src/features/workspace/types';

export type { ContestStatus, ContestParticipantStatus, ViolationType, ViolationSeverity };

export interface ContestRuleConfig {
  penaltyMinutesPerWrongAnswer: number; // default: 20
  maxWarnings: number; // default: 3
  enableProctoring: boolean; // default: true
  allowedLanguages?: SupportedWorkspaceLanguage[];
  freezeLeaderboardMinutesBeforeEnd?: number; // default: 0
  allowCustomInput?: boolean;
}

export interface ContestProblemSummary {
  problemId: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
  points: number;
  tags?: string[];
  solved?: boolean;
  attempted?: boolean;
  score?: number;
  acceptedSubmissionsCount?: number;
  totalSubmissionsCount?: number;
}

export interface ContestItem {
  id: string;
  title: string;
  description: string;
  startAt: string; // ISO
  endAt: string; // ISO
  registrationDeadline: string; // ISO
  status: ContestStatus;
  rules: ContestRuleConfig;
  createdBy: string;
  createdAt: string;
  participantCount: number;
  problemCount: number;
  totalPoints: number;
  userParticipantStatus?: ContestParticipantStatus | null;
  userWarnings?: number;
  userScore?: number;
  userRank?: number | null;
}

export interface ContestDetail extends ContestItem {
  problems: ContestProblemSummary[];
}

export interface ContestLeaderboardProblemStatus {
  status: 'accepted' | 'failed' | 'unattempted';
  attempts: number;
  timeMinutes?: number;
  points: number;
}

export interface ContestLeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  collegeId?: string;
  avatarUrl?: string;
  totalScore: number;
  penaltyTime: number; // minutes
  solvedCount: number;
  isDisqualified?: boolean;
  problems: Record<string, ContestLeaderboardProblemStatus>;
}

export interface ContestViolationRecord {
  id: string;
  contestId: string;
  userId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  occurredAt: string;
  warningNumber: number;
  evidence: Record<string, unknown>;
  userDisplayName?: string;
}

export interface ContestParticipantItem {
  contestId: string;
  userId: string;
  displayName: string;
  collegeId?: string;
  email?: string;
  registeredAt: string;
  status: ContestParticipantStatus;
  warnings: number;
  joinedAt?: string | null;
  disqualifiedAt?: string | null;
}

export interface CreateContestInput {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  registrationDeadline: string;
  status?: ContestStatus;
  rules?: Partial<ContestRuleConfig>;
  problems: Array<{
    problemId: string;
    orderIndex: number;
    points: number;
  }>;
}

export interface ViolationReportPayload {
  contestId: string;
  type: ViolationType;
  evidence?: Record<string, unknown>;
}

export interface ViolationReportResponse {
  success: boolean;
  warningNumber: number;
  maxWarnings: number;
  isDisqualified: boolean;
  status: ContestParticipantStatus;
  message: string;
}
