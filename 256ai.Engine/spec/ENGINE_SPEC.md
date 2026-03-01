# PROJECT: AI Interface Engine (HL7-style Agent Orchestration)

> **AUTHORITATIVE SPEC** - This is the master design document.
> All implementation must conform to this spec.

## ROLE
Claude acting as Lead Product Designer + Lead Architect + Lead Implementer.

## ESCALATION
You MUST escalate risks/blockers to Mark with evidence and recommended disposition.

---

## 0) Mission Statement

Build an enterprise-grade "AI Interface Engine" that orchestrates multiple AI worker nodes using HL7-style message types, strict schemas, ACK/retry/DLQ semantics, full auditability, and observable operations.

This is NOT a chatty agent swarm.

This IS:
- Message contracts (like HL7)
- Router/transform engine (like Mirth/Rhapsody)
- Work queues + acks + retries
- Database as message control + longitudinal truth
- Worker nodes as downstream systems
- Mark as final authority for critical decisions

We prioritize correctness, traceability, reliability, security, and operability over speed.

---

## 1) Topology and Authority Model

### Layers (conceptual)
1. **Strategy/Oversight**: Mark (human) is final authority.
2. **Control Plane**: Main AI Claude coordinates, routes, and validates.
3. **Execution Nodes**: Specialized worker agents/services run tasks.
4. **Transport**: Message bus + task queue primitives.
5. **Database**: Audit + state + message control + artifacts.

### Authority rules
- Control Plane (you) decides routing and task decomposition.
- Workers DO NOT self-direct. Workers may escalate anomalies.
- Mark must be escalated for: schema changes, security decisions, major infra choices, unclear product direction.

### Escalation rule (mandatory)
If you see something "not right", you MUST escalate. Silence is failure.

---

## 2) Non-Negotiables (Hard Requirements)

1. HL7-like message types and versioning
2. Strict schema validation at ingress (reject invalid messages)
3. ACK semantics (fast ACK on accept; explicit reject; timeouts)
4. Retry and Dead Letter Queue (DLQ) behavior
5. Full audit trail (append-only task_event / message_event log)
6. Idempotency (safe retries)
7. Observability (metrics, logs, traces; dashboards; alerts)
8. Security: secrets never in message payloads; least privilege
9. Controlled evolution: schema versioning + migration strategy
10. Deterministic behavior: no "agent democracy"; central convergence

---

## 3) Product Definition

### What we are building
A service platform that:
- Receives "Agent messages" (AGT tasks, ARG results, AEX escalations, etc.)
- Routes them to the correct worker queue based on rules
- Enforces contract validation + state machine transitions
- Records every action for audit and debugging
- Provides operator UI (later) and metrics (now)

### What success looks like
- You can run 4+ worker nodes reliably with predictable behavior.
- You can trace any task end-to-end (like HL7 message control ID tracking).
- You can prove: who did what, when, with what inputs, and what outputs.
- You can recover from failures (retry/DLQ) without human babysitting.
- Workers can surface risks and Mark can disposition them cleanly.

---

## 4) Naming + HL7-style Message Model

### Message Families (v1)
We will create a canonical "AIv2" envelope with message types similar to HL7.

**Message types:**
| Code | Name | HL7 Analogy |
|------|------|-------------|
| AGT | Agent Task | ORM order |
| AAC | Agent Ack | ACK |
| ARG | Agent Result | ORU result |
| AEX | Agent Exception/Escalation | ERR/NTE with severity |
| AHE | Agent Heartbeat | System status |
| ADI | Agent Disposition | Resolution of escalation |

**Optional HL7 trigger-like events (recommended naming):**
- AGT^T01 = New Task
- AAC^A01 = Accepted
- AAC^A02 = Rejected
- AAC^A03 = Received/Queued (optional)
- ARG^R01 = Result
- AEX^E01 = Escalation
- AHE^H01 = Heartbeat
- ADI^D01 = Disposition

### Envelope Standard (required segments)

