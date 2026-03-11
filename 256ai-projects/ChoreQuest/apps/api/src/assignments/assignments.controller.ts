import {
  Controller,
  Get,
  Post,
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
import { AssignmentsService } from './assignments.service';
import { AssignmentGeneratorService } from './assignment-generator.service';
import { CompleteAssignmentDto } from './dto/complete-assignment.dto';
import { RejectAssignmentDto } from './dto/reject-assignment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly generatorService: AssignmentGeneratorService,
  ) {}

  @Post('households/me/assignments/generate')
  @UseGuards(RolesGuard)
  @Roles('parent')
  generateAssignments(
    @Request() req: { user: { householdId: string } },
  ) {
    return this.generatorService.generateAssignments(req.user.householdId);
  }

  @Get('households/me/assignments')
  listAssignments(
    @Request() req: { user: { householdId: string } },
    @Query('date') date?: string,
    @Query('childId') childId?: string,
    @Query('status') status?: string,
  ) {
    return this.assignmentsService.listAssignments(req.user.householdId, {
      date,
      childId,
      status,
    });
  }

  @Get('households/me/assignments/:id')
  getAssignment(
    @Request() req: { user: { householdId: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.getAssignment(req.user.householdId, id);
  }

  @Post('assignments/:id/complete')
  completeAssignment(
    @Request() req: { user: { householdId: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAssignmentDto,
  ) {
    return this.assignmentsService.completeAssignment(
      req.user.householdId,
      id,
      dto.note,
    );
  }

  @Post('assignments/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('parent')
  approveAssignment(
    @Request() req: { user: { householdId: string; userId: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assignmentsService.approveAssignment(
      req.user.householdId,
      id,
      req.user.userId,
    );
  }

  @Post('assignments/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('parent')
  rejectAssignment(
    @Request() req: { user: { householdId: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectAssignmentDto,
  ) {
    return this.assignmentsService.rejectAssignment(
      req.user.householdId,
      id,
      dto.reason,
    );
  }
}
