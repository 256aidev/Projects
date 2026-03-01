# API Reference

> **Complete API documentation for workers and clients.**
> Base URL: `http://10.0.1.147:5100` (Dragon — Coordinator)
> MCP SSE: `http://10.0.1.147:5100/sse`

---

## Health Endpoints

### GET /health/summary

Get overall system health status. Use this to check if the engine is operational.

**Response:**
```json
{
  "overallStatus": "OK",        // OK | DEGRADED | DOWN
  "timestamp": "2026-01-29T20:00:00Z",
  "workers": {
    "online": 1,
    "degraded": 0,
    "total": 1
  },
  "apps": {
    "healthy": 2,
    "degraded": 0,
    "total": 2
  },
  "syntheticChecks": {
    "passesLastHour": 10,
    "failsLastHour": 0
  },
  "escalations": {
    "pending": 0,
    "total": 5
  }
}
```

**Example:**
```bash
curl http://localhost:5100/health/summary
```

**Status Logic:**
- `OK` - All workers online, no failures
- `DEGRADED` - Some workers degraded, synthetic failures, or app issues
- `DOWN` - No workers online

---

### GET /health/workers

List all registered workers and their status.

**Response:**
```json
[
  {
    "workerId": "worker-256ai-001",
    "role": "claude-code",
    "status": "OK",
    "version": "1.0.0",
    "lastTaskId": null,
    "ipAddress": "10.0.1.147",
    "lastSeenAt": "2026-02-16T06:30:00Z",
    "isOnline": true
  }
]
```

**Example:**
```bash
curl http://10.0.1.147:5100/health/workers
```

**Notes:**
- `isOnline` = heartbeat received within last 60 seconds
- Workers must send heartbeats every 15-30 seconds
- `role` and `ipAddress` set via heartbeat

---

### POST /health/heartbeat

Worker sends heartbeat (AHE message via HTTP).

**Request Body:**
```json
{
  "workerId": "worker-256ai-001",
  "status": "OK",
  "lastTaskId": null,
  "version": "1.0.0",
  "role": "claude-code",
  "ipAddress": "10.0.1.147",
  "capacity": {
    "maxConcurrent": 5,
    "currentInflight": 0,
    "domains": ["general", "code"]
  }
}
```

**Response:**
```json
{
  "received": true,
  "workerId": "worker-256ai-001",
  "timestamp": "2026-02-16T06:30:00Z"
}
```

---

### DELETE /health/workers/{workerId}

Remove a dead/stale worker from the registry.

**Example:**
```bash
curl -X DELETE http://10.0.1.147:5100/health/workers/worker-old-001
```

---

### GET /health/apps

List health status of all managed applications.

**Response:**
```json
[
  {
    "appId": "bazi-api",
    "instanceId": "bazi-prod-1",
    "environment": "production",
    "status": "OK",
    "latencyP95": 150,
    "errorRate": 0.01,
    "lastSeenAt": "2026-01-29T20:00:00Z",
    "isHealthy": true
  }
]
```

**Example:**
```bash
curl http://localhost:5100/health/apps
```

---

### GET /health/synthetic

List synthetic check results.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | int | 50 | Max results to return |

**Response:**
```json
[
  {
    "id": "guid",
    "scenarioId": "login-flow",
    "status": "PASS",
    "failureReason": null,
    "correlationId": "guid",
    "createdAt": "2026-01-29T20:00:00Z"
  }
]
```

**Example:**
```bash
curl "http://localhost:5100/health/synthetic?limit=10"
```

---

## Task Endpoints

### POST /tasks

Submit a new task for worker execution.

**Request Body:**
```json
{
  "objective": "Analyze the user's BaZi chart and provide insights",
  "domain": "bazi-analysis",
  "constraints": [
    "Response must be in English",
    "Include element analysis"
  ],
  "inputs": {
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "timezone": "Asia/Shanghai"
  },
  "expectedOutputs": "JSON with chart analysis",
  "validationCriteria": "Must include all 8 pillars",
  "timeLimitSeconds": 300,
  "batchLimit": 1
}
```

**Required Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `objective` | string | What the task should accomplish (one task, one objective) |
| `domain` | string | Task category/domain |
| `expectedOutputs` | string | What the result should look like |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `constraints` | string[] | Rules the worker must follow |
| `inputs` | object | Key-value data for the task |
| `validationCriteria` | string | How to validate the result |
| `timeLimitSeconds` | int | Max execution time |
| `batchLimit` | int | Max items to process |
| `projectId` | string | Group related tasks together |
| `parentTaskId` | string | Parent task for decomposition |
| `executionMode` | string | `auto`, `cli`, `api`, `ollama` |
| `dependsOn` | string[] | Task IDs that must complete first |

