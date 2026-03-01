# Machine Credentials & Connection Info

Quick reference for SSH/SCP connections.

---

## Win Dev Box (Seat 1 - Lead Dev)
- **Name**: Main Windows Dev
- **User**: h1deep
- **IP**: 10.0.0.21 (wired) / 10.0.1.41 (WiFi)
- **Use for**: Primary Claude Code development
- **Claude**: Lead dev role

---

## New AI Box (Seat 2 - Co-Dev / Worker)
- **Name**: Ryzen AI Max+ 395 (64GB RAM / 64GB unified)
- **User**: TBD
- **IP**: TBD (pending setup)
- **Use for**:
  - Co-dev seat (Claude Code when you're there)
  - Qwen worker (qwen2.5-coder:32b when at Win Dev)
- **Ollama port**: 11434
- **Models**: qwen2.5-coder:32b (to install)

---

## Mac Development Machine (BaZi Mobile)
- **Name**: Mac Mini / MacBook
- **User**: `mark lombardi`
- **IP**: `10.0.0.143`
- **Use for**: iOS builds, Xcode, App Store submissions
- **Project path**: `~/projects/bazi/BaziMobileApp`
- **Docs path**: `~/projects/bazi/docs`

### SSH Command
```bash
ssh "mark lombardi"@10.0.0.143
```

### SCP Example
```bash
scp "local/file.txt" "mark lombardi"@10.0.0.143:~/projects/bazi/
```

---

## Ollama AI Server (Windows - No SSH)
- **Name**: Ollama Server
- **User**: `nazmin`
- **IP**: `10.0.1.147`
- **Port**: `11434`
- **Use for**: LLM inference for BaZi app
- **Current Model**: `qwen2.5:14b`
- **Available Models**: qwen2.5:14b, llama3.3:70b, llama3:latest
- **Note**: Windows machine - use curl, not SSH

### Check Ollama Status
```bash
curl http://10.0.1.147:11434/api/ps
curl http://10.0.1.147:11434/api/tags
```

---

## App Server (Linux Backend)
- **Name**: BaZi API Server
- **User**: `nazmin`
- **IP**: `10.0.1.76`
- **Port**: `8000`
- **Use for**: FastAPI backend, PostgreSQL database
- **Backend path**: `~/AstrologyApp`
- **Service**: `bazi-app` (systemd)

### SSH Command
```bash
ssh nazmin@10.0.1.76
```

### Key Files
- `.env` - OLLAMA_HOST, OLLAMA_MODEL, DATABASE_URL
- `app.py` - Main FastAPI application
- `app.log` - Application logs

### Restart Backend (no sudo)
```bash
ssh nazmin@10.0.1.76 "pkill -f uvicorn; cd ~/AstrologyApp && nohup uvicorn app:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &"
```

---

## Production API (Cloudflare)
- **URL**: `https://256ai.xyz`
- **Stack**: FastAPI + PostgreSQL (proxied via Cloudflare)
- **Deploy via**: See `Deploy-ToServer.ps1`

---

## NAS Backup
- **See**: `Backup-ToNAS.ps1`, `Backup-MacToNAS.ps1`

---

## Architecture Overview

```
CEO Layer: You + GPT (Strategy & Finance)
              │
              ▼
     AI Interface Engine
    (HL7-style Orchestration)
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
Win Dev    New AI Box   Mac Dev
(Seat 1)   (Seat 2)     (iOS)
Claude     Claude/Qwen  Claude
   │          │
   └────┬─────┘
        ▼
   Ollama PC (App AI)
```

**Dual Mode for New AI Box:**
- You at New AI Box → Claude Code (co-dev)
- You at Win Dev Box → Qwen worker (I delegate tasks)
