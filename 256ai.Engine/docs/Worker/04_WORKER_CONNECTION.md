# Worker Connection Guide

> **How to connect a worker (Claude agent) to the 256ai.Engine**

---

## Overview

Workers are Claude agents that execute tasks dispatched by the Control Plane. There are two connection methods:

| Method | Status | Best For |
|--------|--------|----------|
| **HTTP Polling** | Available Now | Development, simple setups |
| **RabbitMQ** | When service running | Production, high throughput |

---

## Method A: HTTP Polling (Available Now)

Use this method when RabbitMQ is not running. Workers poll the API for tasks.

### Connection Flow

```
┌─────────────┐         ┌───────────────────┐
│   Worker    │  HTTP   │   Control Plane   │
│  (Claude)   │ ──────► │  localhost:5100   │
└─────────────┘         └───────────────────┘
      │                         │
      │ 1. Poll for tasks       │
      │ ◄─────────────────────► │
      │                         │
      │ 2. Claim task           │
      │ ◄─────────────────────► │
      │                         │
      │ 3. Execute with Claude  │
      │                         │
      │ 4. Submit result        │
      │ ──────────────────────► │
      │                         │
      │ 5. Send heartbeat       │
      │ ──────────────────────► │
      └─────────────────────────┘
```

### Worker Loop (Pseudocode)

```python
CONTROL_PLANE = "http://localhost:5100"
WORKER_ID = "worker-mainwin-001"
POLL_INTERVAL = 5  # seconds

while True:
    # 1. Send heartbeat
    send_heartbeat(WORKER_ID)

    # 2. Poll for pending tasks
    tasks = GET(f"{CONTROL_PLANE}/tasks?status=PENDING&limit=1")

    if tasks:
        task = tasks[0]

        # 3. Claim the task (future: POST /tasks/{id}/claim)
        # For now, tasks are first-come-first-served

        # 4. Execute with Claude
        result = execute_with_claude(task)

        # 5. Submit result (future: POST /tasks/{id}/result)
        # For now, update via direct DB or escalate

    sleep(POLL_INTERVAL)
```

### Current Endpoints for Workers

```bash
# Check system health before starting
curl http://localhost:5100/health/summary

# Poll for pending tasks
curl "http://localhost:5100/tasks?status=PENDING&limit=1"

# Get task details
curl http://localhost:5100/tasks/{taskId}

# List active escalations (check before new work)
curl "http://localhost:5100/escalations?disposition=Pending"
```

### Endpoints Needed (Coming Soon)

| Endpoint | Purpose |
|----------|---------|
| `POST /tasks/{id}/claim` | Claim a task (prevents double-pickup) |
| `POST /tasks/{id}/result` | Submit task result |
| `POST /health/heartbeat` | Send worker heartbeat |
| `POST /workers/register` | Register new worker |

---

## Method B: RabbitMQ (When Running)

Use this method in production. Workers subscribe to task queues.

### Prerequisites

1. RabbitMQ running on `localhost:5672`
2. Management UI at `http://localhost:15672` (guest/guest)

### Start RabbitMQ (Windows)

```powershell
# If installed as service
net start RabbitMQ

# Or manually
rabbitmq-server
```

### Exchange & Queue Structure

```
Exchange: engine.messages (topic)
│
├── q.worker.{worker_id}.tasks    ← Worker consumes tasks here
│   Routing key: task.{domain}
│
├── q.controlplane.results        ← Worker publishes results here
│   Routing key: result.*
│
├── q.controlplane.health.agent   ← Worker publishes heartbeats here
│   Routing key: health.agent
│
└── q.controlplane.escalations    ← Worker publishes escalations here
    Routing key: escalation.*
```

### Connection Code (C#)

