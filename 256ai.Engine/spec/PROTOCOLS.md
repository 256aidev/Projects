# Engine Protocols

> **Protocol documentation for the 256ai.Engine**
> Shows message flows, state transitions, and gaps analysis.

**See also:** [PROTOCOL_FLOWS.md](PROTOCOL_FLOWS.md) — Visual diagrams

---

## Table of Contents
1. [Current Implementation Status](#current-implementation-status)
2. [Message Types](#message-types)
3. [Task Protocol (Current)](#task-protocol-current)
4. [Task Protocol (Per Spec)](#task-protocol-per-spec)
5. [Gap Analysis: Plan/Approval Phase](#gap-analysis-planapproval-phase)
6. [Escalation Protocol](#escalation-protocol)
7. [Health Protocol](#health-protocol)
8. [API Endpoints](#api-endpoints)

---

## Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Task submission (POST /tasks) | Implemented | Creates task, publishes TAS |
| Task query (GET /tasks) | Implemented | Lists/gets tasks |
| Task result processing | Implemented | TRS updates task status |
| Worker heartbeat (AHE) | Implemented | Heartbeat service |
| Escalations API | Implemented | CRUD + disposition |
| **AAC (Acknowledgment)** | NOT IMPLEMENTED | Worker doesn't send ACK |
| **Plan/Approval phase** | NOT IMPLEMENTED | No planning step |
| **State machine enforcement** | PARTIAL | Missing intermediate states |
| RabbitMQ integration | Implemented | But not running |
| Schema validation | NOT IMPLEMENTED | No ingress validation |

---

## Message Types

### Implemented Messages

| Code | Name | Direction | Purpose |
|------|------|-----------|---------|
| TAS | Task Message | CP → Worker | Dispatch task |
| TRS | Task Result | Worker → CP | Return result |
| AHE | Agent Heartbeat | Worker → CP | Liveness signal |
| ESC | Escalation | Worker → CP | Surface issues |
| AHS | App Health Status | App → CP | App health |
| ASC | Synthetic Check | System → CP | E2E verification |

### NOT Implemented (Per Spec)

| Code | Name | Purpose | Why Missing |
|------|------|---------|-------------|
| AAC | Agent Ack | Worker accepts/rejects task | Not coded |
| ADI | Agent Disposition | Resolution of escalation | Uses API instead |
| AGT | Agent Task (full) | Full HL7-style task | Using simplified TAS |

---

## Task Protocol (Current)

### What Actually Happens Now

```
┌──────────────┐                    ┌──────────────┐
│ Control Plane│                    │    Worker    │
└──────────────┘                    └──────────────┘
       │                                   │
       │  1. POST /tasks                   │
       │  (creates task, status=PENDING)   │
       │                                   │
       │  2. Publish TAS to queue          │
       │ ────────────────────────────────► │
       │                                   │
       │                    3. Receive TAS │
       │                    4. Execute     │
       │                       immediately │
       │                    5. Send TRS    │
       │ ◄──────────────────────────────── │
       │                                   │
       │  6. Update task status            │
       │     (COMPLETED or FAIL)           │
       │                                   │
```

### Task States (Current)

```
PENDING ──────────────────────────────► COMPLETED
    │                                       │
    └───────────────────────────────────────┘
                                        or FAIL
```

**Current states used:** PENDING, COMPLETED, FAIL

**Missing states from spec:**
- CREATED
- QUEUED
- ACKED
- RUNNING
- RESULT_RECEIVED
- CLOSED
- DLQ

### Code Flow (Current)

1. **TasksController.CreateTask()** (line 34-96)
   - Creates TaskEntity with status=PENDING
   - Publishes TaskMessage to RabbitMQ

2. **TaskConsumerService.ProcessTask()** (line 84-161)
   - Deserializes TaskMessage
   - Immediately calls `RunTaskAsync()` (no ACK step)
   - Sends TaskResultMessage

3. **TaskResultConsumerService.ProcessTaskResult()** (line 77-105)
   - Updates TaskEntity with result
   - Sets CompletedAt timestamp

---

## Task Protocol (Per Spec)

### What SHOULD Happen (ENGINE_SPEC.md)

```
┌──────────────┐                    ┌──────────────┐
│ Control Plane│                    │    Worker    │
└──────────────┘                    └──────────────┘
       │                                   │
       │  1. Create task (CREATED)         │
       │                                   │
       │  2. Route to queue (QUEUED)       │
       │                                   │
       │  3. Send AGT                      │
       │ ────────────────────────────────► │
       │                                   │
       │                    4. Validate    │
       │                       can perform │
       │                                   │
       │  5. AAC^A01 (accepted)            │
       │ ◄──────────────────────────────── │
       │                                   │
       │  6. Update state (ACKED)          │
       │                                   │
       │                    7. Execute     │
       │                       (RUNNING)   │
       │                                   │
       │  8. ARG (result)                  │
       │ ◄──────────────────────────────── │
       │                                   │
       │  9. Validate result               │
       │     (RESULT_RECEIVED → CLOSED)    │
       │                                   │
```

### Full State Machine (Per Spec)

```
CREATED → QUEUED → ACKED → RUNNING → RESULT_RECEIVED → CLOSED
              │       │        │
              ▼       ▼        ▼
           FAILED ──────────────────► DLQ (if retry exhausted)
              │
              ▼
           (RETRY) → QUEUED
```

### What's Missing

1. **AAC Message** - Worker should ACK before executing
2. **State tracking** - Each transition should be recorded
3. **Retry logic** - Failed tasks should retry before DLQ
4. **Validation** - Schema validation at ingress

---

## Gap Analysis: Plan/Approval Phase

### Your Question
> "If a task is given, is a plan asked for back from the downstream agent before the agent can execute?"

### Current Answer: NO

The current implementation has **no planning phase**. Tasks go:
```
Receive Task → Execute Immediately → Return Result
```

### Options for Adding Plan/Approval

#### Option A: Plan-then-Execute Protocol

```
┌──────────────┐                    ┌──────────────┐
│ Control Plane│                    │    Worker    │
└──────────────┘                    └──────────────┘
       │                                   │
       │  1. Send AGT (task)               │
       │ ────────────────────────────────► │
       │                                   │
       │  2. Worker analyzes task          │
       │                                   │
       │  3. APL (Agent Plan)              │
       │     - Proposed approach           │
       │     - Estimated steps             │
       │     - Risks identified            │
       │     - Resources needed            │
       │ ◄──────────────────────────────── │
       │                                   │
       │  4. Review plan                   │
       │     (human or automatic)          │
       │                                   │
       │  5. APA (Agent Plan Approval)     │
       │     - APPROVED / REJECTED         │
       │     - Modifications               │
       │ ────────────────────────────────► │
       │                                   │
       │  6. Execute (if approved)         │
       │                                   │
       │  7. ARG (result)                  │
       │ ◄──────────────────────────────── │
```

**New message types needed:**
- **APL** (Agent Plan) - Worker proposes execution plan
- **APA** (Agent Plan Approval) - CP approves/rejects/modifies plan

**New states needed:**
- PLAN_REQUESTED
- PLAN_RECEIVED
- PLAN_APPROVED
- PLAN_REJECTED

#### Option B: Trust Levels

Different tasks get different protocols based on risk:

| Trust Level | Protocol |
|-------------|----------|
| LOW (new worker, risky task) | Full plan approval required |
| MEDIUM (established worker) | Plan submitted but auto-approved |
| HIGH (trusted worker, routine task) | No plan needed, execute directly |

#### Option C: Escalation-Based Planning

Keep current flow but require escalation (AEX) when:
- Task is ambiguous
- Multiple approaches possible
- High-risk operation
- First time seeing this task type

Worker escalates with proposed plan, human approves via disposition.

### Recommendation

**Option A (Plan-then-Execute)** is most aligned with the spec's philosophy:
- "Workers DO NOT self-direct"
- "Mark must be escalated for... unclear product direction"
- "Deterministic behavior: no agent democracy"

But it adds latency. Consider:
- Making it **optional per task** (flag in task message)
- Enabling it for certain **domains** only
- Auto-approving **routine tasks** after learning period

---

## Escalation Protocol

### Current Implementation

```
Worker detects issue → Creates EscalationEntity → API returns it
Human views via GET /escalations → PUT /escalations/{id} to disposition
```

### Escalation Levels

| Level | When to Use |
|-------|-------------|
| CONCERN | Minor issue, informational |
| RISK | Potential problem, needs attention |
| BLOCKER | Cannot proceed, requires immediate action |

### Disposition Options

| Disposition | Required | Effect |
|-------------|----------|--------|
| Accepted | - | Issue acknowledged, continue |
| Rejected | reason | False positive, record why |
| Deferred | reviewDate | Will review later |

### Missing from Current Code

- No automatic escalation from worker on task failure
- No EscalationConsumerService to process ESC messages
- Escalations created manually, not via message flow

---

## Health Protocol

### Heartbeat (AHE) - Implemented

```
Worker ──(every 20s)──► AHE message ──► HealthConsumerService ──► worker_heartbeat table
```

**Fields sent:**
- WorkerId
- Status (OK/DEGRADED/DOWN)
- Capacity (max tasks, current inflight)
- Version
- LastTaskId

**Timeout:** Worker marked OFFLINE if no heartbeat > 60 seconds

### App Health (AHS) - Schema Only

Apps should emit health status, but no apps are connected yet.

### Synthetic Check (ASC) - Schema Only

End-to-end tests that verify the whole system works. Not implemented.

---

## API Endpoints

### Task Endpoints

#### POST /tasks
**Purpose:** Submit new task for execution

**Request:**
```json
{
  "objective": "string (required)",
  "domain": "string (required)",
  "expectedOutputs": "string (required)",
  "constraints": ["optional array"],
  "inputs": {"optional": "object"},
  "validationCriteria": "optional string",
  "timeLimitSeconds": 300,
  "batchLimit": 1
}
```

**Response (201):**
```json
{
  "taskId": "guid",
  "status": "PENDING",
  "createdAt": "timestamp"
}
```

**Protocol:**
1. Validate request
2. Create TaskEntity (PENDING)
3. Build TaskMessage (TAS)
4. Publish to RabbitMQ tasks queue
5. Return task ID

**Missing:** Schema validation, plan request flag

---

#### GET /tasks
**Purpose:** List tasks with optional filters

**Parameters:**
- `status` (optional): PENDING, COMPLETED, FAIL
- `limit` (default 50)

**Response:**
```json
[
  {
    "taskId": "guid",
    "objective": "string",
    "domain": "string",
    "status": "PENDING",
    "assignedWorkerId": null,
    "createdAt": "timestamp",
    "completedAt": null
  }
]
```

---

#### GET /tasks/{id}
**Purpose:** Get task details and result

**Response:**
```json
{
  "taskId": "guid",
  "objective": "string",
  "domain": "string",
  "status": "COMPLETED",
  "assignedWorkerId": "worker-id",
  "createdAt": "timestamp",
  "completedAt": "timestamp",
  "result": { ... }
}
```

---

### Health Endpoints

#### GET /health/summary
**Purpose:** Overall system health

**Response:**
```json
{
  "overallStatus": "OK|DEGRADED|DOWN",
  "timestamp": "timestamp",
  "workers": { "online": 0, "degraded": 0, "total": 0 },
  "apps": { "healthy": 0, "degraded": 0, "total": 0 },
  "syntheticChecks": { "passesLastHour": 0, "failsLastHour": 0 },
  "escalations": { "pending": 0, "total": 0 }
}
```

**Status Logic:**
- DOWN = no workers online
- DEGRADED = workers degraded OR synthetic failures OR app issues
- OK = everything healthy

---

#### GET /health/workers
**Purpose:** List all registered workers

**Response:**
```json
[
  {
    "workerId": "string",
    "status": "OK",
    "version": "1.0.0",
    "lastTaskId": "guid or null",
    "lastSeenAt": "timestamp",
    "isOnline": true
  }
]
```

---

#### GET /health/apps
**Purpose:** List app health status

---

#### GET /health/synthetic
**Purpose:** List synthetic check results

**Parameters:** `limit` (default 50)

---

### Escalation Endpoints

#### GET /escalations
**Purpose:** List escalations

**Parameters:**
- `disposition`: Pending, Accepted, Rejected, Deferred
- `limit` (default 50)

---

#### GET /escalations/{id}
**Purpose:** Get escalation details

---

#### PUT /escalations/{id}
**Purpose:** Disposition an escalation

**Request:**
```json
{
  "disposition": "Accepted|Rejected|Deferred",
  "reason": "required if Rejected",
  "reviewDate": "required if Deferred"
}
```

---

## Summary: What Needs to Be Built

### Phase 1: Fix Core Protocol
1. Add AAC (acknowledgment) message and flow
2. Implement full state machine (CREATED→QUEUED→ACKED→RUNNING→CLOSED)
3. Add task_event logging (audit trail)
4. Add retry + DLQ handling

### Phase 2: Add Plan/Approval (Optional)
1. Add APL (Agent Plan) message type
2. Add APA (Agent Plan Approval) message type
3. Add plan states to state machine
4. Add `requiresPlan` flag to task schema
5. Build plan review UI or API

### Phase 3: Full Observability
1. Schema validation at ingress
2. Prometheus metrics
3. Alert rules

---

*Last updated: 2026-01-30*
