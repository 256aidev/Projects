import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEventService } from './notification-event.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEvents: NotificationEventService,
  ) {}

  @Cron('*/15 * * * *')
  async scanDueAndOverdue() {
    this.logger.log('Scanning for due reminders and overdue assignments...');

    const now = new Date();
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Due reminders: assignments with due_at within the next 30 minutes
    const dueSoon = await this.prisma.choreAssignment.findMany({
      where: {
        status: 'pending',
        due_at: {
          gt: now,
          lte: thirtyMinFromNow,
        },
      },
      include: {
        chore: { select: { title: true } },
        assigned_child: { select: { display_name: true } },
      },
    });

    for (const assignment of dueSoon) {
      await this.notificationEvents.createDueReminder({
        id: assignment.id,
        household_id: assignment.household_id,
        assigned_child_id: assignment.assigned_child_id,
        chore: assignment.chore,
      });
    }

    // Overdue: assignments with due_at in the past and still pending
    const overdue = await this.prisma.choreAssignment.findMany({
      where: {
        status: 'pending',
        due_at: { lt: now },
      },
      include: {
        chore: { select: { title: true } },
        assigned_child: { select: { display_name: true } },
      },
    });

    for (const assignment of overdue) {
      await this.notificationEvents.createOverdueAlert({
        id: assignment.id,
        household_id: assignment.household_id,
        assigned_child_id: assignment.assigned_child_id,
        chore: assignment.chore,
      });
    }

    this.logger.log(
      `Processed ${dueSoon.length} due reminders, ${overdue.length} overdue alerts`,
    );
  }
}
