# Protocol Flows — Visual Guide

> **How messages flow through the engine**

**See also:** [PROTOCOLS.md](PROTOCOLS.md) — Detailed specs and gap analysis

---

## 1. Current Implementation (What Exists Now)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT FLOW                                    │
│                         (Simplified - No Checks)                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                          ┌──────────┐
    │  Human   │                                          │  Worker  │
    │  (You)   │                                          │ (Claude) │
    └────┬─────┘                                          └────┬─────┘
         │                                                     │
         │  ① POST /tasks                                      │
         │  {objective, domain, expectedOutputs}               │
         ▼                                                     │
    ┌──────────────┐                                          │
    │ Control Plane│                                          │
    │   (API)      │                                          │
    └──────┬───────┘                                          │
           │                                                   │
           │  ② Create TaskEntity                              │
           │     status = PENDING                              │
           │                                                   │
           │  ③ Publish TAS (Task Message)                     │
           │ ─────────────────────────────────────────────────►│
           │                    RabbitMQ                       │
           │                                                   │
           │                                    ④ Receive TAS  │
           │                                                   │
           │                                    ⑤ Execute      │
           │                                       IMMEDIATELY │
           │                                       (no check)  │
           │                                                   │
           │                                    ⑥ Send TRS     │
           │◄───────────────────────────────────────────────── │
           │                   (Task Result)                   │
           │                                                   │
           │  ⑦ Update TaskEntity                              │
           │     status = COMPLETED                            │
           │                                                   │
         ┌─┴─────────────┐                                     │
         │ GET /tasks/id │                                     │
         │ (see result)  │                                     │
         └───────────────┘                                     │

PROBLEMS WITH CURRENT FLOW:
─────────────────────────────
• No ACK - Worker doesn't confirm it CAN do the task
• No Plan - Worker doesn't propose HOW it will do the task
• No Approval - Human can't review before execution
• No States - Missing QUEUED, ACKED, RUNNING states
• No Retry - Failed tasks don't retry
```

---

## 2. Spec Protocol (What ENGINE_SPEC.md Defines)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPEC FLOW                                       │
│                    (With ACK - Per ENGINE_SPEC.md)                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                          ┌──────────┐
    │  Human   │                                          │  Worker  │
    └────┬─────┘                                          └────┬─────┘
         │                                                     │
         │  ① POST /tasks                                      │
         ▼                                                     │
    ┌──────────────┐                                          │
    │ Control Plane│                                          │
    └──────┬───────┘                                          │
           │                                                   │
           │  ② Create TaskEntity                              │
           │     status = CREATED                              │
           │                                                   │
           │  ③ Route to queue                                 │
           │     status = QUEUED                               │
           │                                                   │
           │  ④ Publish AGT (Agent Task)                       │
           │ ─────────────────────────────────────────────────►│
           │                                                   │
           │                                    ⑤ Receive AGT  │
           │                                                   │
           │                                    ⑥ Validate:    │
           │                                       Can I do    │
           │                                       this task?  │
           │                                                   │
           │                     ⑦ AAC^A01 (Accepted)          │
           │◄───────────────────────────────────────────────── │
           │                  OR AAC^A02 (Rejected)            │
           │                                                   │
           │  ⑧ Update TaskEntity                              │
           │     status = ACKED (or FAILED if rejected)        │
           │                                                   │
           │                                    ⑨ Execute      │
           │                                       task        │
           │                                                   │
           │                                    ⑩ Send ARG     │
           │◄───────────────────────────────────────────────── │
           │                   (Agent Result)                  │
           │                                                   │
           │  ⑪ Validate result                                │
           │     status = RESULT_RECEIVED                      │
           │                                                   │
           │  ⑫ Close task                                     │
           │     status = CLOSED                               │
           │                                                   │


STATE MACHINE (Spec):
─────────────────────
  CREATED → QUEUED → ACKED → RUNNING → RESULT_RECEIVED → CLOSED
                │
                ▼
             FAILED → (RETRY) → QUEUED
                │
                ▼ (retry exhausted)
               DLQ


MESSAGE TYPES (Spec):
─────────────────────
  AGT = Agent Task (Control Plane → Worker)
  AAC = Agent ACK (Worker → Control Plane)
  ARG = Agent Result (Worker → Control Plane)
  AEX = Agent Exception/Escalation
  AHE = Agent Heartbeat
  ADI = Agent Disposition
```

---

