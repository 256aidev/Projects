# BaZi App - Project Status

## Current Phase: Go-Live 1 (iOS App Store)

### Overall Progress
| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Backend Auth | COMPLETE | JWT authentication added to FastAPI |
| Phase 2: React Native Setup | COMPLETE | Expo SDK 54, React 19 |
| Phase 3: Screens | COMPLETE | Home, Profile, Calendar, Settings |
| Phase 4: Calendar | COMPLETE | Past 14 days, date navigation |
| Phase 5: Translations | COMPLETE | Chinese-to-English for Four Pillars |
| Phase 6: AdMob Code | COMPLETE | Banner + Interstitial ads |
| Phase 7: iOS Build | COMPLETE | Production AdMob IDs, Xcode ready |
| Phase 8: Production Server | COMPLETE | FastAPI running on 10.0.1.76 |
| Phase 9: App Store Submit | IN PROGRESS | Nginx + SSL remaining |
| Phase 10: Google Play | NOT STARTED | After iOS launch |

---

## Go-Live 1: iOS App Store Checklist

### Infrastructure
- [x] AI Server (10.0.1.147) - Ollama running with llama3
- [x] Bazi App Server (10.0.1.76) - Ubuntu installed
- [x] PostgreSQL database created (bazidb)
- [x] FastAPI deployed and running
- [x] Systemd service created (auto-start on boot)
- [x] API tested from Win11 - working!
- [ ] Nginx reverse proxy configured
- [ ] SSL certs (Cloudflare/Let's Encrypt)
- [ ] Domain 256ai.xyz pointing to server
- [ ] Update mobile app API URL to production

### iOS App
- [x] Production AdMob IDs in app.json
- [x] Production AdMob IDs in Info.plist
- [x] Production AdMob IDs in AdBanner.tsx
- [x] Production AdMob IDs in InterstitialManager.ts
- [x] npm install complete
- [x] pod install complete
- [x] Xcode workspace ready
- [ ] Archive app in Xcode
- [ ] Upload to App Store Connect
- [ ] Fill in App Store metadata
- [ ] Submit for review

### AdMob IDs (iOS - Production)
- App ID: `ca-app-pub-5491037392330095~5450979012`
- Banner: `ca-app-pub-5491037392330095/3367741151`
- Interstitial: `ca-app-pub-5491037392330095/2681345448`

---

## Go-Live 2: Google Play Store Checklist

### Android App
- [ ] Create Android AdMob IDs in AdMob console
- [ ] Update app.json with Android App ID
- [ ] Update AdBanner.tsx with Android banner ID
- [ ] Update InterstitialManager.ts with Android interstitial ID
- [ ] Build with EAS or Android Studio
- [ ] Upload to Google Play Console
- [ ] Fill in Play Store metadata
- [ ] Submit for review

### AdMob IDs (Android - TBD)
- App ID: `ca-app-pub-3940256099942544~3347511713` (TEST - replace)
- Banner: TBD
- Interstitial: TBD

---

## Network Architecture

```
Internet
    │
    ▼
Cloudflare (256ai.xyz) ← DNS Complete
    │
    ▼
UDR7 UniFi Router
    │
    ├── VLAN 1 (Dev Network 10.0.0.x)
    │   ├── Win11 Dev Box: 10.0.0.21 (wired) / 10.0.1.41 (Bittek WiFi)
    │   ├── Mac Dev Box
    │   └── Synology NAS: 10.0.1.198
    │
    └── VLAN 2 (Bittek Prod 10.0.1.x)
        ├── Bazi App Server: 10.0.1.76 (FastAPI + PostgreSQL) ← RUNNING
        └── AI Server: 10.0.1.147 (Ollama + llama3) ← RUNNING
```

---

## Server Status

### Bazi App Server (10.0.1.76)
- **Service**: `bazi-app.service` (systemd)
- **Status**: Active (running)
- **Port**: 8000
- **Check**: `sudo systemctl status bazi-app`
- **Logs**: `sudo journalctl -u bazi-app -f`

### AI Server (10.0.1.147)
- **Service**: Ollama
- **Model**: llama3:latest (8B Q4_0)
- **Port**: 11434
- **Test**: `curl http://10.0.1.147:11434/api/tags`

---

## Key Contacts / Accounts
- Apple Developer Account: tigerrook65@gmail.com (Personal)
- Google Play Console: (pending setup)
- AdMob Account: Active
- Domain: 256ai.xyz (Cloudflare - Complete)

---

Last Updated: 2026-01-20
