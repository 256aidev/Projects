import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChoreDto, AssigneeModeDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';

@Injectable()
export class ChoresService {
  constructor(private readonly prisma: PrismaService) {}

  async createChore(householdId: string, dto: CreateChoreDto) {
    if (dto.assigneeMode === AssigneeModeDto.SINGLE && dto.assignedChildId) {
      await this.validateActiveChild(householdId, dto.assignedChildId);
    }

    const chore = await this.prisma.chore.create({
      data: {
        household_id: householdId,
        title: dto.title,
        description: dto.description,
        points: dto.points,
        recurrence_type: dto.recurrenceType,
        recurrence_config: dto.recurrenceConfig ?? [],
        assignee_mode: dto.assigneeMode,
        assigned_child_id: dto.assignedChildId,
        approval_required: dto.approvalRequired ?? true,
      },
      include: {
        assigned_child: {
          select: { id: true, display_name: true },
        },
      },
    });

    return this.mapChore(chore);
  }

  async listChores(
    householdId: string,
    filters: { active?: boolean; archived?: boolean },
  ) {
    const where: Record<string, unknown> = { household_id: householdId };

    if (filters.active !== undefined) {
      where.is_active = filters.active;
    }
    if (filters.archived !== undefined) {
      where.is_archived = filters.archived;
    }

    const chores = await this.prisma.chore.findMany({
      where,
      include: {
        assigned_child: {
          select: { id: true, display_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return chores.map((c) => this.mapChore(c));
  }

  async getChore(householdId: string, choreId: string) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
      include: {
        assigned_child: {
          select: { id: true, display_name: true },
        },
      },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    return this.mapChore(chore);
  }

  async updateChore(householdId: string, choreId: string, dto: UpdateChoreDto) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    const assigneeMode = dto.assigneeMode ?? chore.assignee_mode;
    const assignedChildId = dto.assignedChildId ?? chore.assigned_child_id;

    if (assigneeMode === 'single' && dto.assignedChildId) {
      await this.validateActiveChild(householdId, dto.assignedChildId);
    }

    const data: Prisma.ChoreUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.points !== undefined) data.points = dto.points;
    if (dto.recurrenceType !== undefined) data.recurrence_type = dto.recurrenceType;
    if (dto.recurrenceConfig !== undefined) data.recurrence_config = dto.recurrenceConfig;
    if (dto.assigneeMode !== undefined) data.assignee_mode = dto.assigneeMode;
    if (dto.assignedChildId !== undefined) data.assigned_child_id = dto.assignedChildId;
    if (dto.approvalRequired !== undefined) data.approval_required = dto.approvalRequired;

    const updated = await this.prisma.chore.update({
      where: { id: choreId },
      data,
      include: {
        assigned_child: {
          select: { id: true, display_name: true },
        },
      },
    });

    return this.mapChore(updated);
  }

  async archiveChore(householdId: string, choreId: string) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    const updated = await this.prisma.chore.update({
      where: { id: choreId },
      data: { is_archived: true, is_active: false },
    });

    return { id: updated.id, isArchived: updated.is_archived, isActive: updated.is_active };
  }

  async restoreChore(householdId: string, choreId: string) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    const updated = await this.prisma.chore.update({
      where: { id: choreId },
      data: { is_archived: false, is_active: true },
    });

    return { id: updated.id, isArchived: updated.is_archived, isActive: updated.is_active };
  }

  private async validateActiveChild(householdId: string, childId: string) {
    const child = await this.prisma.user.findFirst({
      where: {
        id: childId,
        household_id: householdId,
        role: 'child',
        is_active: true,
      },
    });

    if (!child) {
      throw new BadRequestException(
        'assignedChildId must reference an active child in this household',
      );
    }
  }

  private mapChore(chore: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    recurrence_type: string;
    recurrence_config: unknown;
    assignee_mode: string;
    assigned_child_id: string | null;
    approval_required: boolean;
    is_active: boolean;
    is_archived: boolean;
    created_at: Date;
    updated_at: Date;
    assigned_child?: { id: string; display_name: string } | null;
  }) {
    return {
      id: chore.id,
      title: chore.title,
      description: chore.description,
      points: chore.points,
      recurrenceType: chore.recurrence_type,
      recurrenceConfig: chore.recurrence_config,
      assigneeMode: chore.assignee_mode,
      assignedChildId: chore.assigned_child_id,
      assignedChild: chore.assigned_child
        ? { id: chore.assigned_child.id, displayName: chore.assigned_child.display_name }
        : null,
      approvalRequired: chore.approval_required,
      isActive: chore.is_active,
      isArchived: chore.is_archived,
      createdAt: chore.created_at,
      updatedAt: chore.updated_at,
    };
  }
}
