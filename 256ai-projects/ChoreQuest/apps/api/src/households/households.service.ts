import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

interface HouseholdSettings {
  defaultApprovalRequired?: boolean;
  pointsEnabled?: boolean;
  remindersEnabled?: boolean;
  [key: string]: unknown;
}

@Injectable()
export class HouseholdsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHousehold(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    return {
      id: household.id,
      name: household.name,
      timezone: household.timezone,
      settings: household.settings,
      memberCount: household._count.users,
      createdAt: household.created_at,
      updatedAt: household.updated_at,
    };
  }

  async updateHousehold(householdId: string, dto: UpdateHouseholdDto) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const data: Prisma.HouseholdUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.settings !== undefined) data.settings = dto.settings;

    const updated = await this.prisma.household.update({
      where: { id: householdId },
      data,
      include: {
        _count: { select: { users: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      timezone: updated.timezone,
      settings: updated.settings,
      memberCount: updated._count.users,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  async getMembers(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const members = await this.prisma.user.findMany({
      where: { household_id: householdId },
      select: {
        id: true,
        email: true,
        display_name: true,
        role: true,
        avatar_color: true,
        avatar_icon: true,
        age: true,
        is_active: true,
        created_at: true,
      },
      orderBy: [{ role: 'asc' }, { display_name: 'asc' }],
    });

    return members.map((m) => ({
      id: m.id,
      email: m.email,
      displayName: m.display_name,
      role: m.role,
      avatarColor: m.avatar_color,
      avatarIcon: m.avatar_icon,
      age: m.age,
      isActive: m.is_active,
      createdAt: m.created_at,
    }));
  }

  async getSettings(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { settings: true },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const settings = (household.settings ?? {}) as HouseholdSettings;

    return {
      defaultApprovalRequired: settings.defaultApprovalRequired ?? true,
      pointsEnabled: settings.pointsEnabled ?? true,
      remindersEnabled: settings.remindersEnabled ?? true,
    };
  }

  async updateSettings(householdId: string, dto: UpdateSettingsDto) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { settings: true },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    const current = (household.settings ?? {}) as HouseholdSettings;

    if (dto.defaultApprovalRequired !== undefined)
      current.defaultApprovalRequired = dto.defaultApprovalRequired;
    if (dto.pointsEnabled !== undefined)
      current.pointsEnabled = dto.pointsEnabled;
    if (dto.remindersEnabled !== undefined)
      current.remindersEnabled = dto.remindersEnabled;

    await this.prisma.household.update({
      where: { id: householdId },
      data: { settings: current as Prisma.InputJsonValue },
    });

    return {
      defaultApprovalRequired: current.defaultApprovalRequired ?? true,
      pointsEnabled: current.pointsEnabled ?? true,
      remindersEnabled: current.remindersEnabled ?? true,
    };
  }
}