## 3. Enhanced Protocol (With Plan/Approval Phase)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENHANCED FLOW                                      │
│              (With Plan/Approval - PROPOSED ADDITION)                        │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                          ┌──────────┐
    │  Human   │                                          │  Worker  │
    │  (Mark)  │                                          │ (Claude) │
    └────┬─────┘                                          └────┬─────┘
         │                                                     │
         │  ① POST /tasks                                      │
         │     {objective, requiresPlan: true}                 │
         ▼                                                     │
    ┌──────────────┐                                          │
    │ Control Plane│                                          │
    └──────┬───────┘                                          │
           │                                                   │
           │  ② status = CREATED → QUEUED                      │
           │                                                   │
           │  ③ Publish AGT                                    │
           │ ─────────────────────────────────────────────────►│
           │                                                   │
           │                                    ④ Receive AGT  │
           │                                                   │
           │                                    ⑤ Analyze task │
           │                                       & create    │
           │                                       plan        │
           │                                                   │
           │                     ⑥ APL (Agent Plan)            │
           │◄───────────────────────────────────────────────── │
           │   {                                               │
           │     "taskId": "...",                              │
           │     "proposedApproach": "...",                    │
           │     "steps": [...],                               │
           │     "estimatedDuration": "...",                   │
           │     "risksIdentified": [...],                     │
           │     "resourcesNeeded": [...],                     │
           │     "clarificationsNeeded": [...]                 │
           │   }                                               │
           │                                                   │
           │  ⑦ status = PLAN_RECEIVED                         │
           │                                                   │
    ┌──────┴───────┐                                          │
    │              │                                          │
    │  Human       │  ⑧ Review plan                            │
    │  Reviews     │     - Approve as-is                       │
    │  Plan        │     - Approve with modifications          │
    │              │     - Reject with feedback                │
    │              │                                          │
    └──────┬───────┘                                          │
           │                                                   │
           │  ⑨ APA (Agent Plan Approval)                      │
           │ ─────────────────────────────────────────────────►│
           │   {                                               │
           │     "decision": "APPROVED|REJECTED|MODIFY",       │
           │     "modifications": [...],                       │
           │     "feedback": "..."                             │
           │   }                                               │
           │                                                   │
           │  ⑩ status = PLAN_APPROVED (or PLAN_REJECTED)      │
           │                                                   │
           │                                    ⑪ Execute per  │
           │                                       approved    │
           │                                       plan        │
           │                                                   │
           │                     ⑫ ARG (Result)                │
           │◄───────────────────────────────────────────────── │
           │                                                   │
           │  ⑬ status = CLOSED                                │
           │                                                   │


ENHANCED STATE MACHINE:
───────────────────────
  CREATED → QUEUED → PLAN_REQUESTED → PLAN_RECEIVED → PLAN_APPROVED → RUNNING → CLOSED
                                            │
                                            ▼
                                      PLAN_REJECTED → (revise) → PLAN_REQUESTED
                                            │
                                            ▼ (give up)
                                          FAILED


NEW MESSAGE TYPES:
──────────────────
  APL = Agent Plan (Worker → Control Plane)
        Worker proposes how it will execute the task

  APA = Agent Plan Approval (Control Plane → Worker)
        Human/system approves, rejects, or modifies the plan
```

---

## 4. How It All Integrates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE INTEGRATED FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         STRATEGY LAYER              │
                    │      (Human - Mark - Final Auth)    │
                    │                                     │
                    │  • Reviews plans (APL)              │
                    │  • Approves execution (APA)         │
                    │  • Dispositions escalations (ADI)   │
                    └──────────────────┬──────────────────┘
                                       │
                    ┌──────────────────▼──────────────────┐
                    │         CONTROL PLANE               │
                    │      (This Engine - Port 5100)      │
                    │                                     │
                    │  • Receives tasks (POST /tasks)     │
                    │  • Routes to workers (AGT)          │
                    │  • Receives ACKs (AAC)              │
                    │  • Receives plans (APL)             │
                    │  • Forwards approvals (APA)         │
                    │  • Receives results (ARG)           │
                    │  • Manages state machine            │
                    │  • Stores audit trail               │
                    └──────────────────┬──────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │    WORKER 1     │    │    WORKER 2     │    │    WORKER 3     │
    │  (Claude Code)  │    │  (Claude Code)  │    │  (Claude Code)  │
    │                 │    │                 │    │                 │
    │ • Receives AGT  │    │ • Receives AGT  │    │ • Receives AGT  │
    │ • Sends AAC     │    │ • Sends AAC     │    │ • Sends AAC     │
    │ • Sends APL     │    │ • Sends APL     │    │ • Sends APL     │
    │ • Waits for APA │    │ • Waits for APA │    │ • Waits for APA │
    │ • Executes      │    │ • Executes      │    │ • Executes      │
    │ • Sends ARG     │    │ • Sends ARG     │    │ • Sends ARG     │
    │ • Sends AHE     │    │ • Sends AHE     │    │ • Sends AHE     │
    │   (heartbeat)   │    │   (heartbeat)   │    │   (heartbeat)   │
    └─────────────────┘    └─────────────────┘    └─────────────────┘


MESSAGE FLOW SUMMARY:
─────────────────────

  DOWNWARD (Control Plane → Worker):
  ┌─────────────────────────────────────────────────────────────┐
  │  AGT = "Here's a task to do"                                │
  │  APA = "Your plan is approved/rejected/modified"            │
  └─────────────────────────────────────────────────────────────┘

  UPWARD (Worker → Control Plane):
  ┌─────────────────────────────────────────────────────────────┐
  │  AAC = "I can/cannot do this task"                          │
  │  APL = "Here's my plan to do it"                            │
  │  ARG = "Here's the result"                                  │
  │  AEX = "I have a problem/question"                          │
  │  AHE = "I'm still alive" (every 20 seconds)                 │
  └─────────────────────────────────────────────────────────────┘


WHEN THINGS GO WRONG:
─────────────────────

  Worker Can't Do Task:
    AGT → AAC^A02 (Rejected) → Task goes back to queue or fails

  Worker Is Uncertain:
    AGT → AAC^A01 → APL with "clarificationsNeeded" → Human clarifies

  Plan Rejected:
    APL → APA (Rejected) → Worker revises → APL again

  Execution Fails:
    Running → AEX (Escalation) → Human dispositions → Retry or fail

  Worker Dies:
    No AHE for 60s → Control Plane marks worker OFFLINE → Reassign tasks
```

