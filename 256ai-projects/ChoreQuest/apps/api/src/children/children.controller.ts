import {
  Controller,
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
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Controller('households/me/children')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  createChild(
    @Request() req: { user: { householdId: string } },
    @Body() dto: CreateChildDto,
  ) {
    return this.childrenService.createChild(req.user.householdId, dto);
  }

  @Patch(':childId')
  updateChild(
    @Request() req: { user: { householdId: string } },
    @Param('childId', ParseUUIDPipe) childId: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.updateChild(req.user.householdId, childId, dto);
  }

  @Post(':childId/deactivate')
  deactivateChild(
    @Request() req: { user: { householdId: string } },
    @Param('childId', ParseUUIDPipe) childId: string,
  ) {
    return this.childrenService.deactivateChild(req.user.householdId, childId);
  }
}
