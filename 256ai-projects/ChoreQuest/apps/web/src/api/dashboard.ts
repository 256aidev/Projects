import client from './client';

export interface ChildSummary {
  child_id: string;
  display_name: string;
  avatar_color: string | null;
  total_today: number;
  completed_today: number;
  weekly_points: number;
  streak: number;
}

export interface PendingApproval {
  id: string;
  chore_title: string;
  child_name: string;
  child_id: string;
  completed_at: string;
  completion_note: string | null;
  points: number;
}

export interface OverdueAssignment {
  id: string;
  chore_title: string;
  child_name: string;
  child_id: string;
  due_at: string;
  points: number;
}

export interface LeaderboardEntry {
  child_id: string;
  display_name: string;
  avatar_color: string | null;
  weekly_points: number;
  lifetime_points: number;
  rank: number;
}

export interface ParentDashboardData {
  household_name: string;
  stats: {
    total_today: number;
    completed_today: number;
    pending_today: number;
    overdue_today: number;
  };
  children: ChildSummary[];
  pending_approvals: PendingApproval[];
  overdue: OverdueAssignment[];
  leaderboard: LeaderboardEntry[];
}

export interface ChildChore {
  id: string;
  chore_title: string;
  description: string | null;
  points: number;
  due_at: string | null;
  status: string;
  completed_at: string | null;
  completion_note: string | null;
  approved_at: string | null;
}

export interface ChildDashboardData {
  child_id: string;
  display_name: string;
  avatar_color: string | null;
  streak: number;
  weekly_points: number;
  lifetime_points: number;
  todays_chores: ChildChore[];
  leaderboard: LeaderboardEntry[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getParentDashboard(): Promise<ParentDashboardData> {
  const { data } = await client.get('/households/me/dashboard/parent');

  // Map API camelCase response to frontend snake_case shape
  const raw = data as Record<string, any>;
  const household = raw.household ?? {};
  const todayStats = raw.todayStats ?? {};

  return {
    household_name: household.name ?? '',
    stats: {
      total_today: todayStats.total ?? 0,
      completed_today: todayStats.completed ?? 0,
      pending_today: todayStats.pending ?? 0,
      overdue_today: todayStats.overdue ?? 0,
    },
    children: ((raw.childSummaries ?? []) as any[]).map((c) => ({
      child_id: c.id ?? c.child_id ?? '',
      display_name: c.displayName ?? c.display_name ?? '',
      avatar_color: c.avatarColor ?? c.avatar_color ?? null,
      total_today: c.todayTotal ?? c.total_today ?? 0,
      completed_today: c.todayCompleted ?? c.completed_today ?? 0,
      weekly_points: c.weeklyPoints ?? c.weekly_points ?? 0,
      streak: c.streak ?? 0,
    })),
    pending_approvals: ((raw.pendingApprovals ?? []) as any[]).map((a) => ({
      id: a.id ?? '',
      chore_title: a.choreTitle ?? a.chore_title ?? '',
      child_name: a.childName ?? a.child_name ?? '',
      child_id: a.childId ?? a.child_id ?? '',
      completed_at: a.completedAt ?? a.completed_at ?? '',
      completion_note: a.completionNote ?? a.completion_note ?? null,
      points: a.points ?? 0,
    })),
    overdue: ((raw.overdueList ?? []) as any[]).map((o) => ({
      id: o.id ?? '',
      chore_title: o.choreTitle ?? o.chore_title ?? '',
      child_name: o.childName ?? o.child_name ?? '',
      child_id: o.childId ?? o.child_id ?? '',
      due_at: o.dueAt ?? o.due_at ?? '',
      points: o.points ?? 0,
    })),
    leaderboard: ((raw.leaderboard ?? []) as any[]).map((l) => ({
      child_id: l.childId ?? l.child_id ?? '',
      display_name: l.displayName ?? l.display_name ?? '',
      avatar_color: l.avatarColor ?? l.avatar_color ?? null,
      weekly_points: l.weeklyPoints ?? l.weekly_points ?? 0,
      lifetime_points: l.lifetimePoints ?? l.lifetime_points ?? 0,
      rank: l.rank ?? 0,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getChildDashboard(
  childId: string,
): Promise<ChildDashboardData> {
  const { data } = await client.get(
    `/households/me/dashboard/child/${childId}`,
  );
  const raw = data as Record<string, any>;

  return {
    child_id: raw.childId ?? raw.child_id ?? childId,
    display_name: raw.displayName ?? raw.display_name ?? '',
    avatar_color: raw.avatarColor ?? raw.avatar_color ?? null,
    streak: raw.streak ?? 0,
    weekly_points: raw.weeklyPoints ?? raw.weekly_points ?? 0,
    lifetime_points: raw.lifetimePoints ?? raw.lifetime_points ?? 0,
    todays_chores: ((raw.todaysChores ?? raw.todays_chores ?? []) as any[]).map((c) => ({
      id: c.id ?? '',
      chore_title: c.choreTitle ?? c.chore_title ?? '',
      description: c.description ?? null,
      points: c.points ?? 0,
      due_at: c.dueAt ?? c.due_at ?? null,
      status: c.status ?? 'pending',
      completed_at: c.completedAt ?? c.completed_at ?? null,
      completion_note: c.completionNote ?? c.completion_note ?? null,
      approved_at: c.approvedAt ?? c.approved_at ?? null,
    })),
    leaderboard: ((raw.leaderboard ?? []) as any[]).map((l) => ({
      child_id: l.childId ?? l.child_id ?? '',
      display_name: l.displayName ?? l.display_name ?? '',
      avatar_color: l.avatarColor ?? l.avatar_color ?? null,
      weekly_points: l.weeklyPoints ?? l.weekly_points ?? 0,
      lifetime_points: l.lifetimePoints ?? l.lifetime_points ?? 0,
      rank: l.rank ?? 0,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
