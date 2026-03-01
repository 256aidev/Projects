# 256ai - Connections & Access Reference

> **Last Updated:** 2026-02-15
> **Network:** All machines on **10.0.1.x** (Bittek Prod) subnet

---

## Machine Inventory

| Machine | Hostname | IP | OS | Role | Status |
|---------|----------|-----|-----|------|--------|
| **256AI (Dragon)** | 256AI | 10.0.1.147 | Windows 11 | Coordinator + App Compute | Always on |
| **MainWin** | Dev Win11 | 10.0.1.235 | Windows 11 | Worker (human dev machine) | Not always on |
| **Mac** | — | 10.0.1.237 | macOS | Worker (iOS/frontend) | May be asleep |
| **AI02** | NucBox_EVO-X2 | 10.0.1.178 | Windows | Worker (dev/AI) | Active |
| **Linux** | — | 10.0.1.76 | Linux | BaZi backend API | Always on |
| **NAS-DC1** | NAS-DC1 | 10.0.1.1 | — | NAS / Domain Controller | Always on |

---

## SSH Connections

| Machine | Command | User | Notes |
|---------|---------|------|-------|
| **Linux (BaZi API)** | `ssh nazmin@10.0.1.76` | nazmin | Always on, backend server |
| **Mac** | `ssh marklombardi@10.0.1.237` | marklombardi | 00king | May timeout if Mac is asleep |

**Note:** 256AI (Dragon) — SSH broken, use RDP instead.

---

## RDP Connections

| Machine | Host | Username | Password |
|---------|------|----------|----------|
| **AI02 (NucBox_EVO-X2)** | 10.0.1.178 | mark | 00king |

---

## Service URLs

### 256ai Engine
| Service | URL | Location |
|---------|-----|----------|
| Control Plane API | `http://10.0.1.147:5100` | 256AI (Dragon) |
| Health Check | `http://10.0.1.147:5100/health/summary` | 256AI (Dragon) |
| Workers Status | `http://10.0.1.147:5100/health/workers` | 256AI (Dragon) |
| Dashboard | `http://10.0.1.147:8080` | 256AI (Dragon) |

### BaZi App
| Service | URL | Location |
|---------|-----|----------|
| Production API | `https://256ai.xyz` | Cloudflare → Linux |
| Internal API | `http://10.0.1.76:8000` | Linux (direct) |
| Admin Dashboard | `http://10.0.1.76:3001` | Linux |
| API Docs (Swagger) | `http://10.0.1.76:8000/docs` | Linux |

### Ollama (LLM)
| Instance | URL | Purpose |
|----------|-----|---------|
| Dragon | `http://10.0.1.147:11434` | **APPS ONLY** (BaZi production) |
| AI02 | `http://10.0.1.178:11434` | Dev/testing (Qwen, etc.) |

---

## Database Credentials

### PostgreSQL (BaZi - on Linux 10.0.1.76)
| Field | Value |
|-------|-------|
| Host | localhost (on 10.0.1.76) |
| Port | 5432 |
| Database | bazidb |
| Username | baziuser |
| Password | BaziPass2026 |
| Connection URL | `postgresql://baziuser:BaziPass2026@localhost:5432/bazidb` |

### SQLite (Engine - on MainWin)
| Field | Value |
|-------|-------|
| File | `I:\2026CodeProjects\256ai.Engine\engine.db` |
| Auth | None |

---

## Admin Dashboard Login

| Field | Value |
|-------|-------|
| URL | `http://10.0.1.76:3001` |
| Email | admin@bazi-app.com |
| Password | AdminPassword123 |

---

## API Authentication

### App Secret (Mobile App → Backend)
| Field | Value |
|-------|-------|
| Header 1 | `X-Timestamp` (unix epoch seconds) |
| Header 2 | `X-App-Signature` = `sha256(timestamp + secret)` |
| Secret Key | `f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30` |
| Tolerance | 300 seconds |
| Exempt Paths | `/`, `/health`, `/docs`, `/admin/*` |

### JWT
| Field | Value |
|-------|-------|
| Secret | `bazi-mobile-app-jwt-secret-key-256ai-prod-2026` |

### Test User
| Field | Value |
|-------|-------|
| Email | test@256ai.xyz |
| Password | Test123! |

---

## OAuth / Google Cloud

| Field | Value |
|-------|-------|
| Account | 256ai.dev@gmail.com |
| Project ID | 717245085455 |
| Console | https://console.cloud.google.com/apis/credentials?project=717245085455 |
| iOS Client ID | `717245085455-f4kiundnmolvtka4u6tgpq8vgkoce2sr.apps.googleusercontent.com` |
| Web Client ID | (pending — create in Google Cloud Console) |

---

## AdMob (Google Ads)

### iOS (Production)
| Field | Value |
|-------|-------|
| App ID | `ca-app-pub-5491037392330095~5450979012` |
| Banner ID | `ca-app-pub-5491037392330095/3367741151` |
| Interstitial ID | `ca-app-pub-5491037392330095/2681345448` |

