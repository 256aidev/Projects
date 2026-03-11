# ChoreQuest — Architecture

## Overview

ChoreQuest is a self-hosted family chore tracking application. All components run on-premises via Docker Compose — there are no cloud service dependencies.

## Component Diagram

```
┌──────────────────────────────────────────────────────┐
│                    Host Machine                       │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  nginx    │───▶│  NestJS API  │───▶│ PostgreSQL │ │
│  │  :80/:443 │    │  :3000       │    │  :5432     │ │
│  └──────────┘    └──────────────┘    └────────────┘ │
│       ▲                │                     │       │
│       │           Background Jobs            │       │
│       │          (@nestjs/schedule)     Named Volume │
│       │                                 postgres_data│
│  Clients (LAN)                                       │
└──────────────────────────────────────────────────────┘
```

## Services

| Service    | Image / Runtime   | Purpose                          | Exposed Port |
|------------|-------------------|----------------------------------|-------------|
| nginx      | nginx:alpine      | Reverse proxy, rate limiting, security headers | 80 (443 when SSL enabled) |
| api        | node:20-alpine    | NestJS REST API + background jobs | Internal only (via nginx) |
| postgres   | postgres:16-alpine| Relational database              | Internal only |

## Tech Stack Decisions

| Concern            | Choice             | Rationale |
|--------------------|--------------------|-----------|
| API framework      | NestJS (TypeScript)| Modular architecture, built-in DI, decorators for validation/auth |
| Database           | PostgreSQL 16      | Robust relational DB, excellent for structured data, self-hosted |
| ORM                | Prisma             | Type-safe queries, declarative schema, migration tooling |
| Auth               | JWT + Argon2id     | Stateless auth tokens, industry-standard password hashing — no external auth providers |
| Reverse proxy      | Nginx              | Battle-tested, rate limiting, security headers, future SSL termination |
| Containerization   | Docker Compose     | Single-command deployment, service orchestration, volume management |
| Background jobs    | @nestjs/schedule   | In-process cron for V1 (chore rotation, overdue checks). Separate worker process possible later |
| Validation         | class-validator    | Decorator-based DTO validation integrated with NestJS pipes |

## Data Model

```
Household 1──* User
Household 1──* Chore
Household 1──* ChoreAssignment

Chore 1──* ChoreAssignment
Chore 1──? RotationGroup 1──* RotationMember

User 1──* ChoreAssignment (assigned_to)
User 1──* ChoreAssignment (approved_by)
User 1──* RotationMember
User 1──* PointsLedgerEntry

ChoreAssignment 1──* PointsLedgerEntry
```

Key design choices:
- **Multi-household**: Each household is isolated. Users belong to exactly one household.
- **Role-based**: `parent` and `child` roles control permissions (approval, chore creation, etc.).
- **Assignment model**: Chores are templates; ChoreAssignments are concrete instances for a specific date/user.
- **Points ledger**: Append-only log for auditability. Points are summed at read time.
- **Rotation groups**: Optional round-robin assignment for recurring chores.

## Request Flow

1. Client sends HTTP request to nginx (:80)
2. Nginx applies rate limiting (10 req/s per IP, burst 20)
3. Nginx proxies to NestJS API (:3000)
4. NestJS ValidationPipe validates the request DTO
5. Controller delegates to service layer
6. Service uses PrismaService for database operations
7. Response flows back through nginx to client

## Authentication Flow

1. Parent registers household → creates first parent user with Argon2id-hashed password
2. Login → API verifies password, issues JWT access token (15m) + refresh token (7d)
3. Subsequent requests include `Authorization: Bearer <token>`
4. JWT strategy validates token and attaches user context
5. Guards enforce role-based access (e.g., only parents can approve chores)

## Directory Structure

```
ChoreQuest/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── prisma/       # Schema + migrations
│   │   └── src/          # Application code
│   └── worker/           # Placeholder for future dedicated worker
├── packages/
│   ├── shared-types/     # TypeScript enums, DTOs, interfaces
│   └── shared-validation/# Shared validation schemas (future)
├── infra/
│   ├── docker/           # Dockerfiles, docker-compose, nginx config
│   ├── nginx/            # Nginx configuration (canonical)
│   └── scripts/          # backup.sh, restore.sh, deploy.sh, migrate.sh
├── docs/                 # Architecture, deployment, runbook docs
└── .env.example          # Environment variable template
```

## Deployment

All services are deployed as Docker containers via `docker compose up -d`. See [DEPLOYMENT_ON_PREM.md](./DEPLOYMENT_ON_PREM.md) for setup instructions.

Database migrations are managed by Prisma and run via `infra/scripts/migrate.sh`.

Backups use `pg_dump` with 7-day retention. See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).
