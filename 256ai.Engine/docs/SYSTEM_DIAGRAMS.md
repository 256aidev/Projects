# 256ai Engine - System Diagrams

> **For Executive Review** | Last Updated: 2026-01-31 | **v1 Doctrine - FROZEN**

---

## 1. High-Level Architecture

```
                            ┌─────────────────────────────────────┐
                            │         HUMAN (Strategy)            │
                            │      Decides what to build          │
                            └──────────────────┬──────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              WEB DASHBOARD                                    │
│                         http://10.0.1.147:8080                               │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   Health    │  │   Workers   │  │    Tasks    │  │   Response  │        │
│   │   Status    │  │   Status    │  │    Queue    │  │    View     │        │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTP API
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CONTROL PLANE (Engine)                             │
│                          http://10.0.1.147:5100                               │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│   │  Task Queue  │  │   Worker     │  │   Health     │  │  Escalation  │    │
│   │  Manager     │  │   Registry   │  │   Monitor    │  │   Handler    │    │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│                          SQLite Database (DEV)                               │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    SWARM LEAD       │  │      WORKER         │  │      WORKER         │
│     (MainWin)       │  │     (Dragon)        │  │      (AI02)         │
│                     │  │                     │  │                     │
│  Claude Code        │  │  Claude Code        │  │  Claude Code        │
│  10.0.1.235          │  │  10.0.1.147         │  │  10.0.1.178          │
│                     │  │                     │  │                     │
│  Domains:           │  │  Domains:           │  │  Domains:           │
│  - general          │  │  - ai-compute       │  │  - general          │
│  - code             │  │  - data             │  │  - code             │
│  - docs             │  │  - transforms       │  │  - dev              │
│  - infrastructure   │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

## 2. Message Model (HL7-style)

All interactions are typed messages with versioning and traceability.

### Message Types (v1)

| Code | Name | Purpose |
|------|------|---------|
| **AGT** | Agent Task | Order/task assignment |
| **AAC** | Agent Ack | Accept/reject lease |
| **ARG** | Agent Result | Task completion output |
| **AEX** | Agent Escalation | Exception/escalation |
| **AHE** | Worker Heartbeat | Liveness + capacity |
| **AHS** | App Health Status | Dependency checks |
| **ASC** | Synthetic Check | End-to-end truth verification |
| **ADI** | Disposition | Accept/reject/defer escalation |

### Required Envelope Fields (every message)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGE ENVELOPE                             │
├─────────────────────────────────────────────────────────────────┤
│  message_type      : string   (AGT, AAC, ARG, AEX, etc.)        │
│  message_version   : string   (v1)                              │
│  message_id        : UUID     (unique per message)              │
│  from_id           : string   (sender worker/component)         │
│  to_id             : string   (target worker/component)         │
│  correlation_id    : UUID     (trace across subtasks)           │
│  causation_id      : UUID     (what caused this message)        │
│  created_at        : ISO8601  (timestamp)                       │
│  idempotency_key   : string   (for task/result safety)          │
├─────────────────────────────────────────────────────────────────┤
│  payload           : object   (message-type-specific data)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                              ┌──────────┐
    │  Human   │                                              │  Human   │
    │  Input   │                                              │  Output  │
    └────┬─────┘                                              └────▲─────┘
         │                                                         │
         │ 1. "Build login page"                                   │ 8. Final Result
         ▼                                                         │
    ┌──────────┐                                              ┌────┴─────┐
    │Dashboard │─────── 2. POST /tasks ──────────────────────▶│Dashboard │
    └────┬─────┘         {objective, domain}                  └────▲─────┘
         │                                                         │
         │                                                         │ 7. GET /tasks/{id}
         ▼                                                         │    {result}
    ┌──────────────────────────────────────────────────────────────┴──────┐
    │                         CONTROL PLANE                                │
    │                                                                      │
    │   ┌─────────────────────────────────────────────────────────────┐   │
    │   │                      TASK QUEUE                              │   │
    │   │                                                              │   │
    │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
    │   │  │ PENDING │  │ LEASED  │  │IN_PROG  │  │COMPLETED│        │   │
    │   │  │ Task 1  │  │ Task 2  │  │ Task 3  │  │ Task 4  │        │   │
    │   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
    │   │                                                              │   │
    │   └─────────────────────────────────────────────────────────────┘   │
    │                                                                      │
    └────────┬─────────────────────────────────────────────────┬──────────┘
             │                                                  │
             │ 3. POST /tasks/poll                             │ 6. POST /tasks/{id}/result
             │    → returns lease_id                           │    {outputs, idempotency_key}
             ▼                                                  │
    ┌────────────────────────────────────────────────────────────────────┐
    │                           WORKERS                                   │
    │                                                                     │
    │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
    │   │  Claude Code  │  │  Claude Code  │  │  Claude Code  │         │
    │   │   (MainWin)   │  │   (Dragon)    │  │    (AI02)     │         │
    │   │               │  │               │  │               │         │
    │   │ 4. ACK lease  │  │ 4. ACK lease  │  │ 4. ACK lease  │         │
    │   │               │  │               │  │               │         │
    │   │ 5. Execute &  │  │ 5. Execute &  │  │ 5. Execute &  │         │
    │   │    Think      │  │    Think      │  │    Think      │         │
    │   └───────────────┘  └───────────────┘  └───────────────┘         │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Task Lifecycle (Correct Semantics)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TASK STATE MACHINE                                       │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │ CREATED │
                              └────┬────┘
                                   │
                                   ▼
                              ┌─────────┐
                    ┌────────▶│ PENDING │◀────────┐
                    │         └────┬────┘         │
                    │              │              │
                    │              ▼              │
                    │         ┌─────────┐         │
                    │         │ LEASED  │─────────┤ (lease expired,
                    │         └────┬────┘         │  no ACK received)
                    │              │              │
                    │              │ ACK          │
                    │              ▼              │
                    │         ┌─────────┐         │
                    │         │  ACKED  │         │
                    │         └────┬────┘         │
                    │              │              │
                    │              ▼              │
                    │       ┌───────────┐         │
                    │       │IN_PROGRESS│─────────┤ (in_progress_timeout)
                    │       └─────┬─────┘         │
                    │             │               │
                    │   ┌─────────┴─────────┐     │
                    │   │                   │     │
                    │   ▼                   ▼     │
              ┌───────────┐           ┌─────────┐ │
              │ COMPLETED │           │ FAILED  │─┘ (retry if budget remains)
              └───────────┘           └────┬────┘
                                           │
                                           │ (retry_count > max_retries)
                                           ▼
                                      ┌─────────┐
                                      │   DLQ   │
                                      └─────────┘


    LEASE SEMANTICS:
    ─────────────────────────────────────────────────────────────────────▶

    │ T+0        │ T+1          │ T+2          │ T+3            │ T+4          │
    │            │              │              │                │              │
    │ Worker     │ Lease        │ Worker       │ Worker         │ Result       │
    │ polls      │ granted      │ sends ACK    │ executes       │ submitted    │
    │            │ (30s TTL)    │ (within 5s)  │                │              │
```

