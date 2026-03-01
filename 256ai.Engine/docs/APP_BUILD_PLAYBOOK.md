# App Build Playbook

> **How to plan, decompose, and execute an app build using the 256ai swarm.**

**See also:** [Swarm Workflow](../spec/SWARM_WORKFLOW.md) — General plan-execute lifecycle
**See also:** [Agent Roles](../spec/AGENT_ROLES.md) — Worker roster and domain routing
**See also:** [Task Schema](ControlPlane/06_TASK_SCHEMA.md) — Task fields and format

---

## Project Structure Convention

All apps built by the swarm live under a single root:

```
C:\Projects\
├── 256ai.Engine\              ← The engine (permanent infrastructure)
├── 256ai-dashboard\           ← Engine monitoring dashboard
├── 256ai-projects\            ← ALL apps built by the swarm
│   ├── bazi\                  ← BaZi (reference implementation)
│   ├── app-template\          ← Reusable app template
│   └── [new-app-name]\        ← Each new app gets its own folder
```

**Rules:**
- Every new project starts at `C:\Projects\256ai-projects\{app-name}\`
- Each project follows the monorepo structure defined in [The 8 Layers](#the-8-layers) below
- The engine dispatches tasks with `workingDirectory` pointing to `C:\Projects\256ai-projects\{app-name}\`
- Workers on other machines clone/sync from this path
- BaZi is the reference implementation — new apps can reference its code but should not depend on it
- **BaZi live code** lives on Mac (`~/projects/bazi/BaziMobileApp/`) and Linux (`/home/nazmin/AstrologyApp/`)
- The local copy at `256ai-projects/bazi/` is a **reference snapshot** for pattern extraction, not the active codebase

### Per-Project Folder Structure

Every app under `256ai-projects/` follows this layout:

```
{app-name}/
├── CLAUDE.md                  ← Worker orientation for this specific app
├── backend/                   ← Layers 1-5 (Python FastAPI)
│   ├── app/
│   │   ├── models/            ← Layer 1: Data
│   │   ├── repositories/      ← Layer 1: Data access
│   │   ├── engines/           ← Layer 2: Domain engine
│   │   ├── auth/              ← Layer 3: Auth
│   │   ├── routers/           ← Layer 4: API
│   │   └── services/          ← Layer 5: Content generation
│   └── tests/
├── mobile/                    ← Layer 6 (React Native Expo)
│   └── src/
├── admin/                     ← Layer 7 (React + Vite + Tailwind)
│   └── src/
├── contracts/                 ← Layer 0 (shared types)
│   ├── python/
│   ├── typescript/
│   └── openapi/
└── docs/                      ← App-specific documentation
```

---

## Overview

Every app we build follows the same pattern: **8 layers**, dispatched as **engine tasks** across the worker swarm, executed in **4 waves** that maximize parallelism. The BaZi app (`C:\Projects\256ai-projects\bazi`) is the reference implementation that proved this stack works.

This playbook defines:
1. What the 8 layers are
2. How each layer maps to engine tasks and worker domains
3. What depends on what (wave ordering)
4. How to dispatch it all through the Control Plane

---

## The 8 Layers

Every app — regardless of domain — decomposes into these layers:

```
Layer 0: Contracts & Scaffold ────── Foundation (everything imports from here)
    │
    ├── Layer 1: Data Layer ───────── Models, migrations, repositories
    ├── Layer 2: Domain Engine ────── Pluggable business/calculation logic
    ├── Layer 3: Auth & Identity ──── JWT, social login, user profiles
    │
    ├── Layer 4: API Layer ────────── FastAPI endpoints, middleware
    ├── Layer 5: Content Generation ─ Templates (free) + LLM (premium)
    │
    ├── Layer 6: Mobile App ───────── React Native Expo, 4-tab layout
    ├── Layer 7: Admin Dashboard ──── React + Vite + Tailwind
    │
    └── Layer 8: Monetization ─────── Subscriptions, IAP, ads
