# 256ai Engine Architecture

> **Last Updated:** 2026-01-31
> **Status:** Active Development

---

## Overview

The 256ai Engine is an HL7-style orchestration framework for AI agent swarms. It enables Claude Code instances across multiple machines to communicate and collaborate through a centralized coordinator.

**Key Principle:** Workers ARE Claude Code instances. No API costs - just existing Claude Code subscriptions.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STRATEGY LAYER                                     │
│                         (Human - Mark)                                       │
│                                                                              │
│                    Decides WHAT to build                                     │
│                    Reviews escalations                                       │
│                    Provides direction                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Dashboard / Direct Chat
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SWARM LEAD (MainWin Claude Code)                        │
│                            10.0.1.235                                         │
│                                                                              │
│  Responsibilities:                                                           │
│  • Plans WITH human                                                          │
│  • Decomposes complex tasks into subtasks                                    │
│  • Dispatches subtasks via POST /tasks                                       │
│  • Coordinates workers                                                       │
│  • Collects and assembles results                                            │
│  • Can also execute tasks directly                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ POST /tasks
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ENGINE (Control Plane)                                  │
│                    http://10.0.1.147:5100                                     │
│                                                                              │
│  Role: DUMB COORDINATOR (Post Office)                                        │
│  • Receives tasks → puts in queue                                            │
│  • Receives poll → gives task to worker                                      │
│  • Receives result → stores it                                               │
│  • Tracks health/status                                                      │
│  • Does NOT think or make decisions                                          │
│                                                                              │
│  Database: SQLite (engine.db)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  WORKER: Mac        │  │  WORKER: AI01       │  │  WORKER: AI02       │
│  (Claude Code)      │  │  (Dragon)           │  │  (Claude Code)      │
│  10.0.1.237         │  │  10.0.1.147         │  │  10.0.1.178          │
│                     │  │                     │  │                     │
│  Domains:           │  │  Domains:           │  │  Domains:           │
│  - frontend         │  │  - ai-compute       │  │  - general          │
│  - ui               │  │  - data             │  │  - code             │
│  - mobile           │  │  - transforms       │  │  - dev              │
│                     │  │                     │  │                     │
│  Ollama: None       │  │  Ollama: APPS only  │  │  Ollama: DEV only   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## Component Roles

| Component | Role | Intelligence |
|-----------|------|--------------|
| **Engine** | Coordinator/Router | DUMB - routes messages, holds queue, tracks state |
| **Swarm Lead** | Decision Maker | SMART - decomposes tasks, dispatches, collects results |
| **Workers** | Executors | SMART - do the actual work (they ARE Claude Code) |

### Engine = Post Office
The engine does NOT think. It just:
- Receives tasks → puts in queue
- Receives poll → gives task to matching worker
- Receives result → stores it
- Tracks health/status

### Swarm Lead = Manager
The Swarm Lead (MainWin Claude Code):
- Receives requests from human
- Decides how to break down complex tasks
- Dispatches subtasks to workers via engine
- Waits for results
- Assembles final answer
- Reports to human

### Workers = Staff
Workers (Claude Code instances on other machines):
- Poll engine for tasks in their domain
- Execute the task (they ARE intelligent - Claude Code)
- Submit results back to engine

---

## Machine Assignments

| Machine | IP | Worker ID | Role | Domains | Ollama |
|---------|-----|-----------|------|---------|--------|
| **MainWin** | 10.0.1.235 | worker-mainwin-001 | Swarm Lead + Worker | general, code, docs, infrastructure | None |
| **Mac** | 10.0.1.237 | worker-mac-001 | Worker | frontend, ui, mobile | None |
| **AI01 (Dragon)** | 10.0.1.147 | worker-dragon-001 | Worker | ai-compute, data, transforms | For APPS only |
| **AI02** | 10.0.1.178 | worker-aipc2-001 | Worker | general, code, dev | For DEV only |

### Ollama Separation of Concerns

**Important:** Ollama on AI01/Dragon and AI02 is NOT for the engine.

