# Machine: MainWin (Dev Win11) - WORKER ONLY

## Identity

| Field | Value |
|-------|-------|
| **Hostname** | Dev Win11 Box |
| **IP Address** | 10.0.1.235 |
| **VLAN/Network** | Bittek Prod (10.0.1.x) |
| **OS** | Windows 11 |
| **Role** | **Worker** (NOT Coordinator) |
| **Worker ID** | worker-mainwin-001 |
| **Availability** | **NOT ALWAYS ON** |

## Hardware

| Spec | Value |
|------|-------|
| **CPU** | (fill in) |
| **RAM** | (fill in) |
| **GPU** | (fill in) |
| **Storage** | (fill in) |

## Local Paths

| Path | Location |
|------|----------|
| **Project Root** | `I:\2026CodeProjects\256ai.Engine` |
| **Database** | `I:\2026CodeProjects\256ai.Engine\engine.db` (SQLite) |
| **Logs** | Console output |

## Services Running

| Service | Port | Status |
|---------|------|--------|
| Control Plane API | 5100 | [x] Running |
| Worker | N/A | [ ] Not started |
| PostgreSQL | 5432 | [ ] Not installed |
| RabbitMQ | 5672 | [ ] Not installed |

## Credentials

| Credential | Location |
|------------|----------|
| Database | SQLite - no auth |
| Claude API | `appsettings.json` → `Claude:ApiKey` |
| RabbitMQ | guest/guest (default) |

## Network Access

| Can reach | IP/Host | Port |
|-----------|---------|------|
| Control Plane | localhost | 5100 |
| Database | local file | N/A |
| Claude API | api.anthropic.com | 443 |
| BaZi Server | 10.0.1.76 | 22 |
| AI Server (Dragon) | 10.0.1.147 | 11434 |
| Mac Build Box | 10.0.1.237 | 22 |

## Worker Config

MainWin is a **Worker** (not Coordinator). Dragon (10.0.1.147) is the Coordinator.

| Field | Value |
|-------|-------|
| **Role** | Worker (when available) |
| **Worker ID** | `worker-mainwin-001` |
| **Domains** | `general`, `code`, `docs` |
| **Connects To** | Dragon Control Plane at `http://10.0.1.147:5100` |

### How to Poll for Tasks (when MainWin is on):
```bash
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=worker-mainwin-001&domains=general,code,docs"
```

### How to Submit Results:
```bash
curl -s -X POST "http://10.0.1.147:5100/tasks/TASK_ID/result" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-mainwin-001","success":true,"outputs":{"response":"YOUR_RESULT"}}'
```

### How to Send Heartbeat:
```bash
curl -s -X POST "http://10.0.1.147:5100/health/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-mainwin-001","status":"OK","version":"1.0.0"}'
```

---

## Notes

- Primary human development machine
- **NOT ALWAYS ON** - availability is intermittent
- Control Plane now runs on **Dragon (10.0.1.147)**, not MainWin
- Uses SQLite for local data
- Connects to Dragon for swarm coordination
