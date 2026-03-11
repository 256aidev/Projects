import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(
    householdId: string,
    userId: string,
    filters: { unreadOnly?: boolean; limit?: number },
  ) {
    const where: Record<string, unknown> = {
      household_id: householdId,
      target_user_id: userId,
    };

    if (filters.unreadOnly) {
      where.is_read = false;
    }

    const notifications = await this.prisma.notificationEvent.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters.limit ?? 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      relatedAssignmentId: n.related_assignment_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    }));
  }

  async markRead(householdId: string, userId: string, notificationId: string) {
    const notification = await this.prisma.notificationEvent.findFirst({
      where: {
        id: notificationId,
        household_id: householdId,
        target_user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notificationEvent.update({
      where: { id: notificationId },
      data: { is_read: true },
    });

    return { success: true };
  }

  async markAllRead(householdId: string, userId: string) {
    const result = await this.prisma.notificationEvent.updateMany({
      where: {
        household_id: householdId,
        target_user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return { updated: result.count };
  }

  async getPreferences(householdId: string, userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { household_id_user_id: { household_id: householdId, user_id: userId } },
    });

    if (!pref) {
      // Return defaults
      return {
        remindersEnabled: true,
        overdueAlertsEnabled: true,
        approvalAlertsEnabled: true,
      };
    }

    return {
      remindersEnabled: pref.reminders_enabled,
      overdueAlertsEnabled: pref.overdue_alerts_enabled,
      approvalAlertsEnabled: pref.approval_alerts_enabled,
    };
  }

  async updatePreferences(
    householdId: string,
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const data: Record<string, boolean> = {};
    if (dto.remindersEnabled !== undefined) data.reminders_enabled = dto.remindersEnabled;
    if (dto.overdueAlertsEnabled !== undefined) data.overdue_alerts_enabled = dto.overdueAlertsEnabled;
    if (dto.approvalAlertsEnabled !== undefined) data.approval_alerts_enabled = dto.approvalAlertsEnabled;

    const pref = await this.prisma.notificationPreference.upsert({
      where: { household_id_user_id: { household_id: householdId, user_id: userId } },
      create: {
        household_id: householdId,
        user_id: userId,
        reminders_enabled: dto.remindersEnabled ?? true,
        overdue_alerts_enabled: dto.overdueAlertsEnabled ?? true,
        approval_alerts_enabled: dto.approvalAlertsEnabled ?? true,
      },
      update: data,
    });

    return {
      remindersEnabled: pref.reminders_enabled,
      overdueAlertsEnabled: pref.overdue_alerts_enabled,
      approvalAlertsEnabled: pref.approval_alerts_enabled,
    };
  }
}
