# BaZi App - Changelog

All notable changes to this project are documented here.

---

## [1.1.0] - 2026-01-20

### Infrastructure - Production Server Live!
- Bazi App Server (10.0.1.76) fully deployed
- PostgreSQL database `bazidb` created with user `baziuser`
- FastAPI connected to remote Ollama server (10.0.1.147)
- Systemd service `bazi-app.service` created for auto-start
- API tested and working from Win11 dev box
- Nginx reverse proxy configured

### Changed
- `narrative_agent.py`: Updated to use `OLLAMA_HOST` environment variable
  - Now uses `OllamaClient(host=OLLAMA_HOST)` instead of default localhost
  - Default model changed from `llama3.2` to `llama3`
- `requirements.txt`: Added `psycopg2-binary>=2.9.0` for PostgreSQL support
- Created `.env.production` template for production deployment

### Server Commands
- Start: `sudo systemctl start bazi-app`
- Stop: `sudo systemctl stop bazi-app`
- Status: `sudo systemctl status bazi-app`
- Logs: `sudo journalctl -u bazi-app -f`

---

## [1.0.0] - 2026-01-18

### Added - iOS App (BaziMobileApp)
- React Native app with Expo SDK 54
- JWT authentication with AsyncStorage
- Screens: Login, Register, Home, Profile, Calendar, Settings
- Calendar with past 14 days navigation
- Chinese-to-English translations for Four Pillars (stems, branches, zodiac)
- AdMob integration (banner + interstitial ads)
- Production AdMob IDs configured for iOS

### Added - Backend (AstrologyApp)
- FastAPI backend with BaZi calculations
- JWT authentication endpoints (`/auth/login`, `/auth/register`)
- User management endpoints
- Daily readings with template-based generation (FREE)
- Weekly readings with Ollama AI generation (FREE)
- Rate limiting with slowapi
- SQLAlchemy ORM with SQLite (dev) / PostgreSQL (prod)

### Files Modified for iOS AdMob
- `app.json` - iosAppId updated to production
- `ios/BaZiAstrology/Info.plist` - GADApplicationIdentifier updated
- `src/components/ads/AdBanner.tsx` - iOS banner ID updated
- `src/components/ads/InterstitialManager.ts` - iOS interstitial ID updated

---

## [0.9.0] - 2026-01-17

### Added
- Calendar screen date navigation
- Fixed API endpoint from query param to path param for dates
- Profile screen Four Pillars translations
- Removed "coming soon" placeholder text

### Fixed
- Network connectivity issues (phone to backend)
- Windows Firewall rule for port 8000
- Expo SDK version mismatch (52 → 54)
- React version mismatch (18 → 19)

---

## [0.5.0] - 2026-01-16

### Added
- Initial React Native app structure
- Authentication flow (login/register screens)
- Navigation setup (tabs + stack)
- API client with JWT handling

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.5.0 | 2026-01-16 | Initial app structure |
| 0.9.0 | 2026-01-17 | Core features complete |
| 1.0.0 | 2026-01-18 | iOS ready for App Store |
| 1.1.0 | TBD | Production server live |
| 1.2.0 | TBD | App Store approved |
| 2.0.0 | TBD | Android/Play Store launch |
