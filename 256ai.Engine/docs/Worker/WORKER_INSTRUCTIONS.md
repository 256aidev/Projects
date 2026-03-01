# Claude Code Worker Instructions

> **For Claude Code instances that need to work as engine workers.**

---

## Overview

You are a Claude Code worker in the 256ai.Engine swarm. Your job:
1. **Poll** the engine for tasks assigned to your domains
2. **Execute** the task objective (you do the thinking)
3. **Submit** the result back to the engine

---

## Your Configuration

**Read from your machine's doc** (`docs/machines/YOUR_MACHINE.md`):

| Field | Where to Find |
|-------|---------------|
| Worker ID | `docs/machines/YOUR_MACHINE.md` |
| Domains | `docs/machines/YOUR_MACHINE.md` |
| Control Plane URL | `http://10.0.1.147:5100` (MainWin) |

---

## Worker Protocol

### Step 1: Poll for Tasks

```bash
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=YOUR_WORKER_ID&domains=YOUR_DOMAINS"
```

**Response if no task:**
```json
{"hasTask": false}
```

**Response if task available:**
```json
{
  "hasTask": true,
  "taskId": "abc-123",
  "objective": "Do something specific",
  "domain": "general",
  "inputs": {},
  "expectedOutputs": "Description of expected result"
}
```

### Step 2: Execute the Task

When you receive a task:
1. Read the `objective` - this is what you need to do
2. Use your Claude capabilities to complete it
3. Prepare the result

**You ARE the AI.** Use your reasoning, code generation, file access - whatever the task requires.

### Step 3: Submit Result

```bash
curl -s -X POST "http://10.0.1.147:5100/tasks/TASK_ID/result" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "YOUR_WORKER_ID",
    "success": true,
    "outputs": {"response": "Your result here"},
    "executionTimeMs": 1500
  }'
```

**On failure:**
```json
{
  "workerId": "YOUR_WORKER_ID",
  "success": false,
  "errorMessage": "What went wrong"
}
```

---

## Worker Mode Command

When the user says "Enter worker mode" or you need to check for tasks:

```bash
# Poll for tasks
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=YOUR_ID&domains=general,code"
```

If a task is returned, execute it and submit the result.

---

## Example: Full Worker Cycle

**1. Poll:**
```bash
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=worker-dragon-001&domains=ai-compute,data"
```

**2. Response:**
```json
{
  "hasTask": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "objective": "Analyze the sentiment of this text: 'I love this product!'",
  "domain": "ai-compute",
  "expectedOutputs": "Sentiment classification"
}
```

**3. Execute:** (You, Claude Code, analyze the sentiment)

**4. Submit:**
```bash
curl -s -X POST "http://10.0.1.147:5100/tasks/550e8400-e29b-41d4-a716-446655440000/result" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "worker-dragon-001",
    "success": true,
    "outputs": {"sentiment": "positive", "confidence": 0.95}
  }'
```

---

## Heartbeat (Optional)

Send periodic heartbeats so the Swarm Lead knows you're alive:

```bash
curl -s -X POST "http://10.0.1.147:5100/health/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "YOUR_WORKER_ID",
    "status": "OK",
    "capacity": {"maxConcurrent": 5, "currentInflight": 0, "domains": ["your", "domains"]}
  }'
```

---

## Escalation

If you encounter something you can't handle:

1. Submit a failed result with `success: false`
2. Include clear error message
3. The Swarm Lead will escalate to Strategy Layer if needed

---

## Quick Reference

| Action | Command |
|--------|---------|
| Poll for tasks | `GET /tasks/poll?workerId=X&domains=Y` |
| Submit success | `POST /tasks/{id}/result` with `success: true` |
| Submit failure | `POST /tasks/{id}/result` with `success: false` |
| Send heartbeat | `POST /health/heartbeat` |

**Control Plane:** `http://10.0.1.147:5100`

---

*Last updated: 2026-01-31*
