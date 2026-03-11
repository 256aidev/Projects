import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { HouseholdsModule } from './households/households.module';
import { ChildrenModule } from './children/children.module';
import { ChoresModule } from './chores/chores.module';
import { RotationModule } from './rotation/rotation.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PointsModule } from './points/points.module';
import { StreaksModule } from './streaks/streaks.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TerminusModule,
    HealthModule,
    AuthModule,
    HouseholdsModule,
    ChildrenModule,
    ChoresModule,
    RotationModule,
    AssignmentsModule,
    DashboardModule,
    PointsModule,
    StreaksModule,
    LeaderboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}
