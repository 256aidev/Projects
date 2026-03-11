import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('households/me/leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getLeaderboard(
    @Request() req: { user: { householdId: string } },
  ) {
    const household = await this.prisma.household.findUnique({
      where: { id: req.user.householdId },
      select: { timezone: true },
    });
    const timezone = household?.timezone ?? 'America/New_York';

    return this.leaderboardService.getWeeklyLeaderboard(
      req.user.householdId,
      timezone,
    );
  }
}
