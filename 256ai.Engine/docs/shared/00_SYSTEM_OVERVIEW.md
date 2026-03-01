# AI Launch Engine — System Overview

This system is designed to maximize application launch velocity while preserving reliability, learning retention, and decision clarity.

**Apps are disposable. The engine is permanent.**

## Core Principles

- Centralized decision authority
- Distributed execution
- Structured escalation
- Observable everything
- Reliability in the core loop
- Speed everywhere else

## Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  1. STRATEGY LAYER (Human + Claude Chat)                        │
│     Decides WHAT to build, reviews escalations                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. CONTROL PLANE (Engine.ControlPlane)                         │
│     API: http://localhost:5100                                  │
│     Dispatches tasks, tracks health, manages escalations        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. EXECUTION NODES (Engine.Worker)                             │
│     Execute tasks via Claude API                                │
│     Emit heartbeats, report results                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. MODEL & COMPUTE LAYER                                       │
│     Claude API, local Ollama, GPU resources                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. MONITORING & FEEDBACK LAYER                                 │
│     Health messages (AHE, AHS, ASC)                             │
│     Alerts, dashboards                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Message Types

| Code | Name | Purpose |
|------|------|---------|
| TAS | Task | Dispatch work to a worker |
| TRS | Task Result | Worker reports completion |
| AHE | Agent Heartbeat | Worker liveness signal |
| AHS | App Health Status | Application health checks |
| ASC | Synthetic Check | End-to-end system verification |
| ESC | Escalation | Surface risks to Strategy Layer |

## Golden Rules

1. **If it is not written in this repository, it does not exist**
2. **Health is a MESSAGE STREAM, not a dashboard**
3. **If a component doesn't emit health messages, it doesn't exist**
4. **Every escalation must receive a disposition**
5. **Killing an app is success; keeping broken infrastructure is failure**
