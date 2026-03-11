import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationEventService } from './notification-event.service';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationEventService,
    NotificationSchedulerService,
  ],
  exports: [NotificationEventService],
})
export class NotificationsModule {}
