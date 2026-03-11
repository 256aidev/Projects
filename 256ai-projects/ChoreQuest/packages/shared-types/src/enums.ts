export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
}

export enum RecurrenceType {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  WEEKDAYS = 'weekdays',
  CUSTOM = 'custom',
}

export enum AssigneeMode {
  SINGLE = 'single',
  ROTATION = 'rotation',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  OVERDUE = 'overdue',
}

export enum PointsEventType {
  CHORE_APPROVED = 'chore_approved',
  MANUAL_ADJUSTMENT = 'manual_adjustment',
}

export enum NotificationType {
  DUE_REMINDER = 'due_reminder',
  OVERDUE = 'overdue',
  COMPLETION_ALERT = 'completion_alert',
  APPROVAL_ALERT = 'approval_alert',
  REJECTION_ALERT = 'rejection_alert',
}