### State Rules

| State | Entry Condition | Exit Conditions |
|-------|-----------------|-----------------|
| **CREATED** | Task submitted | → PENDING (immediate) |
| **PENDING** | Awaiting worker | → LEASED (worker claims) |
| **LEASED** | Worker claimed, awaiting ACK | → ACKED (ACK received) / → PENDING (lease expires) |
| **ACKED** | Worker accepted | → IN_PROGRESS (work begins) |
| **IN_PROGRESS** | Work executing | → COMPLETED / → FAILED |
| **FAILED** | Execution error | → PENDING (retry) / → DLQ (budget exceeded) |
| **DLQ** | Retry budget exceeded | → PENDING (manual replay) |
| **COMPLETED** | Success | Terminal |

---

## 5. Multi-Machine Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-MACHINE COMMUNICATION                               │
└─────────────────────────────────────────────────────────────────────────────┘

                           Network: 10.0.1.x (Bittek Prod)
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                                                                         │
    │    ┌──────────────────┐                    ┌──────────────────┐        │
    │    │    MainWin       │                    │     Dragon       │        │
    │    │   10.0.1.235      │                    │   10.0.1.147     │        │
    │    │                  │                    │                  │        │
    │    │ ┌──────────────┐ │                    │ ┌──────────────┐ │        │
    │    │ │Control Plane │ │◀───── HTTP ───────│ │  Dashboard   │ │        │
    │    │ │  :5100       │ │                    │ │    :8080     │ │        │
    │    │ └──────────────┘ │                    │ └──────────────┘ │        │
    │    │                  │                    │                  │        │
    │    │ ┌──────────────┐ │                    │ ┌──────────────┐ │        │
    │    │ │ Swarm Lead   │ │───── HTTP ────────▶│ │   Worker     │ │        │
    │    │ │(Claude Code) │ │    (via Engine)    │ │(Claude Code) │ │        │
    │    │ └──────────────┘ │                    │ └──────────────┘ │        │
    │    └──────────────────┘                    └──────────────────┘        │
    │             │                                       ▲                   │
    │             │                                       │                   │
    │             │         ┌──────────────────┐          │                   │
    │             │         │      AI02        │          │                   │
    │             │         │   10.0.1.178      │          │                   │
    │             │         │                  │          │                   │
    │             │         │ ┌──────────────┐ │          │                   │
    │             └────────▶│ │   Worker     │ │◀─────────┘                   │
    │               HTTP    │ │(Claude Code) │ │  HTTP                        │
    │            (via Engine)└──────────────┘ │                               │
    │                       └──────────────────┘                              │
    │                                                                         │
    └─────────────────────────────────────────────────────────────────────────┘

    Protocol: HTTP REST (DEV transport).
    Message contract and state machine are designed to support
    RabbitMQ/NATS later without changing behavior.
