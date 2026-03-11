import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RotationService } from './rotation.service';
import { CreateRotationDto } from './dto/create-rotation.dto';
import { ReorderRotationDto } from './dto/reorder-rotation.dto';

@Controller('households/me/chores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
export class RotationController {
  constructor(private readonly rotationService: RotationService) {}

  @Post(':choreId/rotation')
  createRotation(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
    @Body() dto: CreateRotationDto,
  ) {
    return this.rotationService.createRotationGroup(
      choreId,
      req.user.householdId,
      dto.childIds,
    );
  }

  @Get(':choreId/rotation')
  getRotation(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
  ) {
    return this.rotationService.getRotationGroup(choreId, req.user.householdId);
  }

  @Patch(':choreId/rotation/reorder')
  reorderRotation(
    @Request() req: { user: { householdId: string } },
    @Param('choreId', ParseUUIDPipe) choreId: string,
    @Body() dto: ReorderRotationDto,
  ) {
    return this.rotationService.reorderMembers(
      choreId,
      req.user.householdId,
      dto.childIds,
    );
  }
}
