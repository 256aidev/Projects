import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async getChildPoints(householdId: string, childId: string, timezone: string) {
    const weekStart = this.getWeekStart(timezone);

    const [lifetimeResult, weeklyResult] = await Promise.all([
      this.prisma.pointsLedgerEntry.aggregate({
        where: { household_id: householdId, child_id: childId },
        _sum: { points: true },
      }),
      this.prisma.pointsLedgerEntry.aggregate({
        where: {
          household_id: householdId,
          child_id: childId,
          awarded_at: { gte: weekStart },
        },
        _sum: { points: true },
      }),
    ]);

    return {
      childId,
      lifetimePoints: lifetimeResult._sum.points ?? 0,
      weeklyPoints: weeklyResult._sum.points ?? 0,
      weekStart: weekStart.toISOString(),
    };
  }

  async getWeeklyPointsAll(householdId: string, timezone: string) {
    const weekStart = this.getWeekStart(timezone);

    const children = await this.prisma.user.findMany({
      where: { household_id: householdId, role: 'child', is_active: true },
      select: { id: true, display_name: true, avatar_color: true },
    });

    const results = await Promise.all(
      children.map(async (child) => {
        const result = await this.prisma.pointsLedgerEntry.aggregate({
          where: {
            household_id: householdId,
            child_id: child.id,
            awarded_at: { gte: weekStart },
          },
          _sum: { points: true },
        });

        return {
          childId: child.id,
          displayName: child.display_name,
          avatarColor: child.avatar_color,
          weeklyPoints: result._sum.points ?? 0,
        };
      }),
    );

    return {
      weekStart: weekStart.toISOString(),
      children: results,
    };
  }

  private getWeekStart(timezone: string): Date {
    // Calculate Monday start in the household's timezone
    const now = new Date();
    // Get current date parts in the household timezone
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