```

---

## 6. Complete Request Workflow (Example)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           EXAMPLE: Human requests "Build me a login page"                    │
└─────────────────────────────────────────────────────────────────────────────┘

 Human                Dashboard              Engine              Workers
   │                     │                     │                    │
   │  "Build login"      │                     │                    │
   │────────────────────▶│                     │                    │
   │                     │                     │                    │
   │                     │  POST /tasks (AGT)  │                    │
   │                     │  {domain:"general"} │                    │
   │                     │────────────────────▶│                    │
   │                     │                     │                    │
   │                     │                     │ Store in Queue     │
   │                     │                     │ (PENDING)          │
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ POST /tasks/poll   │
   │                     │                     │ workerId=mainwin   │
   │                     │                     │ domains=general    │
   │                     │                     │                    │
   │                     │                     │ Return Task+Lease  │
   │                     │                     │────────────────────▶
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ POST /tasks/{id}/ack
   │                     │                     │ (AAC message)      │
   │                     │                     │                    │
   │                     │                     │                    │ Swarm Lead
   │                     │                     │                    │ THINKS...
   │                     │                     │                    │
   │                     │                     │                    │ Decides:
   │                     │                     │                    │ Break into
   │                     │                     │                    │ 3 subtasks
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ POST /tasks (x3)   │
   │                     │                     │ 1. UI → frontend   │
   │                     │                     │ 2. Backend → code  │
   │                     │                     │ 3. Tests → code    │
   │                     │                     │                    │
   │                     │                     │ Queue subtasks     │
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ Workers poll &     │
   │                     │                     │ claim + ACK        │
   │                     │                     │                    │
   │                     │                     │                    │ Workers
   │                     │                     │                    │ EXECUTE
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ POST results (ARG) │
   │                     │                     │ (x3 with idemp.key)│
   │                     │                     │                    │
   │                     │                     │ Swarm Lead         │
   │                     │                     │ collects results   │
   │                     │                     │                    │
   │                     │                     │◀───────────────────│
   │                     │                     │ POST final result  │
   │                     │                     │ (ARG message)      │
   │                     │                     │                    │
   │                     │ Auto-refresh        │                    │
   │                     │◀────────────────────│                    │
   │                     │ GET /tasks/{id}     │                    │
   │                     │                     │                    │
   │  View Result        │                     │                    │
   │◀────────────────────│                     │                    │
   │                     │                     │                    │
```

---

## 7. API Endpoints Summary

| Method | Endpoint | Purpose | Used By |
|--------|----------|---------|---------|
| `POST` | `/messages` | Submit HL7-style message (AGT/ARG/AEX/AHE/AHS/ASC/ADI) | Dashboard, Workers |
| `POST` | `/tasks` | Create task (AGT wrapper) | Dashboard, Swarm Lead |
| `GET` | `/tasks` | List tasks | Dashboard |
| `GET` | `/tasks/{id}` | Task details + timeline | Dashboard |
| `POST` | `/tasks/poll` | Claim task → returns lease | Workers |
| `POST` | `/tasks/{id}/ack` | ACK lease accepted | Workers |
| `POST` | `/tasks/{id}/heartbeat` | Optional progress ping during long task | Workers |
| `POST` | `/tasks/{id}/result` | Submit result (ARG) | Workers |
| `POST` | `/tasks/{id}/fail` | Submit failure (AEX/FAILED) | Workers |
| `GET` | `/dlq` | List dead-letter tasks | Dashboard |
| `POST` | `/dlq/{id}/replay` | Replay DLQ task | Operator |
| `POST` | `/health/worker` | AHE worker heartbeat | Workers |
| `POST` | `/health/app` | AHS app health | Apps |
| `POST` | `/health/synthetic` | ASC synthetic check | Engine/Synth runner |
| `GET` | `/health/summary` | Unified status view | Dashboard |
| `GET` | `/workers` | Worker registry status | Dashboard |

---

