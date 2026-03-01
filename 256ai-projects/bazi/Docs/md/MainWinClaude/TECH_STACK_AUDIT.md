# BaZi App - Technical Stack Audit Report
**Generated:** January 2026
**Purpose:** System audit for legal compliance implementation

---

## STACK SUMMARY

| Layer | Technology | Details |
|-------|------------|---------|
| **Mobile App** | React Native + Expo 54 | TypeScript, iOS & Android |
| **Admin Dashboard** | React 19 + Vite | TypeScript, Web only |
| **Backend API** | FastAPI (Python) | REST API, JSON responses |
| **Database** | SQLite (default) | SQLAlchemy ORM, configurable via env |
| **Authentication** | Custom JWT | 30-day tokens, bcrypt passwords |
| **OAuth Providers** | Google + Apple | Native SDK integration |
| **Ads** | Google AdMob | react-native-google-mobile-ads v14.6.0 |
| **Push Notifications** | FCM/APNs ready | device_token field exists |
| **Deployment** | Linux server | systemd service (bazi-app) |

---

## FRONTEND

### 1. Mobile App (React Native + Expo)
- **Framework:** React Native 0.81.4 with Expo 54.0.0
- **Language:** TypeScript
- **Platforms:** iOS and Android
- **Location:** `I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\`

**Key Dependencies:**
```
expo: ~54.0.0
react: 19.1.0
react-native: 0.81.4
@react-navigation/native: ^6.1.18
@react-native-async-storage/async-storage: 2.1.2
@react-native-google-signin/google-signin: ^16.1.1
expo-apple-authentication: ^8.0.8
react-native-google-mobile-ads: ^14.6.0
react-native-purchases: ^8.2.0
```

**Authentication in Frontend:**
- Google Sign-In: `@react-native-google-signin/google-signin`
- Apple Sign-In: `expo-apple-authentication`
- Email/Password: Custom implementation
- Auth Context: `src/auth/AuthContext.tsx`
- API Functions: `src/api/auth.ts`

### 2. Admin Dashboard (React Web)
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Language:** TypeScript
- **Location:** `I:\2026CodeProjects\BaZi\iOS\admin-dashboard\`

**Key Dependencies:**
```
react: 19.2.0
react-router-dom: 7.12.0
@tanstack/react-query: 5.x
axios: for API calls
```

---

## BACKEND / API

### 3. Backend Server
- **Language:** Python 3.x
- **Framework:** FastAPI 0.109.0+
- **Server:** Uvicorn 0.27.0+
- **Location:** `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\`

**Key Files:**
- Main App: `app.py`
- Auth Router: `routers/auth_router.py`
- Admin Router: `routers/admin_router.py`
- User Model: `models/user.py`
- Database Config: `models/base.py`

### 4. User Creation Flow
Users are created through THREE paths:

**A. Email/Password Registration**
- Endpoint: `POST /auth/register`
- Requires: email, password, birth data (date, time, location)
- Creates user with calculated BaZi pillars

**B. Google OAuth**
- Endpoint: `POST /auth/social` (provider="google")
- Token verified via Google servers
- May return `needs_onboarding=True` if birth data missing

**C. Apple OAuth**
- Endpoint: `POST /auth/social` (provider="apple")
- Same flow as Google

---

## DATABASE

### 5. Database Type
- **Default:** SQLite (`sqlite:///./bazi_app.db`)
- **Configurable:** Via `DATABASE_URL` environment variable
- **ORM:** SQLAlchemy 2.0+

### 6. Database Configuration
- **Config File:** `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\models\base.py`
- **Environment:** `.env` file with `DATABASE_URL`
- **Connection:** SQLAlchemy SessionLocal factory

### 7. User Table Structure
- **Table Name:** `users`
- **Primary Key:** `id` (Integer, auto-increment)
- **Total Fields:** 47 columns

**Authentication Fields:**
| Field | Type | Notes |
|-------|------|-------|
| id | Integer | PRIMARY KEY |
| email | String(255) | UNIQUE, nullable |
| password_hash | String(255) | nullable (OAuth users) |
| auth_provider | String(50) | "email", "google", "apple" |
| provider_user_id | String(255) | OAuth provider ID |
| email_verified | Boolean | default False |
| device_token | String(500) | FCM/APNs token |
| last_login | DateTime | nullable |

**Birth Data Fields:**
| Field | Type | Notes |
|-------|------|-------|
| name | String(100) | NOT NULL |
| birth_date | Date | NOT NULL, required for BaZi |
| birth_time | Time | NOT NULL, required for BaZi |
| birth_longitude | Float | nullable |
| birth_latitude | Float | nullable |
| birth_location | String(200) | nullable |

