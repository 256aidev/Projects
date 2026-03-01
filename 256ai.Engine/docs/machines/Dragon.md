# Machine: Dragon (AI Compute Server)

## Identity

| Field | Value |
|-------|-------|
| **Hostname** | Dragon |
| **IP Address** | 10.0.1.147 |
| **VLAN/Network** | Server Network (10.0.1.x) |
| **OS** | Windows 11 |

## Roles (Separate Concerns)

Dragon serves **two independent roles**:

### Role 1: Engine Worker (Optional)
If Claude Code is installed, Dragon can be a Worker in the engine.

| Field | Value |
|-------|-------|
| **Worker ID** | worker-dragon-001 |
| **Worker Type** | Claude Code instance |
| **Connects To** | Control Plane at **10.0.1.41:5100** (same subnet) |

### Role 2: App Compute (Ollama)
Ollama runs on Dragon for **apps** to use (BaZi, etc.).

| Field | Value |
|-------|-------|
| **Service** | Ollama |
| **Port** | 11434 |
| **Used By** | Apps (NOT the engine) |

**Important:** The engine does NOT touch Ollama. Ollama is for apps.

---

## Hardware

| Spec | Value |
|------|-------|
| **CPU** | (fill in) |
| **RAM** | (fill in) |
| **GPU** | (fill in - AI compute) |
| **Storage** | (fill in) |

---

## Services Running

| Service | Port | Status | Used By |
|---------|------|--------|---------|
| Ollama | 11434 | Running | Apps (BaZi, etc.) |
| Claude Code Worker | N/A | Not installed | Engine (if installed) |

---

## To Make Dragon an Engine Worker

**Claude Code IS the worker.** No .NET app needed.

### Setup:
1. Install Claude Code on Dragon
2. Clone the 256ai.Engine project (for docs access)
3. Read `docs/Worker/WORKER_INSTRUCTIONS.md`

### Worker Config:
| Field | Value |
|-------|-------|
| **Worker ID** | `worker-dragon-001` |
| **Domains** | `ai-compute`, `data`, `transforms` |
| **Control Plane** | `http://10.0.1.41:5100` (use 10.0.1.41 - same subnet as Dragon) |

### How to Poll for Tasks (run in Claude Code):
```bash
curl -s "http://10.0.1.41:5100/tasks/poll?workerId=worker-dragon-001&domains=ai-compute,data,transforms"
```

### How to Submit Results:
```bash
curl -s -X POST "http://10.0.1.41:5100/tasks/TASK_ID/result" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-dragon-001","success":true,"outputs":{"response":"YOUR_RESULT"}}'
```

### How to Send Heartbeat:
```bash
curl -s -X POST "http://10.0.1.41:5100/health/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"workerId":"worker-dragon-001","status":"OK","version":"1.0.0"}'
```

See `docs/Worker/WORKER_INSTRUCTIONS.md` for full protocol.

---

## Network Note

Dragon is on the **10.0.1.x subnet**. MainWin (Control Plane) has two interfaces:
- `10.0.0.21` - for 10.0.0.x clients (Mac, AI02)
- `10.0.1.41` - for 10.0.1.x clients (Dragon)

**Dragon must use `10.0.1.41:5100`** to reach the Control Plane.

---

## Ollama Access (For Apps)

Apps should call Ollama at:
- **Local (on Dragon):** `http://localhost:11434`
- **Network (from other machines):** `http://10.0.1.147:11434`

**Network config (if needed):**
```powershell
# PowerShell (run as admin)
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "Machine")

# Restart Ollama
taskkill /IM ollama.exe /F
ollama serve
```

Also add Windows Firewall rule for port 11434 inbound.

---

## Models Available

```bash
# Check models on Dragon
curl http://10.0.1.147:11434/api/tags
```

Current models:
- llama3:latest (8B, Q4_0)

---

## Notes

- **Engine Worker** = Claude Code (if installed)
- **App Compute** = Ollama (separate, for apps)
- These are independent - one doesn't require the other
- SSH broken - use RDP for access
