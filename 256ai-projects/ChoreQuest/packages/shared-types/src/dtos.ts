import {
  UserRole,
  RecurrenceType,
  AssigneeMode,
  AssignmentStatus,
  NotificationType,
} from './enums';

// ─── Base ───────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  created_at: string;
}

// ─── Household DTOs ─────────────────────────────────────────────────────────

export interface HouseholdDto extends BaseEntity {
  name: string;
  timezone: string;
  settings: Record<string, unknown>;
  updated_at: string;
}

export interface CreateHouseholdDto {
  name: string;
  timezone?: string;
}

export interface UpdateHouseholdDto {
  name?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}

// ─── User DTOs ──────────────────────────────────────────────────────────────

export interface UserDto extends BaseEntity {
  household_id: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  avatar_color: string | null;
  avatar_icon: string | null;
  age: number | null;
  is_active: boolean;
}

export interface CreateParentDto {
  email: string;
  password: string;
  display_name: string;
  household_name: string;
  timezone?: string;
}

export interface CreateChildDto {
  display_name: string;
  avatar_color?: string;
  avatar_icon?: string;
  age?: number;
}

export interface UpdateUserDto {
  display_name?: string;
  avatar_color?: string;
  avatar_icon?: string;
  age?: number;
}

// ─── Auth DTOs ──────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

// ─── Chore DTOs ─────────────────────────────────────────────────────────────

export interface ChoreDto extends BaseEntity {
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

export interface CreateChoreDto {
  title: string;
  description?: string;
  points?: number;
  due_time?: string;
  recurrence_type?: RecurrenceType;
  recurrence_config?: unknown;
  assignee_mode?: AssigneeMode;
  assigned_child_id?: string;
  approval_required?: boolean;
  rotation_child_ids?: string[];
}

export interface UpdateChoreDto {
  title?: string;
  description?: string;
  points?: number;
  due_time?: string;
  recurrence_type?: RecurrenceType;
  recurrence_config?: unknown;
  assignee_mode?: AssigneeMode;
  assigned_child_id?: string;
  approval_required?: boolean;
  is_active?: boolean;
  is_archived?: boolean;
}

// ─── Assignment DTOs ────────────────────────────────────────────────────────

export interface ChoreAssignmentDto extends BaseEntity {
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

export interface CompleteAssignmentDto {
  completion_note?: string;
}

export interface ApproveAssignmentDto {
  points_override?: number;
}

export interface RejectAssignmentDto {
  rejection_reason: string;
}

// ─── Points DTOs ────────────────────────────────────────────────────────────

export interface PointsLedgerEntryDto {
  id: string;
  child_id: string;
  assignment_id: string | null;
  points: number;
  reason: string | null;
  awarded_at: string;
  event_type: string;
}

export interface PointsSummaryDto {
  child_id: string;
  display_name: string;
  total_points: number;
}

export interface ManualPointsDto {
  child_id: string;
  points: number;
  reason: string;
}

// ─── Notification DTOs ──────────────────────────────────────────────────────

export interface NotificationPreferenceDto {
  id: string;
  user_id: string;
  reminders_enabled: boolean;
  overdue_alerts_enabled: boolean;
  approval_alerts_enabled: boolean;
}

export interface UpdateNotificationPreferenceDto {
  reminders_enabled?: boolean;
  overdue_alerts_enabled?: boolean;
  approval_alerts_enabled?: boolean;
}

export interface NotificationEventDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_assignment_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationQuery {
  page?: number;
  per_page?: number;
}
