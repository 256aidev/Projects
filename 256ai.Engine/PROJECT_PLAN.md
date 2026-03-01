# 256ai.Engine Project Plan

> **Read this to understand where we are and what's next.**
> Linked from [CLAUDE.md](CLAUDE.md)
> Based on [ENGINE_SPEC.md](spec/ENGINE_SPEC.md)

---

## Current Phase: Phase 3 - Worker Integration 🔄 IN PROGRESS
## Previous: Phase 2 - Documentation ✅ COMPLETE

---

## Agent Swarm Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  STRATEGY LAYER (Human - Mark)                                  │
│  Final authority, approves plans                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  SWARM LEAD (MainWin Claude - THIS INSTANCE)                    │
│  Plans WITH human, decomposes tasks, coordinates swarm          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Worker A      │       │ Worker B      │       │ Worker C      │
│ (Qwen/Dragon) │       │ (Mac Claude)  │       │ (Cloud API)   │
│ Data, AI      │       │ Frontend      │       │ Scale         │
└───────────────┘       └───────────────┘       └───────────────┘
```

**Hybrid Power:** On-prem (Claude Code + Ollama/Qwen) + Cloud (Claude API)

---

## System Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Strategy (Human - Mark)       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Layer 2: Control Plane (This Engine)   │
│  - Routes AGT tasks to workers          │
│  - Validates HL7-style messages         │
│  - Manages state machines               │
│  - Processes AAC/ARG/AEX/AHE            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Layer 3: Execution Nodes (Workers)     │
│  - Claude Code instances (heterogeneous)│
│  - Execute tasks, send results          │
│  - Emit heartbeats (AHE)                │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Layer 4: Model & Compute (FOR APPS)    │
│  - Dragon: Ollama + Qwen/Llama          │
│  - AI Server 2: Ollama + Qwen           │
│  - NOT connected to engine directly     │
└─────────────────────────────────────────┘
```

**Key Point:** The engine orchestrates **Claude Code instances**, NOT Ollama. Ollama is Layer 4 compute for apps.

---

## Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Solution structure (Core, Infrastructure, ControlPlane, Worker)
- [x] EF Core entities and SQLite migrations
- [x] Basic API endpoints (health, tasks, escalations)
- [x] Control Plane running at http://localhost:5100

### Phase 2: Documentation ✅ COMPLETE
- [x] GPT spec captured → [spec/ENGINE_SPEC.md](spec/ENGINE_SPEC.md)
- [x] Protocol documentation → [spec/PROTOCOLS.md](spec/PROTOCOLS.md)
- [x] Protocol flow diagrams → [spec/PROTOCOL_FLOWS.md](spec/PROTOCOL_FLOWS.md)
- [x] Agent roles & swarm → [spec/AGENT_ROLES.md](spec/AGENT_ROLES.md)
- [x] Swarm workflow → [spec/SWARM_WORKFLOW.md](spec/SWARM_WORKFLOW.md)
- [x] Doc structure guide → [docs/DOC_STRUCTURE.md](docs/DOC_STRUCTURE.md)
- [x] API Reference → [docs/ControlPlane/API_REFERENCE.md](docs/ControlPlane/API_REFERENCE.md)
- [x] Worker connection → [docs/Worker/04_WORKER_CONNECTION.md](docs/Worker/04_WORKER_CONNECTION.md)
- [x] Task schema → [docs/ControlPlane/06_TASK_SCHEMA.md](docs/ControlPlane/06_TASK_SCHEMA.md)
- [x] Machine docs (MainWin, Dragon)

### Phase 3: Worker Integration 🔄 IN PROGRESS
- [x] HTTP polling worker implementation (`TaskPollingService` — 5s poll interval)
- [x] Heartbeat endpoint (`POST /health/heartbeat`) with worker-reported IP and Role
- [x] Task result submission endpoint (`POST /tasks/{id}/result`)
- [x] Worker registration/discovery (auto via heartbeat)
- [x] AAC (acknowledgment) message flow (`POST /tasks/{id}/ack`)
- [x] Task progress reporting (`POST /tasks/{id}/progress`)
- [x] Task cancellation (`POST /tasks/{id}/cancel`)
- [x] Multi-provider worker support (claude-code, claude-api, ollama)
- [x] 6 workers deployed across 4 machines (Dragon, MainWin, AI02, Mac)
- [x] Dashboard — Worker list with Role/IP columns, Task Queue with auto-resume, Task Viewer with Output/Details/Timeline tabs
- [x] MCP Server — SSE endpoint at `/sse` with 11 tools (tasks, health, escalations, benchmark)
- [x] Benchmark tooling — PowerShell script + REST API + MCP tools for throughput testing
- [x] ProjectId field for task grouping
- [ ] Lease timeout (return LEASED tasks to PENDING after 60s with no ACK)
- [ ] Worker capacity-aware routing (respect MaxConcurrentTasks)

### Phase 4: RabbitMQ Integration
- [ ] Start RabbitMQ service
- [ ] Define exchanges/queues/DLQs per [spec/PROTOCOLS.md](spec/PROTOCOLS.md)
- [ ] Implement producer: route AGT to worker queues
- [ ] Implement consumer: receive AAC/ARG/AEX/AHE
- [ ] Retry policy and DLQ handling

