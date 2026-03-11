import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HouseholdsService } from './households.service';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('households/me')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get()
  getHousehold(@Request() req: { user: { householdId: string } }) {
    return this.householdsService.getHousehold(req.user.householdId);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('parent')
  updateHousehold(
    @Request() req: { user: { householdId: string } },
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.householdsService.updateHousehold(req.user.householdId, dto);
  }

  @Get('members')
  getMembers(@Request() req: { user: { householdId: string } }) {
    return this.householdsService.getMembers(req.user.householdId);
  }

  @Get('settings')
  getSettings(@Request() req: { user: { householdId: string } }) {
    return this.householdsService.getSettings(req.user.householdId);
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles('parent')
  updateSettings(
    @Request() req: { user: { householdId: string } },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.householdsService.updateSettings(req.user.householdId, dto);
  }
}
