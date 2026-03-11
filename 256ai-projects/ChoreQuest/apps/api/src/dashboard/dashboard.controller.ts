import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('households/me/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('parent')
  @UseGuards(RolesGuard)
  @Roles('parent')
  getParentDashboard(
    @Request() req: { user: { householdId: string } },
  ) {
    return this.dashboardService.getParentDashboard(req.user.householdId);
  }

  @Get('child/:childId')
  getChildDashboard(
    @Request() req: { user: { householdId: string } },
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    return this.dashboardService.getChildDashboard(
      req.user.householdId,
      childId,
    );
  }
}
