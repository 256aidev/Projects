import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentGeneratorService } from '../assignments/assignment-generator.service';
import { StreakService } from '../streaks/streak.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: AssignmentGeneratorService,
    private readonly streakService: StreakService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async getParentDashboard(householdId: string) {
    // Auto-generate today's assignments
    await this.generator.generateAssignments(householdId, new Date(), 1);

    const today = this.todayUtc();

    const [household, todayAssignments, children, pendingApprovals, overdueList] =
      await Promise.all([
        this.prisma.household.findUnique({
          where: { id: householdId },
          select: { id: true, name: true, timezone: true },
        }),
        this.prisma.choreAssignment.findMany({
          where: { household_id: householdId, effective_date: today },
          include: {
            chore: { select: { id: true, title: true, points: true } },
            assigned_child: { select: { id: true, display_name: true } },
          },
        }),
        this.prisma.user.findMany({
          where: { household_id: householdId, role: 'child', is_active: true },
          select: { id: true, display_name: true, avatar_color: true },
        }),
        this.prisma.choreAssignment.findMany({
          where: { household_id: householdId, status: 'awaiting_approval' },
          include: {
            chore: { select: { id: true, title: true, points: true } },
            assigned_child: { select: { id: true, display_name: true } },
          },
          orderBy: { completed_at: 'asc' },
        }),
        this.prisma.choreAssignment.findMany({
          where: {
            household_id: householdId,
            status: 'pending',
            effective_date: { lt: today },
          },
          include: {
            chore: { select: { id: true, title: true, points: true } },
            assigned_child: { select: { id: true, display_name: true } },
          },
          orderBy: { effective_date: 'asc' },
        }),
      ]);

    const timezone = household?.timezone ?? 'America/New_York';

    // Today's stats
    const total = todayAssignments.length;
    const completed = todayAssignments.filter(
      (a) => a.status === 'approved' || a.status === 'awaiting_approval',
    ).length;
    const pending = todayAssignments.filter((a) => a.status === 'pending').length;
    const overdue = overdueList.length;

    // Child summaries with points and streaks
    const weekStart = this.weekStartUtc();
    const childSummaries = await Promise.all(
      children.map(async (child) => {
        const childToday = todayAssignments.filter(
          (a) => a.assigned_child_id === child.id,
        );
        const childCompleted = childToday.filter(
          (a) => a.status === 'approved' || a.status === 'awaiting_approval',
        ).length;

        const [lifetimePoints, weeklyPoints, streakData] = await Promise.all([
          this.getLifetimePoints(child.id),
          this.getWeeklyPoints(child.id, weekStart),
          this.streakService.getCurrentStreak(child.id, timezone),
        ]);

        return {
          id: child.id,
          displayName: child.display_name,
          avatarColor: child.avatar_color,
          todayTotal: childToday.length,
          todayCompleted: childCompleted,
          lifetimePoints,
          weeklyPoints,
          streak: streakData.currentStreak,
        };
      }),
    );

    // Real weekly leaderboard
    const leaderboard = await this.leaderboardService.getWeeklyLeaderboard(
      householdId,
      timezone,
    );

    return {
      household: household
        ? { id: household.id, name: household.name, timezone: household.timezone }
        : null,
      todayStats: { total, completed, pending, overdue },
      childSummaries,
      pendingApprovals: pendingApprovals.map((a) => this.mapAssignmentBrief(a)),
      overdueList: overdueList.map((a) => this.mapAssignmentBrief(a)),
      leaderboard,
    };
  }

  async getChildDashboard(householdId: string, childId: string) {
    const child = await this.prisma.user.findFirst({
      where: {
        id: childId,
        household_id: householdId,
        role: 'child',
        is_active: true,
      },
      select: { id: true, display_name: true, avatar_color: true, avatar_icon: true },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Auto-generate today's assignments
    await this.generator.generateAssignments(householdId, new Date(), 1);

    const today = this.todayUtc();
    const weekStart = this.weekStartUtc();

    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { timezone: true },
    });
    const timezone = household?.timezone ?? 'America/New_York';

    const [todayAssignments, awaitingApproval, lifetimePoints, weeklyPoints, streakData] =
      await Promise.all([
        this.prisma.choreAssignment.findMany({
          where: {
            household_id: householdId,
            assigned_child_id: childId,
            effective_date: today,
          },
          include: {
            chore: { select: { id: true, title: true, points: true } },
          },
          orderBy: { created_at: 'asc' },
        }),
        this.prisma.choreAssignment.findMany({
          where: {
            household_id: householdId,
            assigned_child_id: childId,
            status: 'awaiting_approval',
          },
          include: {
            chore: { select: { id: true, title: true, points: true } },
          },
          orderBy: { completed_at: 'asc' },
        }),
        this.getLifetimePoints(childId),
        this.getWeeklyPoints(childId, weekStart),
        this.streakService.getCurrentStreak(childId, timezone),
      ]);

    // Real weekly leaderboard for position
    const leaderboard = await this.leaderboardService.getWeeklyLeaderboard(
      householdId,
      timezone,
    );
    const entry = leaderboard.find((e) => e.childId === childId);
    const position = entry?.rank ?? leaderboard.length + 1;

    return {
      child: {
        id: child.id,
        displayName: child.display_name,
        avatarColor: child.avatar_color,
        avatarIcon: child.avatar_icon,
      },
      todayAssignments: todayAssignments.map((a) => ({
        id: a.id,
        choreId: a.chore_id,
        chore: { id: a.chore.id, title: a.chore.title, points: a.chore.points },
        effectiveDate: a.effective_date,
        dueAt: a.due_at,
        status: a.status,
        completedAt: a.completed_at,
        completionNote: a.completion_note,
      })),
      points: {
        weekly: weeklyPoints,
        lifetime: lifetimePoints,
      },
      awaitingApproval: awaitingApproval.map((a) => ({
        id: a.id,
        chore: { id: a.chore.id, title: a.chore.title, points: a.chore.points },
        completedAt: a.completed_at,
      })),
      streak: streakData.currentStreak,
      leaderboardPosition: position,
    };
  }

  private async getLifetimePoints(childId: string): Promise<number> {
    const result = await this.prisma.pointsLedgerEntry.aggregate({
      where: { child_id: childId },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  }

  private async getWeeklyPoints(childId: string, weekStart: Date): Promise<number> {
    const result = await this.prisma.pointsLedgerEntry.aggregate({
      where: {
        child_id: childId,
        awarded_at: { gte: weekStart },
      },
      _sum: { points: true },
    });
    return result._sum.points ?? 0;
  }

  private todayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  private weekStartUtc(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as week start
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return new Date(
      Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()),
    );
  }

  private mapAssignmentBrief(a: {
    id: string;
    chore_id: string;
    effective_date: Date;
    status: string;
    completed_at: Date | null;
    chore: { id: string; title: string; points: number };
    assigned_child: { id: string; display_name: string };
  }) {
    return {
      id: a.id,
      choreId: a.chore_id,
      chore: { id: a.chore.id, title: a.chore.title, points: a.chore.points },
      assignedChild: {
        id: a.assigned_child.id,
        displayName: a.assigned_child.display_name,
      },
      effectiveDate: a.effective_date,
      status: a.status,
      completedAt: a.completed_at,
    };
  }
}
