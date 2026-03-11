import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationEventService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompletionAlert(assignment: {
    id: string;
    household_id: string;
    assigned_child_id: string;
    chore: { title: string };
    assigned_child: { display_name: string };
  }) {
    // Notify all parents in the household
    const parents = await this.prisma.user.findMany({
      where: { household_id: assignment.household_id, role: 'parent', is_active: true },
      select: { id: true },
    });

    for (const parent of parents) {
      const isDuplicate = await this.checkDuplicate(
        'completion_alert',
        assignment.id,
        parent.id,
      );
      if (isDuplicate) continue;

      const prefsOk = await this.checkPreference(
        assignment.household_id,
        parent.id,
        'approval_alerts_enabled',
      );
      if (!prefsOk) continue;

      await this.prisma.notificationEvent.create({
        data: {
          household_id: assignment.household_id,
          target_user_id: parent.id,
          type: 'completion_alert',
          title: 'Chore Completed',
          body: `${assignment.assigned_child.display_name} completed "${assignment.chore.title}"`,
          related_assignment_id: assignment.id,
        },
      });
    }
  }

  async createApprovalAlert(assignment: {
    id: string;
    household_id: string;
    assigned_child_id: string;
    chore: { title: string };
  }) {
    const isDuplicate = await this.checkDuplicate(
      'approval_alert',
      assignment.id,
      assignment.assigned_child_id,
    );
    if (isDuplicate) return;

    const prefsOk = await this.checkPreference(
      assignment.household_id,
      assignment.assigned_child_id,
      'approval_alerts_enabled',
    );
    if (!prefsOk) return;

    await this.prisma.notificationEvent.create({
      data: {
        household_id: assignment.household_id,
        target_user_id: assignment.assigned_child_id,
        type: 'approval_alert',
        title: 'Chore Approved!',
        body: `Your chore "${assignment.chore.title}" was approved`,
        related_assignment_id: assignment.id,
      },
    });
  }

  async createRejectionAlert(assignment: {
    id: string;
    household_id: string;
    assigned_child_id: string;
    chore: { title: string };
    rejection_reason?: string | null;
  }) {
    const isDuplicate = await this.checkDuplicate(
      'rejection_alert',
      assignment.id,
      assignment.assigned_child_id,
    );
    if (isDuplicate) return;

    const prefsOk = await this.checkPreference(
      assignment.household_id,
      assignment.assigned_child_id,
      'approval_alerts_enabled',
    );
    if (!prefsOk) return;

    const body = assignment.rejection_reason
      ? `Your chore "${assignment.chore.title}" was rejected: ${assignment.rejection_reason}`
      : `Your chore "${assignment.chore.title}" was rejected`;

    await this.prisma.notificationEvent.create({
      data: {
        household_id: assignment.household_id,
        target_user_id: assignment.assigned_child_id,
        type: 'rejection_alert',
        title: 'Chore Rejected',
        body,
        related_assignment_id: assignment.id,
      },
    });
  }

  async createDueReminder(assignment: {
    id: string;
    household_id: string;
    assigned_child_id: string;
    chore: { title: string };
  }) {
    const isDuplicate = await this.checkDuplicate(
      'due_reminder',
      assignment.id,
      assignment.assigned_child_id,
    );
    if (isDuplicate) return;

    const prefsOk = await this.checkPreference(
      assignment.household_id,
      assignment.assigned_child_id,
      'reminders_enabled',
    );
    if (!prefsOk) return;

    await this.prisma.notificationEvent.create({
      data: {
        household_id: assignment.household_id,
        target_user_id: assignment.assigned_child_id,
        type: 'due_reminder',
        title: 'Chore Due Soon',
        body: `"${assignment.chore.title}" is due in less than 30 minutes`,
        related_assignment_id: assignment.id,
      },
    });
  }

  async createOverdueAlert(assignment: {
    id: string;
    household_id: string;
    assigned_child_id: string;
    chore: { title: string };
  }) {
    const isDuplicate = await this.checkDuplicate(
      'overdue',
      assignment.id,
      assignment.assigned_child_id,
    );
    if (isDuplicate) return;

    const prefsOk = await this.checkPreference(
      assignment.household_id,
      assignment.assigned_child_id,
      'overdue_alerts_enabled',
    );
    if (!prefsOk) return;

    await this.prisma.notificationEvent.create({
      data: {
        household_id: assignment.household_id,
        target_user_id: assignment.assigned_child_id,
        type: 'overdue',
        title: 'Chore Overdue',
        body: `"${assignment.chore.title}" is past due`,
        related_assignment_id: assignment.id,
      },
    });
  }

  private async checkDuplicate(
    type: string,
    assignmentId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existing = await this.prisma.notificationEvent.findFirst({
      where: {
        type: type as any,
        related_assignment_id: assignmentId,
        target_user_id: targetUserId,
        created_at: { gte: since },
      },
    });

    return !!existing;
  }

  private async checkPreference(
    householdId: string,
    userId: string,
    field: 'reminders_enabled' | 'overdue_alerts_enabled' | 'approval_alerts_enabled',
  ): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { household_id_user_id: { household_id: householdId, user_id: userId } },
    });

    // Default to enabled if no preferences set
    if (!pref) return true;

    return pref[field];
  }
}
