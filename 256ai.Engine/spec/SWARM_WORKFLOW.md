# Swarm Workflow

> **How we go from idea to shipped app using the agent swarm.**
> **Goal: VELOCITY + CORRECTNESS**
>
> Fast is useless if it's wrong. We achieve both through:
> - Thorough planning (human + Lead collaborate)
> - Parallel execution (swarm works simultaneously)
> - Memory/docs (Lead stays oriented across sessions)
> - Hybrid power (on-prem + cloud combined)

**See also:** [AGENT_ROLES.md](AGENT_ROLES.md) — Agent definitions | [PROTOCOLS.md](PROTOCOLS.md) — Message flows

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FROM IDEA TO SHIPPED APP                             │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PHASE 1: PLANNING (Manual, Back-and-Forth)                             │
  │                                                                         │
  │    Human ◄──────────────────────────────────────► Claude                │
  │                                                                         │
  │    "Here's the idea"                                                    │
  │    "Here's the plan"                                                    │
  │    "What about X?"                                                      │
  │    "Good point, revised plan"                                           │
  │    "Approved. GO."                                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Plan approved
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PHASE 2: TASK DECOMPOSITION (Control Plane)                            │
  │                                                                         │
  │    Plan ───► Break into tasks ───► Assign domains ───► Queue tasks      │
  │                                                                         │
  │    Task 1: Backend API         → domain: "code"                         │
  │    Task 2: Database schema     → domain: "code"                         │
  │    Task 3: Frontend UI         → domain: "frontend"                     │
  │    Task 4: AI integration      → domain: "ai-compute"                   │
  │    Task 5: Documentation       → domain: "docs"                         │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Tasks dispatched
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PHASE 3: PARALLEL EXECUTION (Swarm)                                    │
  │                                                                         │
  │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
  │    │ Claude      │  │ Qwen        │  │ Mac Claude  │  │ Dragon      │  │
  │    │ (MainWin)   │  │ (Server)    │  │ (MacBook)   │  │ (GPU)       │  │
  │    │             │  │             │  │             │  │             │  │
  │    │ Backend API │  │ Data proc   │  │ Frontend    │  │ AI models   │  │
  │    │ DB schema   │  │ Transforms  │  │ UI/UX       │  │ Heavy comp  │  │
  │    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
  │           │               │               │               │            │
  │           └───────────────┴───────────────┴───────────────┘            │
  │                                    │                                    │
  │                            All working in parallel                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Results flow back
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PHASE 4: INTEGRATION & ASSEMBLY                                        │
  │                                                                         │
  │    Control Plane receives all results                                   │
  │    Validates outputs                                                    │
  │    Assembles into final app                                             │
  │    Reports to human                                                     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │ APP DONE │
                              └──────────┘
```

---

## Phase 1: Planning (Manual)

**Who:** Human + Main Claude (you and me)
**Mode:** Conversational, back-and-forth
**Output:** Approved plan document

### What happens:

1. **Human shares idea**
   - "I want to build X"
   - Initial requirements

2. **Claude proposes plan**
   - Architecture
   - Components needed
   - Task breakdown draft

3. **Back-and-forth refinement**
   - Human: "What about Y?"
   - Claude: "Good point, here's revised plan"
   - Human: "Change Z"
   - Claude: "Updated"

4. **Human approves**
   - "Looks good. GO."

### Plan document structure:

```markdown
# App: [Name]

## Objective
What we're building.

## Components
- Component A
- Component B

## Task Breakdown
| Task | Domain | Assigned To | Dependencies |
|------|--------|-------------|--------------|
| 1. Build API | code | Claude MainWin | None |
| 2. Build DB | code | Claude MainWin | None |
| 3. Build UI | frontend | Mac Claude | Task 1, 2 |

## Success Criteria
How we know it's done.

## APPROVED: [Date]
```

---

## Phase 2: Task Decomposition

**Who:** Control Plane
**Mode:** Automated
**Output:** Queued tasks

### Control Plane actions:

1. Parse approved plan
2. Create TaskEntity for each task
3. Set domains and dependencies
4. Calculate execution order
5. Queue independent tasks immediately
6. Hold dependent tasks until prerequisites complete

### Dependency handling:

```
Task 1 (API)     ───┐
                    ├───► Task 3 (UI) depends on 1 & 2
Task 2 (DB)     ───┘