```

### Why This Order

- **Layer 0 must come first.** It defines the Python ABCs, TypeScript interfaces, and OpenAPI spec that every other layer conforms to. Without contracts, parallel workers produce incompatible code.
- **Layers 1-3 are independent** of each other — they only need Layer 0. Maximum parallelism here.
- **Layer 4 integrates** Layers 1-3 into a single API.
- **Layer 5** plugs into Layers 1 and 2 for content generation.
- **Layers 6-7** only need the contracts from Layer 0 (they call the API, they don't import backend code).
- **Layer 8** wires into Layers 4 and 6 last.

---

## Layer-to-Worker Mapping

Each layer maps to specific worker domains from [AGENT_ROLES.md](../spec/AGENT_ROLES.md):

| Layer | Primary Worker | Domain | Why |
|-------|---------------|--------|-----|
| 0: Contracts | `worker-mainwin-001` | coordination, code | Architecture decisions need the Lead |
| 1: Data | `worker-ai02-coder-001/002` | code, data | Straightforward code generation |
| 2: Domain Engine | `worker-mainwin-001` + `worker-ai02-claude` | code | Interface design (Lead) + implementation (Claude) |
| 3: Auth | `worker-ai02-claude` | code | Reasoning-heavy (OAuth flows, security) |
| 4: API | `worker-ai02-coder-001/002` + `worker-mainwin-001` | code | App factory (Lead) + routers (code gen) |
| 5: Content | `worker-256ai-001` + `worker-ai02-coder-002` | ai-compute, data | Ollama integration (256AI) + templates (code gen) |
| 6: Mobile | `worker-mac-001` | frontend, ui, mobile | All mobile/iOS work |
| 7: Admin | `worker-mac-001` | frontend | React frontend |
| 8: Monetization | `worker-mac-001` + `worker-mainwin-001` | frontend, code | Mobile SDK (Mac) + backend webhooks (Lead) |

---

## Wave Execution Model

Tasks dispatch in 4 waves. Within each wave, independent tasks run in parallel. The Control Plane's `dependsOn` field (see [Task Schema](ControlPlane/06_TASK_SCHEMA.md)) holds tasks until prerequisites complete.

### Wave 0: Foundation
**Goal:** Create the contracts that unlock everything else.
**Duration:** ~2hr (mostly sequential — T-001 must finish before T-002)

| Task | Layer | What | Worker | Deps |
|------|-------|------|--------|------|
| T-000 | 0 | Monorepo scaffold (folders, git, configs) | mainwin-001 | none |
| T-001 | 0 | Python ABCs (`IDomainEngine`, `IContentGenerator`, types) | mainwin-001 | T-000 |
| T-002 | 0 | TypeScript interfaces (mirror of Python ABCs + DTOs) | mainwin-001 | T-001 |
| T-003 | 0 | OpenAPI spec skeleton (all endpoints) | ai02-coder-001 | T-000 |
| T-004 | 0 | docker-compose.yml (PostgreSQL, Ollama) | ai02-coder-002 | T-000 |
| T-005 | 0 | CLAUDE.md files per layer (worker orientation) | ai02-coder-002 | T-000 |

### Wave 1: Independent Layers (Maximum Parallelism)
**Goal:** Build data, engine, auth, and frontend skeleton simultaneously.
**Duration:** ~3hr (4+ workers busy in parallel)

**Backend stream (AI02 workers):**

| Task | Layer | What | Worker | Deps |
|------|-------|------|--------|------|
| T-100 | 1 | SQLAlchemy models (User, Entity, Forecast, Subscription, ...) | ai02-coder-001 | T-001 |
| T-101 | 1 | Alembic setup + initial migration | ai02-coder-002 | T-100 |
| T-102 | 1 | Repository pattern (BaseRepo + per-model repos) | ai02-coder-001 | T-100 |
| T-103 | 1 | Seed data scripts | ai02-coder-002 | T-101 |
| T-200 | 2 | `IDomainEngine` ABC + `EngineFactory` | mainwin-001 | T-001 |
| T-201 | 2 | Example reference engine (numerology or similar) | ai02-claude | T-200 |
| T-202 | 2 | BaZi engine adapter (wraps existing calculator) | ai02-claude | T-200 |
| T-300 | 3 | JWT handler (create/verify/refresh) | ai02-claude | T-001 |
| T-301 | 3 | Google OAuth2 server-side flow | ai02-coder-001 | T-300 |
| T-302 | 3 | Apple Sign-In server-side flow | ai02-coder-001 | T-300 |
| T-303 | 3 | Auth middleware + `get_current_user` dependency | ai02-claude | T-300 |

**Frontend stream (Mac worker):**

| Task | Layer | What | Worker | Deps |
|------|-------|------|--------|------|
| T-600 | 6 | Expo project init + navigation skeleton | mac-001 | T-002 |
| T-601 | 6 | Theme system (configurable colors, typography, spacing) | mac-001 | T-600 |
| T-602 | 6 | Shared component library (Button, Card, Header, etc.) | mac-001 | T-601 |
| T-603 | 6 | API client service + JWT interceptor | mac-001 | T-002 |
| T-604 | 6 | State management (auth, user, entity, content stores) | mac-001 | T-002 |
| T-700 | 7 | Vite + React + Tailwind admin project setup | mac-001 | T-002 |
| T-701 | 7 | Admin layout (Sidebar, TopBar, page shell) | mac-001 | T-700 |

### Wave 2: Integration
**Goal:** Wire layers together — API endpoints, content pipeline, all screens.
**Duration:** ~4hr (all workers busy)

| Task | Layer | What | Worker | Deps |
|------|-------|------|--------|------|
| T-400 | 4 | FastAPI app factory + middleware stack | mainwin-001 | T-102, T-303 |
| T-401-T-410 | 4 | API routers (auth, users, calculate, entities, relationships, forecasts, achievements, subscriptions, admin, health) | ai02-* | T-400 |
| T-500-T-507 | 5 | Content pipeline (Ollama client, OpenAI fallback, template generator, LLM generator, cache, scheduler, prompts) | 256ai-001, ai02-* | T-001, T-102 |
| T-610-T-618 | 6 | Mobile screens (auth, You tab, calculate, relationships, compatibility, world, settings, push notifications, deep links) | mac-001 | T-602, T-603, T-604 |
| T-710-T-714 | 7 | Admin pages (dashboard, users, content, analytics, health) | mac-001 | T-701 |

### Wave 3: Monetization + Polish
**Goal:** Add payment flows, testing, documentation.
**Duration:** ~2hr

| Task | Layer | What | Worker | Deps |
|------|-------|------|--------|------|
| T-800 | 8 | RevenueCat webhook handler (backend) | mainwin-001 | T-408 |
| T-801 | 8 | Entitlement service | mainwin-001 | T-102, T-300 |
| T-802-T-805 | 8 | Mobile monetization (RevenueCat SDK, paywall, ads, subscription screen) | mac-001 | T-600, T-602, T-603 |
| T-900+ | All | Tests, integration tests, documentation | various | Waves 2-3 |

---

## Task Dispatch Format

Each task maps to a `POST /tasks` call. Use `parentTaskId` to group all tasks under one parent, and `dependsOn` to encode the wave ordering.

```json
{
  "objective": "Create SQLAlchemy models for app-template...",
  "domain": "code",
  "parentTaskId": "parent-app-build-001",
  "dependsOn": ["T-001"],
  "inputs": {
    "workingDirectory": "C:\\Projects\\app-template\\backend",
    "referenceFile": "C:\\moveproject\\2026CodeProjects\\BaZi\\iOS\\AstrologyApp\\models\\user.py"
  },
  "constraints": ["SQLAlchemy 2.0 declarative", "UUID primary keys"],
  "expectedOutputs": "All model files in backend/app/models/",
  "validationCriteria": "Models import without error, tables can be created"
}
```

The Control Plane automatically holds tasks with unmet dependencies in PENDING until prerequisites complete (see dependency resolution in `TasksController.cs` `PollForTask` method).

---

## Tech Stack (Same as BaZi — Proven)

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | Python FastAPI + SQLAlchemy | Fast API dev, good ORM, async |
| Database | SQLite (dev) / PostgreSQL (prod) | Zero config for dev, scales for prod |
| Mobile | React Native + Expo + TypeScript | Cross-platform, Expo simplifies builds |
| Admin | React + Vite + Tailwind | Fast builds, utility-first CSS |
| AI Content | Ollama (free) + OpenAI (fallback) | Zero-cost daily readings, quality fallback |
| Auth | JWT + Google/Apple OAuth | Industry standard for mobile |
| Monetization | RevenueCat + Google Mobile Ads | Handles IAP complexity, ad mediation |
| Platform | iOS first, then Android | Simpler to ship one platform well |

---

## Domain Engine Pattern

The key abstraction that makes the template reusable. Every app plugs in a different engine:

```python
class IDomainEngine(ABC):
    def calculate(self, input_data: dict) -> DomainResult
    def get_required_inputs(self) -> list[InputField]
    def get_compatibility(self, a: DomainResult, b: DomainResult) -> CompatibilityResult
    def get_forecast(self, data: DomainResult, period: ForecastPeriod) -> ForecastResult