**BaZi Calculated Fields:**
- year_pillar, month_pillar, day_pillar, hour_pillar (Chinese characters)
- year_stem, month_stem, day_stem, hour_stem
- year_branch, month_branch, day_branch, hour_branch
- day_master, day_master_element, day_master_polarity
- year_ten_god, month_ten_god, hour_ten_god
- element_counts (JSON text)

**User Preferences:**
| Field | Type | Notes |
|-------|------|-------|
| preferred_tone | String(50) | default "balanced" |
| language | String(10) | default "en" |
| created_at | DateTime | auto |
| updated_at | DateTime | auto |

### 8. Migrations
- **Status:** NO formal migration system
- **Method:** SQLAlchemy `Base.metadata.create_all()` on app startup
- **Tool:** None (no Alembic)

---

## ADS / THIRD PARTIES

### 9. Google AdMob
- **Status:** INTEGRATED in mobile app
- **Package:** `react-native-google-mobile-ads: ^14.6.0`
- **Implementation:** Client-side only
- **Server-side ad logic:** None

### 10. Analytics
- **Status:** Not explicitly integrated
- **Firebase Analytics:** Not installed
- **Google Analytics:** Not installed
- **Custom analytics:** Basic stats via `services/stats_service.py`

### 11. In-App Purchases
- **Package:** `react-native-purchases: ^8.2.0` (RevenueCat)
- **Status:** Package installed but may not be active (AdMob-only monetization stated)

---

## DEPLOYMENT

### 11. Backend Deployment
- **Location:** Linux server (Ubuntu)
- **IP:** 10.0.1.76 (internal), 256ai.xyz (external via Cloudflare)
- **Service:** systemd (`bazi-app`)
- **User:** nazmin
- **App Path:** `/home/nazmin/AstrologyApp/`

### 12. Database Deployment
- **Location:** Same host as backend
- **Type:** SQLite file on server
- **Path:** `/home/nazmin/AstrologyApp/bazi_app.db`

---

## LEGAL / USER FLOW (CRITICAL GAPS)

### 13. Legal Acceptance Storage
**Current State:** NO legal acceptance tracking exists

**Recommended Location:** User table (add new fields)

### 14. Current Tracking Fields
| Feature | Status | Field |
|---------|--------|-------|
| Terms acceptance | NOT TRACKED | - |
| Privacy acceptance | NOT TRACKED | - |
| Age verification | NOT TRACKED | - |
| Birthdate | TRACKED | birth_date |
| Legal version | NOT TRACKED | - |

**FIELDS THAT NEED TO BE ADDED:**
```python
# In models/user.py - Add to User class:
legal_accepted_at = Column(DateTime, nullable=True)
legal_version = Column(String(20), nullable=True)
```

---

## KEY FILES FOR USER CREATION & PERSISTENCE

| Purpose | File Path |
|---------|-----------|
| Main App Entry | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\app.py` |
| User Model | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\models\user.py` |
| All Models Init | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\models\__init__.py` |
| Database Config | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\models\base.py` |
| Auth Router | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\routers\auth_router.py` |
| Admin Router | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\routers\admin_router.py` |
| JWT Handler | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\auth\jwt_handler.py` |
| Password Utils | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\auth\password_utils.py` |
| Auth Dependencies | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\auth\dependencies.py` |
| Mobile Auth Context | `I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\auth\AuthContext.tsx` |
| Mobile API Client | `I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\api\auth.ts` |
| Environment Config | `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\.env` |

---

## IMPLEMENTATION NOTES FOR LEGAL COMPLIANCE

### Required Backend Changes:
1. Add `legal_accepted_at` and `legal_version` fields to User model
2. Add age validation (13+) before saving birth_date
3. Add user deletion endpoint for data deletion requests
4. Add `/admin/scheduler/check-readings` and trigger endpoints (already added)

### Required Mobile App Changes:
1. Add Legal screen with Privacy Policy, Terms, Disclaimer
2. Add first-launch legal acceptance modal
3. Add age gate check before profile completion
4. Add data deletion request flow
5. Block AdMob for users under 13

### Server Details for Deployment:
- SSH: `ssh nazmin@10.0.1.76`
- Restart service: `sudo systemctl restart bazi-app`
- Logs: `sudo journalctl -u bazi-app -n 50`
- Health monitor: `/home/nazmin/AstrologyApp/scripts/bazi-health-monitor.sh`

---

## CONTACT INFO FOR LEGAL DOCS
- **Email:** 256ai.dev@gmail.com
- **Current Legal Version:** None (to be: "2026-01")