All messages MUST include:
- **HDR** (header): ids, type, version, routing
- **CTX** (context): app, env, tenant, algo_version
- **AUD** (audit/tracing): correlation_id, causation_id, trace_id
- **SEC** (security refs): auth context references (no secrets)

**Task-specific segments:**
- OBJ: objective + intent
- CON: constraints
- INP: inputs (typed)
- VAL: validation/SLO targets
- ART: artifacts expected (optional)

**Result segments:**
- STA: status + exit_code + runtime duration
- MET: metrics
- OUT: outputs (structured)
- ART: artifact pointers (URIs, checksums)
- LOG: log pointers (URIs)

**Escalation segments:**
- SEV: Concern / Risk / Blocker
- EVD: evidence (where, what, impact)
- REC: recommendation

**Heartbeat:**
- CAP: capacity & health (cpu/mem/queue capacity)
- VER: versions (worker version, model version)
- LST: last task id/time processed

**Disposition:**
- DSP: accept/reject/defer + rationale + follow-up task links

---

## 5) Transport and Infrastructure (HL7 Engine Style)

### Default recommended stack (unless Mark overrides)
- **PostgreSQL** = source of truth, audit, state, message store
- **RabbitMQ** = queues, routing, ACK/retry/DLQ semantics
- Optional later: Redis for caching, Kafka for event streaming (not required for v1)

### RabbitMQ topology

**Exchange:** `ai.msg` (topic exchange)

**Routing keys:**
- `agt.<domain>.<priority>`
- `aac.<status>`
- `arg.<domain>`
- `aex.<severity>`
- `ahe.<worker>`
- `adi.<decision>`

**Queues (examples):**
- `q.worker.mac.ios`
- `q.worker.win.infra`
- `q.worker.ai.compute1`
- `q.worker.ai.compute2`
- `q.controlplane.inbox` (messages coming back)
- `q.dlq.*` (DLQs per queue)

**For each worker queue:**
- Configure retry with TTL + dead-letter exchange
- Define max in-flight / prefetch
- Require explicit ACK from consumer

### DB is the message control system
DB must store:
- Every message (raw)
- Parsed fields for search/index
- Task state machine
- Event log (append-only)

---

## 6) Database Schema (Postgres) — Required Tables

You MUST implement with migrations.

### message
Stores raw message payloads (like HL7 message store).

| Field | Type | Description |
|-------|------|-------------|
| message_id | UUID | Primary key |
| message_type | text | AGT/AAC/ARG/AEX/AHE/ADI |
| trigger_event | text | T01/R01/etc |
| version | text | e.g. 1.0 |
| from_id | text | Source |
| to_id | text | Destination |
| correlation_id | UUID | For tracing |
| causation_id | UUID | What caused this |
| created_at | timestamp | |
| status | text | RECEIVED/VALIDATED/ROUTED/FAILED/DLQ |
| payload_json | jsonb | Raw message |

### task
Represents orchestration unit.

| Field | Type | Description |
|-------|------|-------------|
| task_id | UUID | Primary key |
| objective | text | What to do |
| domain | text | IOS/INFRA/AI_COMPUTE/etc |
| priority | int | |
| state | text | CREATED/QUEUED/ACKED/RUNNING/RESULT_RECEIVED/CLOSED/FAILED/DLQ |
| assigned_worker | text | |
| inputs_hash | text | For idempotency |
| slo_json | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |

### task_event (append-only audit log)

| Field | Type | Description |
|-------|------|-------------|
| id | bigserial | Primary key |
| task_id | UUID | |
| event_type | text | QUEUED/ACKED/STARTED/RESULT/ESCALATION/DISPOSITION/FAILED/DLQ |
| message_id | UUID | nullable |
| detail_json | jsonb | |
| created_at | timestamp | |

### escalation

| Field | Type | Description |
|-------|------|-------------|
| escalation_id | UUID | Primary key |
| task_id | UUID | |
| level | text | CONCERN/RISK/BLOCKER |
| title | text | |
| evidence_json | jsonb | |
| recommendation | text | |
| status | text | RAISED/DISPOSITIONED/RESOLVED |
| disposition | text | ACCEPT/REJECT/DEFER (nullable) |
| disposition_notes | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