Task 1 and 2 run in parallel
Task 3 waits until both complete
```

---

## Phase 3: Parallel Execution

**Who:** Worker swarm
**Mode:** Parallel, automated
**Output:** Task results

### Agent assignments:

| Agent | Machine | Best For |
|-------|---------|----------|
| Claude (MainWin) | Windows dev | Backend, APIs, C#, general code |
| Qwen | Server | Data processing, transformations |
| Claude (Mac) | MacBook | Frontend, Swift, iOS |
| Ollama (Dragon) | GPU server | Heavy AI, embeddings, inference |

### Parallel execution:

```
Time ─────────────────────────────────────────────────────────►

Claude MainWin:  ████████ Task 1 ████████
                 ████████ Task 2 ████████

Qwen Server:     ████████ Task 4 ████████████████

Mac Claude:                               ████████ Task 3 ████████
                                          (waits for 1 & 2)

Dragon:          ████████████ Task 5 ████████████
```

**All agents work simultaneously = VELOCITY**

---

## Phase 4: Integration

**Who:** Control Plane + Human review
**Mode:** Automated assembly, human verification
**Output:** Working app

### Steps:

1. **Collect results**
   - All ARG (result) messages received
   - Artifacts stored

2. **Validate**
   - Each task result meets criteria
   - No escalations pending

3. **Assemble**
   - Combine components
   - Run integration tests

4. **Report**
   - Summary to human
   - App ready for review

---

## Agent Roster

### Current

| Agent ID | Type | Machine | Domains | Status |
|----------|------|---------|---------|--------|
| worker-mainwin-001 | Claude Code | MainWin | code, docs, general | Online |

### Planned

| Agent ID | Type | Machine | Domains | Status |
|----------|------|---------|---------|--------|
| worker-dragon-001 | Claude Code | Dragon | ai-compute | Planned |
| worker-mac-001 | Claude Code | MacBook | frontend, ios | Planned |
| worker-qwen-001 | Qwen | Server | data, transforms | Planned |

---

## Core Principles

### VELOCITY + CORRECTNESS
> **Fast is useless if it's wrong. The goal is BOTH.**

### 1. Plan thoroughly, execute fast
- Time spent planning saves time in execution
- Fewer rework cycles
- The Lead has MEMORY (docs) to stay correct

### 2. Parallelize everything possible
- Independent tasks run simultaneously
- Only block on true dependencies
- Total time = longest chain, not sum of all

### 3. Right agent for the job
- Frontend → Mac Claude
- Heavy AI → Dragon (on-prem Ollama)
- Backend → MainWin Claude
- Cloud tasks → Claude API

### 4. Hybrid on-prem + cloud
- **On-prem power:** Ollama + Qwen/Llama, local GPU, local Claude Code
- **Cloud power:** Claude API for scale and quality
- Best of both = velocity + cost efficiency

### 5. Escalate early
- If stuck, escalate immediately
- Don't waste time on blockers
- Correctness over speed when uncertain

### 6. Memory is power
- Documentation keeps the Lead oriented
- Required reading before acting
- If it's not written down, it doesn't exist

---

## Example: Building a New App

### Input (from Human):
"Build a habit tracker mobile app with AI insights"

### Planning session output:

```markdown
# App: HabitAI

## Components
1. Backend API (C#)
2. Database (PostgreSQL)
3. Mobile frontend (iOS)
4. AI habit analysis engine

## Tasks
| # | Task | Domain | Agent | Deps |
|---|------|--------|-------|------|
| 1 | API endpoints | code | MainWin | - |
| 2 | DB schema | code | MainWin | - |
| 3 | Habit analysis model | ai-compute | Dragon | - |
| 4 | iOS app | frontend | Mac | 1,2 |
| 5 | AI integration | code | MainWin | 3,4 |
| 6 | Documentation | docs | MainWin | 5 |

APPROVED: 2026-01-30
```

### Execution:
- Tasks 1, 2, 3 start immediately (parallel)
- Task 4 waits for 1 & 2
- Task 5 waits for 3 & 4
- Task 6 waits for 5

### Result:
- All agents working in parallel
- Total time ≈ longest chain, not sum of all tasks
- **Velocity achieved**

---

## Quick Commands

### Start the swarm on a plan:
```bash
# Submit the plan as tasks
POST /tasks/batch
{
  "planId": "habit-ai-001",
  "tasks": [...]
}
```

### Monitor progress:
```bash
# Check task status
GET /tasks?planId=habit-ai-001

# Check worker status
GET /health/workers
```

### View results:
```bash
# Get completed task results
GET /tasks/{taskId}
```

---

*Last updated: 2026-01-30*
