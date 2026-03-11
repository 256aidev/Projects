import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RotationService } from '../rotation/rotation.service';

@Injectable()
export class AssignmentGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rotationService: RotationService,
  ) {}

  async generateAssignments(
    householdId: string,
    date?: Date,
    horizon = 7,
  ): Promise<{ created: number; skipped: number }> {
    const startDate = date ?? new Date();
    let created = 0;
    let skipped = 0;

    const chores = await this.prisma.chore.findMany({
      where: {
        household_id: householdId,
        is_active: true,
        is_archived: false,
      },
    });

    for (const chore of chores) {
      for (let d = 0; d < horizon; d++) {
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + d);

        if (!this.matchesRecurrence(chore, targetDate)) {
          continue;
        }

        let assignedChildId: string | null = null;

        if (chore.assignee_mode === 'single') {
          assignedChildId = chore.assigned_child_id;
        } else if (chore.assignee_mode === 'rotation') {
          try {
            assignedChildId = await this.rotationService.getNextAssignee(
              chore.id,
            );
          } catch {
            // No rotation group configured — skip
            skipped++;
            continue;
          }
        }

        if (!assignedChildId) {
          skipped++;
          continue;
        }

        // Normalize to date-only for the unique constraint
        const effectiveDate = new Date(
          Date.UTC(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate(),
          ),
        );

        // Check for duplicate
        const existing = await this.prisma.choreAssignment.findUnique({
          where: {
            chore_id_effective_date_assigned_child_id: {
              chore_id: chore.id,
              effective_date: effectiveDate,
              assigned_child_id: assignedChildId,
            },
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Compute due_at from chore.due_time if set
        let dueAt: Date | null = null;
        if (chore.due_time) {
          const [hours, minutes] = chore.due_time.split(':').map(Number);
          dueAt = new Date(effectiveDate);
          dueAt.setUTCHours(hours, minutes, 0, 0);
        }

        await this.prisma.choreAssignment.create({
          data: {
            household_id: householdId,
            chore_id: chore.id,
            assigned_child_id: assignedChildId,
            effective_date: effectiveDate,
            due_at: dueAt,
            status: 'pending',
            generated_by_rotation: chore.assignee_mode === 'rotation',
          },
        });

        created++;
      }
    }

    return { created, skipped };
  }

  private matchesRecurrence(
    chore: { recurrence_type: string; recurrence_config: unknown; created_at: Date },
    date: Date,
  ): boolean {
    const dayOfWeek = date.getDay(); // 0=Sun .. 6=Sat

    switch (chore.recurrence_type) {
      case 'once': {
        const createdDate = new Date(chore.created_at);
        return (
          createdDate.getFullYear() === date.getFullYear() &&
          createdDate.getMonth() === date.getMonth() &&
          createdDate.getDate() === date.getDate()
        );
      }
      case 'daily':
        return true;
      case 'weekly': {
        const config = chore.recurrence_config as { dayOfWeek?: number } | null;
        if (config && typeof config === 'object' && 'dayOfWeek' in config) {
          return config.dayOfWeek === dayOfWeek;
        }
        return false;
      }
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'custom': {
        const customConfig = chore.recurrence_config as { days?: number[] } | null;
        if (
          customConfig &&
          typeof customConfig === 'object' &&
          'days' in customConfig &&
          Array.isArray(customConfig.days)
        ) {
          return customConfig.days.includes(dayOfWeek);
        }
        return false;
      }
      default:
        return false;
    }
  }
}