**Response (201 Created):**
```json
{
  "taskId": "abc123-def456",
  "status": "PENDING",
  "createdAt": "2026-01-29T20:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Generate a summary of the document",
    "domain": "text-processing",
    "expectedOutputs": "Plain text summary under 200 words"
  }'
```

---

### GET /tasks

List tasks with optional filters.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `status` | string | (all) | Filter by status: PENDING, LEASED, ACKED, RUNNING, COMPLETED, FAIL, CANCELLED |
| `projectId` | string | (all) | Filter by project |
| `parentTaskId` | string | (all) | Filter by parent task |
| `limit` | int | 50 | Max results to return |

**Response:**
```json
[
  {
    "taskId": "abc123",
    "objective": "Analyze document",
    "domain": "text-processing",
    "status": "PENDING",
    "assignedWorkerId": null,
    "createdAt": "2026-01-29T20:00:00Z",
    "completedAt": null
  }
]
```

**Example - Get pending tasks (for workers polling):**
```bash
curl "http://localhost:5100/tasks?status=PENDING&limit=10"
```

---

### GET /tasks/{id}

Get a specific task's status and result.

**Response:**
```json
{
  "taskId": "abc123",
  "objective": "Analyze document",
  "domain": "text-processing",
  "status": "COMPLETED",
  "assignedWorkerId": "worker-mainwin-001",
  "createdAt": "2026-01-29T20:00:00Z",
  "completedAt": "2026-01-29T20:05:00Z",
  "result": {
    "summary": "The document discusses...",
    "confidence": 0.95
  }
}
```

**Example:**
```bash
curl http://localhost:5100/tasks/abc123
```

**Status Values:**
- `PENDING` - Waiting for a worker to claim
- `LEASED` - Worker has polled and claimed (not yet ACKed)
- `ACKED` - Worker acknowledged receipt
- `RUNNING` - Worker is executing (reported progress)
- `COMPLETED` - Successfully finished
- `FAIL` - Execution failed
- `CANCELLED` - Cancelled before completion

---

### GET /tasks/poll

Worker polls for available tasks. Claims the first matching PENDING task.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `workerId` | string | **Required.** Worker identifier |
| `domains` | string | Comma-separated domain list (default: "general") |

**Example:**
```bash
curl "http://10.0.1.147:5100/tasks/poll?workerId=worker-256ai-001&domains=general,code"
```

---

### POST /tasks/{id}/ack

Worker acknowledges task receipt. Must be called after polling.

**Request Body:** `{ "workerId": "worker-256ai-001" }`

---

### POST /tasks/{id}/progress

Worker reports progress on a long-running task.

**Request Body:**
```json
{
  "workerId": "worker-256ai-001",
  "message": "Analyzing file structure",
  "percentComplete": 45,
  "currentStep": "step-3-analysis"
}
```

---

### POST /tasks/{id}/result

Worker submits task result.

**Request Body:**
```json
{
  "workerId": "worker-256ai-001",
  "success": true,
  "outputs": { "response": "Task completed successfully" },
  "executionTimeMs": 12500
}
```

---

### POST /tasks/{id}/cancel

Cancel a pending or in-progress task.

**Example:**
```bash
curl -X POST http://10.0.1.147:5100/tasks/abc123/cancel
```

---

## Event Endpoints

### GET /events

Get recent activity events (tasks, workers, escalations).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | int | 50 | Max events to return |

---

## Benchmark Endpoints

### POST /benchmark/run

Submit a batch of synthetic benchmark tasks.

**Request Body:**
```json
{
  "taskCount": 20,
  "domain": "general",
  "projectId": "benchmark-20260216-070000"
}
```

### GET /benchmark/{projectId}

Get live benchmark results: throughput, latency percentiles, per-worker distribution.

---

## MCP Server (Model Context Protocol)

The Control Plane exposes an MCP SSE endpoint at `/sse` for Claude Code and other MCP-compatible clients.

**Connect from Claude Code:**
```json
{
  "mcpServers": {
    "256ai-engine": {
      "url": "http://10.0.1.147:5100/sse"
    }
  }
}
```

**Available MCP Tools:**
| Tool | Description |
|------|-------------|
| `submit_task` | Submit a new task |
| `get_task` | Get task status and result |
| `list_tasks` | List tasks (filter by status, projectId) |
| `cancel_task` | Cancel a task |
| `system_health` | Overall system health |
| `list_workers` | List workers with status |
| `remove_worker` | Remove a stale worker |
| `list_escalations` | List escalations |
| `dispose_escalation` | Accept/reject/defer an escalation |
| `run_benchmark` | Submit benchmark tasks |
| `benchmark_results` | Get benchmark throughput results |

