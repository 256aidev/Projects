import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async createChild(householdId: string, dto: CreateChildDto) {
    const child = await this.prisma.user.create({
      data: {
        household_id: householdId,
        display_name: dto.displayName,
        role: 'child',
        avatar_color: dto.avatarColor,
        age: dto.age,
      },
      select: {
        id: true,
        display_name: true,
        role: true,
        avatar_color: true,
        age: true,
        is_active: true,
        created_at: true,
      },
    });

    return {
      id: child.id,
      displayName: child.display_name,
      role: child.role,
      avatarColor: child.avatar_color,
      age: child.age,
      isActive: child.is_active,
      createdAt: child.created_at,
    };
  }

  async updateChild(householdId: string, childId: string, dto: UpdateChildDto) {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, household_id: householdId, role: 'child' },
    });

    if (!child) {
      throw new NotFoundException('Child not found in this household');
    }

    const updated = await this.prisma.user.update({
      where: { id: childId },
      data: {
        ...(dto.displayName !== undefined && { display_name: dto.displayName }),
        ...(dto.avatarColor !== undefined && { avatar_color: dto.avatarColor }),
        ...(dto.age !== undefined && { age: dto.age }),
      },
      select: {
        id: true,
        display_name: true,
        role: true,
        avatar_color: true,
        age: true,
        is_active: true,
        created_at: true,
      },
    });

    return {
      id: updated.id,
      displayName: updated.display_name,
      role: updated.role,
      avatarColor: updated.avatar_color,
      age: updated.age,
      isActive: updated.is_active,
      createdAt: updated.created_at,
    };
  }

  async deactivateChild(householdId: string, childId: string) {
    const child = await this.prisma.user.findFirst({
      where: { id: childId, household_id: householdId, role: 'child' },
    });

    if (!child) {
      throw new NotFoundException('Child not found in this household');
    }

    const updated = await this.prisma.user.update({
      where: { id: childId },
      data: { is_active: false },
      select: {
        id: true,
        display_name: true,
        role: true,
        is_active: true,
      },
    });

    return {
      id: updated.id,
      displayName: updated.display_name,
      role: updated.role,
      isActive: updated.is_active,
    };
  }
}