```

| App | Engine Implementation |
|-----|---------------------|
| BaZi | Four Pillars calculator (lunar calendar, stems, branches) |
| Numerology | Life path numbers from birth date and name |
| Western Astrology | Natal chart from birth date/time/location |
| Feng Shui | Eight Mansions from birth year + compass direction |
| Biorhythm | Sine wave cycles from birth date |

The mobile app, API, content generation, and monetization layers stay the same — only the engine changes.

---

## BaZi Reference Files

When building a new app from this template, reference these files from the working BaZi implementation:

| BaZi File | What to Reuse | Target Layer |
|-----------|---------------|-------------|
| `iOS/AstrologyApp/app.py` | FastAPI structure, endpoint patterns | 4 |
| `iOS/AstrologyApp/agents/bazi_calculator.py` | Engine interface pattern | 2 |
| `iOS/AstrologyApp/agents/narrative_agent.py` | Ollama/OpenAI integration | 5 |
| `iOS/AstrologyApp/agents/template_engine.py` | Zero-cost content generation | 5 |
| `iOS/AstrologyApp/auth/jwt_handler.py` | JWT token handling | 3 |
| `iOS/AstrologyApp/auth/dependencies.py` | FastAPI auth middleware | 3 |
| `iOS/AstrologyApp/models/user.py` | User model structure | 1 |
| `iOS/AstrologyApp/models/subscription.py` | Subscription/entitlement schema | 1, 8 |
| `iOS/AstrologyApp/tasks/scheduler.py` | APScheduler setup | 5 |
| `iOS/AstrologyApp/engines/relationship_engine.py` | Compatibility scoring | 2 |
| `BaziMobileApp/src/api/client.ts` | API client + JWT interceptor | 6 |
| `BaziMobileApp/src/auth/AuthContext.tsx` | Auth state management | 6 |
| `BaziMobileApp/src/navigation/` | Tab + stack navigation | 6 |
| `BaziMobileApp/src/purchases/PurchaseContext.tsx` | Subscription state | 8 |

All BaZi source at: `C:\Projects\256ai-projects\bazi\`

---

## Verification

After all waves complete, verify end-to-end:

1. **Layer 0:** Contracts compile (Python imports + TypeScript compiles)
2. **Layer 1:** `alembic upgrade head` creates all tables
3. **Layer 2:** Example engine returns valid `DomainResult`
4. **Layer 3:** Register → login → JWT → access protected endpoint
5. **Layer 4:** All endpoints match OpenAPI spec (`pytest tests/`)
6. **Layer 5:** Template generator + LLM generator both produce content
7. **Layer 6:** `expo start --ios` — app launches, all 4 tabs work
8. **Layer 7:** `npm run dev` — admin dashboard renders
9. **Layer 8:** Paywall shows; entitlements gate premium content
10. **Full flow:** Register → calculate → daily reading → add entity → compatibility → forecast

---

## Project API (Engine Integration)

Every task belongs to a project. The engine needs a first-class `Project` entity so the dashboard can track app builds end-to-end.

### Project Entity

```
ProjectEntity:
  ProjectId       string (PK, GUID)
  Name            string (slug: "feng-shui", "bazi", "numerology")
  DisplayName     string ("Feng Shui App")
  Description     string (what this app does)
  DomainEngine    string (which engine: "bazi", "numerology", "feng-shui", "custom")
  Platform        string ("ios", "ios+android", "ios+android+web")
  WorkingDirectory string (auto: "C:\Projects\256ai-projects\{name}\")
  Status          string (PLANNING, SCAFFOLDING, IN_PROGRESS, TESTING, COMPLETED, ARCHIVED)
  CurrentWave     int    (0-3, which wave is active)
  CreatedAt       DateTimeOffset
  CompletedAt     DateTimeOffset?
```

### TaskEntity Changes

Add `ProjectId` (FK) to `TaskEntity` so every task is tied to a project:

```
TaskEntity:
  ...existing fields...
  ProjectId       string? (FK → ProjectEntity)  ← NEW
```

### New API Endpoints

```
POST   /projects                    Create a new project (creates folder + Wave 0 tasks)
GET    /projects                    List all projects
GET    /projects/{id}               Get project detail (status, wave progress, task counts)
GET    /projects/{id}/tasks         List all tasks for this project
PATCH  /projects/{id}               Update project (status, wave)
DELETE /projects/{id}               Archive a project
```

### POST /projects — Create New Project

**Request:**
```json
{
  "name": "feng-shui",
  "displayName": "Feng Shui App",
  "description": "Eight Mansions calculation app with compass integration",
  "domainEngine": "feng-shui",
  "platform": "ios"
}
```

**What happens:**
1. Creates `ProjectEntity` in DB with status `SCAFFOLDING`
2. Creates folder at `C:\Projects\256ai-projects\feng-shui\`
3. Creates Wave 0 tasks (T-000 through T-005) with `projectId` set
4. Returns project ID + created task IDs

**Response (201):**
```json
{
  "projectId": "proj-abc123",
  "name": "feng-shui",
  "status": "SCAFFOLDING",
  "workingDirectory": "C:\\Projects\\256ai-projects\\feng-shui",
  "tasksCreated": 6,
  "createdAt": "2026-02-15T10:00:00Z"
}
```

### GET /projects/{id} — Project Status

**Response:**
```json
{
  "projectId": "proj-abc123",
  "name": "feng-shui",
  "displayName": "Feng Shui App",
  "status": "IN_PROGRESS",
  "currentWave": 1,
  "waves": {
    "0": { "total": 6, "completed": 6, "failed": 0, "status": "COMPLETED" },
    "1": { "total": 17, "completed": 8, "failed": 0, "status": "IN_PROGRESS" },
    "2": { "total": 32, "completed": 0, "failed": 0, "status": "PENDING" },
    "3": { "total": 14, "completed": 0, "failed": 0, "status": "PENDING" }
  },
  "progress": {
    "totalTasks": 69,
    "completed": 14,
    "percentComplete": 20
  }
}
```

### Dashboard: Projects Page

The dashboard gets a new "Projects" page with:

1. **Project list** — cards showing each project with name, status, progress bar, wave indicator
2. **"New Project" button** → opens form page:
   - Name (slug, auto-generates working directory)
   - Display Name
   - Description
   - Domain Engine (dropdown: bazi, numerology, feng-shui, western-astrology, custom)
   - Platform (dropdown: iOS, iOS + Android, All)
   - [Create Project] button
3. **Project detail page** — click a project card to see:
   - Wave progress (4 progress bars, one per wave)
   - Task list grouped by layer
   - Active workers and what they're doing
   - Escalations for this project
   - Timeline / Gantt-style view of task execution

### Files to Modify

| File | Change |
|------|--------|
| `src/Engine.Infrastructure/Entities/ProjectEntity.cs` | **NEW** — Project data model |
| `src/Engine.Infrastructure/Entities/TaskEntity.cs` | **EDIT** — Add `ProjectId` field |
| `src/Engine.Infrastructure/Data/EngineDbContext.cs` | **EDIT** — Add `Projects` DbSet, configure relationship |
| `src/Engine.ControlPlane/Controllers/ProjectsController.cs` | **NEW** — Project CRUD endpoints |
| `src/Engine.ControlPlane/Controllers/TasksController.cs` | **EDIT** — Add `projectId` filter to ListTasks, add to CreateTaskRequest |
| `src/Engine.Dashboard/index.html` | **EDIT** — Add Projects nav item + pages |
| EF Migration | **NEW** — `AddProjectEntity` migration |

---

## Task Count

| Wave | Tasks | Workers Active | Wall Clock |
|------|-------|---------------|------------|
| 0: Foundation | 6 | 3 | ~2hr |
| 1: Independent | 17 | 4+ | ~3hr |
| 2: Integration | 32 | 5+ | ~4hr |
| 3: Monetization | 14 | 3 | ~2hr |
| **Total** | **69** | | **~11hr** vs ~70hr sequential |

---

*Last updated: 2026-02-15*
