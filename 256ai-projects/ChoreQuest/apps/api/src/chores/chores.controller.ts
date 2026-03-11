import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChoresService } from './chores.service';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';

@Controller('households/me/chores')
@UseGuards(JwtAuthGuard)
export class ChoresController {
  constructor(private readonly choresService: ChoresService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('parent')
  createChore(
    @Request() req: { user: { householdId: string } },
    @Body() dto: CreateChoreDto,
  ) {
    return this.choresService.createChore(req.user.householdId, dto);
  }

  @Get()
  listChores(
    @Request() req: { user: { householdId: string } },
    @Query('active') active?: string,
    @Query('archived') archived?: string,
  ) {
    const filters: { active?: boolean; archived?: boolean } = {};
    if (active !== undefined) filters.active = active === 'true';
    if (archived !== undefined) filters.archived = archived === 'true';
    return this.choresService.listChores(req.user.householdId, filters);
  }

  @Get(':choreId')
  getChore(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
  ) {
    return this.choresService.getChore(req.user.householdId, choreId);
  }

  @Patch(':choreId')
  @UseGuards(RolesGuard)
  @Roles('parent')
  updateChore(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
    @Body() dto: UpdateChoreDto,
  ) {
    return this.choresService.updateChore(req.user.householdId, choreId, dto);
  }

  @Post(':choreId/archive')
  @UseGuards(RolesGuard)
  @Roles('parent')
  archiveChore(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
  ) {
    return this.choresService.archiveChore(req.user.householdId, choreId);
  }

  @Post(':choreId/restore')
  @UseGuards(RolesGuard)
  @Roles('parent')
  restoreChore(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
  ) {
    return this.choresService.restoreChore(req.user.householdId, choreId);
  }
}