---

## Escalation Endpoints

### GET /escalations

List escalations (issues surfaced by workers).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `disposition` | string | (all) | Filter: Pending, Accepted, Rejected, Deferred |
| `limit` | int | 50 | Max results to return |

**Response:**
```json
[
  {
    "id": "guid",
    "level": "RISK",
    "sourceMessageType": "TRS",
    "impact": "Task result may be inaccurate",
    "recommendation": "Review manually before using",
    "disposition": "Pending",
    "dispositionReason": null,
    "reviewDate": null,
    "createdAt": "2026-01-29T20:00:00Z"
  }
]
```

**Escalation Levels:**
- `CONCERN` - Minor issue, informational
- `RISK` - Potential problem, needs attention
- `BLOCKER` - Cannot proceed, requires immediate action

**Example - Get pending escalations:**
```bash
curl "http://localhost:5100/escalations?disposition=Pending"
```

---

### GET /escalations/{id}

Get detailed escalation information.

**Response:**
```json
{
  "id": "guid",
  "level": "RISK",
  "sourceMessageType": "TRS",
  "evidenceJson": "{\"taskId\": \"abc123\", \"error\": \"Ambiguous input\"}",
  "impact": "Task result may be inaccurate",
  "recommendation": "Review manually before using",
  "disposition": "Pending",
  "dispositionReason": null,
  "reviewDate": null,
  "createdAt": "2026-01-29T20:00:00Z"
}
```

**Example:**
```bash
curl http://localhost:5100/escalations/abc123-def456
```

---

### PUT /escalations/{id}

Disposition an escalation. **Every escalation must receive a disposition.**

**Request Body:**
```json
{
  "disposition": "Accepted",
  "reason": "Reviewed and approved",
  "reviewDate": null
}
```

**Disposition Values:**
| Value | Required Fields | Description |
|-------|-----------------|-------------|
| `Accepted` | (none) | Issue acknowledged and resolved |
| `Rejected` | `reason` | Issue dismissed with explanation |
| `Deferred` | `reviewDate` | Will review later |

**Response:**
```json
{
  "id": "guid",
  "disposition": "Accepted",
  "dispositionReason": "Reviewed and approved",
  "reviewDate": null
}
```

**Examples:**
```bash
# Accept an escalation
curl -X PUT http://localhost:5100/escalations/abc123 \
  -H "Content-Type: application/json" \
  -d '{"disposition": "Accepted"}'

# Reject with reason
curl -X PUT http://localhost:5100/escalations/abc123 \
  -H "Content-Type: application/json" \
  -d '{"disposition": "Rejected", "reason": "False positive - no action needed"}'

# Defer for later review
curl -X PUT http://localhost:5100/escalations/abc123 \
  -H "Content-Type: application/json" \
  -d '{"disposition": "Deferred", "reviewDate": "2026-02-01T00:00:00Z"}'
```

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Description of what went wrong",
  "taskId": "abc123"  // if applicable
}
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (for POST) |
| 400 | Bad request (validation error) |
| 404 | Resource not found |
| 500 | Server error |

---

## Worker Polling Pattern

Workers connect via HTTP polling (5-second interval):

```bash
# 1. Poll for tasks (claims first matching PENDING task)
curl "http://10.0.1.147:5100/tasks/poll?workerId=worker-001&domains=general,code"

# 2. ACK the task
curl -X POST http://10.0.1.147:5100/tasks/{id}/ack \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001"}'

# 3. Report progress (optional, for long tasks)
curl -X POST http://10.0.1.147:5100/tasks/{id}/progress \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001", "message": "Step 2 of 5", "percentComplete": 40}'

# 4. Submit result
curl -X POST http://10.0.1.147:5100/tasks/{id}/result \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001", "success": true, "outputs": {"response": "Done"}, "executionTimeMs": 5000}'

# 5. Send heartbeat (every 20 seconds)
curl -X POST http://10.0.1.147:5100/health/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-001", "status": "OK", "role": "claude-code", "ipAddress": "10.0.1.147"}'
```

## Benchmark Script

Run throughput benchmarks from PowerShell:

```powershell
# Quick 5-task test
.\scripts\benchmark.ps1 -TaskCount 5

# 20 tasks burst mode targeting code domain
.\scripts\benchmark.ps1 -TaskCount 20 -Domain code -Burst

# Dry run — submit tasks, check results later
.\scripts\benchmark.ps1 -TaskCount 50 -DryRun
```

See [Worker Connection Guide](../Worker/04_WORKER_CONNECTION.md) for full details.

---

*Last updated: 2026-02-16*
