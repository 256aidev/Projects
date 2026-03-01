# Machine: Mac (Frontend Worker)

## Identity

| Field | Value |
|-------|-------|
| **Hostname** | Mac Build Box |
| **IP Address** | 10.0.1.237 |
| **VLAN/Network** | Bittek Prod (10.0.1.x) |
| **OS** | macOS |
| **Role** | Worker |
| **Worker ID** | worker-mac-001 |

## Hardware

| Spec | Value |
|------|-------|
| **CPU** | (fill in) |
| **RAM** | (fill in) |
| **GPU** | (fill in) |
| **Storage** | (fill in) |

## Status

**CONNECTED** - Claude Code v2.1.29 installed at `/opt/homebrew/bin/claude`

---

## Worker Config (Planned)

| Field | Value |
|-------|-------|
| **Worker ID** | `worker-mac-001` |
| **Role** | Worker |
| **Domains** | `frontend`, `ui`, `mobile` |
| **Control Plane** | `http://10.0.1.147:5100` |

### How to Poll for Tasks (run in Claude Code):
```bash
curl -s "http://10.0.1.147:5100/tasks/poll?workerId=worker-mac-001&domains=frontend,ui,mobile"
```

### How to Submit Results:
```bash
curl -s -X POST "http://10.0.1.147:5100/tasks/TASK_ID/result" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-mac-001","success":true,"outputs":{"response":"YOUR_RESULT"}}'
```

### How to Send Heartbeat:
```bash
curl -s -X POST "http://10.0.1.147:5100/health/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-mac-001","status":"OK","version":"1.0.0"}'
```

See `docs/Worker/WORKER_INSTRUCTIONS.md` for full protocol.

---

## Services

| Service | Port | Status | Used By |
|---------|------|--------|---------|
| Claude Code Worker | N/A | ✅ Installed (v2.1.29) | Engine |
| Ollama | N/A | Not planned | N/A |

---

## Setup Steps

1. Install Claude Code on Mac
2. Clone or access the 256ai.Engine project
3. Read `docs/Worker/WORKER_INSTRUCTIONS.md`
4. Start polling for tasks

---

## Network Access

| Can reach | IP/Host | Port |
|-----------|---------|------|
| Control Plane | 10.0.1.147 | 5100 |
| Dashboard | 10.0.1.147 | 8080 |

---

## Sync File Location

**CLAUDE_SYNC.md Path:** `~/Projects/BaZi/Docs/CLAUDE_SYNC.md` (capital D in Docs)

This is where to write instructions for Mac's Claude Code to pick up.

**Project Structure:**
- `~/Projects/BaZi/Docs/` - Documentation and sync file
- `~/Projects/BaZi/BaziMobileApp/` - The actual React Native app

**NOTE:** `~/BaziMobileApp/` at home level is WRONG - that's a stale copy.

---

## Notes

- Primary use: frontend, UI, mobile development tasks
- macOS environment for iOS/Swift development
- No Ollama needed - pure Claude Code worker
- SSH access available (port 22)