---

## 5. Task Lifecycle with Plan/Approval

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TASK LIFECYCLE TIMELINE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Time ──────────────────────────────────────────────────────────────────────────►

│ CREATED │ QUEUED │ ACK │ PLAN_REQ │ PLAN_RCV │ APPROVED │ RUNNING │ CLOSED │
│         │        │     │          │          │          │         │        │
│    ●────┼────●───┼──●──┼────●─────┼────●─────┼────●─────┼────●────┼───●    │
│    │    │    │   │  │  │    │     │    │     │    │     │    │    │   │    │
│    │    │    │   │  │  │    │     │    │     │    │     │    │    │   │    │
│  Task   │  Route │ AAC │  Worker  │   APL    │   APA    │ Execute │  ARG   │
│ created │ to Q   │ A01 │ analyzes │ proposed │ approved │  task   │ result │
│         │        │     │          │          │          │         │        │


AUDIT TRAIL (task_event table):
───────────────────────────────
  ID  TASK_ID    EVENT_TYPE       MESSAGE_ID    TIMESTAMP
  1   abc-123    CREATED          null          10:00:00
  2   abc-123    QUEUED           msg-001       10:00:01
  3   abc-123    ACK_RECEIVED     msg-002       10:00:02
  4   abc-123    PLAN_REQUESTED   msg-002       10:00:02
  5   abc-123    PLAN_RECEIVED    msg-003       10:00:15
  6   abc-123    PLAN_APPROVED    msg-004       10:05:00  ← Human reviewed
  7   abc-123    STARTED          null          10:05:01
  8   abc-123    RESULT_RECEIVED  msg-005       10:10:00
  9   abc-123    CLOSED           null          10:10:01
```

---

## 6. Decision Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECISION TREE                                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              Task Submitted
                                    │
                                    ▼
                         ┌──────────────────┐
                         │ requiresPlan set │
                         │    in task?      │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             requiresPlan=true           requiresPlan=false
                    │                           │
                    ▼                           ▼
           ┌───────────────┐           ┌───────────────┐
           │ Worker sends  │           │ Worker sends  │
           │ APL (plan)    │           │ AAC and       │
           │               │           │ executes      │
           └───────┬───────┘           └───────────────┘
                   │
                   ▼
           ┌───────────────┐
           │ Human reviews │
           │ plan          │
           └───────┬───────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
     APPROVE    MODIFY     REJECT
        │          │          │
        ▼          ▼          ▼
     Execute    Worker     Worker
     as-is      adjusts    stops or
                & retries  escalates


TRUST LEVELS (Optional Enhancement):
────────────────────────────────────

  Task Trust Level     Worker Trust Level     Result
  ─────────────────    ──────────────────     ──────
  LOW (risky)          Any                    Plan required
  MEDIUM               LOW                    Plan required
  MEDIUM               HIGH                   Plan optional
  HIGH (routine)       HIGH                   No plan needed
```

---

## Summary

| Flow | ACK | Plan | Approval | Status |
|------|-----|------|----------|--------|
| Current | NO | NO | NO | Implemented |
| Spec | YES | NO | NO | NOT implemented |
| Enhanced | YES | YES | YES | PROPOSED |

**To implement Enhanced flow, we need:**
1. AAC message type + handler
2. APL message type + handler
3. APA message type + handler
4. New states in TaskEntity
5. task_event audit logging
6. UI/API for plan review

---

*Last updated: 2026-01-30*
