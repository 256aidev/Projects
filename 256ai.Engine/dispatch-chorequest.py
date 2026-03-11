"""
Dispatch ChoreQuest on-prem backend tasks to the swarm.
Skipping all mobile/frontend work — backend only.
"""
import json, urllib.request

API = "http://localhost:5100"
PROJECT_ID = "1be2cac6-54bc-48cd-8df5-004fbbffdd95"
WORK_DIR = "C:\\Projects\\256ai-projects\\ChoreQuest"

# Exclude AI02 workers — their Claude Code/binary has compatibility issues
EXCLUDE_WORKERS = ["worker-ai02-claude", "worker-ai02-coder-001", "worker-ai02-coder-002"]

def post(url, data):
    # Add excludeWorkers to all task dispatches
    if "objective" in data and "excludeWorkers" not in data:
        data["excludeWorkers"] = EXCLUDE_WORKERS
    req = urllib.request.Request(url, json.dumps(data).encode(), {"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

tasks = {}

# ── Phase 0+1: On-Prem Foundation + Backend Project Init ──────────────
phase01 = post(f"{API}/tasks", {
    "objective": f"""Phase 0+1 — On-Prem Foundation & Backend Project Initialization

Working Directory: {WORK_DIR}

IMPORTANT: This is an ON-PREM ONLY project. NO Supabase, NO Firebase, NO cloud services.

Read SPEC.md in the working directory for full context. This task covers Phase 0 and Phase 1.

GOAL: Set up the monorepo, backend API, Docker infra, and foundational docs.

TECH STACK (LOCKED):
- Node.js LTS + NestJS (TypeScript) for API
- PostgreSQL (self-hosted) for database
- Prisma for ORM/migrations
- Docker Compose for deployment
- Nginx for reverse proxy
- JWT + Argon2id for auth (built into the API, no external providers)

TASKS:

1. Create monorepo structure:
   /apps/api          — NestJS backend
   /apps/worker       — (placeholder for future background worker, can be same process for V1)
   /packages/shared-types   — Shared TypeScript types
   /packages/shared-validation — Shared validation schemas
   /infra/docker      — Dockerfiles
   /infra/nginx       — Nginx config
   /infra/scripts     — Deploy/backup scripts
   /docs              — Architecture docs

2. Initialize NestJS API (apps/api):
   - npx @nestjs/cli new api --strict --skip-git --package-manager npm
   - TypeScript strict mode
   - Install: @nestjs/config, @nestjs/jwt, @nestjs/passport, passport, passport-jwt
   - Install: @prisma/client, prisma (dev)
   - Install: argon2 (for password hashing)
   - Install: class-validator, class-transformer (for DTO validation)
   - Install: @nestjs/schedule (for background jobs)
   - Configure ESLint + Prettier
   - Create health endpoint: GET /health returns {{ status: 'ok', timestamp, version }}

3. Initialize Prisma:
   - npx prisma init in apps/api
   - Configure DATABASE_URL for local Postgres (postgresql://choreflow:choreflow@localhost:5432/choreflow)
   - Create empty initial migration

4. Create Docker Compose (infra/docker/docker-compose.yml):
   - postgres service: postgres:16-alpine, port 5432, volume for data, env vars for user/pass/db
   - api service: node:20-alpine, port 3000, depends on postgres, mounts code
   - nginx service: nginx:alpine, port 80/443, routes /api to api service
   - Named volumes: postgres_data

5. Create .env.example at project root:
   DATABASE_URL=postgresql://choreflow:choreflow@localhost:5432/choreflow
   JWT_SECRET=change-me-in-production
   JWT_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   PORT=3000
   NODE_ENV=development

6. Create infra/nginx/nginx.conf:
   - Route /api/* to http://api:3000
   - Basic security headers

7. Create shared-types package (packages/shared-types):
   - package.json with name @choreflow/shared-types
   - src/index.ts exporting role enums, status enums, base DTOs
   - Role enum: PARENT, CHILD
   - Assignment status enum: PENDING, COMPLETED, AWAITING_APPROVAL, APPROVED, REJECTED, OVERDUE
   - Chore recurrence enum: ONCE, DAILY, WEEKLY, WEEKDAYS, CUSTOM

8. Write foundational docs:
   - docs/ARCHITECTURE.md — describe on-prem architecture, component diagram, tech stack decisions
   - docs/DEPLOYMENT_ON_PREM.md — Docker Compose setup, env vars, first-run instructions
   - docs/RUNBOOK.md — placeholder with sections for startup, shutdown, backup, restore, troubleshooting

9. Verify everything boots:
   - Docker Compose starts postgres successfully
   - NestJS API starts and connects to postgres
   - GET /health returns 200

DELIVERABLES: Bootable NestJS API, Docker Compose with Postgres, Nginx config, shared types package, foundational docs.
DONE CRITERIA: API starts, health endpoint works, Postgres connected, no cloud SDKs anywhere.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Bootable NestJS API with Docker Compose, Prisma configured, health endpoint working, docs written"
})
tasks["phase01"] = phase01["taskId"]
print(f"Phase 0+1: {phase01['taskId']}")

# ── Phase 2: Database Schema ──────────────────────────────────────────
phase2 = post(f"{API}/tasks", {
    "objective": f"""Phase 2 — Database Schema and Data Contracts

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 2: defining the complete PostgreSQL schema.

PREREQUISITE: Phase 0+1 must be complete. The NestJS API with Prisma should already be initialized in apps/api.

GOAL: Define the full relational schema in Prisma, run migrations, create shared TypeScript types.

ENTITIES TO CREATE (in prisma/schema.prisma):

1. Household: id, name, timezone, settings (JSON), createdAt, updatedAt
2. ParentUser: id, email (unique), passwordHash, displayName, householdId (FK), role='PARENT', isActive, createdAt
3. ChildProfile: id, displayName, avatarColor, age (optional), householdId (FK), isActive, createdAt
4. HouseholdMembership: id, householdId, userId (polymorphic or separate parent/child refs), role, joinedAt
5. Chore: id, householdId (FK), title, description, points (int), dueTime (optional), recurrenceType (enum), recurrenceConfig (JSON), assigneeMode (SINGLE/ROTATION), assignedChildId (nullable FK), approvalRequired (bool), isActive, isArchived, createdAt, updatedAt
6. ChoreAssignment: id, householdId (FK), choreId (FK), assignedChildId (FK), effectiveDate, dueAt (nullable), status (enum), generatedByRotation (bool), completedAt (nullable), completionNote (nullable), approvedAt (nullable), approverId (nullable), rejectedAt (nullable), rejectionReason (nullable), createdAt
7. RotationGroup: id, choreId (FK, unique), currentIndex (int default 0), createdAt
8. RotationMember: id, rotationGroupId (FK), childId (FK), orderIndex (int), createdAt
9. PointsLedger: id, householdId (FK), childId (FK), assignmentId (FK, unique — prevents double-award), points (int), awardedAt, reason
10. NotificationPreference: id, householdId (FK), userId, remindersEnabled (bool), overdueAlertsEnabled (bool), approvalAlertsEnabled (bool)
11. NotificationEvent: id, householdId (FK), targetUserId, type (enum), title, body, relatedAssignmentId (nullable), isRead (bool), createdAt
12. RefreshTokenSession: id, userId, token (hashed), deviceName (nullable), expiresAt, createdAt, revokedAt (nullable)
13. AuditLog: id, householdId (FK), userId, action, details (JSON), ipAddress (nullable), createdAt

ENUMS (Prisma enums):
- Role: PARENT, CHILD
- RecurrenceType: ONCE, DAILY, WEEKLY, WEEKDAYS, CUSTOM
- AssigneeMode: SINGLE, ROTATION
- AssignmentStatus: PENDING, COMPLETED, AWAITING_APPROVAL, APPROVED, REJECTED, OVERDUE
- NotificationType: DUE_REMINDER, OVERDUE, COMPLETION_ALERT, APPROVAL_ALERT, REJECTION_ALERT

INDEXES to add:
- ChoreAssignment: (householdId, effectiveDate, status), (assignedChildId, effectiveDate), (choreId, effectiveDate, assignedChildId) unique
- PointsLedger: (childId, awardedAt), (householdId, awardedAt)
- ParentUser: email unique
- Chore: (householdId, isActive)

TASKS:
1. Update prisma/schema.prisma with all entities, enums, relations, and indexes
2. Run: npx prisma migrate dev --name init-schema
3. Create packages/shared-types/src/entities.ts — export TypeScript interfaces for each entity
4. Create packages/shared-types/src/enums.ts — export all enum values
5. Create packages/shared-types/src/dtos.ts — export request/response DTOs
6. Create a seed script (prisma/seed.ts) that creates a test household, parent, 2 children, and sample chores
7. Update docs/DB_SCHEMA.md with entity descriptions, relationships, and index strategy

DONE CRITERIA: Prisma migration runs clean, schema supports all MVP flows, seed data loads, shared types compile.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Complete Prisma schema, migration, shared types, seed script, DB_SCHEMA.md",
    "dependsOn": [tasks["phase01"]]
})
tasks["phase2"] = phase2["taskId"]
print(f"Phase 2: {phase2['taskId']}")

# ── Phase 3: Self-Hosted Auth ─────────────────────────────────────────
phase3 = post(f"{API}/tasks", {
    "objective": f"""Phase 3 — Self-Hosted Authentication and Session Management

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 3.

PREREQUISITE: Phase 2 must be complete (database schema with ParentUser and RefreshTokenSession tables).

GOAL: Implement parent authentication entirely inside the NestJS API. NO external auth providers.

TECH DECISIONS (LOCKED):
- Argon2id for password hashing
- JWT access tokens (15 min expiry)
- Refresh tokens stored server-side, revocable
- No email verification in V1

CREATE THESE IN apps/api:

1. Auth Module (src/auth/):
   - auth.module.ts — imports JwtModule, PassportModule
   - auth.service.ts — signup, login, refresh, logout logic
   - auth.controller.ts — REST endpoints
   - jwt.strategy.ts — Passport JWT strategy
   - jwt-auth.guard.ts — route guard
   - household.guard.ts — ensures user belongs to the household they're accessing

2. API Endpoints:
   POST /auth/signup — {{ email, password, displayName }}
     - Validate email format, password min 8 chars
     - Hash password with Argon2id
     - Create ParentUser record
     - Return access token + refresh token

   POST /auth/login — {{ email, password }}
     - Verify credentials
     - Generate JWT access token (payload: userId, email, role, householdId)
     - Generate refresh token, store in RefreshTokenSession
     - Return both tokens

   POST /auth/refresh — {{ refreshToken }}
     - Validate refresh token exists and not expired/revoked
     - Rotate: revoke old, issue new refresh token + new access token
     - Return new tokens

   POST /auth/logout — {{ refreshToken }} (requires JWT auth)
     - Revoke the refresh token session
     - Return success

   GET /auth/me — (requires JWT auth)
     - Return current user profile (id, email, displayName, role, householdId)

3. JWT Configuration:
   - Secret from env var JWT_SECRET
   - Access token expiry from env var JWT_EXPIRY (default 15m)
   - Refresh token expiry from env var REFRESH_TOKEN_EXPIRY (default 7d)

4. Guards:
   - JwtAuthGuard: validates Bearer token on protected routes
   - HouseholdGuard: ensures authenticated user belongs to the requested household

5. Password Policy:
   - Minimum 8 characters
   - Use class-validator decorators on DTOs

6. Refresh Token Storage:
   - Store hashed token in RefreshTokenSession table
   - Include deviceName field (optional, from user agent)
   - Token rotation on every refresh call
   - Revocation sets revokedAt timestamp

DONE CRITERIA: Parent can signup, login, refresh token, logout. JWT guard protects routes. No external auth provider. Tokens are revocable.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Auth module with signup/login/refresh/logout endpoints, JWT guard, Argon2id hashing",
    "dependsOn": [tasks["phase2"]]
})
tasks["phase3"] = phase3["taskId"]
print(f"Phase 3: {phase3['taskId']}")

# ── Phase 4: Household & Members API ──────────────────────────────────
phase4 = post(f"{API}/tasks", {
    "objective": f"""Phase 4 — Household Setup and Member Management API

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 4 — API endpoints only, no mobile UI.

PREREQUISITE: Phase 3 must be complete (auth working with JWT guards).

GOAL: Let a signed-in parent create a household and manage child profiles via API.

CREATE THESE IN apps/api:

1. Households Module (src/households/):
   - households.module.ts
   - households.service.ts
   - households.controller.ts
   - DTOs for create/update

2. Children Module (src/children/):
   - children.module.ts
   - children.service.ts
   - children.controller.ts
   - DTOs for create/update/deactivate

3. API Endpoints (all require JWT auth):

   POST /households — {{ name, timezone }}
     - Only if parent doesn't already have a household
     - Create household, link parent to it
     - Return household object

   GET /households/me
     - Return current parent's household with member summary

   GET /households/me/members
     - Return all members (parent(s) + children) of the household
     - Include active/inactive status

   POST /households/me/children — {{ displayName, avatarColor, age? }}
     - Only parents can add children
     - Create ChildProfile linked to household
     - Return child object

   PATCH /households/me/children/:childId — {{ displayName?, avatarColor?, age? }}
     - Only parents can edit
     - Validate child belongs to household
     - Return updated child

   POST /households/me/children/:childId/deactivate
     - Only parents can deactivate
     - Set isActive = false
     - Deactivated children hidden from new assignment selections

4. Authorization:
   - All endpoints require JwtAuthGuard
   - HouseholdGuard ensures parent belongs to the household
   - Children cannot access these management endpoints

5. Validation:
   - displayName required, max 50 chars
   - avatarColor optional string
   - timezone must be valid IANA timezone string

DONE CRITERIA: Parent can create household, add/edit/deactivate children via API. Role guards enforced. Child profiles linked to household.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Household and children API endpoints with role-based guards",
    "dependsOn": [tasks["phase3"]]
})
tasks["phase4"] = phase4["taskId"]
print(f"Phase 4: {phase4['taskId']}")

# ── Phase 5: Chore CRUD API ──────────────────────────────────────────
phase5 = post(f"{API}/tasks", {
    "objective": f"""Phase 5 — Chore CRUD API

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 5 — API endpoints only.

PREREQUISITE: Phase 4 must be complete (households and children modules).

GOAL: Allow parents to create, list, edit, archive, and inspect chores via API.

CREATE IN apps/api:

1. Chores Module (src/chores/):
   - chores.module.ts
   - chores.service.ts
   - chores.controller.ts
   - DTOs with class-validator decorators

2. API Endpoints (all require JWT + household guard):

   POST /households/me/chores — Create chore
     Body: {{ title, description?, points, dueTime?, recurrenceType, recurrenceConfig?, assigneeMode, assignedChildId?, approvalRequired }}
     - Validate: title required, points >= 0, valid recurrenceType
     - If assigneeMode = SINGLE, assignedChildId required and must be active child in household
     - If assigneeMode = ROTATION, assignedChildId should be null (rotation group setup separate)
     - Return created chore

   GET /households/me/chores — List chores
     Query params: ?active=true&archived=false
     - Return chores for household with pagination
     - Include assignee info

   GET /households/me/chores/:choreId — Get chore detail
     - Return full chore with recurrence config and current assignee info

   PATCH /households/me/chores/:choreId — Update chore
     Body: {{ title?, description?, points?, dueTime?, recurrenceType?, recurrenceConfig?, assigneeMode?, assignedChildId?, approvalRequired? }}
     - Only parents can edit
     - Validate chore belongs to household

   POST /households/me/chores/:choreId/archive — Archive chore
     - Set isArchived = true, isActive = false
     - Archived chores stop generating new assignments
     - Return updated chore

3. RecurrenceConfig JSON shape:
   - ONCE: {{ }} (no config needed)
   - DAILY: {{ }} (every day)
   - WEEKLY: {{ dayOfWeek: 0-6 }} (0=Sunday)
   - WEEKDAYS: {{ }} (Mon-Fri)
   - CUSTOM: {{ days: [0,1,2,3,4,5,6] }} (specific days)

4. Validation Rules:
   - title: required, 1-100 chars
   - points: required, integer, >= 0
   - recurrenceType: required, valid enum value
   - recurrenceConfig: validated against recurrenceType
   - assignedChildId: must be active child in household when provided

DONE CRITERIA: Full chore CRUD API working. Validation enforced. Archived chores flagged. Parent-only access.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Chore CRUD API endpoints with validation and role guards",
    "dependsOn": [tasks["phase4"]]
})
tasks["phase5"] = phase5["taskId"]
print(f"Phase 5: {phase5['taskId']}")

# ── Phase 6+7: Assignment Generation + Rotation Engine ────────────────
phase67 = post(f"{API}/tasks", {
    "objective": f"""Phase 6+7 — Assignment Generation Engine + Rotation Engine

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phases 6 and 7.

PREREQUISITE: Phase 5 must be complete (chore CRUD working).

GOAL: Generate real dated chore assignment rows from chore definitions. Implement fair rotation across children.

CREATE IN apps/api:

1. Assignments Module (src/assignments/):
   - assignments.module.ts
   - assignments.service.ts — CRUD and query operations
   - assignment-generator.service.ts — core generation engine
   - assignments.controller.ts
   - DTOs

2. Rotation Module (src/rotation/):
   - rotation.module.ts
   - rotation.service.ts — manages rotation groups, next-assignee logic
   - rotation.controller.ts — endpoints for managing rotation groups

3. Assignment Generation Engine (assignment-generator.service.ts):

   Core method: generateAssignments(householdId, date = today, horizon = 7 days)

   Logic:
   - Fetch all active, non-archived chores for the household
   - For each chore, for each date in [date, date+horizon]:
     - Check if recurrence matches that date (use recurrence matcher)
     - Check if assignment already exists for (choreId, effectiveDate, assignedChildId) — SKIP if exists (idempotent)
     - If assigneeMode = SINGLE: use chore.assignedChildId
     - If assigneeMode = ROTATION: call rotation service to get next child
     - Create ChoreAssignment row with status PENDING

   Recurrence Matcher logic:
   - ONCE: only matches chore.createdAt date
   - DAILY: matches every day
   - WEEKLY: matches if date.dayOfWeek === config.dayOfWeek
   - WEEKDAYS: matches Mon-Fri (dayOfWeek 1-5)
   - CUSTOM: matches if date.dayOfWeek in config.days

4. Rotation Service (rotation.service.ts):

   getNextAssignee(choreId):
   - Load RotationGroup for chore
   - Load RotationMembers ordered by orderIndex
   - Filter out inactive children
   - Get member at currentIndex
   - Advance currentIndex (wrap around)
   - Return selected childId

   createRotationGroup(choreId, childIds):
   - Create RotationGroup with currentIndex=0
   - Create RotationMember entries with sequential orderIndex

   reorderMembers(rotationGroupId, childIds in new order):
   - Update orderIndex values to match new order

5. API Endpoints:

   POST /households/me/assignments/generate — Trigger assignment generation
     - Calls generateAssignments for household
     - Returns count of new assignments created

   GET /households/me/assignments — List assignments
     Query: ?date=2026-03-07&childId=xxx&status=PENDING
     - Return assignments for household, filterable

   GET /households/me/assignments/:assignmentId — Get assignment detail

   POST /households/me/chores/:choreId/rotation — Set up rotation
     Body: {{ childIds: [id1, id2, ...] }}
     - Create/update rotation group

   GET /households/me/chores/:choreId/rotation — Get rotation info
     - Return rotation members and next assignee preview

   PATCH /households/me/chores/:choreId/rotation/reorder — Reorder
     Body: {{ childIds: [id2, id1, ...] }}

6. Assignment generation should be called:
   - Explicitly via the generate endpoint
   - Also triggered automatically before dashboard fetch (ensure current assignments exist)

7. CRITICAL: Duplicate prevention
   - Unique constraint on (choreId, effectiveDate, assignedChildId)
   - Use upsert or check-before-insert pattern
   - Multiple calls to generate must not create duplicate rows

DONE CRITERIA: Assignments generate correctly for all recurrence types. Rotation cycles through children deterministically. No duplicates on repeated generation. Idempotent.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Assignment generation engine, rotation engine, API endpoints, duplicate prevention",
    "dependsOn": [tasks["phase5"]]
})
tasks["phase67"] = phase67["taskId"]
print(f"Phase 6+7: {phase67['taskId']}")

# ── Phase 8: Dashboard APIs ───────────────────────────────────────────
phase8 = post(f"{API}/tasks", {
    "objective": f"""Phase 8 — Parent and Child Dashboard API Endpoints

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 8 — API endpoints only, no mobile screens.

PREREQUISITE: Phase 6+7 must be complete (assignments and rotation working).

GOAL: Create aggregation endpoints that power parent and child dashboards.

CREATE IN apps/api:

1. Dashboard Module (src/dashboard/):
   - dashboard.module.ts
   - dashboard.service.ts
   - dashboard.controller.ts

2. API Endpoints:

   GET /households/me/dashboard/parent
   Returns:
   {{
     household: {{ name, memberCount }},
     today: {{
       totalAssignments: number,
       completedCount: number,
       pendingCount: number,
       overdueCount: number
     }},
     childSummaries: [
       {{
         childId, displayName, avatarColor,
         todayChores: number,
         completedToday: number,
         pendingApprovals: number,
         points: {{ weekly: number, lifetime: number }},
         streak: number
       }}
     ],
     pendingApprovals: [
       {{ assignmentId, choreTitle, childName, completedAt }}
     ],
     overdueChores: [
       {{ assignmentId, choreTitle, childName, dueAt }}
     ],
     leaderboard: [
       {{ childId, displayName, weeklyPoints, rank }}
     ]
   }}

   GET /households/me/dashboard/child/:childId
   Returns:
   {{
     child: {{ displayName, avatarColor }},
     today: {{
       assignments: [ {{ assignmentId, choreTitle, status, dueAt, points }} ],
       completedCount: number,
       pendingCount: number
     }},
     awaitingApproval: [ {{ assignmentId, choreTitle, completedAt }} ],
     points: {{ weekly: number, lifetime: number }},
     streak: number,
     leaderboard: [
       {{ childId, displayName, weeklyPoints, rank }}
     ]
   }}

3. Logic:
   - Before fetching dashboard data, auto-trigger assignment generation for today
   - Calculate overdue: assignments where status=PENDING and dueAt < now
   - Points queries will be simple SUM for now (proper ledger in Phase 10)
   - Streak is placeholder 0 for now (proper engine in Phase 11)
   - Leaderboard is simple weekly points ranking (proper in Phase 12)

4. Authorization:
   - Parent dashboard: requires parent role
   - Child dashboard: parent can view any child in household, child can view own (future)

DONE CRITERIA: Dashboard endpoints return structured data. Auto-generates today's assignments. Overdue detection works.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Dashboard aggregation API endpoints for parent and child views",
    "dependsOn": [tasks["phase67"]]
})
tasks["phase8"] = phase8["taskId"]
print(f"Phase 8: {phase8['taskId']}")

# ── Phase 9: Completion & Approval ────────────────────────────────────
phase9 = post(f"{API}/tasks", {
    "objective": f"""Phase 9 — Completion and Approval Workflow API

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 9.

PREREQUISITE: Phase 8 must be complete (dashboard endpoints exist, assignments queryable).

GOAL: Implement the core household loop: child completes chore → parent approves/rejects → points awarded.

UPDATE assignments module in apps/api:

1. New endpoints in assignments.controller.ts:

   POST /assignments/:assignmentId/complete
   Body: {{ note?: string }}
   Auth: any household member (child or parent)
   Logic:
   - Validate assignment exists and belongs to user's household
   - Status must be PENDING
   - If chore.approvalRequired = true: set status to AWAITING_APPROVAL
   - If chore.approvalRequired = false: set status to APPROVED, auto-award points
   - Store completedAt timestamp and optional note
   - Return updated assignment

   GET /households/me/approvals/pending
   Auth: parent only
   Returns: list of assignments with status AWAITING_APPROVAL, sorted by completedAt
   Include: choreTitle, childName, completedAt, note

   POST /assignments/:assignmentId/approve
   Auth: parent only
   Logic:
   - Validate status is AWAITING_APPROVAL
   - Set status to APPROVED
   - Store approvedAt, approverId
   - Award points to PointsLedger (CRITICAL: use assignmentId unique constraint to prevent double-award)
   - Return updated assignment

   POST /assignments/:assignmentId/reject
   Body: {{ reason?: string }}
   Auth: parent only
   Logic:
   - Validate status is AWAITING_APPROVAL
   - Set status to REJECTED
   - Store rejectedAt, rejectionReason
   - Do NOT award points
   - Return updated assignment

2. State Transition Rules:
   PENDING → COMPLETED (if no approval required) or AWAITING_APPROVAL
   AWAITING_APPROVAL → APPROVED or REJECTED
   No other transitions allowed (guard against invalid state changes)

3. Points Award Logic:
   - On approval, insert into PointsLedger:
     {{ householdId, childId, assignmentId, points: chore.points, reason: 'chore_approved' }}
   - UNIQUE constraint on assignmentId prevents double-award
   - Wrap in transaction: update assignment status + insert points ledger

4. Overdue Detection:
   - Create a method or scheduled job that marks PENDING assignments as OVERDUE
     if dueAt exists and dueAt < current time
   - Run this check during dashboard fetch and/or on a schedule

DONE CRITERIA: Child can complete. Parent can approve/reject. Points awarded once only. State transitions valid. No double-credit bug.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Completion/approval workflow endpoints with points awarding and state validation",
    "dependsOn": [tasks["phase8"]]
})
tasks["phase9"] = phase9["taskId"]
print(f"Phase 9: {phase9['taskId']}")

# ── Phase 10+11+12: Points, Streaks, Leaderboard ─────────────────────
phase101112 = post(f"{API}/tasks", {
    "objective": f"""Phase 10+11+12 — Points Ledger, Streak Engine, and Weekly Leaderboard

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phases 10, 11, and 12.

PREREQUISITE: Phase 9 must be complete (approval workflow awarding points).

GOAL: Build proper points queries, streak calculation, and leaderboard ranking.

CREATE/UPDATE IN apps/api:

1. Points Module (src/points/):
   - points.module.ts
   - points.service.ts
   - points.controller.ts

   Endpoints:
   GET /households/me/points/child/:childId — lifetime and weekly totals
   GET /households/me/points/weekly — all children's weekly totals (for leaderboard)
   POST /households/me/points/recalculate — admin utility to recalculate from ledger (debugging)

   Service methods:
   - getLifetimePoints(childId): SUM points FROM PointsLedger WHERE childId
   - getWeeklyPoints(childId, weekStart): SUM points WHERE childId AND awardedAt >= weekStart
   - getHouseholdWeeklyRanking(householdId): ranked list of children by weekly points

   Week boundary: use household timezone, Monday = start of week

2. Streak Module (src/streaks/):
   - streak.service.ts

   LOCKED DECISION: V1 streak rule = "child maintains streak if ALL assigned chores for that day are approved"

   Algorithm:
   - Start from today, walk backwards day by day
   - For each day, check: were there any assignments? If yes, were ALL approved?
   - If all approved: streak++, continue to previous day
   - If any not approved (or pending/overdue): streak breaks, stop
   - Skip days with no assignments (don't break streak on no-chore days)
   - Return {{ currentStreak: number, lastSuccessfulDay: date }}

   Service method: getCurrentStreak(childId, householdTimezone): {{ streak, lastDay }}

3. Leaderboard Module (src/leaderboard/):
   - leaderboard.service.ts
   - leaderboard.controller.ts

   Endpoint:
   GET /households/me/leaderboard — weekly leaderboard
   Returns: [{{ childId, displayName, avatarColor, weeklyPoints, completedChores, rank }}]

   Logic:
   - Query weekly points for all active children in household
   - Rank by points descending
   - Ties get same rank
   - Include completed chore count as secondary metric

4. Update Dashboard endpoints:
   - Replace placeholder streak=0 with real streak calculation
   - Replace placeholder leaderboard with real weekly ranking
   - Ensure points show real ledger-backed values

DONE CRITERIA: Points are ledger-backed and idempotent. Streak logic is deterministic. Leaderboard ranks by weekly points. Dashboard shows real values.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Points service, streak calculator, leaderboard ranking, dashboard integration",
    "dependsOn": [tasks["phase9"]]
})
tasks["phase101112"] = phase101112["taskId"]
print(f"Phase 10+11+12: {phase101112['taskId']}")

# ── Phase 13: Notifications Backend ───────────────────────────────────
phase13 = post(f"{API}/tasks", {
    "objective": f"""Phase 13 — Notifications and Event Feed Backend

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 13 — backend notification system only, no mobile push.

PREREQUISITE: Phase 10+11+12 must be complete.

GOAL: Create on-prem notification event system. Backend generates events, stores them, exposes via API.

CREATE IN apps/api:

1. Notifications Module (src/notifications/):
   - notifications.module.ts
   - notifications.service.ts — writes notification events
   - notifications.controller.ts — API endpoints

2. Notification Event Writer (notifications.service.ts):
   Methods that create NotificationEvent records:

   - createDueReminder(assignment): for assignments due within reminder window
   - createOverdueAlert(assignment): for assignments past due
   - createCompletionAlert(assignment): notify parent when child completes
   - createApprovalAlert(assignment): notify child when parent approves
   - createRejectionAlert(assignment): notify child when parent rejects

   Each method:
   - Check if duplicate exists (same type + relatedAssignmentId + targetUserId in last 24h)
   - If not duplicate, create NotificationEvent record
   - Return the event or null if suppressed

3. API Endpoints:

   GET /households/me/notifications — Event feed
   Query: ?unreadOnly=true&limit=50
   Returns: list of notification events for the current user, newest first

   POST /households/me/notifications/:id/read — Mark as read
   Sets isRead = true

   POST /households/me/notifications/read-all — Mark all as read

   GET /households/me/notifications/preferences — Get notification preferences
   POST /households/me/notifications/preferences — Update preferences
   Body: {{ remindersEnabled, overdueAlertsEnabled, approvalAlertsEnabled }}

4. Integration Points:
   - Hook into assignment completion flow → create completionAlert for parent
   - Hook into approval flow → create approvalAlert for child
   - Hook into rejection flow → create rejectionAlert for child

5. Scheduled Job (using @nestjs/schedule):
   - Every 15 minutes: scan for assignments due within next 30 minutes → create due reminders
   - Every 15 minutes: scan for overdue assignments → create overdue alerts
   - Respect user notification preferences (skip if disabled)
   - Duplicate suppression prevents spam

6. IMPORTANT: No cloud push. Events are stored on-prem. Mobile app will poll/sync the event feed.

DONE CRITERIA: Events generated on completion/approval/rejection. Scheduled due/overdue reminders. Duplicate suppression. Event feed API works.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Notification event system, event feed API, scheduled reminder jobs, duplicate suppression",
    "dependsOn": [tasks["phase101112"]]
})
tasks["phase13"] = phase13["taskId"]
print(f"Phase 13: {phase13['taskId']}")

# ── Phase 14: Settings API ────────────────────────────────────────────
phase14 = post(f"{API}/tasks", {
    "objective": f"""Phase 14 — Settings and Household Controls API

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 14 — API endpoints only.

PREREQUISITE: Phase 4 must be complete (household module exists).

GOAL: Give parents API control over household behavior.

CREATE/UPDATE IN apps/api:

1. Settings endpoints in households.controller.ts (or new settings.controller.ts):

   GET /households/me/settings — Get household settings
   Returns: {{ name, timezone, defaultApprovalRequired, pointsEnabled, remindersEnabled }}

   PATCH /households/me/settings — Update settings
   Body: {{ name?, timezone?, defaultApprovalRequired?, pointsEnabled?, remindersEnabled? }}
   Auth: parent only
   - Update household record
   - Return updated settings

   GET /households/me/chores/archived — List archived chores
   Returns: archived chores for review/restore

   POST /households/me/chores/:choreId/restore — Restore archived chore
   - Set isArchived = false, isActive = true

2. Settings stored in Household.settings JSON field:
   {{ defaultApprovalRequired: bool, pointsEnabled: bool, remindersEnabled: bool }}

3. Authorization: Only parents can access settings endpoints. Children get 403.

DONE CRITERIA: Parent can view/update household settings via API. Archived chores manageable. Role-guarded.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Household settings API endpoints with role guards",
    "dependsOn": [tasks["phase4"]]
})
tasks["phase14"] = phase14["taskId"]
print(f"Phase 14: {phase14['taskId']}")

# ── Phase 16: DevOps ─────────────────────────────────────────────────
phase16 = post(f"{API}/tasks", {
    "objective": f"""Phase 16 — DevOps, Deployment, Backups, and Runbooks

Working Directory: {WORK_DIR}

Read SPEC.md for full context. This task covers Phase 16.

PREREQUISITE: Phase 0+1 must be complete (Docker Compose baseline exists).

GOAL: Make the system production-ready for on-prem deployment.

CREATE/UPDATE:

1. Update infra/docker/docker-compose.yml for production:
   - api service: multi-stage Dockerfile (build + runtime), health check, restart policy
   - postgres service: named volume, pg_hba.conf for security, health check
   - nginx service: production SSL config placeholder, rate limiting
   - Add docker-compose.dev.yml override for development (hot reload, debug ports)

2. Create infra/docker/Dockerfile.api:
   - Multi-stage: node:20-alpine for build, node:20-alpine for runtime
   - Copy only production dependencies
   - Run prisma generate
   - Expose port 3000
   - CMD: node dist/main.js

3. Create infra/scripts/backup.sh:
   - pg_dump to timestamped file
   - Compress with gzip
   - Keep last 7 daily backups
   - Log success/failure

4. Create infra/scripts/restore.sh:
   - Take backup file as argument
   - Decompress and pg_restore
   - Verify row counts after restore

5. Create infra/scripts/migrate.sh:
   - Run prisma migrate deploy
   - Log migration status

6. Create infra/scripts/deploy.sh:
   - Pull latest code
   - Run migrations
   - Build and restart containers
   - Health check after deploy

7. Update docs/DEPLOYMENT_ON_PREM.md:
   - Prerequisites (Docker, Docker Compose)
   - First-time setup instructions
   - Environment variable reference
   - SSL/TLS certificate setup
   - Network configuration

8. Update docs/RUNBOOK.md:
   - Startup procedure
   - Shutdown procedure
   - Backup schedule recommendation
   - Restore procedure
   - Troubleshooting common issues
   - How to check logs
   - How to update/upgrade

9. Create docs/BACKUP_RESTORE.md:
   - Backup strategy
   - Retention policy
   - Restore steps
   - Verification checklist

10. Create API health check endpoint enhancements:
    GET /health — basic health
    GET /health/detailed — includes DB connectivity, disk space, uptime

DONE CRITERIA: Docker builds succeed. Backup script works. Restore tested. Deploy script runs. Docs complete enough for another operator.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Production Docker setup, backup/restore scripts, deploy script, operational docs",
    "dependsOn": [tasks["phase01"]]
})
tasks["phase16"] = phase16["taskId"]
print(f"Phase 16: {phase16['taskId']}")

# ── Summary ───────────────────────────────────────────────────────────
print("\n" + "="*60)
print("DISPATCH COMPLETE — ChoreQuest On-Prem Backend")
print("="*60)
print(f"\nProject ID: {PROJECT_ID}")
print(f"\nTasks dispatched:")
for name, tid in tasks.items():
    print(f"  {name:20s} → {tid}")
print(f"\nDependency chain:")
print(f"  Phase 0+1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6+7 → Phase 8 → Phase 9 → Phase 10-12 → Phase 13")
print(f"  Phase 4 → Phase 14 (settings, parallel)")
print(f"  Phase 0+1 → Phase 16 (devops, parallel)")
print(f"\nSkipped: Phase 15 (UX/mobile), Phase 17 (QA - dispatch after build)")
print(f"\nMobile frontend deferred — will be dispatched when laptop is ready.")
