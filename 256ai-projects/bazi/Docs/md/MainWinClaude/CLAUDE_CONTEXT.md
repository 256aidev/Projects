# Claude Code - Extended Context File

This file helps Claude Code maintain context across sessions. Read this file at the start of any new session.

---

## Project Overview

**BaZi App** - A mobile app for Chinese BaZi (Four Pillars of Destiny) astrology readings.

- **Backend**: FastAPI (Python) at `iOS/AstrologyApp/`
- **Mobile App**: React Native (Expo) at `iOS/BaziMobileApp/`
- **Target Platforms**: iOS App Store, Google Play Store
- **Monetization**: Google AdMob (banner + interstitial ads)

---

## Current Session State

### Last Known Status (2026-01-20)
- FastAPI deployed and running on Bazi App Server (10.0.1.76)
- Systemd service created: `bazi-app.service`
- Nginx reverse proxy configured
- Cloudflare SSL (Flexible) working - https://256ai.xyz/ accessible
- Mobile app API URL updated to production
- PowerShell sync scripts created for backup/versioning

### Active Todo List
1. [DONE] Deploy FastAPI to production server
2. [DONE] Configure Nginx reverse proxy
3. [DONE] Set up SSL with Cloudflare
4. [DONE] Update mobile app API URL to https://256ai.xyz
5. [DONE] Create backup/sync scripts
6. [IN PROGRESS] Test mobile app connectivity
7. [PENDING] iOS App Store submission

---

## Server Information

### Bazi App Server (FastAPI + PostgreSQL)
- **Hostname**: bazi
- **IP**: 10.0.1.76
- **VLAN**: Bittek Prod (10.0.1.x)
- **OS**: Ubuntu Server
- **SSH User**: nazmin
- **App Path**: ~/AstrologyApp
- **Database**: PostgreSQL
  - DB Name: bazidb
  - DB User: baziuser
  - DB Pass: @BB#26$Odin%

### AI Server (Ollama)
- **Hostname**: dragon.lan.256ai
- **IP**: 10.0.1.147
- **VLAN**: Bittek Prod (10.0.1.x)
- **OS**: Windows 11
- **Ollama Port**: 11434
- **Model**: llama3:latest (8B, Q4_0)
- **RAM**: 128GB
- **CPU**: Ryzen AI Max+ 395

### Dev Win11 Box
- **IP**: 10.0.0.21 (wired) / 10.0.1.41 (Bittek WiFi)
- **VLAN**: Dev Network (10.0.0.x)
- **Project Path**: I:\2026CodeProjects\BaZi\

### Dev Mac Box
- **IP**: 10.0.0.143
- **User**: mark lombardi
- **VLAN**: Dev Network
- **Use**: iOS builds only (Xcode)
- **Project Path**: ~/Documents/BaziMobileApp
- **SSH**: `ssh "mark lombardi"@10.0.0.143`

---

## Key Configuration Files

### Backend (.env on server)
```
DATABASE_URL=postgresql://baziuser:@BB#26$Odin%@localhost:5432/bazidb
OLLAMA_HOST=http://10.0.1.147:11434
JWT_SECRET_KEY=bazi-mobile-app-jwt-secret-key-256ai-prod-2026
```

### Mobile App (API client)
- File: `src/api/client.ts`
- API_BASE_URL: `https://256ai.xyz` (production)

---

## AdMob Configuration

### iOS (Production)
- App ID: `ca-app-pub-5491037392330095~5450979012`
- Banner: `ca-app-pub-5491037392330095/3367741151`
- Interstitial: `ca-app-pub-5491037392330095/2681345448`

### Android (Test IDs - need production)
- App ID: `ca-app-pub-3940256099942544~3347511713`
- Banner: placeholder
- Interstitial: placeholder

---

## Common Commands

### Deploy to Bazi Server (from Win11)
```batch
scp -r "I:\2026CodeProjects\BaZi\iOS\AstrologyApp" nazmin@10.0.1.76:~/
```

### SSH to Bazi Server
```batch
ssh nazmin@10.0.1.76
```

### Start FastAPI on Server
```bash
cd ~/AstrologyApp
./venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### Test Ollama from Server
```bash
curl http://10.0.1.147:11434/api/tags
```

---

## Backup & Sync Scripts

All scripts in `I:\2026CodeProjects\BaZi\scripts\`

### Win11 → NAS (backup before changes)
```powershell
.\scripts\Backup-ToNAS.ps1
```
Creates timestamped backup at `\\10.0.1.198\home\Projects\Bazi\backups\`

### Win11 → Mac (push changes)
```powershell
.\scripts\Sync-ToMac.ps1
```
Shows diff, prompts before copying. Only changed files.

### Mac → Win11 (pull changes)
```powershell
.\scripts\Sync-FromMac.ps1
```
Pull newer files from Mac to Win11.

### Mac → NAS (backup Mac work)
```powershell
.\scripts\Backup-MacToNAS.ps1
```
Creates `mac_YYYY-MM-DD_HHMM` backup folder on NAS.

### Single File (safest)
```powershell
.\scripts\Sync-SingleFile.ps1 -File "BaziMobileApp\src\api\client.ts"
```
Creates .bak backup on Mac before overwriting.

### Compare (read-only)
```powershell
.\scripts\Compare-WithMac.ps1
```
Shows which files differ between Win11 and Mac.

---

## Recent Code Changes

### narrative_agent.py
- Added `OLLAMA_HOST` environment variable support
- Uses `OllamaClient(host=OLLAMA_HOST)` for remote Ollama
- Default model: `llama3` (was `llama3.2`)

### requirements.txt
- Added `psycopg2-binary>=2.9.0` for PostgreSQL

---

## Known Issues / Blockers

1. **Local DNS Cache** - Win11 Synology DNS (10.0.1.198) may cache old records. Use `ipconfig /flushdns` or test with `--resolve` flag.
2. **AdMob in Expo Go** - RNGoogleMobileAdsModule requires native build, won't work in Expo Go. Use Xcode build.
3. **iOS Testing** - Must rebuild app in Xcode after code changes (not just Expo reload)

---

## User Preferences

- Prefers batch files for repetitive commands
- Uses Windows 11 as main dev box
- Mac only for iOS builds
- Wants code changes on dev box, then copy to server (stay in sync)
- Architecture-conscious (VLANs, separation of concerns)

---

## Session Recovery Checklist

If starting fresh, check:
1. Read this file first
2. Read PROJECT_STATUS.md for current phase
3. Read CHANGELOG.md for recent changes
4. SSH into 10.0.1.76 and check `systemctl status bazi-app` (if service exists)
5. Check if Ollama is running: `curl http://10.0.1.147:11434/api/tags`

---

### NAS (Synology)
- **IP**: 10.0.1.198
- **Backup Path**: `\\10.0.1.198\home\Projects\Bazi\backups\`

---

Last Updated: 2026-01-20
