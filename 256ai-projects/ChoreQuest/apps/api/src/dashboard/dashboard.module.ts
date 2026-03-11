import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { StreaksModule } from '../streaks/streaks.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AssignmentsModule, StreaksModule, LeaderboardModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