### worker

| Field | Type | Description |
|-------|------|-------------|
| worker_id | text | Primary key |
| domain_caps | jsonb | Capabilities |
| status | text | ONLINE/OFFLINE/DEGRADED |
| last_heartbeat_at | timestamp | |
| capacity_json | jsonb | |
| version | text | |

### artifact

| Field | Type | Description |
|-------|------|-------------|
| artifact_id | UUID | Primary key |
| task_id | UUID | |
| kind | text | log/report/diff/output |
| uri | text | |
| checksum | text | |
| created_at | timestamp | |

---

## 7) State Machines (Explicit)

### Task state machine
```
CREATED -> QUEUED -> ACKED -> RUNNING -> RESULT_RECEIVED -> CLOSED

Failure paths:
- QUEUED -> FAILED -> (RETRY) -> QUEUED
- FAILED -> DLQ if retry budget exceeded
- Any -> FAILED if schema invalid or worker rejects
```

**Rules:**
- A task is not ACKED until worker sends AAC^A01 accepted.
- A task must not be RUNNING without a STARTED event.
- RESULT closes the task only when validated.

### Escalation state machine
```
RAISED -> DISPOSITIONED -> RESOLVED
```

**Disposition can be:**
- ACCEPT: create follow-up task(s)
- REJECT: record reason
- DEFER: record next review date/time and conditions

**Every escalation MUST receive a disposition.**

---

## 8) Idempotency and Determinism

**Idempotency key (recommend):**
```
inputs_hash = hash(message.CTX + message.INP + algo_version + objective)
```

**Behavior:**
- If a duplicate AGT arrives with same idempotency key and existing task is OPEN, return AAC^A01 referencing existing task_id.
- If existing task is CLOSED, either:
  - Return cached ARG (if available), OR
  - Create new task version depending on rules (document it).

---

## 9) API / Interfaces

Implement an HTTP API for ingress + internal consumption.

**Endpoints (v1):**
- `POST /api/messages` (ingress any message)
- `GET /api/tasks/{task_id}` (task status)
- `GET /api/escalations` (filter by status/level)
- `POST /api/escalations/{id}/disposition` (human or control plane)
- `GET /api/workers` (worker status)
- `POST /api/workers/{worker_id}/heartbeat` (if not using AHE via bus)

All inbound messages must:
- Validate schema
- Be recorded in `message`
- Produce task/event transitions

---

## 10) Worker Node Contract (Execution Nodes)

**Worker behavior:**
- Consume AGT messages from its queue
- Validate it can perform task
- Send AAC accepted quickly
- Execute
- Send ARG result with metrics and artifact URIs
- If anomalies: send AEX escalation with evidence
- Send periodic AHE heartbeat with capacity and health

**Workers must:**
- Never store secrets in messages
- Not expand scope
- Not alter shared contracts

---

## 11) Monitoring & Observability (Interface-engine grade)

You MUST instrument:
- Message counts by type
- Task counts by state
- Queue depths
- Consumer lag
- Retries and DLQ counts
- p50/p95/p99 latencies (task lifecycle and worker runtime)
- Error rates (validation errors, worker failures)
- Heartbeat freshness

**Deliver:**
- Prometheus metrics endpoint (`/metrics`)
- Structured logs (json) with correlation_id
- Dashboards (Grafana JSON or at least documented queries)
- Alerts:
  - Worker heartbeat missing > threshold
  - Queue depth rising > threshold
  - DLQ non-empty
  - Error rate > threshold

---

## 12) Security Requirements (Non-negotiable)

- Secrets are never in message payloads.
- Use env vars or local secret store on each box.
- Messages carry only references (e.g., `SEC.credential_ref="ai1-ollama-token"`).
- Least privilege per worker.
- All ingress endpoints require auth (API key or OAuth; choose and implement).
- Audit access: log who dispositions escalations.

If any security choice is uncertain, escalate to Mark.

---

## 13) Versioning + Migration Strategy

