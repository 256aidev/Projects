# Agent Roles & Swarm

> **Who the agents are, what they do, and how to dispatch to them.**

**See also:** [PROTOCOLS.md](PROTOCOLS.md) — Message flows | [ENGINE_SPEC.md](ENGINE_SPEC.md) — Full spec

---

## Swarm Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT SWARM                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  STRATEGY LAYER │
                         │  (Human - Mark) │
                         │                 │
                         │  Final authority│
                         │  Approves plans │
                         └────────┬────────┘
                                  │
                                  │ Plans together, approves
                                  ▼
                         ┌─────────────────────────┐
                         │      SWARM LEAD         │
                         │   (MainWin Claude)      │
                         │                         │
                         │  • Lead Dev / Team Lead │
                         │  • Plans WITH human     │
                         │  • Decomposes tasks     │
                         │  • Leads the swarm      │
                         │  • Coordinates workers  │
                         └────────────┬────────────┘
                                      │
                                      │ Dispatches & coordinates
                                      │
         ┌────────────────────────────┼────────────────────────┐
         │                            │                        │
         ▼                            ▼                        ▼
┌─────────────────┐        ┌─────────────────┐      ┌─────────────────┐
│   WORKER A      │        │   WORKER B      │      │   WORKER C      │
│   (Qwen/Mac)    │        │   (Dragon)      │      │   (Other)       │
│                 │        │                 │      │                 │
│   Executes      │        │   Executes      │      │   Executes      │
│   assigned work │        │   assigned work │      │   assigned work │
└─────────────────┘        └─────────────────┘      └─────────────────┘
```

---

## Agent Types

### 1. Strategy Layer (Human)

| Field | Value |
|-------|-------|
| **Role** | Final Authority |
| **Who** | Mark (human) |
| **Responsibilities** | Approve plans, disposition escalations, strategic decisions |
| **Interacts via** | API, UI, or direct |

**When to escalate to Strategy Layer:**
- Breaking schema changes
- Security decisions
- Unclear product direction
- Blocker-level escalations

---

### 2. Swarm Lead / Coordinator (Dragon)

| Field | Value |
|-------|-------|
| **Role** | Coordinator / Swarm Lead |
| **Instance** | Single (one Lead) |
| **Location** | Dragon (10.0.1.147) |
| **Control Plane** | `http://10.0.1.147:5100` |
| **Why Dragon** | Always on, stable, MainWin not always available |

**The Coordinator (Dragon):**
- Plans WITH the human (back-and-forth collaboration)
- Decomposes approved plans into tasks
- Assigns tasks to appropriate workers
- Coordinates the swarm during execution
- Reviews results from workers
- Reports progress to human
- Can also execute light tasks directly

**NOTE:** Dragon's Ollama is for production apps (BaZi), NOT for development. Heavy AI work goes to AI2.

**Planning Role:**
- Human says "I want to build X"
- I propose architecture and plan
- We refine together
- Human approves
- I decompose and dispatch to swarm

**Coordination Role:**
- Track all in-flight tasks
- Handle worker escalations
- Re-route failed tasks
- Assemble final results

**The Lead does NOT:**
- Make strategic decisions without human
- Approve its own plans (human approves)
- Ignore escalations

---

### 3. Workers (Execution Nodes)

Workers execute tasks. **NOT all workers are Claude** - the swarm is heterogeneous.

| Worker Type | Best For | Examples |
|-------------|----------|----------|
| **Claude Code** | Complex reasoning, code, planning | MainWin, Mac |
| **Claude API** | Scale, cloud tasks | API calls |
| **Qwen** | Data processing, transforms | Server |
| **Ollama** | Heavy AI, embeddings, local inference | Dragon |

**Hybrid power = best tool for each job.**

| Field | Value |
|-------|-------|
| **Role** | Task Executor |
| **Instances** | Multiple (different machines, different models) |
| **Responsibilities** | Execute tasks, return results, emit heartbeats, escalate issues |

**Worker behavior:**
- Receive AGT (task) from Lead
- Send AAC (acknowledge) - accept or reject
- Send APL (plan) if required
- Execute task
- Send ARG (result)
- Send AHE (heartbeat) every 20 seconds
- Send AEX (escalation) if uncertain

---

## Worker Registry

### Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      HYBRID POWER                                │
├─────────────────────────────────┬───────────────────────────────┤
│         ON-PREM                 │           CLOUD               │
├─────────────────────────────────┼───────────────────────────────┤
│  Claude Code (MainWin/Mac)      │  Claude API                   │
│  AI Server 1: Dragon (147)      │                               │
│    └─ Ollama + Qwen/Llama       │                               │
│  AI Server 2: (setting up)      │                               │
│    └─ Ollama + Qwen/Llama       │                               │
│  Local GPU compute              │                               │
├─────────────────────────────────┼───────────────────────────────┤
│  Reasoning, code, planning      │  Scale when needed            │
│  Heavy AI processing            │  Overflow capacity            │
│  Embeddings, fast inference     │                               │
│  No API costs                   │                               │
└─────────────────────────────────┴───────────────────────────────┘
```

### On-Prem AI Servers

| Server | IP | Runtime | Models | Status |
|--------|-----|---------|--------|--------|
| Dragon | 10.0.1.147 | Ollama | Qwen, Llama3 | Running |
| AI Server 2 | TBD | Ollama | Qwen, Llama | Setting up |

### Current Workers

| Worker ID | Machine | Model/Runtime | Domain Caps | Status |
|-----------|---------|---------------|-------------|--------|
| worker-mainwin-001 | MainWin | Claude Code | general, code, docs | Online |

### Planned Workers

| Worker ID | Machine | Model/Runtime | Domain Caps | Status |
|-----------|---------|---------------|-------------|--------|
| worker-dragon-qwen | Dragon | Ollama + Qwen | data, transforms | Planned |
| worker-dragon-llama | Dragon | Ollama + Llama3 | ai-compute | Planned |
| worker-ai2-qwen | AI Server 2 | Ollama + Qwen | data, transforms | Planned |
| worker-mac-001 | MacBook | Claude Code | frontend, ios | Planned |
| worker-cloud-001 | Cloud | Claude API | scale, overflow | Planned |

---

## Domains & Routing

Tasks are routed to workers based on **domain**.

### Domain Registry

| Domain | Description | Routed To |
|--------|-------------|-----------|
| `general` | General tasks | Any available worker |
| `code` | Code generation, debugging | worker-mainwin-001 |
| `docs` | Documentation tasks | worker-mainwin-001 |
| `ai-compute` | Heavy AI processing | worker-dragon-001 |
| `bazi-analysis` | BaZi chart analysis | worker-bazi-001 |
| `infrastructure` | Infra/DevOps tasks | worker-mainwin-001 |

### Routing Rules

```
Task.domain = "code"       → q.worker.code
Task.domain = "ai-compute" → q.worker.ai-compute
Task.domain = "general"    → q.worker.general (round-robin)
```

---

## How to Dispatch to an Agent

### Via API (POST /tasks)

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Generate a Python function to calculate fibonacci",
    "domain": "code",
    "expectedOutputs": "Python function with docstring"
  }'
```

The `domain` field determines which worker(s) receive the task.

### Via RabbitMQ (Direct)

```
Exchange: ai.msg
Routing key: agt.code.normal
```

Workers bound to `q.worker.code` will receive the message.

---

## Worker Capabilities

Each worker declares its capabilities in the heartbeat (AHE):

```json
{
  "workerId": "worker-mainwin-001",
  "domainCaps": ["general", "code", "docs"],
  "status": "OK",
  "capacity": {
    "maxConcurrent": 5,
    "currentInflight": 1
  }
}
```

**Capability matching:**
- Task arrives with `domain: "code"`
- Control Plane finds workers with `"code"` in `domainCaps`
- Routes to available worker with capacity

---

## Adding a New Agent/Worker

### 1. Set up the machine
- Install Claude Code
- Clone 256ai.Engine project
- Create machine doc in `docs/machines/`

### 2. Configure the worker
```json
// appsettings.json
{
  "Worker": {
    "WorkerId": "worker-newmachine-001",
    "DomainCaps": ["domain1", "domain2"],
    "MaxConcurrentTasks": 5
  }
}
```

### 3. Register the domain
Add to domain registry (this doc).

### 4. Start the worker
```bash
dotnet run --project src/Engine.Worker
```

### 5. Verify
```bash
curl http://localhost:5100/health/workers
```

---

## Agent Communication Patterns

### Task Dispatch (Normal)

```
Control Plane                    Worker
     │                              │
     │  AGT (task)                  │
     │ ────────────────────────────►│
     │                              │
     │              AAC (accepted)  │
     │◄──────────────────────────── │
     │                              │
     │              ARG (result)    │
     │◄──────────────────────────── │
```

### Task with Plan Approval

```
Control Plane                    Worker
     │                              │
     │  AGT (task, requiresPlan)    │
     │ ────────────────────────────►│
     │                              │
     │              APL (plan)      │
     │◄──────────────────────────── │
     │                              │
     │  APA (approved)              │
     │ ────────────────────────────►│
     │                              │
     │              ARG (result)    │
     │◄──────────────────────────── │
```

### Escalation Flow

```
Control Plane        Worker              Strategy Layer
     │                  │                      │
     │  AGT (task)      │                      │
     │ ────────────────►│                      │
     │                  │                      │
     │    AEX (issue)   │                      │
     │◄──────────────── │                      │
     │                  │                      │
     │  Escalation created                     │
     │ ────────────────────────────────────────►
     │                                         │
     │                        ADI (disposition)│
     │◄────────────────────────────────────────
     │                  │                      │
     │  (continue or    │                      │
     │   fail based on  │                      │
     │   disposition)   │                      │
```

---

## Authority Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUTHORITY FLOWS                          │
└─────────────────────────────────────────────────────────────────┘

    INSTRUCTIONS FLOW DOWNWARD:

        Strategy Layer
              │
              ▼
        Control Plane
              │
              ▼
          Workers


    SIGNALS FLOW UPWARD:

          Workers
              │
              ▼
        Control Plane
              │
              ▼
        Strategy Layer


RULES:
─────
• Workers DO NOT self-direct
• Workers may escalate anomalies
• Control Plane decides routing
• Strategy Layer has final authority
• Silence is failure - if something is wrong, escalate
```

---

## Quick Reference

### To dispatch a task:
```bash
POST /tasks with domain field
```

### To see available workers:
```bash
GET /health/workers
```

### To add a new worker:
1. Create machine doc
2. Configure worker settings
3. Run Engine.Worker
4. Update this doc

### To add a new domain:
1. Add to domain registry (this doc)
2. Configure routing rules
3. Assign workers to domain

---

*Last updated: 2026-01-30*
