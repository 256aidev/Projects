# BaZi Four Pillars App - System Architecture

## Overview

The BaZi Four Pillars App is a mobile application that provides personalized Chinese astrology readings using AI-generated content. The system consists of three main components working together.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              END USERS                                      │
│                    (Download app from Apple App Store)                      │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BaziMobileApp (React Native / iOS)                      │
│                                                                             │
│  Location: I:\2026CodeProjects\BaZi\iOS\BaziMobileApp                       │
│  Build Machine: Mac (10.0.0.143)                                            │
│                                                                             │
│  Key Files:                                                                 │
│  ├── src/api/client.ts          - API client configuration                 │
│  ├── src/api/forecasts.ts       - Weekly/Monthly/Yearly forecast APIs      │
│  ├── src/screens/readings/      - Forecast display screens                 │
│  └── ios/                       - Xcode project files                      │
│                                                                             │
│  Build Process:                                                             │
│  1. Code synced to Mac via SCP                                              │
│  2. Built in Xcode (Cmd+Shift+K to clean, Cmd+R to run)                    │
│  3. Packaged as .ipa for App Store submission                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ HTTPS API Calls
                                  │ (Base URL: https://256ai.xyz)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare (CDN/Proxy)                              │
│                                                                             │
│  Domain: 256ai.xyz                                                          │
│  Features: SSL termination, DDoS protection, caching                        │
│  Timeout: 100 seconds (for proxied requests)                                │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AstrologyApp (FastAPI Backend)                            │
│                                                                             │
│  Server: Linux (10.0.1.76)                                                  │
│  Location: /home/nazmin/AstrologyApp                                        │
│  Service: systemd (bazi-app.service)                                        │
│  Runtime: uvicorn with 4 workers                                            │
│                                                                             │
│  Key Files:                                                                 │
│  ├── app.py                     - Main FastAPI application                  │
│  ├── agents/narrative_agent.py  - AI content generation                     │
│  ├── models/                    - SQLAlchemy database models                │
│  │   ├── user.py                                                            │
│  │   ├── weekly_reading.py                                                  │
│  │   ├── monthly_reading.py                                                 │
│  │   └── yearly_reading.py                                                  │
│  └── venv/                      - Python virtual environment                │
│                                                                             │
│  API Endpoints:                                                             │
│  ├── GET /                      - Health check                              │
│  ├── GET /weekly/{user_id}      - Weekly forecast                           │
│  ├── GET /monthly/{user_id}     - Monthly forecast                          │
│  ├── GET /yearly/{user_id}      - Yearly forecast                           │
│  ├── POST /users                - Create user                               │
│  └── GET /users/{user_id}       - Get user profile                          │
│                                                                             │
│  Database: PostgreSQL (localhost:5432)                                      │
│  ├── users                      - User profiles and birth data              │
│  ├── weekly_readings            - Cached weekly forecasts                   │
│  ├── monthly_readings           - Cached monthly forecasts                  │
│  └── yearly_readings            - Cached yearly forecasts                   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ HTTP API Calls
                                  │ (Timeout: 120 seconds)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Ollama AI Server (LLM)                                 │
│                                                                             │
│  Server: Windows (10.0.1.147)                                               │
│  Port: 11434                                                                │
│  Model: llama3:latest                                                       │
│                                                                             │
│  Purpose:                                                                   │
│  - Generates personalized BaZi readings                                     │
│  - Produces content in English and Chinese                                  │
│  - Interprets Four Pillars charts                                           │
│                                                                             │
│  Connection: http://10.0.1.147:11434                                        │
│  Environment Variable: OLLAMA_HOST                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Reading Generation Flow

```
1. User opens Yearly Forecast in app
                    │
                    ▼
2. App calls GET https://256ai.xyz/yearly/{user_id}
                    │
                    ▼
3. Backend checks PostgreSQL for cached reading
                    │
          ┌─────────┴─────────┐
          │                   │
    [Cache Hit]          [Cache Miss]
          │                   │
          ▼                   ▼
4a. Return cached      4b. Acquire advisory lock
    content                   │
                              ▼
                        5. Call Ollama to generate
                           (up to 120s timeout)
                              │
                              ▼
                        6. Save to PostgreSQL
                              │
                              ▼
                        7. Release lock & return
```

### Race Condition Prevention

The backend uses PostgreSQL advisory locks to prevent duplicate AI generations:

```python
# Lock ID formula:
# - Yearly readings:  user_id + 1,000,000
# - Monthly readings: user_id + 2,000,000

# Flow:
1. Check for existing reading
2. If not found, acquire advisory lock
3. Check again (another request may have created it)
4. If still not found, generate with Ollama
5. Save to database
6. Release lock (in finally block)
```

## Development Machines

| Machine | IP Address | Purpose |
|---------|------------|---------|
| Windows Dev | Local | Primary development, code editing |
| Mac | 10.0.0.143 | iOS builds, Xcode, App Store submission |
| Linux Server | 10.0.1.76 | Production backend (FastAPI + PostgreSQL) |
| Windows AI | 10.0.1.147 | Ollama LLM server |

## Deployment Process

### Backend Deployment

```bash
# SSH to server
ssh nazmin@10.0.1.76

# Navigate to app
cd ~/AstrologyApp

# Pull latest changes (if using git)
git pull

# Restart service
sudo systemctl restart bazi-app

# Check status
sudo systemctl status bazi-app

# View logs
journalctl -u bazi-app -f
```

### Mobile App Deployment

```bash
# 1. Sync code to Mac
scp -r src/ "mark lombardi@10.0.0.143:~/Documents/BaziMobileApp/src/"

# 2. On Mac: Install dependencies
cd ~/Documents/BaziMobileApp/ios
pod install

# 3. Open in Xcode
open BaziMobileApp.xcworkspace

# 4. Build and test
# Cmd + Shift + K (Clean)
# Cmd + R (Run on device/simulator)

# 5. Archive for App Store
# Product > Archive
# Distribute App > App Store Connect
```

## Configuration

### Backend Environment Variables

```bash
# /home/nazmin/AstrologyApp/.env
DATABASE_URL=postgresql://user:pass@localhost/astrology
OLLAMA_HOST=http://10.0.1.147:11434
```

### Mobile App API Configuration

```typescript
// src/api/client.ts
const API_BASE_URL = 'https://256ai.xyz';
```

### Systemd Service

```ini
# /etc/systemd/system/bazi-app.service
[Unit]
Description=BaZi Four Pillars App
After=network.target

[Service]
User=nazmin
WorkingDirectory=/home/nazmin/AstrologyApp
ExecStart=/home/nazmin/AstrologyApp/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### Common Issues

1. **App hangs on forecast loading**
   - Check if Ollama server is running: `curl http://10.0.1.147:11434/api/tags`
   - Check backend logs: `journalctl -u bazi-app -n 100`

2. **Yearly forecast crashes app**
   - Ensure null safety in forecasts.ts
   - Check for defensive rendering in screen components

3. **Server blocks during AI generation**
   - Ensure uvicorn has multiple workers (--workers 4)
   - Check Ollama timeout configuration (120s)

4. **Duplicate key errors in logs**
   - Advisory locks should prevent this
   - Check that lock/unlock is properly balanced

### Health Checks

```bash
# Check backend
curl https://256ai.xyz/

# Check Ollama
curl http://10.0.1.147:11434/api/tags

# Test endpoint
curl https://256ai.xyz/weekly/1
```

## Version History

- **2026-01-23**: Added advisory locking for race conditions, null safety in mobile app
- **2026-01-23**: Added 4 uvicorn workers, 120s Ollama timeout
- **2026-01-23**: Connected mobile app to real AI endpoints (disabled mock data)
