import {
  UserRole,
  RecurrenceType,
  AssigneeMode,
  AssignmentStatus,
  PointsEventType,
  NotificationType,
} from './enums';

// ─── Base ───────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
}

// ─── Core entities ──────────────────────────────────────────────────────────

export interface Household extends BaseEntity {
  name: string;
  timezone: string;
  settings: Record<string, unknown>;
  updated_at: string;
}

export interface User extends BaseEntity {
  household_id: string;
  email: string | null;
  password_hash: string | null;
  display_name: string;
  role: UserRole;
  avatar_color: string | null;
  avatar_icon: string | null;
  age: number | null;
  is_active: boolean;
}

export interface HouseholdMembership {
  id: string;
  household_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
}

// ─── Chores ─────────────────────────────────────────────────────────────────

export interface Chore extends BaseEntity {
  household_id: string;
  title: string;
  description: string | null;
  points: number;
  due_time: string | null;
  recurrence_type: RecurrenceType;
  recurrence_config: unknown;
  assignee_mode: AssigneeMode;
  assigned_child_id: string | null;
  approval_required: boolean;
  is_active: boolean;
  is_archived: boolean;
  updated_at: string;
}

export interface ChoreAssignment extends BaseEntity {
  household_id: string;
  chore_id: string;
  assigned_child_id: string;
  effective_date: string;
  due_at: string | null;
  status: AssignmentStatus;
  generated_by_rotation: boolean;
  completed_at: string | null;
  completion_note: string | null;
  approved_at: string | null;
  approver_id: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

// ─── Rotation ───────────────────────────────────────────────────────────────

export interface RotationGroup extends BaseEntity {
  chore_id: string;
  current_index: number;
}

export interface RotationMember extends BaseEntity {
  rotation_group_id: string;
  child_id: string;
  order_index: number;
}

// ─── Points ─────────────────────────────────────────────────────────────────

export interface PointsLedgerEntry {
  id: string;
  household_id: string;
  child_id: string;
  assignment_id: string | null;
  points: number;
  reason: string | null;
  awarded_at: string;
  event_type: PointsEventType;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface NotificationPreference {
  id: string;
  household_id: string;
  user_id: string;
  reminders_enabled: boolean;
  overdue_alerts_enabled: boolean;
  approval_alerts_enabled: boolean;
}

export interface NotificationEvent extends BaseEntity {
  household_id: string;
  target_user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_assignment_id: string | null;
  is_read: boolean;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface RefreshTokenSession extends BaseEntity {
  user_id: string;
  token: string;
  device_name: string | null;
  expires_at: string;
  revoked_at: string | null;
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  household_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
}
