/**
 * Nexus Code — Database Types (Phase 2)
 *
 * Strongly typed TypeScript interfaces reflecting the 17 normalized tables
 * in the PostgreSQL schema.
 */

export type UserRole = 'student' | 'coordinator' | 'admin';

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';
export type ProblemStatus = 'draft' | 'published' | 'archived';
export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'python2' | 'cpp' | 'java' | 'c' | 'go' | 'rust';
export type TestCaseVisibility = 'sample' | 'hidden';

export type ContestStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
export type ContestParticipantStatus = 'registered' | 'active' | 'completed' | 'disqualified';

export type SubmissionStatus = 'pending' | 'processing' | 'evaluated' | 'error';
export type SubmissionVerdict =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'compilation_error'
  | 'runtime_error'
  | 'internal_error';

export type EventType = 'hackathon' | 'workshop' | 'webinar' | 'meetup' | 'contest';
export type EventParticipantStatus = 'registered' | 'attended' | 'cancelled';

export type ViolationType =
  | 'tab_switch'
  | 'paste_detected'
  | 'fullscreen_exit'
  | 'unauthorized_navigation'
  | 'workspace_misuse'
  | 'multiple_ip'
  | 'plagiarism'
  | 'other';
export type ViolationSeverity = 'low' | 'warning' | 'critical' | 'disqualification';

// 1. Profiles
export interface ProfileRow {
  id: string; // UUID references auth.users(id)
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  college_id: string | null;
  created_at: string;
  updated_at: string;
}

// 2. Problems
export interface ProblemRow {
  id: string; // UUID
  title: string;
  slug: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  explanation: string | null;
  difficulty: ProblemDifficulty;
  tags: string[];
  status: ProblemStatus;
  created_by: string; // UUID references profiles(id)
  created_at: string;
  updated_at: string;
}

// 3. Problem Languages
export interface ProblemLanguageRow {
  problem_id: string;
  language: SupportedLanguage;
  starter_code: string;
}

// 4. Test Cases
export interface TestCaseRow {
  id: string;
  problem_id: string;
  storage_path: string;
  visibility: TestCaseVisibility;
  metadata: Record<string, unknown>;
  created_at: string;
}

// 5. Contests
export interface ContestRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  registration_deadline: string;
  status: ContestStatus;
  rules: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 6. Contest Problems
export interface ContestProblemRow {
  contest_id: string;
  problem_id: string;
  order_index: number;
  points: number;
}

// 7. Contest Participants
export interface ContestParticipantRow {
  contest_id: string;
  user_id: string;
  registered_at: string;
  status: ContestParticipantStatus;
  warnings: number;
  joined_at: string | null;
  disqualified_at: string | null;
}

// 8. Submissions
export interface SubmissionRow {
  id: string;
  contest_id: string | null;
  problem_id: string;
  user_id: string;
  language: string;
  source_ref: string;
  status: SubmissionStatus;
  score: number;
  execution_time: number | null;
  memory: number | null;
  created_at: string;
}

// 9. Submission Results
export interface SubmissionResultRow {
  submission_id: string;
  test_count: number;
  passed_count: number;
  verdict: SubmissionVerdict;
  judge_metadata: Record<string, unknown>;
  created_at: string;
}

// 10. Contest Scores
export interface ContestScoreRow {
  contest_id: string;
  user_id: string;
  score: number;
  penalty_time: number;
  solved_count: number;
  rank: number | null;
  updated_at: string;
}

// 11. Events
export interface EventRow {
  id: string;
  title: string;
  type: EventType;
  description: string | null;
  start_at: string;
  end_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 12. Event Participants
export interface EventParticipantRow {
  event_id: string;
  user_id: string;
  status: EventParticipantStatus;
  result_data: Record<string, unknown>;
  registered_at: string;
}

// 13. Achievements
export interface AchievementRow {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  icon: string;
  created_at: string;
}

// 14. User Achievements
export interface UserAchievementRow {
  user_id: string;
  achievement_id: string;
  event_id: string | null;
  awarded_at: string;
}

// 15. Certificates
export interface CertificateRow {
  id: string;
  user_id: string;
  event_id: string | null;
  certificate_number: string;
  rank: number | null;
  file_path: string;
  verification_token: string;
  issued_at: string;
}

// 16. Violations
export interface ViolationRow {
  id: string;
  contest_id: string;
  user_id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  occurred_at: string;
  warning_number: number;
  evidence: Record<string, unknown>;
}

// 17. Audit Logs
export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
