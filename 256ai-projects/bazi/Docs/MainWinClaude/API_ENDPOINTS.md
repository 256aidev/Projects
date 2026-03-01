# BaZi API Endpoints Reference

**Base URL:** `https://256ai.xyz` (Production) | `http://localhost:8000` (Development)

---

## Table of Contents
- [Public Endpoints](#public-endpoints)
- [Authentication](#authentication)
- [User Readings](#user-readings)
- [Relationships](#relationships)
- [Subscription](#subscription)
- [Admin Authentication](#admin-authentication)
- [Admin User Management](#admin-user-management)
- [Admin Statistics](#admin-statistics)
- [Admin Subscriptions](#admin-subscriptions)
- [Admin Financials](#admin-financials)
- [Admin System Monitoring](#admin-system-monitoring)
- [Admin Scheduler](#admin-scheduler)

---

## Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root - returns version info |
| GET | `/health` | Health check endpoint |
| GET | `/pillars` | Get current day's pillars |
| GET | `/pillars/{target_date}` | Get pillars for specific date (YYYY-MM-DD) |

---

## Authentication

**Prefix:** `/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register with email/password + birth data | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/social` | Login/register with Google or Apple OAuth | No |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/device-token` | Register FCM/APNs push token | Yes |
| POST | `/auth/accept-legal` | Accept legal terms (Privacy, ToS) | Yes |
| GET | `/auth/legal-status` | Check if legal acceptance needed | Yes |
| DELETE | `/auth/delete-account` | Delete account and all data | Yes |

### Register Request
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "John Doe",
  "birth_date": "1990-05-15",
  "birth_time": "14:30:00",
  "birth_longitude": -122.4194,
  "birth_latitude": 37.7749,
  "birth_location": "San Francisco, CA",
  "preferred_tone": "balanced",
  "language": "en"
}
```

### Login Request
```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Social Login Request
```json
POST /auth/social
{
  "provider": "google",
  "token": "eyJhbGciOiJSUzI1...",
  "name": "John Doe",
  "birth_date": "1990-05-15",
  "birth_time": "14:30:00"
}
```

### Token Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": 123,
  "needs_onboarding": false
}
```

---

## User Readings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/daily/{user_id}` | Get today's daily reading | Yes |
| GET | `/daily/{user_id}/{target_date}` | Get daily reading for specific date | Yes |
| POST | `/daily/{user_id}/regenerate` | Regenerate today's daily reading | Yes |
| GET | `/weekly/{user_id}` | Get current week's reading | Yes |
| POST | `/weekly/{user_id}/regenerate` | Regenerate weekly reading | Yes |
| GET | `/monthly/{user_id}` | Get current month's reading | Yes |
| GET | `/yearly/{user_id}` | Get current year's reading | Yes |

### Daily Reading Response
```json
{
  "user_id": 123,
  "date": "2026-01-26",
  "day_pillar": "甲子",
  "day_pillar_pinyin": "Jiǎ Zǐ",
  "energy_score": 75,
  "focus_areas": ["career", "relationships"],
  "reading_text": "Today brings favorable energy for...",
  "lucky_directions": ["East", "Southeast"],
  "auspicious_activities": ["Starting new projects", "Networking"],
  "cautionary_notes": ["Avoid major financial decisions"],
  "created_at": "2026-01-26T00:05:00Z"
}
```

---

## Relationships

**Prefix:** `/api`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/persons` | Add a person for compatibility analysis | Yes |
| GET | `/api/persons` | List all added persons | Yes |
| GET | `/api/persons/{person_id}` | Get person details | Yes |
| DELETE | `/api/persons/{person_id}` | Delete person | Yes |
| GET | `/api/relationship/{person_id}` | Get compatibility analysis | Yes |

### Create Person Request
```json
POST /api/persons?user_id=123
{
  "name": "Jane Doe",
  "relationship_type": "spouse",
  "birth_date": "1992-03-20",
  "birth_time": "10:15:00",
  "birth_time_known": true,
  "birth_location": "New York, NY"
}
```

### Compatibility Response
```json
{
  "person_id": 45,
  "person_name": "Jane Doe",
  "relationship_type": "spouse",
  "ease_score": 72,
  "durability_score": 85,
  "confidence": "high",
  "confidence_percent": 90,
  "asymmetry": {
    "flag": false,
    "ease_u2p": 70,
    "ease_p2u": 74
  },
  "strengths": ["Strong communication", "Shared values"],
  "watchouts": ["Different energy levels"],
  "toxicity": {
    "index": 15,
    "level": "low"
  },
  "ten_god": {
    "role": "Direct Wealth",
    "interpretation": "Natural compatibility..."
  }
}
```

---

## Subscription

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/subscription/status` | Get user's subscription status | Yes |
| GET | `/subscription/plans` | Get available subscription plans | No |

---

## Admin Authentication

**Prefix:** `/admin/auth`
**Required:** Admin JWT Token

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| POST | `/admin/auth/login` | Admin login | None |
| GET | `/admin/auth/me` | Get admin profile | admin |
| POST | `/admin/auth/create-admin` | Create new admin | super_admin |
| POST | `/admin/bootstrap` | Create first super_admin (one-time) | None |

### Admin Login Request
```json
POST /admin/auth/login
{
  "email": "admin@256ai.xyz",
  "password": "adminpassword"
}
```

---

## Admin User Management

**Prefix:** `/admin/users`
**Required:** Admin JWT Token

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | List users (paginated, searchable) | admin |
| GET | `/admin/users/{user_id}` | Get user details | admin |
| PATCH | `/admin/users/{user_id}` | Update user | admin |
| DELETE | `/admin/users/{user_id}` | Delete user and data | super_admin |
| POST | `/admin/users/{user_id}/grant-premium` | Grant premium access | admin |
| GET | `/admin/users/{user_id}/subscription` | Get user subscription | admin |
| POST | `/admin/users/{user_id}/subscription` | Grant subscription | admin |

### List Users Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search by name or email |
| `auth_provider` | string | Filter by: email, google, apple |
| `page` | int | Page number (default: 1) |
| `per_page` | int | Items per page (default: 20, max: 100) |

---

## Admin Statistics

**Prefix:** `/admin/stats`
**Required:** Admin JWT Token

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats/overview` | Dashboard overview stats |
| GET | `/admin/stats/users` | User growth over time |
| GET | `/admin/stats/retention` | DAU/WAU/MAU metrics |
| GET | `/admin/stats/readings` | Reading generation stats |
| GET | `/admin/stats/recent-signups` | Recent user signups |
| GET | `/admin/stats/subscriptions` | Subscription statistics |

### Overview Response
```json
{
  "total_users": 1500,
  "users_today": 25,
  "users_this_week": 150,
  "users_this_month": 400,
  "active_users_7d": 800,
  "total_daily_readings": 45000,
  "total_weekly_readings": 6000,
  "readings_today": 1500
}
```

### Retention Response
```json
{
  "dau": 250,
  "wau": 800,
  "mau": 1200,
  "dau_mau_ratio": 20.8
}
```

---

## Admin Subscriptions

**Prefix:** `/admin/subscriptions`
**Required:** Admin JWT Token

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/subscriptions/plans` | List subscription plans |
| POST | `/admin/subscriptions/plans` | Create new plan |
| PATCH | `/admin/subscriptions/plans/{plan_id}` | Update plan |
| POST | `/admin/subscriptions/seed-plans` | Seed default plans |
| DELETE | `/admin/subscriptions/{subscription_id}` | Cancel subscription |
| POST | `/admin/subscriptions/{subscription_id}/refund` | Refund subscription |
| GET | `/admin/subscriptions/entitlements` | List available entitlements |

### Available Entitlements
| ID | Name | Description |
|----|------|-------------|
| `future_7_day` | Future 7-Day Readings | Access to 7-day future predictions |
| `weekly_forecast` | Weekly Forecast | Weekly horoscope forecasts |
| `monthly_forecast` | Monthly Forecast | Monthly horoscope forecasts |
| `yearly_forecast` | Yearly Forecast | Yearly horoscope forecasts |
| `remove_ads` | Remove Ads | Ad-free experience |
| `screenshot_mode` | Screenshot Mode | Dev mode - hides ads, enables dev features (admin-only) |
| `premium_annual` | Premium (All Features) | Full access to all premium features |

> **Note:** `screenshot_mode` is NOT included in `premium_annual`. It must be explicitly granted by admins for testing/screenshot purposes.

---

## Admin Financials

**Prefix:** `/admin/financials`
**Required:** Admin JWT Token

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/financials/overview` | Financial overview |
| GET | `/admin/financials/revenue-by-source` | Revenue by source (iOS, Google, Admin) |
| GET | `/admin/financials/revenue-by-plan` | Revenue by subscription plan |
| GET | `/admin/financials/revenue-by-type` | Revenue by transaction type |
| GET | `/admin/financials/revenue-over-time` | Daily revenue (last N days) |
| GET | `/admin/financials/monthly-revenue` | Monthly revenue (last N months) |
| GET | `/admin/financials/transactions` | Paginated transaction logs |
| GET | `/admin/financials/recent-transactions` | Recent transactions |

---

## Admin System Monitoring

**Prefix:** `/admin/system`
**Required:** Admin JWT Token

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/system/health` | Service health status (Ollama, DB, API) |
| POST | `/admin/system/health-report` | Receive health reports from monitors |
| GET | `/admin/system/request-logs` | Recent API request logs |
| GET | `/admin/system/metrics` | 24-hour system metrics |
| GET | `/admin/launch-health` | Launch health dashboard with thresholds |

### Launch Health Response
```json
{
  "latency": {
    "p50_ms": 45,
    "p95_ms": 120,
    "p99_ms": 250,
    "status": "green"
  },
  "errors": {
    "rate_percent": 0.5,
    "count_24h": 12,
    "total_requests_24h": 2400,
    "status": "green"
  },
  "rate_limits": {
    "count_1h": 0,
    "status": "green"
  },
  "scheduler": {
    "jobs": [
      {"job": "daily_readings", "status": "healthy", "last_run": "2026-01-26T00:05:00Z"}
    ],
    "readings": {
      "daily": {"generated": 150, "total": 150},
      "weekly": {"generated": 150, "total": 150}
    },
    "failures": 0,
    "status": "green"
  },
  "timestamp": "2026-01-26T12:30:00Z"
}
```

### Status Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| P95 Latency | < 1500ms | 1500-2500ms | > 2500ms |
| Error Rate | < 2% | 2-5% | > 5% |
| Rate Limits (1h) | < 10 | 10-50 | > 50 |
| Job Failures | 0 | 1 | 2+ |

---

## Admin Scheduler

**Prefix:** `/admin/scheduler`
**Required:** Admin JWT Token (most endpoints)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/scheduler/status` | Get all job statuses | Admin |
| GET | `/admin/scheduler/check-readings` | Check reading completion | None |
| POST | `/admin/scheduler/trigger-daily` | Trigger daily job | None |
| POST | `/admin/scheduler/trigger-weekly` | Trigger weekly job | None |
| POST | `/admin/scheduler/trigger-monthly` | Trigger monthly job | None |
| POST | `/admin/scheduler/trigger-yearly` | Trigger yearly job | None |

### Scheduler Status Response
```json
{
  "jobs": [
    {
      "job": "daily_readings",
      "last_status": "healthy",
      "last_message": "Generated 150 readings",
      "last_run": "2026-01-26T00:05:00Z"
    }
  ],
  "readings": {
    "daily": {"date": "2026-01-26", "generated": 150, "total": 150},
    "weekly": {"week_start": "2026-01-20", "generated": 150, "total": 150},
    "monthly": {"month_start": "2026-01-01", "generated": 150, "total": 150},
    "yearly": {"year": 2026, "generated": 150, "total": 150}
  },
  "total_users": 150
}
```

---

## Admin Audit Logs

| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/admin/audit-logs` | Get admin action audit logs | super_admin |

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `per_page` | int | Items per page (max: 100) |
| `admin_id` | int | Filter by admin ID |
| `action` | string | Filter by action type |

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

- Standard endpoints: 100 requests/minute per IP
- Auth endpoints: 20 requests/minute per IP
- Admin endpoints: 200 requests/minute per admin

---

*Last updated: 2026-01-26*