### Android (Test — replace for production)
| Field | Value |
|-------|-------|
| App ID | `ca-app-pub-3940256099942544~3347511713` |

---

## Apple Developer

| Field | Value |
|-------|-------|
| Account Email | tigerrook65@gmail.com |
| Account Type | Personal |

---

## Domain & DNS

| Field | Value |
|-------|-------|
| Domain | 256ai.xyz |
| Provider | Cloudflare |

### 256ai Website (Cloudflare Workers)

| Field | Value |
|-------|-------|
| URL | `https://helper.256ai-home.workers.dev/` |
| Platform | Cloudflare Workers |
| Purpose | 256ai public website — links to support site and support email |

---

## RabbitMQ (Message Queue)

| Field | Value |
|-------|-------|
| Host | localhost |
| Port | 5672 |
| Username | guest |
| Password | guest |
| Management UI | `http://localhost:15672` (guest/guest) |
| Exchange | engine.messages (topic) |

---

## Worker IDs

| Machine | Worker ID |
|---------|-----------|
| 256AI (Dragon) | worker-dragon-001 |
| MainWin | worker-mainwin-001 |
| Mac | worker-mac-001 |
| AI02 | worker-aipc2-001 |

---

## SCP Sync Commands (Windows → Mac)

### Sync documentation file
```bash
ssh marklombardi@10.0.1.237 "mkdir -p ~/projects/bazi/docs"
scp <local_file> marklombardi@10.0.1.237:~/projects/bazi/docs/CLAUDE_SYNC.md
```

### Sync source files
```bash
# Create dirs if needed
ssh marklombardi@10.0.1.237 "mkdir -p ~/projects/bazi/BaziMobileApp/src/screens/family ~/projects/bazi/BaziMobileApp/src/screens/relationships ~/projects/bazi/BaziMobileApp/src/screens/world ~/projects/bazi/BaziMobileApp/src/api"

# Example: copy a screen file
scp "I:\2026CodeProjects\BaZi\BaziMobileApp\src\screens\family\FamilyMemberDetailScreen.tsx" marklombardi@10.0.1.237:~/projects/bazi/BaziMobileApp/src/screens/family/
```

### Upload to Linux backend
```bash
scp <local_file> nazmin@10.0.1.76:/home/nazmin/AstrologyApp/<path>
```

---

## Deployment Commands

### BaZi Backend (Linux)
```bash
# Restart server (systemd auto-restarts after kill)
ssh nazmin@10.0.1.76 "pkill -f 'uvicorn app:app'"

# Or manual start
ssh nazmin@10.0.1.76 "cd /home/nazmin/AstrologyApp && source venv/bin/activate && nohup uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4 &"
```

### Control Plane (Dragon/256AI)
```bash
cd I:\2026CodeProjects\256ai.Engine
dotnet run --project src/Engine.ControlPlane --urls "http://0.0.0.0:5100"
```

### Ollama Network Config (if needed)
```powershell
# PowerShell (run as admin on target machine)
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "Machine")
taskkill /IM ollama.exe /F
ollama serve
```

---

## Key File Paths

### Linux (10.0.1.76)
| Path | Purpose |
|------|---------|
| `/home/nazmin/AstrologyApp/` | BaZi backend (FastAPI) |
| `/home/nazmin/AstrologyApp/.env` | Environment variables |
| `/home/nazmin/AstrologyApp/templates/` | Template engine files |
| `/home/nazmin/admin-dashboard/` | Admin dashboard (React) |

### Mac (10.0.1.237)
| Path | Purpose |
|------|---------|
| `~/projects/bazi/BaziMobileApp/` | Mobile app source |
| `~/projects/bazi/docs/CLAUDE_SYNC.md` | Sync file for Mac Claude |

### Windows (MainWin)
| Path | Purpose |
|------|---------|
| `I:\2026CodeProjects\` | Project root |
| `I:\2026CodeProjects\256ai.Engine\` | Engine project |
| `I:\2026CodeProjects\BaZi\BaziMobileApp\` | Mobile app source (mirror) |

---

## Testing

| Field | Value |
|-------|-------|
| Manual test user | `test@256ai.xyz` / `Test123!` |
| Throughput test users | `throughput-test-{N}@test.256ai.xyz` / `TestPass256!` |
| Throughput test script | `scripts/bazi-throughput-test.ps1` |
| Full docs | [docs/testing/TEST_USERS.md](testing/TEST_USERS.md) |

---

## Important Notes

- **Mac may be asleep** — SSH will timeout. Wait for user to wake it.
- **Dragon's Ollama is for APPS ONLY** — do NOT use for dev/code generation.
- **Dragon SSH is broken** — use RDP or local access.
- **PowerShell `curl`** is an alias for `Invoke-WebRequest` — use `curl.exe` for real curl.
- **systemd auto-restarts uvicorn** on Linux — just `pkill` and it comes back.
- **Mac sync file path** uses capital D: `~/Projects/BaZi/Docs/CLAUDE_SYNC.md`