### Phase 5: Multi-Worker Swarm ✅ COMPLETE
- [x] Worker SDK (shared lib) for: parse AGT, send AAC/ARG/AEX/AHE
- [x] Reference worker (dummy task) — claude-api echo mode
- [x] Mac Claude worker setup (worker-mac-001, 10.0.1.237)
- [x] Dragon worker setup (worker-256ai-001, 10.0.1.147)
- [x] AI02 workers (worker-ai02-claude, worker-ai02-coder-001/002, 10.0.1.178)
- [x] Domain-based routing (workers declare domains, polling filters by domain)

### Phase 6: Observability + Ops
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboard
- [ ] Alerts (missing heartbeat, DLQ non-empty, etc.)
- [ ] Deployment runbook

### Phase 7: End-to-End Scenarios
- [ ] Happy path test (AGT→AAC→ARG)
- [ ] Worker offline test
- [ ] Worker rejects task test
- [ ] Schema validation test
- [ ] Escalation disposition flow test
- [ ] Plan/approval flow (if implemented)

### Phase 8: Dashboard (Plan First)
> **Requires:** Planning session with CEO before building

- [ ] **Plan dashboard with Mark** — Define what we need to see
- [ ] Identify pain points to monitor
- [ ] Define key metrics and views
- [ ] Wireframe/mockup approval
- [ ] Build dashboard UI
- [ ] Real-time health visualization
- [ ] Task flow monitoring
- [ ] Worker status overview
- [ ] Escalation queue view
- [ ] Message stream viewer

---

## Message Types (HL7-style)

| Code | Name | Purpose |
|------|------|---------|
| AGT | Agent Task | Task dispatch (like HL7 ORM) |
| AAC | Agent Ack | Acknowledgment (like HL7 ACK) |
| ARG | Agent Result | Task result (like HL7 ORU) |
| AEX | Agent Exception | Escalation with severity |
| AHE | Agent Heartbeat | Worker liveness |
| ADI | Agent Disposition | Escalation resolution |
| AHS | App Health Status | Application health |
| ASC | Synthetic Check | End-to-end verification |

---

## Quick Reference

| What | Where |
|------|-------|
| API Base URL | http://localhost:5100 |
| Database | SQLite: `engine.db` |
| Master Spec | [spec/ENGINE_SPEC.md](spec/ENGINE_SPEC.md) |
| API Docs | [docs/ControlPlane/API_REFERENCE.md](docs/ControlPlane/API_REFERENCE.md) |
| Worker Guide | [docs/Worker/04_WORKER_CONNECTION.md](docs/Worker/04_WORKER_CONNECTION.md) |

---

## Backlog (Future)

- [ ] PostgreSQL migration (from SQLite)
- [ ] Synthetic check framework
- [ ] Prometheus + Grafana stack (metrics backend for dashboard)
- [ ] Mobile/tablet dashboard view
- [ ] Configurable poll interval (currently hardcoded 5s in TaskPollingService)
- [ ] MCP server authentication (currently open)

---

## Completed Work Log

| Date | What |
|------|------|
| 2026-01-29 | Initial solution structure |
| 2026-01-29 | EF Core entities and migrations |
| 2026-01-29 | Control Plane API (Health, Tasks, Escalations) |
| 2026-01-29 | Documentation structure (CLAUDE.md, docs/) |
| 2026-01-30 | GPT spec saved to `spec/ENGINE_SPEC.md` |
| 2026-01-30 | Protocol documentation (PROTOCOLS.md, PROTOCOL_FLOWS.md) |
| 2026-01-30 | Agent roles & swarm architecture (AGENT_ROLES.md) |
| 2026-01-30 | Swarm workflow documentation (SWARM_WORKFLOW.md) |
| 2026-01-30 | Documentation structure guide (DOC_STRUCTURE.md) |
| 2026-01-30 | API Reference with curl examples |
| 2026-01-30 | Worker connection guide |
| 2026-01-30 | Dragon machine doc (Ollama + Qwen for apps) |
| 2026-01-30 | **Phase 2 Documentation complete** |
| 2026-02-15 | Multi-provider worker (claude-code, claude-api, ollama) |
| 2026-02-15 | 6 workers deployed: Dragon, MainWin, AI02 (x3), Mac |
| 2026-02-15 | Dashboard: Worker list with Role/IP columns |
| 2026-02-15 | Dashboard: Task Queue panel with auto-resume |
| 2026-02-15 | Dashboard: Task Viewer with Output/Details/Timeline tabs |
| 2026-02-16 | MCP Server (ModelContextProtocol.AspNetCore) — SSE at /sse |
| 2026-02-16 | 11 MCP tools: tasks, health, escalations, benchmark |
| 2026-02-16 | Benchmark tooling: PowerShell script + REST API + MCP |
| 2026-02-16 | ProjectId field for task grouping |

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| SQLite instead of PostgreSQL | Simpler for dev; migrate later |
| HTTP polling before RabbitMQ | RabbitMQ not running yet |
| Claude Code as workers | Per spec - engine orchestrates Claude instances |
| Ollama for apps only | Layer 4 compute, not engine workers |
| MainWin Claude = Swarm Lead | Plans with human, coordinates workers |
| Hybrid on-prem + cloud | On-prem power (Ollama/Qwen) + cloud scale (Claude API) |
| Heterogeneous workers | Different models for different tasks (Claude, Qwen, etc.) |
| MCP in Control Plane (not standalone) | One process, one deployment, SSE alongside REST |
| Benchmark via ProjectId grouping | No special DB table needed — tasks tagged with projectId |

---

*Last updated: 2026-02-16*
