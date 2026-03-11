import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentStreak(
    childId: string,
    timezone: string,
  ): Promise<{ currentStreak: number; lastSuccessfulDay: string | null }> {
    // Get "today" in the household's timezone
    const today = this.getLocalDate(timezone);
    let currentStreak = 0;
    let lastSuccessfulDay: string | null = null;
    const cursor = new Date(today);

    // Walk backwards from today, up to 365 days max
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(
        Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
      );

      const assignments = await this.prisma.choreAssignment.findMany({
        where: {
          assigned_child_id: childId,
          effective_date: dayStart,
        },
        select: { status: true },
      });

      if (assignments.length === 0) {
        // No assignments this day — skip it, don't break streak
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      const allApproved = assignments.every((a) => a.status === 'approved');

      if (allApproved) {
        currentStreak++;
        lastSuccessfulDay = dayStart.toISOString().slice(0, 10);
        cursor.setDate(cursor.getDate() - 1);
      } else {
        // Some assignment not approved — streak breaks
        break;
      }
    }

    return { currentStreak, lastSuccessfulDay };
  }

  private getLocalDate(timezone: string): Date {
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

    return new Date(year, month, day);
  }
}
