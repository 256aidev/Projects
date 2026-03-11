import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyLeaderboard(householdId: string, timezone: string) {
    const weekStart = this.getWeekStart(timezone);

    const children = await this.prisma.user.findMany({
      where: { household_id: householdId, role: 'child', is_active: true },
      select: { id: true, display_name: true, avatar_color: true },
    });

    const entries = await Promise.all(
      children.map(async (child) => {
        const [pointsResult, completedCount] = await Promise.all([
          this.prisma.pointsLedgerEntry.aggregate({
            where: {
              household_id: householdId,
              child_id: child.id,
              awarded_at: { gte: weekStart },
            },
            _sum: { points: true },
          }),
          this.prisma.choreAssignment.count({
            where: {
              household_id: householdId,
              assigned_child_id: child.id,
              status: 'approved',
              approved_at: { gte: weekStart },
            },
          }),
        ]);

        return {
          childId: child.id,
          displayName: child.display_name,
          avatarColor: child.avatar_color,
          weeklyPoints: pointsResult._sum.points ?? 0,
          completedChores: completedCount,
        };
      }),
    );

    // Sort by points descending
    entries.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    // Assign ranks — ties get the same rank
    let currentRank = 1;
    return entries.map((entry, index) => {
      if (index > 0 && entry.weeklyPoints < entries[index - 1].weeklyPoints) {
        currentRank = index + 1;
      }
      return { ...entry, rank: currentRank };
    });
  }

  private getWeekStart(timezone: string): Date {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

    const localDate = new Date(year, month, day);
    const dayOfWeek = localDate.getDay(); // 0=Sun
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    localDate.setDate(localDate.getDate() - diff);

    return new Date(
      Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()),
    );
  }
}