- **AI01 Ollama** → For APPS (BaZi, etc.)
- **AI02 Ollama** → For DEV/testing
- **Engine Workers** → Claude Code only (no API costs)

---

## Task Flow

```
1. Human sends request via Dashboard
         │
         ▼
2. Dashboard → POST /tasks (domain: general) → Engine
         │
         ▼
3. Engine: Task goes into queue [PENDING]
         │
         ▼
4. Swarm Lead polls: GET /tasks/poll?domains=general
         │
         ▼
5. Swarm Lead claims task, status → IN_PROGRESS
         │
         ▼
6. Swarm Lead THINKS: "Break into subtasks"
   - Subtask A → domain: frontend (Mac)
   - Subtask B → domain: code (AI02)
   - Subtask C → domain: ai-compute (Dragon)
         │
         ▼
7. Swarm Lead: POST /tasks (3 subtasks)
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
8. Mac polls      AI02 polls     Dragon polls
   Claims A       Claims B       Claims C
   Executes       Executes       Executes
   Submits        Submits        Submits
         │              │              │
         └──────────────┴──────────────┘
                        │
                        ▼
9. Swarm Lead: GET /tasks?parentTaskId=xxx
   Collects all results
         │
         ▼
10. Swarm Lead: Assembles final response
    POST /tasks/{originalId}/result
         │
         ▼
11. Dashboard shows response to human
```

---

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks` | Create a new task |
| GET | `/tasks` | List tasks (with optional filters) |
| GET | `/tasks/{id}` | Get task details |
| GET | `/tasks/poll` | Poll for pending tasks (workers use this) |
| POST | `/tasks/{id}/result` | Submit task result |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/summary` | Overall system health |
| GET | `/health/workers` | List all workers and status |
| POST | `/health/heartbeat` | Worker heartbeat |

---

## Worker Protocol

### 1. Poll for Tasks
```bash
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=YOUR_ID&domains=YOUR_DOMAINS"
```

Response if task available:
```json
{
  "hasTask": true,
  "taskId": "abc-123",
  "objective": "Do something",
  "domain": "general",
  "inputs": {}
}
```

### 2. Execute Task
The Claude Code instance (the worker) executes the objective.

### 3. Submit Result
```bash
curl -s -X POST "http://10.0.1.147:5100/tasks/TASK_ID/result" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "YOUR_ID",
    "success": true,
    "outputs": {
      "response": "Your result here"
    }
  }'
```

### 4. Send Heartbeat (every 20 seconds)
```bash
curl -s -X POST "http://10.0.1.147:5100/health/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "YOUR_ID",
    "status": "OK",
    "version": "1.0.0"
  }'
```

---

## Services & Ports

| Service | Machine | Port | URL |
|---------|---------|------|-----|
| Control Plane | 256AI | 5100 | http://10.0.1.147:5100 |
| Dashboard | Dragon | 8080 | http://10.0.1.147:8080 |
| Ollama (Apps) | Dragon | 11434 | http://10.0.1.147:11434 |
| Ollama (Dev) | AI02 | 11434 | http://10.0.1.178:11434 |

---

## Key Decisions

1. **Workers ARE Claude Code** - No API calls, no costs beyond subscriptions
2. **Engine is DUMB** - Just routes messages, doesn't think
3. **Swarm Lead is SMART** - Decomposes and coordinates
4. **Ollama is SEPARATE** - For apps/dev, not for engine
5. **HTTP polling** - No RabbitMQ required (simpler)
6. **SQLite** - Simple database, can migrate to PostgreSQL later

---

## Files

| File | Purpose |
|------|---------|
| `docs/ARCHITECTURE.md` | This file - system overview |
| `docs/machines/*.md` | Per-machine configuration |
| `docs/Worker/WORKER_INSTRUCTIONS.md` | How to be a worker |
| `src/Engine.ControlPlane/` | Control Plane API |
| `src/Engine.Dashboard/` | Web dashboard |
| `src/Engine.Infrastructure/` | Shared infrastructure |
