import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEvents: NotificationEventService,
  ) {}

  async listAssignments(
    householdId: string,
    filters: { date?: string; childId?: string; status?: string },
  ) {
    const where: Record<string, unknown> = { household_id: householdId };

    if (filters.date) {
      const d = new Date(filters.date);
      where.effective_date = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
    }

    if (filters.childId) {
      where.assigned_child_id = filters.childId;
    }

    if (filters.status) {
      where.status = filters.status.toLowerCase();
    }

    const assignments = await this.prisma.choreAssignment.findMany({
      where,
      include: {
        chore: { select: { id: true, title: true, points: true } },
        assigned_child: { select: { id: true, display_name: true } },
        approver: { select: { id: true, display_name: true } },
      },
      orderBy: { effective_date: 'asc' },
    });

    return assignments.map((a) => this.mapAssignment(a));
  }

  async getAssignment(householdId: string, assignmentId: string) {
    const assignment = await this.prisma.choreAssignment.findFirst({
      where: { id: assignmentId, household_id: householdId },
      include: {
        chore: { select: { id: true, title: true, points: true, approval_required: true } },
        assigned_child: { select: { id: true, display_name: true } },
        approver: { select: { id: true, display_name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.mapAssignment(assignment);
  }

  async completeAssignment(
    householdId: string,
    assignmentId: string,
    note?: string,
  ) {
    const assignment = await this.prisma.choreAssignment.findFirst({
      where: { id: assignmentId, household_id: householdId },
      include: {
        chore: { select: { id: true, title: true, points: true, approval_required: true } },
        assigned_child: { select: { id: true, display_name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== 'pending') {
      throw new BadRequestException(
        `Cannot complete assignment with status '${assignment.status}'`,
      );
    }

    const needsApproval = assignment.chore.approval_required;
    const newStatus = needsApproval ? 'awaiting_approval' : 'approved';

    if (needsApproval) {
      // Just mark as awaiting approval
      const updated = await this.prisma.choreAssignment.update({
        where: { id: assignmentId },
        data: {
          status: newStatus,
          completed_at: new Date(),
          completion_note: note,
        },
        include: {
          chore: { select: { id: true, title: true, points: true } },
          assigned_child: { select: { id: true, display_name: true } },
        },
      });

      // Notify parent of completion
      this.notificationEvents.createCompletionAlert({
        id: assignment.id,
        household_id: householdId,
        assigned_child_id: assignment.assigned_child_id,
        chore: { title: assignment.chore.title },
        assigned_child: { display_name: assignment.assigned_child.display_name },
      }).catch(() => { /* fire-and-forget */ });

      return this.mapAssignment(updated);
    }

    // Auto-approve: wrap status update + points insert in transaction
    const [updated] = await this.prisma.$transaction([
      this.prisma.choreAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'approved',
          completed_at: new Date(),
          completion_note: note,
          approved_at: new Date(),
        },
        include: {
          chore: { select: { id: true, title: true, points: true } },
          assigned_child: { select: { id: true, display_name: true } },
        },
      }),
      this.prisma.pointsLedgerEntry.create({
        data: {
          household_id: householdId,
          child_id: assignment.assigned_child_id,
          assignment_id: assignmentId,
          points: assignment.chore.points,
          reason: 'Chore auto-approved',
          event_type: 'chore_approved',
        },
      }),
    ]);

    // Notify child of auto-approval
    this.notificationEvents.createApprovalAlert({
      id: assignment.id,
      household_id: householdId,
      assigned_child_id: assignment.assigned_child_id,
      chore: { title: assignment.chore.title },
    }).catch(() => { /* fire-and-forget */ });

    return this.mapAssignment(updated);
  }

  async approveAssignment(
    householdId: string,
    assignmentId: string,
    approverId: string,
  ) {
    const assignment = await this.prisma.choreAssignment.findFirst({
      where: { id: assignmentId, household_id: householdId },
      include: {
        chore: { select: { id: true, title: true, points: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== 'awaiting_approval') {
      throw new BadRequestException(
        `Cannot approve assignment with status '${assignment.status}'`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.choreAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'approved',
          approved_at: new Date(),
          approver_id: approverId,
        },
        include: {
          chore: { select: { id: true, title: true, points: true } },
          assigned_child: { select: { id: true, display_name: true } },
          approver: { select: { id: true, display_name: true } },
        },
      }),
      this.prisma.pointsLedgerEntry.create({
        data: {
          household_id: householdId,
          child_id: assignment.assigned_child_id,
          assignment_id: assignmentId,
          points: assignment.chore.points,
          reason: 'Chore approved by parent',
          event_type: 'chore_approved',
        },
      }),
    ]);

    // Notify child of approval
    this.notificationEvents.createApprovalAlert({
      id: assignment.id,
      household_id: householdId,
      assigned_child_id: assignment.assigned_child_id,
      chore: { title: assignment.chore.title },
    }).catch(() => { /* fire-and-forget */ });

    return this.mapAssignment(updated);
  }

  async rejectAssignment(
    householdId: string,
    assignmentId: string,
    reason?: string,
  ) {
    const assignment = await this.prisma.choreAssignment.findFirst({
      where: { id: assignmentId, household_id: householdId },
      include: {
        chore: { select: { id: true, title: true, points: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (
      assignment.status !== 'awaiting_approval' &&
      assignment.status !== 'completed'
    ) {
      throw new BadRequestException(
        `Cannot reject assignment with status '${assignment.status}'`,
      );
    }

    const updated = await this.prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'rejected',
        rejected_at: new Date(),
        rejection_reason: reason,
      },
      include: {
        chore: { select: { id: true, title: true, points: true } },
        assigned_child: { select: { id: true, display_name: true } },
      },
    });

    // Notify child of rejection
    this.notificationEvents.createRejectionAlert({
      id: assignment.id,
      household_id: assignment.household_id,
      assigned_child_id: assignment.assigned_child_id,
      chore: { title: assignment.chore.title },
      rejection_reason: reason,
    }).catch(() => { /* fire-and-forget */ });

    return this.mapAssignment(updated);
  }

  private mapAssignment(assignment: {
    id: string;
    chore_id: string;
    assigned_child_id: string;
    effective_date: Date;
    due_at: Date | null;
    status: string;
    generated_by_rotation: boolean;
    completed_at: Date | null;
    completion_note: string | null;
    approved_at: Date | null;
    approver_id: string | null;
    rejected_at: Date | null;
    rejection_reason: string | null;
    created_at: Date;
    chore?: { id: string; title: string; points: number } | null;
    assigned_child?: { id: string; display_name: string } | null;
    approver?: { id: string; display_name: string } | null;
  }) {
    return {
      id: assignment.id,
      choreId: assignment.chore_id,
      chore: assignment.chore
        ? { id: assignment.chore.id, title: assignment.chore.title, points: assignment.chore.points }
        : null,
      assignedChildId: assignment.assigned_child_id,
      assignedChild: assignment.assigned_child
        ? { id: assignment.assigned_child.id, displayName: assignment.assigned_child.display_name }
        : null,
      effectiveDate: assignment.effective_date,
      dueAt: assignment.due_at,
      status: assignment.status,
      generatedByRotation: assignment.generated_by_rotation,
      completedAt: assignment.completed_at,
      completionNote: assignment.completion_note,
      approvedAt: assignment.approved_at,
      approverId: assignment.approver_id,
      approver: assignment.approver
        ? { id: assignment.approver.id, displayName: assignment.approver.display_name }
        : null,
      rejectedAt: assignment.rejected_at,
      rejectionReason: assignment.rejection_reason,
      createdAt: assignment.created_at,
    };
  }
}