- Envelope version: `aiv2_version = 1.0`
- Message schema version per type
- Backwards compatibility strategy:
  - Engine must accept previous minor version for a defined window
  - Implement transform layer if needed (like HL7 mapping)

Any breaking change requires:
- A written migration plan
- Mark approval

---

## 14) Operator Experience

### v1 (required)
- CLI or minimal web endpoint to:
  - List tasks by state
  - View a task timeline (task_event)
  - View escalations pending disposition
  - View worker status

### v2 (optional)
- Web UI that resembles an interface engine console:
  - Message explorer
  - Channel/queue status
  - Replay message
  - DLQ viewer
  - Transforms/version maps

---

## 15) Implementation Plan (Do It in Order)

You MUST implement in this order to avoid a brittle mess:

### Phase 1: Spec + Schemas
1. Write `spec/AIv2.md` describing message types and segments
2. Write JSON Schemas for each message type: AGT, AAC, ARG, AEX, AHE, ADI
3. Write routing rules doc `spec/routing.md`
4. Write state machines `spec/state_machines.md`

**Deliverable: Mark reviews spec before heavy coding.**

### Phase 2: DB + Engine Core
1. Implement Postgres migrations for required tables
2. Implement message ingestion endpoint: validate schema, store in `message`, create/update `task` and `task_event`
3. Implement idempotency logic

### Phase 3: RabbitMQ Integration
1. Define exchanges/queues/DLQs in code or IaC
2. Implement producer: route AGT to correct worker queue
3. Implement consumer: receive AAC/ARG/AEX/AHE from control inbox
4. Implement retry policy and DLQ handling

### Phase 4: Worker SDK + Reference Workers
1. Create a small worker SDK (shared lib) to: parse AGT, send AAC/ARG/AEX/AHE, standard logging and metrics
2. Build 1 reference worker that does "dummy task" reliably
3. Then integrate with real AI compute worker(s)

### Phase 5: Observability + Ops Hardening
1. Prometheus metrics
2. Grafana dashboard (basic)
3. Alerts
4. Documentation for deployments

### Phase 6: End-to-End Scenarios
Implement test scenarios like HL7 interface testing:
- Happy path
- Worker offline
- Worker rejects task
- Schema invalid
- Duplicate task idempotency
- Retry then success
- Retry exhaustion -> DLQ
- Escalation disposition flow

---

## 16) Testing Requirements

- **Unit tests** for schema validation and routing rules
- **Integration tests:**
  - Spin up Postgres + RabbitMQ locally
  - Send AGT, verify task lifecycle
  - Simulate worker behavior
- **Load tests:**
  - Queue depth growth
  - Multiple workers consuming
  - Ensure no message loss

---

## 17) Deliverables Checklist

1. `spec/AIv2.md` (message types + segments)
2. JSON Schemas for all message types
3. Postgres migrations
4. RabbitMQ topology (document + bootstrapping)
5. Engine service (API + bus integration)
6. Worker SDK + sample worker
7. Observability (metrics + logs)
8. Runbook: how to deploy, how to troubleshoot, how to replay DLQ
9. Security notes: where secrets live, how rotated, least privilege

---

## 18) Escalation to Mark — Format (MANDATORY)

When escalating, send a structured message to Mark:

### Escalation Template
```
- Level: Concern | Risk | Blocker
- Title:
- What you observed:
- Where (file/service/queue/table):
- Impact:
- Reproduction steps:
- Recommended fix:
- Decision needed from Mark (yes/no):
- If decision needed: options with pros/cons
- Default recommendation if Mark does not respond:
```

### Escalate immediately for:
- Any breaking schema change
- Any decision affecting security model
- Any ambiguity in state machine
- Any choice between RabbitMQ/NATS/Kafka unless already decided
- Any behavior that could cause silent corruption or duplicate execution

---

## 19) Operating Rules While Building

- Do not "wing it" with message formats.
- Spec first, then code.
- Keep schemas strict; reject unknown fields unless explicitly allowed.
- Keep everything traceable via correlation_id.
- Never store credentials in messages.
- Prefer boring, reliable engineering patterns.

---

## 20) Default Decisions (Unless Mark overrides)