```csharp
// Connect to RabbitMQ
var factory = new ConnectionFactory
{
    HostName = "localhost",
    Port = 5672,
    UserName = "guest",
    Password = "guest"
};

using var connection = factory.CreateConnection();
using var channel = connection.CreateModel();

// Declare worker's task queue
var queueName = $"q.worker.{workerId}.tasks";
channel.QueueDeclare(queueName, durable: true, exclusive: false);
channel.QueueBind(queueName, "engine.messages", "task.*");

// Consume tasks
var consumer = new EventingBasicConsumer(channel);
consumer.Received += (model, ea) =>
{
    var body = ea.Body.ToArray();
    var message = JsonSerializer.Deserialize<TaskMessage>(body);

    // Execute task...

    // Acknowledge
    channel.BasicAck(ea.DeliveryTag, false);
};

channel.BasicConsume(queueName, autoAck: false, consumer);
```

### Publishing Results

```csharp
// Publish task result
var result = new TaskResultMessage { /* ... */ };
var body = JsonSerializer.SerializeToUtf8Bytes(result);

channel.BasicPublish(
    exchange: "engine.messages",
    routingKey: "result.completed",
    body: body
);
```

### Publishing Heartbeat

```csharp
// Send heartbeat every 20 seconds
var heartbeat = new AgentHeartbeat
{
    WorkerId = workerId,
    Status = Status.OK,
    Capacity = new CAP { MaxConcurrent = 5, CurrentInflight = 1 },
    Version = new VER { WorkerVersion = "1.0.0", ModelVersion = "claude-3" }
};

var body = JsonSerializer.SerializeToUtf8Bytes(heartbeat);

channel.BasicPublish(
    exchange: "engine.messages",
    routingKey: "health.agent",
    body: body
);
```

---

## Worker Registration

Before a worker can receive tasks, it should register with the Control Plane.

### Registration Info

| Field | Example | Description |
|-------|---------|-------------|
| `workerId` | `worker-mainwin-001` | Unique identifier |
| `hostname` | `DESKTOP-ABC` | Machine hostname |
| `capabilities` | `["text", "code", "analysis"]` | What domains this worker handles |
| `maxConcurrent` | `5` | Max simultaneous tasks |

### Machine Config

Each machine has a config file at `docs/machines/{MachineName}.md` containing:
- Worker ID
- Network info
- Credentials location
- Services running

See [MainWin.md](../machines/MainWin.md) for example.

---

## Heartbeat Requirements

Workers MUST send heartbeats to stay "online":

| Setting | Value |
|---------|-------|
| Heartbeat interval | Every 15-30 seconds |
| Timeout threshold | 60 seconds |
| Status if missed | Worker marked offline |

### Heartbeat Message (AHE)

```json
{
  "header": {
    "messageId": "guid",
    "messageType": "AHE",
    "timestamp": "2026-01-29T20:00:00Z"
  },
  "workerId": "worker-mainwin-001",
  "status": "OK",
  "capacity": {
    "maxConcurrent": 5,
    "currentInflight": 1
  },
  "version": {
    "workerVersion": "1.0.0",
    "modelVersion": "claude-3-opus"
  },
  "lastTaskId": "abc123"
}
```

---

## Escalation Protocol

When a worker is uncertain or encounters an error, it MUST escalate:

```json
{
  "header": {
    "messageType": "ESC"
  },
  "level": "RISK",
  "impact": "Cannot complete task - ambiguous requirements",
  "recommendation": "Clarify objective with user",
  "evidence": {
    "taskId": "abc123",
    "attemptedAction": "parse_input",
    "error": "Multiple valid interpretations"
  }
}
```

**Rule: If uncertain → escalate. Never guess.**

See [Escalation Protocol](../shared/07_ESCALATION_PROTOCOL.md) for full details.

---

## Quick Start Checklist

### For HTTP Polling Worker

- [ ] Control Plane running at `http://localhost:5100`
- [ ] Can reach `/health/summary`
- [ ] Worker ID assigned (see machine config)
- [ ] Poll loop implemented
- [ ] Claude API key configured

### For RabbitMQ Worker

- [ ] RabbitMQ service running
- [ ] Can reach `localhost:5672`
- [ ] Exchange `engine.messages` exists
- [ ] Worker queue bound
- [ ] Heartbeat timer set (20s)
- [ ] Claude API key configured

---

*Last updated: 2026-01-29*
