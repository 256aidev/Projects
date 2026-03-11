"""
Dispatch ChoreQuest v2 — Backend API implementation + Frontend build.
The swarm built the foundation (schema, Docker, docs) but the actual
API controllers/services are mostly missing. This dispatch fixes that
and adds the frontend.
"""
import json, urllib.request

API = "http://localhost:5100"
PROJECT_ID = "1be2cac6-54bc-48cd-8df5-004fbbffdd95"
WORK_DIR = "C:\\Projects\\256ai-projects\\ChoreQuest"

# Exclude AI02 workers — their Claude Code has compatibility issues
EXCLUDE_WORKERS = ["worker-ai02-claude", "worker-ai02-coder-001", "worker-ai02-coder-002"]

def post(url, data):
    if "objective" in data and "excludeWorkers" not in data:
        data["excludeWorkers"] = EXCLUDE_WORKERS
    req = urllib.request.Request(url, json.dumps(data).encode(), {"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

tasks = {}

# ── Backend Phase A: Auth Module Complete ──────────────────────────────
backendA = post(f"{API}/tasks", {
    "objective": f"""Backend Phase A — Complete Auth Module with Controller, Guards, and JWT Strategy

Working Directory: {WORK_DIR}

CONTEXT: The ChoreQuest backend has a NestJS API at apps/api with Prisma schema fully defined.
An auth.service.ts exists with signup/login/refresh/logout/getProfile methods.
BUT there is NO auth.controller.ts, NO auth.module.ts, NO JWT strategy, and NO guards.

YOUR JOB: Complete the auth module so all auth endpoints actually work via HTTP.

1. Create apps/api/src/auth/auth.module.ts:
   - Import JwtModule.registerAsync (use ConfigService for secret/expiry from env)
   - Import PassportModule
   - Import PrismaModule
   - Provide AuthService
   - Export AuthService, JwtModule

2. Create apps/api/src/auth/jwt.strategy.ts:
   - Extend PassportStrategy(Strategy) from passport-jwt
   - Extract JWT from Bearer token
   - Validate payload, return {{ userId, email, role, householdId }}

3. Create apps/api/src/auth/guards/jwt-auth.guard.ts:
   - Extend AuthGuard('jwt')

4. Create apps/api/src/auth/guards/roles.guard.ts:
   - Check user.role against required roles
   - Use @Roles('parent') decorator

5. Create apps/api/src/auth/auth.controller.ts:
   @Controller('auth')
   - POST /auth/signup — call authService.signup, return tokens
   - POST /auth/login — call authService.login, return tokens
   - POST /auth/refresh — call authService.refresh, return tokens
   - POST /auth/logout — @UseGuards(JwtAuthGuard), call authService.logout
   - GET /auth/me — @UseGuards(JwtAuthGuard), call authService.getProfile

6. Update apps/api/src/app.module.ts:
   - Import AuthModule

7. Fix auth.service.ts if needed:
   - Make sure signup creates a Household automatically for the first user
   - Ensure JWT payload includes householdId
   - Check refresh.dto.ts and logout.dto.ts have proper fields

8. Install any missing packages: npm install @nestjs/jwt @nestjs/passport passport passport-jwt argon2
   Also: npm install -D @types/passport-jwt

VERIFY: npm run build succeeds. The auth endpoints should be callable.

DONE CRITERIA: POST /api/auth/signup returns tokens. POST /api/auth/login works. JWT guard protects routes.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Complete auth module with controller, JWT strategy, guards, working endpoints"
})
tasks["backendA"] = backendA["taskId"]
print(f"Backend A (Auth): {backendA['taskId']}")

# ── Backend Phase B: Households + Children + Chores ───────────────────
backendB = post(f"{API}/tasks", {
    "objective": f"""Backend Phase B — Households, Children, and Chores CRUD Modules

Working Directory: {WORK_DIR}

CONTEXT: NestJS API at apps/api. Prisma schema has Household, User (parent/child roles), Chore models.
Auth module should be complete (Phase A). JWT guards available.

YOUR JOB: Create three complete NestJS modules with controllers, services, and DTOs.

=== 1. HOUSEHOLDS MODULE (src/households/) ===

households.module.ts, households.service.ts, households.controller.ts

Endpoints (all @UseGuards(JwtAuthGuard)):
- GET /households/me — get current user's household with member count
- PATCH /households/me — update household (name, timezone, settings) — parent only
- GET /households/me/members — list all household members (parents + children)

Service methods:
- getHousehold(householdId): return household with settings
- updateHousehold(householdId, dto): update name/timezone/settings
- getMembers(householdId): return all users in household

=== 2. CHILDREN MODULE (src/children/) ===

children.module.ts, children.service.ts, children.controller.ts

Endpoints (all @UseGuards(JwtAuthGuard), parent only):
- POST /households/me/children — create child profile (displayName, avatarColor, age?)
- PATCH /households/me/children/:childId — update child
- POST /households/me/children/:childId/deactivate — set isActive=false

Service methods:
- createChild(householdId, dto): create User with role=CHILD
- updateChild(householdId, childId, dto): update display info
- deactivateChild(householdId, childId): soft deactivate

Validation: displayName required max 50, avatarColor optional, child must belong to household

=== 3. CHORES MODULE (src/chores/) ===

chores.module.ts, chores.service.ts, chores.controller.ts

Endpoints (all @UseGuards(JwtAuthGuard)):
- POST /households/me/chores — create chore (title, description?, points, recurrenceType, recurrenceConfig?, assigneeMode, assignedChildId?, approvalRequired)
- GET /households/me/chores — list chores (?active=true&archived=false)
- GET /households/me/chores/:choreId — get chore detail
- PATCH /households/me/chores/:choreId — update chore (parent only)
- POST /households/me/chores/:choreId/archive — archive chore (parent only)
- POST /households/me/chores/:choreId/restore — restore archived chore (parent only)

Validation:
- title: required, 1-100 chars
- points: required, integer >= 0
- recurrenceType: ONCE, DAILY, WEEKLY, WEEKDAYS, CUSTOM
- If assigneeMode=SINGLE, assignedChildId required and must be active child

DTOs: Create proper class-validator DTOs for all create/update operations.

For ALL modules:
- Extract householdId from JWT token (req.user.householdId)
- Use PrismaService for database access
- Import modules in app.module.ts
- Ensure npm run build succeeds

DONE CRITERIA: All three modules have working CRUD endpoints. Validation enforced. Parent-only guards on write operations.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Households, Children, Chores modules with full CRUD endpoints",
    "dependsOn": [tasks["backendA"]]
})
tasks["backendB"] = backendB["taskId"]
print(f"Backend B (Households/Children/Chores): {backendB['taskId']}")

# ── Backend Phase C: Assignments + Rotation + Dashboard ──────────────
backendC = post(f"{API}/tasks", {
    "objective": f"""Backend Phase C — Assignments, Rotation Engine, and Dashboard Endpoints

Working Directory: {WORK_DIR}

CONTEXT: NestJS API at apps/api. Prisma schema has ChoreAssignment, RotationGroup, RotationMember.
Households, Children, and Chores modules should be complete (Phase B).

YOUR JOB: Create three modules — the core scheduling and dashboard system.

=== 1. ASSIGNMENTS MODULE (src/assignments/) ===

Controller endpoints (all JWT guarded):
- POST /households/me/assignments/generate — trigger assignment generation for household
- GET /households/me/assignments — list assignments (?date=YYYY-MM-DD&childId=xxx&status=PENDING)
- GET /households/me/assignments/:id — get assignment detail
- POST /assignments/:id/complete — mark complete (any household member)
  Body: {{ note?: string }}
  If chore.approvalRequired=true: set AWAITING_APPROVAL
  If false: set APPROVED, auto-award points
- POST /assignments/:id/approve — parent only, award points
- POST /assignments/:id/reject — parent only, set REJECTED with reason

Assignment Generation Engine (assignment-generator.service.ts):
- generateAssignments(householdId, date=today, horizon=7):
  - For each active chore, for each date in range:
    - Check recurrence matches date
    - Check no duplicate (choreId + effectiveDate + assignedChildId)
    - If SINGLE mode: use chore.assignedChildId
    - If ROTATION mode: call rotation service for next child
    - Create ChoreAssignment with status PENDING

Recurrence matching:
- ONCE: matches chore.createdAt date only
- DAILY: every day
- WEEKLY: config.dayOfWeek matches date.getDay()
- WEEKDAYS: Mon-Fri (1-5)
- CUSTOM: date.getDay() in config.days array

=== 2. ROTATION MODULE (src/rotation/) ===

rotation.service.ts:
- getNextAssignee(choreId): load RotationGroup, get member at currentIndex, advance index, return childId
- createRotationGroup(choreId, childIds): create group + members with orderIndex
- getRotationGroup(choreId): return group with members
- reorderMembers(groupId, childIds): update orderIndex values

Controller endpoints:
- POST /households/me/chores/:choreId/rotation — create/update rotation group {{ childIds: [] }}
- GET /households/me/chores/:choreId/rotation — get rotation info
- PATCH /households/me/chores/:choreId/rotation/reorder — reorder {{ childIds: [] }}

=== 3. DASHBOARD MODULE (src/dashboard/) ===

Controller endpoints:
- GET /households/me/dashboard/parent — aggregated parent view
  Returns: household summary, today's stats (total/completed/pending/overdue),
  child summaries (each child's progress, points, streak placeholder),
  pending approvals list, overdue list, leaderboard

- GET /households/me/dashboard/child/:childId — child view
  Returns: child info, today's assignments with status, points (weekly/lifetime),
  awaiting approval list, streak placeholder, leaderboard position

Dashboard auto-triggers assignment generation for today before fetching data.

Points calculation:
- SUM from PointsLedger WHERE childId (lifetime)
- SUM from PointsLedger WHERE childId AND awardedAt >= weekStart (weekly)

Points award on approval:
- Insert PointsLedger entry with assignmentId (unique constraint prevents double-award)
- Wrap status update + points insert in transaction

Import all modules in app.module.ts. Ensure npm run build succeeds.

DONE CRITERIA: Assignments generate correctly. Rotation cycles deterministically. Dashboard returns real data. Completion/approval workflow awards points once.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Assignment engine, rotation service, dashboard endpoints, completion/approval workflow",
    "dependsOn": [tasks["backendB"]]
})
tasks["backendC"] = backendC["taskId"]
print(f"Backend C (Assignments/Rotation/Dashboard): {backendC['taskId']}")

# ── Backend Phase D: Points, Streaks, Leaderboard, Notifications ─────
backendD = post(f"{API}/tasks", {
    "objective": f"""Backend Phase D — Points, Streaks, Leaderboard, Notifications, and Settings

Working Directory: {WORK_DIR}

CONTEXT: NestJS API at apps/api. Previous phases built auth, households, children, chores,
assignments, rotation, and dashboard. This phase adds the remaining features.

YOUR JOB: Create the remaining modules to complete the backend API.

=== 1. POINTS MODULE (src/points/) ===
- GET /households/me/points/child/:childId — lifetime + weekly totals
- GET /households/me/points/weekly — all children's weekly totals
- Week boundary: Monday = start, use household timezone

=== 2. STREAKS SERVICE (src/streaks/streak.service.ts) ===
- getCurrentStreak(childId, timezone):
  Walk backwards from today. For each day:
  - If assignments exist and ALL approved: streak++
  - If any not approved: break
  - Skip days with no assignments
  Return {{ currentStreak: number, lastSuccessfulDay: date }}

=== 3. LEADERBOARD (src/leaderboard/) ===
- GET /households/me/leaderboard — weekly leaderboard
  Returns: [{{ childId, displayName, avatarColor, weeklyPoints, completedChores, rank }}]
  Rank by points descending. Ties get same rank.

=== 4. NOTIFICATIONS MODULE (src/notifications/) ===
- GET /households/me/notifications — event feed (?unreadOnly=true&limit=50)
- POST /households/me/notifications/:id/read — mark as read
- POST /households/me/notifications/read-all — mark all read
- GET /households/me/notifications/preferences — get preferences
- POST /households/me/notifications/preferences — update preferences

Notification event writer service:
- createCompletionAlert(assignment): notify parent when child completes
- createApprovalAlert(assignment): notify child when approved
- createRejectionAlert(assignment): notify child when rejected
- Duplicate suppression: check same type + assignmentId + targetUser in last 24h

Hook into assignment completion and approval flows (import NotificationsModule in AssignmentsModule).

Scheduled job (using @nestjs/schedule @Cron):
- Every 15 min: scan for assignments due within 30 min → create due reminders
- Every 15 min: scan for overdue assignments → create overdue alerts
- Respect notification preferences

=== 5. SETTINGS (in households controller) ===
- GET /households/me/settings — return household settings JSON
- PATCH /households/me/settings — update settings (defaultApprovalRequired, pointsEnabled, remindersEnabled)

=== 6. UPDATE DASHBOARD ===
- Replace streak placeholder with real streak calculation
- Replace leaderboard placeholder with real weekly ranking
- Ensure points use real PointsLedger values

Import all new modules in app.module.ts. npm run build must succeed.

DONE CRITERIA: Points are ledger-backed. Streaks calculate correctly. Leaderboard ranks. Notifications generate on events. Settings configurable.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Points, streaks, leaderboard, notifications, settings — complete backend API",
    "dependsOn": [tasks["backendC"]]
})
tasks["backendD"] = backendD["taskId"]
print(f"Backend D (Points/Streaks/Leaderboard/Notifications): {backendD['taskId']}")

# ── Frontend Phase 1: Setup + Auth + API Client ──────────────────────
frontend1 = post(f"{API}/tasks", {
    "objective": f"""Frontend Phase 1 — React Web App Setup, Auth Pages, and API Client

Working Directory: {WORK_DIR}

CONTEXT: ChoreQuest is a family chore tracking app. The backend is a NestJS API at apps/api
with REST endpoints under /api prefix. This task creates the web frontend.

YOUR JOB: Create a React web app at apps/web with auth pages and an API client.

1. Create the React app with Vite:
   cd apps && npm create vite@latest web -- --template react-ts
   cd web && npm install
   npm install react-router-dom axios tailwindcss @tailwindcss/vite

2. Configure Tailwind CSS with Vite plugin (v4 style):
   - Add @tailwindcss/vite to vite.config.ts plugins
   - Add @import "tailwindcss" to src/index.css

3. Configure Vite proxy for API:
   In vite.config.ts, add proxy: {{ '/api': 'http://localhost:3000', '/health': 'http://localhost:3000' }}

4. Create src/api/client.ts:
   - Axios instance with baseURL '/api'
   - Request interceptor: attach Bearer token from localStorage
   - Response interceptor: on 401, try refresh token, retry request
   - If refresh fails, redirect to /login

5. Create src/api/auth.ts:
   - signup(email, password, displayName): POST /auth/signup
   - login(email, password): POST /auth/login
   - refresh(refreshToken): POST /auth/refresh
   - logout(): POST /auth/logout
   - getMe(): GET /auth/me
   - Store tokens in localStorage (accessToken, refreshToken)

6. Create src/context/AuthContext.tsx:
   - React context providing: user, isAuthenticated, login, signup, logout
   - On mount, check localStorage for token and call getMe()
   - Provide loading state while checking auth

7. Create src/pages/LoginPage.tsx:
   - Clean login form: email + password fields
   - Submit calls authContext.login
   - Link to signup page
   - Error display for invalid credentials
   - Redirect to /dashboard on success

8. Create src/pages/SignupPage.tsx:
   - Signup form: email + password + confirm password + display name
   - Submit calls authContext.signup
   - Validation: passwords match, min 8 chars
   - Redirect to /dashboard on success

9. Create src/App.tsx with React Router:
   - / → redirect to /dashboard
   - /login → LoginPage
   - /signup → SignupPage
   - /dashboard → DashboardPage (placeholder, protected route)
   - Protected route wrapper: redirect to /login if not authenticated

10. Create src/components/Layout.tsx:
    - Top navigation bar with logo "ChoreQuest", nav links, user menu
    - Show different nav items based on user role (parent vs child)
    - Logout button
    - Responsive: hamburger menu on mobile

11. Style everything with Tailwind:
    - Clean, modern design
    - Color scheme: indigo/purple primary, warm accents for gamification
    - Mobile-first responsive
    - Card-based layout

VERIFY: npm run dev starts successfully. Login and signup pages render.

DONE CRITERIA: React app boots, auth pages work, API client handles tokens, protected routes redirect.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "React web app with Vite, Tailwind, auth pages, API client, routing",
    "dependsOn": [tasks["backendA"]]
})
tasks["frontend1"] = frontend1["taskId"]
print(f"Frontend 1 (Setup/Auth): {frontend1['taskId']}")

# ── Frontend Phase 2: Dashboards + Approval ──────────────────────────
frontend2 = post(f"{API}/tasks", {
    "objective": f"""Frontend Phase 2 — Parent Dashboard, Child Dashboard, and Approval Workflow

Working Directory: {WORK_DIR}

CONTEXT: React web app at apps/web with Vite + Tailwind + React Router.
Auth context and API client exist from Phase 1. Backend has dashboard and assignment endpoints.

YOUR JOB: Build the main dashboard screens and approval workflow UI.

=== 1. API FUNCTIONS ===

Create src/api/dashboard.ts:
- getParentDashboard(): GET /households/me/dashboard/parent
- getChildDashboard(childId): GET /households/me/dashboard/child/:childId

Create src/api/assignments.ts:
- getAssignments(params): GET /households/me/assignments
- completeAssignment(id, note?): POST /assignments/:id/complete
- approveAssignment(id): POST /assignments/:id/approve
- rejectAssignment(id, reason?): POST /assignments/:id/reject
- generateAssignments(): POST /households/me/assignments/generate
- getPendingApprovals(): GET /households/me/approvals/pending

=== 2. PARENT DASHBOARD (src/pages/ParentDashboardPage.tsx) ===

Layout:
- Welcome header with household name
- Stats row: 4 cards showing today's total/completed/pending/overdue counts
- Child summary cards: grid of cards, each showing:
  - Child avatar (colored circle with initial) + name
  - Progress bar (completed/total today)
  - Weekly points + streak count
  - Click to view child detail
- Pending Approvals section:
  - List of assignments awaiting approval
  - Each row: chore title, child name, completed time, note preview
  - Approve (green) / Reject (red) buttons inline
  - Reject shows a modal for reason input
- Overdue section: red-highlighted list of overdue chores
- Leaderboard sidebar/section: ranked list with medals for top 3

=== 3. CHILD DASHBOARD (src/pages/ChildDashboardPage.tsx) ===

Layout:
- Child header with avatar + name + streak flame icon
- Today's chores list:
  - Each chore card shows: title, points value, due time, status chip
  - PENDING chores have a "Mark Done" button
  - AWAITING_APPROVAL shows "Waiting for approval" badge
  - APPROVED shows checkmark + points earned
- "Mark Done" flow: click → optional note input → submit → status updates
- Points display: weekly + lifetime in a card
- Mini leaderboard: show rank among siblings

=== 4. APPROVAL FLOW COMPONENTS ===

src/components/ApprovalCard.tsx:
- Shows chore title, child name, completion time, note
- Approve button (green check)
- Reject button (red X) → opens reason modal

src/components/RejectModal.tsx:
- Modal with reason text input
- Submit + Cancel buttons

=== 5. ROUTING ===
Update App.tsx:
- /dashboard → ParentDashboardPage (if parent role) or ChildDashboardPage (if child)
- /dashboard/child/:childId → ChildDashboardPage (parent viewing child)

=== 6. SHARED COMPONENTS ===
- src/components/StatsCard.tsx — number + label card
- src/components/ProgressBar.tsx — colored progress bar
- src/components/StatusChip.tsx — colored badge (PENDING=yellow, APPROVED=green, etc.)
- src/components/Avatar.tsx — colored circle with child initial
- src/components/LeaderboardList.tsx — ranked list with medals

Style with Tailwind. Mobile responsive. Use loading skeletons while data fetches.
Auto-refresh dashboard every 30 seconds.

DONE CRITERIA: Parent sees full dashboard with live data. Child sees their chores. Approval flow works end-to-end.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Parent dashboard, child dashboard, approval workflow UI with live data",
    "dependsOn": [tasks["frontend1"], tasks["backendC"]]
})
tasks["frontend2"] = frontend2["taskId"]
print(f"Frontend 2 (Dashboards): {frontend2['taskId']}")

# ── Frontend Phase 3: Chore Management + Household ───────────────────
frontend3 = post(f"{API}/tasks", {
    "objective": f"""Frontend Phase 3 — Chore Management, Household Settings, and Notifications UI

Working Directory: {WORK_DIR}

CONTEXT: React web app at apps/web. Dashboards and auth exist. Backend has full API.

YOUR JOB: Build chore management, household settings, and notification UI.

=== 1. CHORE MANAGEMENT PAGE (src/pages/ChoresPage.tsx) ===

- Tab bar: Active | Archived
- Chore list with cards showing: title, points, recurrence badge, assignee, approval toggle
- "New Chore" button → opens CreateChoreModal
- Click chore → edit inline or in modal
- Archive/Restore buttons

Create src/components/CreateChoreModal.tsx:
- Form fields: title, description, points (number input), recurrence type (dropdown),
  assignment mode (Single/Rotation toggle), assigned child (dropdown if Single),
  approval required (toggle)
- When Rotation selected, show child multi-select for rotation group
- Recurrence config: for WEEKLY show day picker, for CUSTOM show multi-day picker
- Save button → POST /households/me/chores

Create src/api/chores.ts:
- getChores(active?, archived?): GET /households/me/chores
- createChore(dto): POST /households/me/chores
- updateChore(id, dto): PATCH /households/me/chores/:id
- archiveChore(id): POST /households/me/chores/:id/archive
- restoreChore(id): POST /households/me/chores/:id/restore

Create src/api/rotation.ts:
- getRotation(choreId): GET /households/me/chores/:choreId/rotation
- setRotation(choreId, childIds): POST /households/me/chores/:choreId/rotation

=== 2. HOUSEHOLD PAGE (src/pages/HouseholdPage.tsx) ===

- Household name + timezone display
- Children section:
  - List of children with avatar, name, age, active status
  - "Add Child" button → modal with name + avatar color + age
  - Edit button on each child
  - Deactivate button (with confirmation)
- Settings section:
  - Default approval required toggle
  - Points system enabled toggle
  - Reminders enabled toggle
  - Save button

Create src/api/household.ts:
- getHousehold(): GET /households/me
- updateSettings(dto): PATCH /households/me/settings
- getMembers(): GET /households/me/members

Create src/api/children.ts:
- addChild(dto): POST /households/me/children
- updateChild(id, dto): PATCH /households/me/children/:id
- deactivateChild(id): POST /households/me/children/:id/deactivate

=== 3. NOTIFICATIONS (src/components/NotificationBell.tsx) ===

- Bell icon in top nav with unread count badge
- Click → dropdown panel showing recent notifications
- Each notification: icon (by type), title, body, time ago, read/unread dot
- "Mark all read" link at top
- Click notification → navigate to relevant page

Create src/api/notifications.ts:
- getNotifications(unreadOnly?, limit?): GET /households/me/notifications
- markRead(id): POST /households/me/notifications/:id/read
- markAllRead(): POST /households/me/notifications/read-all

=== 4. ROUTING ===
Update App.tsx:
- /chores → ChoresPage (parent only)
- /household → HouseholdPage (parent only)

Update Layout nav links.

DONE CRITERIA: Parents can create/edit/archive chores. Household members manageable. Notifications display in bell dropdown.""",
    "domain": "code",
    "projectId": PROJECT_ID,
    "expectedOutputs": "Chore management UI, household settings, notifications bell, complete navigation",
    "dependsOn": [tasks["frontend2"], tasks["backendD"]]
})
tasks["frontend3"] = frontend3["taskId"]
print(f"Frontend 3 (Chores/Household/Notifications): {frontend3['taskId']}")

# ── Summary ──────────────────────────────────────────────────────────
print("\n" + "="*60)
print("DISPATCH v2 — Backend API + Frontend")
print("="*60)
print(f"\nProject: {PROJECT_ID}")
print(f"\nBackend (API implementation):")
print(f"  A: Auth module      → {tasks['backendA']}")
print(f"  B: CRUD modules     → {tasks['backendB']} (depends on A)")
print(f"  C: Assign/Dashboard → {tasks['backendC']} (depends on B)")
print(f"  D: Points/Notif     → {tasks['backendD']} (depends on C)")
print(f"\nFrontend:")
print(f"  1: Setup/Auth       → {tasks['frontend1']} (depends on A)")
print(f"  2: Dashboards       → {tasks['frontend2']} (depends on 1+C)")
print(f"  3: Chores/Settings  → {tasks['frontend3']} (depends on 2+D)")
print(f"\nDependency graph:")
print(f"  Backend A → Backend B → Backend C → Backend D")
print(f"  Backend A → Frontend 1 → Frontend 2 (also needs C)")
print(f"  Frontend 2 → Frontend 3 (also needs D)")
