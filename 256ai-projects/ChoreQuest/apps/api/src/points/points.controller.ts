import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PointsService } from './points.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('households/me/points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('child/:childId')
  async getChildPoints(
    @Request() req: { user: { householdId: string } },
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    const household = await this.prisma.household.findUnique({
      where: { id: req.user.householdId },
      select: { timezone: true },
    });
    const timezone = household?.timezone ?? 'America/New_York';

    return this.pointsService.getChildPoints(
      req.user.householdId,
      childId,
      timezone,
    );
  }

  @Get('weekly')
  async getWeeklyPoints(
    @Request() req: { user: { householdId: string } },
  ) {
    const household = await this.prisma.household.findUnique({
      where: { id: req.user.householdId },
      select: { timezone: true },
    });
    const timezone = household?.timezone ?? 'America/New_York';

    return this.pointsService.getWeeklyPointsAll(
      req.user.householdId,
      timezone,
    );
  }
}
