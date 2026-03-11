// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'child';
  householdId: string;
  createdAt: string;
}

// Household
export interface Household {
  id: string;
  name: string;
  timezone?: string;
  settings?: HouseholdSettings;
  createdAt: string;
}

export interface HouseholdSettings {
  defaultApprovalRequired?: boolean;
  pointsEnabled?: boolean;
  remindersEnabled?: boolean;
}

export interface HouseholdMember {
  id: string;
  displayName: string;
  role: 'parent' | 'child';
  email?: string;
}

// Children
export interface Child {
  id: string;
  displayName: string;
  avatarColor?: string;
  age?: number;
  active: boolean;
  createdAt: string;
}

export interface CreateChildRequest {
  displayName: string;
  avatarColor?: string;
  age?: number;
}

// Chores
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'weekdays' | 'custom';
export type AssigneeMode = 'single' | 'rotation';

export interface Chore {
  id: string;
  title: string;
  description?: string;
  points: number;
  recurrenceType: RecurrenceType;
  recurrenceConfig?: Record<string, any>;
  assigneeMode: AssigneeMode;
  assignedChildId?: string;
  approvalRequired: boolean;
  active: boolean;
  archived: boolean;
  createdAt: string;
}

export interface CreateChoreRequest {
  title: string;
  description?: string;
  points: number;
  recurrenceType: RecurrenceType;
  recurrenceConfig?: Record<string, any>;
  assigneeMode: AssigneeMode;
  assignedChildId?: string;
  approvalRequired?: boolean;
}

// Assignments
export type AssignmentStatus = 'pending' | 'completed' | 'approved' | 'rejected';

export interface Assignment {
  id: string;
  choreId: string;
  childId: string;
  date: string;
  status: AssignmentStatus;
  completedAt?: string;
  approvedAt?: string;
  note?: string;
  rejectionReason?: string;
  chore?: Chore;
  child?: Child;
}

// Dashboard
export interface ParentDashboard {
  household: Household;
  children: Child[];
  pendingApprovals: Assignment[];
  todayAssignments: Assignment[];
  weeklyPoints: WeeklyPointEntry[];
}

export interface ChildDashboard {
  child: Child;
  todayAssignments: Assignment[];
  points: number;
  streak: number;
  completedToday: number;
  totalToday: number;
}

// Points & Leaderboard
export interface PointEntry {
  childId: string;
  points: number;
  date: string;
  reason: string;
}

export interface WeeklyPointEntry {
  childId: string;
  childName: string;
  avatarColor?: string;
  totalPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  childId: string;
  childName: string;
  avatarColor?: string;
  points: number;
}

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  remindersEnabled?: boolean;
  overdueAlertsEnabled?: boolean;
  approvalAlertsEnabled?: boolean;
}
