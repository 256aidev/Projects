import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RotationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextAssignee(choreId: string): Promise<string> {
    const group = await this.prisma.rotationGroup.findUnique({
      where: { chore_id: choreId },
      include: {
        members: { orderBy: { order_index: 'asc' } },
      },
    });

    if (!group || group.members.length === 0) {
      throw new BadRequestException(
        'No rotation group configured for this chore',
      );
    }

    const member = group.members[group.current_index % group.members.length];
    const nextIndex = (group.current_index + 1) % group.members.length;

    await this.prisma.rotationGroup.update({
      where: { id: group.id },
      data: { current_index: nextIndex },
    });

    return member.child_id;
  }

  async createRotationGroup(
    choreId: string,
    householdId: string,
    childIds: string[],
  ) {
    if (childIds.length === 0) {
      throw new BadRequestException('At least one child is required');
    }

    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    await this.validateChildren(householdId, childIds);

    // Upsert: delete existing group if any, then create new
    const existing = await this.prisma.rotationGroup.findUnique({
      where: { chore_id: choreId },
    });

    if (existing) {
      await this.prisma.rotationMember.deleteMany({
        where: { rotation_group_id: existing.id },
      });
      await this.prisma.rotationGroup.delete({
        where: { id: existing.id },
      });
    }

    const group = await this.prisma.rotationGroup.create({
      data: {
        chore_id: choreId,
        current_index: 0,
        members: {
          create: childIds.map((childId, idx) => ({
            child_id: childId,
            order_index: idx,
          })),
        },
      },
      include: {
        members: {
          orderBy: { order_index: 'asc' },
          include: {
            child: { select: { id: true, display_name: true } },
          },
        },
      },
    });

    return this.mapGroup(group);
  }

  async getRotationGroup(choreId: string, householdId: string) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    const group = await this.prisma.rotationGroup.findUnique({
      where: { chore_id: choreId },
      include: {
        members: {
          orderBy: { order_index: 'asc' },
          include: {
            child: { select: { id: true, display_name: true } },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('No rotation group for this chore');
    }

    return this.mapGroup(group);
  }

  async reorderMembers(
    choreId: string,
    householdId: string,
    childIds: string[],
  ) {
    const chore = await this.prisma.chore.findFirst({
      where: { id: choreId, household_id: householdId },
    });

    if (!chore) {
      throw new NotFoundException('Chore not found');
    }

    const group = await this.prisma.rotationGroup.findUnique({
      where: { chore_id: choreId },
      include: { members: true },
    });

    if (!group) {
      throw new NotFoundException('No rotation group for this chore');
    }

    const existingChildIds = new Set(group.members.map((m) => m.child_id));
    const newChildIds = new Set(childIds);

    if (
      existingChildIds.size !== newChildIds.size ||
      ![...existingChildIds].every((id) => newChildIds.has(id))
    ) {
      throw new BadRequestException(
        'childIds must contain exactly the same members as the existing group',
      );
    }

    await this.prisma.$transaction(
      childIds.map((childId, idx) =>
        this.prisma.rotationMember.updateMany({
          where: {
            rotation_group_id: group.id,
            child_id: childId,
          },
          data: { order_index: idx },
        }),
      ),
    );

    // Reset index to 0 on reorder
    const updated = await this.prisma.rotationGroup.update({
      where: { id: group.id },
      data: { current_index: 0 },
      include: {
        members: {
          orderBy: { order_index: 'asc' },
          include: {
            child: { select: { id: true, display_name: true } },
          },
        },
      },
    });

    return this.mapGroup(updated);
  }

  private async validateChildren(householdId: string, childIds: string[]) {
    const children = await this.prisma.user.findMany({
      where: {
        id: { in: childIds },
        household_id: householdId,
        role: 'child',
        is_active: true,
      },
    });

    if (children.length !== childIds.length) {
      throw new BadRequestException(
        'All childIds must reference active children in this household',
      );
    }
  }

  private mapGroup(group: {
    id: string;
    chore_id: string;
    current_index: number;
    created_at: Date;
    members: Array<{
      id: string;
      child_id: string;
      order_index: number;
      child: { id: string; display_name: string };
    }>;
  }) {
    return {
      id: group.id,
      choreId: group.chore_id,
      currentIndex: group.current_index,
      createdAt: group.created_at,
      members: group.members.map((m) => ({
        id: m.id,
        childId: m.child_id,
        displayName: m.child.display_name,
        orderIndex: m.order_index,
      })),
    };
  }
}
