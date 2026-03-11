import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Controller('households/me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(
    @Request() req: { user: { householdId: string; userId: string } },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listNotifications(
      req.user.householdId,
      req.user.userId,
      {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit, 10) : undefined,
      },
    );
  }

  @Post(':id/read')
  markRead(
    @Request() req: { user: { householdId: string; userId: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(
      req.user.householdId,
      req.user.userId,
      id,
    );
  }

  @Post('read-all')
  markAllRead(
    @Request() req: { user: { householdId: string; userId: string } },
  ) {
    return this.notificationsService.markAllRead(
      req.user.householdId,
      req.user.userId,
    );
  }

  @Get('preferences')
  getPreferences(
    @Request() req: { user: { householdId: string; userId: string } },
  ) {
    return this.notificationsService.getPreferences(
      req.user.householdId,
      req.user.userId,
    );
  }

  @Post('preferences')
  updatePreferences(
    @Request() req: { user: { householdId: string; userId: string } },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(
      req.user.householdId,
      req.user.userId,
      dto,
    );
  }
}