- Use RabbitMQ + Postgres for v1.
- Use JSON message payloads with strict JSON schema validation.
- Use topic routing keys as described.
- Use append-only task_event for audit.
- Use DLQ per worker queue.

---

# ADDENDUM — Nervous System & Health Messaging

> This section is NON-OPTIONAL and part of the core architecture.
> Treat health, heartbeat, and synthetic checks as first-class messages.

## A) Philosophy

The engine MUST know when:
- A worker is alive
- An app is alive
- The system is lying about being alive
- The core loop is broken even though services are "up"

**Health is not a dashboard. Health is a MESSAGE STREAM.**

This mirrors how interface engines monitor:
- Channels
- Endpoints
- Downstream systems
- Message backlogs
- ACK failures

The nervous system is implemented using message types, schemas, routing rules, state, and alerting — NOT ad-hoc polling.

---

## B) Health Message Families (HL7-style)

### 1) AHE — Agent Heartbeat (Worker / Process)

**Purpose:** "This worker/process is alive and here is its current capacity."

**Required segments:** HDR, CTX, AUD, STA, CAP, VER

**Key fields:**
- worker_id
- domain_caps
- status: OK | DEGRADED | DOWN
- capacity: max_concurrent_tasks, current_inflight
- uptime_seconds
- last_task_id
- version (worker + model if applicable)
- emitted_at

**Rules:**
- Emitted on a fixed interval (e.g., every 15–30 seconds)
- Missing heartbeat beyond threshold = worker OFFLINE
- Heartbeat ≠ proof of correctness (only liveness)

---

### 2) AHS — Application Health Status (Service / App Instance)

**Purpose:** "This app or service instance is alive, and these checks passed or failed."

**Required segments:** HDR, CTX, AUD, STA, CHK

**CHK segment structure:**
- check_name (db, broker, cache, model_endpoint, filesystem)
- status: OK | DEGRADED | FAIL
- latency_ms (optional)
- error_message (optional)

**Key fields:**
- app_id
- env
- version
- instance_id
- overall_status: OK | DEGRADED | DOWN
- error_rate
- p50 / p95 latency (if applicable)
- config_hash / build_hash
- emitted_at

---

### 3) ASC — Synthetic Check Result (End-to-End Truth)

**Purpose:** "We executed a real scenario through the system. This is what actually happened."

**This is the MOST IMPORTANT health signal.**

**Required segments:** HDR, CTX, AUD, STA, SCN, MET

**Rules:**
- Synthetic checks MUST traverse the real system path
- Heartbeat can lie; ASC cannot
- Any ASC failure is high signal
- ASC messages MUST carry correlation_id so full trace is possible

---

## C) Routing Rules (Like Interface Channels)

- AHE → `q.controlplane.health.agent`
- AHS → `q.controlplane.health.app`
- ASC → `q.controlplane.health.synthetic`

**Dead-letter rules:**
- Any malformed health message → DLQ with reason
- Missing required segments → reject + log

---

## D) Database Tables (Health-Specific)

### worker_heartbeat
- worker_id, status, capacity_json, last_task_id, version, last_seen_at

### app_health
- app_id, instance_id, env, overall_status, checks_json, latency_p95, error_rate, last_seen_at

### synthetic_check
- scenario_id, status (PASS/FAIL), timings_json, failure_reason, correlation_id, created_at

---

## E) Alert Semantics (Rules, Not Vibes)

**Required alerts:**
- Missing AHE heartbeat beyond threshold
- Missing AHS heartbeat beyond threshold
- Worker or app in DEGRADED > X minutes
- Any ASC failure
- N consecutive ASC failures
- Health queue backlog > threshold

---

## F) Operator Visibility (No SSH Required)

**Endpoints:**
- GET `/health/workers`
- GET `/health/apps`
- GET `/health/synthetic`
- GET `/health/summary`

**Goal:** An operator can understand system health WITHOUT logging into a box.

---

## G) Non-Negotiable Rule

> If a component does not emit health messages, it does not exist.

---

*Source: GPT Build Instructions*
*Last updated: 2026-01-30*