## 8. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Contract-first message model (HL7-style)** | Every interaction is a typed message (AGT/ARG/AEX/AHE/AHS/ASC) with versioning, correlation IDs, and strict validation. |
| **ACK + lease semantics** | Prevent ghost locks, enable retries, and make failure handling deterministic (interface-engine behavior). |
| **At-least-once delivery** | Tasks may execute more than once; idempotency keys prevent harm. We do not promise exactly-once. |
| **SQLite for DEV only (with WAL + leases + DLQ)** | Lightweight, zero-ops dev datastore that still supports correct semantics. Prod path is Postgres + RabbitMQ/NATS. Historical messages retained for configurable window (30-90 days in DEV). |
| **HTTP polling is DEV transport, not the model** | Transport can change later (RabbitMQ/NATS). The message contract and state machine stay stable. |
| **Dead-letter queue (DLQ) is mandatory** | Failures must be visible, replayable, and auditable—no silent drops. |
| **Separate liveness vs truth** | Heartbeats show liveness; synthetic checks prove the core loop works end-to-end. |
| **Engine owns state; workers never mutate DB** | Workers only interact via API/messages. Engine is the single source of truth. |
| **Domain-based routing** | Tasks go to specialists (frontend, backend, AI) based on declared domains. |

### Responsibility Split

| Component | Responsibility |
|-----------|---------------|
| **Engine** | Deterministic: validates, routes, owns state, enforces contracts. |
| **Workers** | Intelligent executors: implement tasks + surface anomalies via escalations. |

> **Engine decides; workers advise.**

---

## 9. Failure Modes & Guarantees

### Delivery Guarantee

| Guarantee | Details |
|-----------|---------|
| **At-least-once** | Tasks may run more than once. |
| **Idempotency keys** | Prevent duplicate harm. |
| **Exactly-once** | NOT promised. |

> **Design Note:** The system intentionally does not attempt exactly-once execution due to distributed failure complexity. Idempotency at the application layer is the correct mitigation.

### Worker Crash Scenarios

| Scenario | Behavior |
|----------|----------|
| Crash after lease, before ACK | Lease expires → task returns to PENDING |
| Crash after ACK | Task retried after `in_progress_timeout` |
| Crash after partial work | Same as above; idempotency key prevents duplicate side-effects |

### Network Partitions

| Scenario | Behavior |
|----------|----------|
| Missing ACK/heartbeat | Timeout handling triggers |
| Late result (after lease expired) | Rejected or logged as late for review |

### Dead-Letter Queue (DLQ)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DLQ FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────┘

    Task fails
         │
         ▼
    retry_count++
         │
         ├─── retry_count <= max_retries? ───▶ Return to PENDING
         │                                      (with backoff)
         │
         ▼ (budget exceeded)
    ┌─────────┐
    │   DLQ   │◀──── Visible in dashboard
    └────┬────┘      Replayable with operator action
         │           Includes failure reason + history
         │
         ▼
    POST /dlq/{id}/replay → Returns to PENDING
```

---

## 10. Machine Assignment Matrix

| Machine | IP | Worker ID | Role | Domains |
|---------|-----|-----------|------|---------|
| **MainWin** | 10.0.1.235 | worker-mainwin-001 | Worker | general, code, docs |
| **256AI** | 10.0.1.147 | worker-dragon-001 | Coordinator + Light Worker | general, infrastructure |
| **AI02 (NucBox_EVO-X2)** | 10.0.1.178 | worker-aipc2-001 | Worker | general, code, dev |
| **Mac** | 10.0.1.237 | worker-mac-001 | Worker | frontend, ui, mobile |

---

## 11. Value Proposition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHY THIS ARCHITECTURE?                               │
└─────────────────────────────────────────────────────────────────────────────┘

    TRADITIONAL APPROACH                    256ai ENGINE APPROACH
    ──────────────────────                  ─────────────────────────

    Human → Single AI → Output              Human → Swarm → Output

    ┌─────────┐                             ┌─────────┐
    │  Human  │                             │  Human  │
    └────┬────┘                             └────┬────┘
         │                                       │
         ▼                                       ▼
    ┌─────────┐                             ┌─────────┐
    │   AI    │                             │  Lead   │───┬───┬───┐
    └────┬────┘                             └─────────┘   │   │   │
         │                                       ▼       ▼   ▼   ▼
         ▼                                  ┌─────┐ ┌─────┐ ┌─────┐
    ┌─────────┐                             │ W1  │ │ W2  │ │ W3  │
    │ Output  │                             └──┬──┘ └──┬──┘ └──┬──┘
    └─────────┘                                │      │      │
                                               └──────┼──────┘
                                                      ▼
                                               ┌───────────┐
                                               │  Output   │
                                               └───────────┘

    Limitations:                            Benefits:
    • Single context window                 • Parallel execution
    • One machine's resources               • Specialized workers
    • Sequential processing                 • Distributed compute
    • Token limits                          • Unlimited scale
                                           • No extra API costs*
                                           • Proper failure handling
                                           • Auditable message trail

    *Workers are Claude Code subscriptions, not API calls
```

---

*Generated by 256ai Engine | Swarm Lead: MainWin | HL7-style Interface Engine*
