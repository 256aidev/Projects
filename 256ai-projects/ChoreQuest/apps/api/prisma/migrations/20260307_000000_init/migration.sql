-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('parent', 'child');

-- CreateEnum
CREATE TYPE "recurrence_type" AS ENUM ('once', 'daily', 'weekly', 'weekdays', 'custom');

-- CreateEnum
CREATE TYPE "assignee_mode" AS ENUM ('single', 'rotation');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('pending', 'completed', 'awaiting_approval', 'approved', 'rejected', 'overdue');

-- CreateEnum
CREATE TYPE "points_event_type" AS ENUM ('chore_approved', 'manual_adjustment');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('due_reminder', 'overdue', 'completion_alert', 'approval_alert', 'rejection_alert');

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "avatar_color" TEXT,
    "avatar_icon" TEXT,
    "age" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_memberships" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chores" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "due_time" TEXT,
    "recurrence_type" "recurrence_type" NOT NULL DEFAULT 'once',
    "recurrence_config" JSONB NOT NULL DEFAULT '[]',
    "assignee_mode" "assignee_mode" NOT NULL DEFAULT 'single',
    "assigned_child_id" TEXT,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_assignments" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "chore_id" TEXT NOT NULL,
    "assigned_child_id" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "due_at" TIMESTAMP(3),
    "status" "assignment_status" NOT NULL DEFAULT 'pending',
    "generated_by_rotation" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "completion_note" TEXT,
    "approved_at" TIMESTAMP(3),
    "approver_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chore_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotation_groups" (
    "id" TEXT NOT NULL,
    "chore_id" TEXT NOT NULL,
    "current_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotation_members" (
    "id" TEXT NOT NULL,
    "rotation_group_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rotation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_ledger" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "points_event_type" NOT NULL,

    CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "overdue_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "approval_alerts_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "related_assignment_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_name" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_token_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "household_memberships_household_id_user_id_key" ON "household_memberships"("household_id", "user_id");

-- CreateIndex
CREATE INDEX "chores_household_id_is_active_idx" ON "chores"("household_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "chore_assignments_chore_id_effective_date_assigned_child_id_key" ON "chore_assignments"("chore_id", "effective_date", "assigned_child_id");

-- CreateIndex
CREATE INDEX "chore_assignments_household_id_effective_date_status_idx" ON "chore_assignments"("household_id", "effective_date", "status");

-- CreateIndex
CREATE INDEX "chore_assignments_assigned_child_id_effective_date_idx" ON "chore_assignments"("assigned_child_id", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "rotation_groups_chore_id_key" ON "rotation_groups"("chore_id");

-- CreateIndex
CREATE INDEX "points_ledger_child_id_awarded_at_idx" ON "points_ledger"("child_id", "awarded_at");

-- CreateIndex
CREATE INDEX "points_ledger_household_id_awarded_at_idx" ON "points_ledger"("household_id", "awarded_at");

-- CreateIndex
CREATE UNIQUE INDEX "points_ledger_assignment_id_key" ON "points_ledger"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_household_id_user_id_key" ON "notification_preferences"("household_id", "user_id");

-- CreateIndex
CREATE INDEX "notification_events_target_user_id_is_read_idx" ON "notification_events"("target_user_id", "is_read");

-- CreateIndex
CREATE INDEX "refresh_token_sessions_user_id_idx" ON "refresh_token_sessions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_household_id_created_at_idx" ON "audit_logs"("household_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_memberships" ADD CONSTRAINT "household_memberships_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_memberships" ADD CONSTRAINT "household_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_assigned_child_id_fkey" FOREIGN KEY ("assigned_child_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_assigned_child_id_fkey" FOREIGN KEY ("assigned_child_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_assignments" ADD CONSTRAINT "chore_assignments_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_groups" ADD CONSTRAINT "rotation_groups_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_members" ADD CONSTRAINT "rotation_members_rotation_group_id_fkey" FOREIGN KEY ("rotation_group_id") REFERENCES "rotation_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_members" ADD CONSTRAINT "rotation_members_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "chore_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token_sessions" ADD CONSTRAINT "refresh_token_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
