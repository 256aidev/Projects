# Claude Sync File - BaZi App Development

> **Last Updated:** 2026-01-26
> **Purpose:** Keep Windows Claude (backend) and Mac Claude (mobile app) in sync

---

## 🚨 READ THIS FIRST - MACHINE ACCESS INFO

**This section exists because Claude often forgets connection details after context resets. DO NOT ask the user for IPs - they are listed here.**

### All Machines in This Project:

| Machine | IP | SSH User | Purpose |
|---------|-----|----------|---------|
| **Linux Backend** | 10.0.1.76 | nazmin | API server, PostgreSQL, uvicorn |
| **Mac (Mobile App)** | 10.0.0.143 | marklombardi | React Native app, Xcode builds |
| **Ollama AI Server** | 10.0.1.147 | (HTTP only) | LLM for AI readings (port 11434) |
| **Public API** | 256ai.xyz | N/A | HTTPS endpoint |

### Quick SSH Commands:
```bash
# Linux backend server
ssh nazmin@10.0.1.76

# Mac build machine
ssh marklombardi@10.0.0.143

# Read Mac Claude's sync file (do this to coordinate!)
ssh marklombardi@10.0.0.143 "cat ~/Projects/Bazi/Docs/CLAUDE_SYNC.md"
```

### ⚠️ Can't Connect? Tell User to Check WiFi!

**If ping/SSH fails, say this:**
> "The Mac at 10.0.0.143 is not reachable. Please check that your WiFi is connected - this is the most common issue when machines don't respond."

**Test connectivity first:**
```bash
ping -n 1 10.0.0.143   # Windows
ping -c 1 10.0.0.143   # Linux/Mac
```

**Common issues:**
1. **WiFi not connected** - #1 issue! User's computer may not auto-connect on startup
2. **Mac is asleep** - Try pinging, it should wake
3. **IP changed** - Rare, but possible if router reset

---

## 📡 Mac Claude Sync File

**Location:** `~/Projects/Bazi/Docs/CLAUDE_SYNC.md` on Mac (10.0.0.143)

**Always read Mac's sync file when coordinating work** - Mac Claude documents their changes there, and I document mine here. This keeps both Claudes in sync.

---

## 🆕 Latest Update (2026-01-26) - Windows Claude

### Screenshot Mode Feature - BACKEND READY

**What is Screenshot Mode?**
A dev/testing mode that:
- Hides ALL ads in the app (for clean screenshots)
- Enables any dev features needed for testing
- Can be granted to specific users via Admin Dashboard

**Backend Changes Made:**
1. Added `screenshot_mode` to `VALID_ENTITLEMENTS` in `models/subscription.py`
2. Added `has_screenshot_mode` flag to subscription status endpoint
3. Added Screenshot Mode option to Admin Dashboard entitlement selector

**How to Grant Screenshot Mode:**
1. Go to Admin Dashboard → Users → Select User → Edit Subscription
2. Check "Screenshot Mode" checkbox
3. Set duration (e.g., 365 days for testers)
4. Save

**API Response:**
```json
GET /subscription/status?user_id=X
{
  "is_premium": true,
  "has_screenshot_mode": true,  // ← NEW FLAG
  "has_remove_ads": false,
  ...
}
```

**⚠️ IMPORTANT: `has_screenshot_mode` is SEPARATE from `has_premium_annual`**
- Premium Annual does NOT include screenshot_mode (it's admin-only)
- Screenshot mode must be explicitly granted to specific users

---

## Current System Status

### Backend (Linux 10.0.1.76) - WORKING
- **Service:** bazi-app.service (uvicorn with 4 workers)
- **API Base:** https://256ai.xyz
- **Ollama:** http://10.0.1.147:11434 (llama3 model)

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET / | ✅ Working | Health check |
| GET /weekly/{user_id} | ✅ Working | AI-generated weekly forecast |
| GET /monthly/{user_id} | ✅ Working | AI-generated monthly forecast |
| GET /yearly/{user_id} | ✅ Working | AI-generated yearly forecast |
| GET /chart-reading/{user_id} | ✅ NEW | AI-generated Four Pillars reading (8 sections) |

### Mobile App (React Native) - ✅ ALL WORKING
- **Location:** ~/Projects/Bazi/BaziMobileApp (on Mac)
- **Scripts:** ~/Projects/Bazi/scripts
- **Build:** Xcode

| Screen | Status | Notes |
|--------|--------|-------|
| Weekly Forecast | ✅ Working | With ad wall |
| Monthly Forecast | ✅ Working | With ad wall |
| Yearly Forecast | ✅ Working | With ad wall (simplified screen) |

---

## Recent Changes (2026-01-25)

### Backend Changes (Latest)

1. **SECURITY HARDENING - API Protection** - CRITICAL UPDATE:
   - **App Secret Middleware**: All API endpoints now require signed requests
   - **CORS Restricted**: Only allows `https://256ai.xyz`, `http://localhost:8081`, `http://localhost:3000`
   - **Strong Secrets**: JWT and App secrets regenerated with 64-char random strings
   - Files modified:
     - `/home/nazmin/AstrologyApp/middleware/app_secret.py` (new)
     - `/home/nazmin/AstrologyApp/middleware/__init__.py` (new)
     - `/home/nazmin/AstrologyApp/app.py` (added middleware, fixed CORS)
     - `/home/nazmin/AstrologyApp/.env` (new secrets)
   - **⚠️ MOBILE APP MUST BE UPDATED** - See Task 0 below (URGENT)

2. **NEW: AI-Generated Four Pillars Chart Reading** - Complete 8-section personalized reading:
   - Uses Ollama/llama3 to generate warm, personalized interpretations
   - Cached permanently per user (regenerates only if birth date changes)
   - Files created:
     - `/home/nazmin/AstrologyApp/agents/chart_reading_agent.py` (new)
     - `/home/nazmin/AstrologyApp/models/chart_reading.py` (new)
   - Files modified:
     - `/home/nazmin/AstrologyApp/app.py` (added endpoint)
     - `/home/nazmin/AstrologyApp/routers/auth_router.py` (added to prewarm)
   - See Task 3 below for Mac Claude implementation details

2. **Monthly Reading Fix** - Fixed two issues in monthly readings:
   - Removed "Key Weeks to Watch" section (was showing weekly content in monthly)
   - Added "Elemental Influences" section with lucky/challenging elements
   - Files modified:
     - `/home/nazmin/AstrologyApp/agents/narrative_agent.py` (prompts)
     - `/home/nazmin/AstrologyApp/monthly_yearly_endpoints.py` (element calculation)
   - Service restarted and tested - working correctly

2. **Load Testing Complete** - Phase A validation passed:
   - 20 test users created (IDs 5-24)
   - 85 readings generated in 12.7 minutes
   - 100% cache hit rate at ~3ms latency
   - 745 req/s peak throughput at 25 concurrent connections

---

## Changes (2026-01-23)

### Backend Changes
1. **Advisory Locking** - Added PostgreSQL advisory locks to prevent race conditions
   - Yearly: lock_id = user_id + 1,000,000
   - Monthly: lock_id = user_id + 2,000,000
   - File: `/home/nazmin/AstrologyApp/app.py`

2. **Ollama Client Timeout** - 120 second timeout on AI generation
   - File: `/home/nazmin/AstrologyApp/agents/narrative_agent.py`

3. **Multiple Workers** - uvicorn now runs with 4 workers
   - File: `/etc/systemd/system/bazi-app.service`

4. **[your name] Placeholder Fix** - Added post-processing to replace AI-generated placeholders
   - Function: `replace_name_placeholders()` replaces `[your name]`, `[Your Name]`, etc. with actual user name
   - Files: `/home/nazmin/AstrologyApp/agents/narrative_agent.py`, `app.py`, `tasks/scheduler.py`
   - Applied to: Weekly, Monthly, and Yearly readings
   - Note: Deleted cached yearly reading for user 3 (yvette) so new one generates with fix

### Mobile App Changes
1. **Null Safety in forecasts.ts**
   - All parsing functions now handle null/undefined content
   - API functions wrapped in try-catch with mock data fallback
   - File: `src/api/forecasts.ts`

2. **Defensive Rendering in YearlyForecastScreen.tsx**
   - Added conditional rendering for all array maps
   - Added fallback values for month properties
   - File: `src/screens/readings/YearlyForecastScreen.tsx`

---

## Completed Tasks (2026-01-24)

### Mac Claude (Mobile App) - ✅ ALL DONE
- [x] Verify yearly forecast screen loads without crashing
- [x] Test all three forecasts (weekly, monthly, yearly) display AI content
- [x] Check that ads display correctly (ad walls on all 3 screens)

### Windows Claude (Backend) - ✅ ALL DONE
- [x] Advisory locks working (no duplicate key errors)
- [x] [your name] placeholder fix deployed
- [x] Service restarted and verified

## Pending Tasks

### For Mac Claude (Mobile App) - HIGH PRIORITY

#### Task 4: 🆕 Screenshot Mode - Mobile App Implementation

**What is this?**
Screenshot Mode is a dev/testing feature that hides ALL ads for clean app screenshots and testing.

**Backend Status:** ✅ COMPLETE - Windows Claude has added this to the backend

**How it Works:**
1. Admin grants `screenshot_mode` entitlement to a user via Admin Dashboard
2. Mobile app fetches subscription status from `/subscription/status`
3. If `has_screenshot_mode: true`, hide ALL ads throughout the app

**API Endpoint:** `GET /subscription/status?user_id={user_id}`

**Response includes:**
```json
{
  "is_premium": true,
  "has_screenshot_mode": true,  // ← Check this flag
  "has_remove_ads": false,
  ...
}
```

**Implementation Steps:**

1. **Add to subscription/purchase context** - Store `has_screenshot_mode` flag:
   ```typescript
   // In PurchaseContext or wherever subscription state is managed
   const [hasScreenshotMode, setHasScreenshotMode] = useState(false);

   // When fetching subscription status:
   const status = await api.get(`/subscription/status?user_id=${userId}`);
   setHasScreenshotMode(status.has_screenshot_mode);
   ```

2. **Create a hook for checking screenshot mode:**
   ```typescript
   // src/hooks/useScreenshotMode.ts
   export function useScreenshotMode() {
     const { hasScreenshotMode } = usePurchaseContext();
     return hasScreenshotMode;
   }
   ```

3. **Update ad components to check for screenshot mode:**
   ```typescript
   // In any ad component (AdBanner, AdWall, etc.)
   const isScreenshotMode = useScreenshotMode();

   if (isScreenshotMode) {
     return null; // Hide ads completely
   }

   // Normal ad display...
   ```

4. **Optional: Show "Dev Mode" indicator in settings:**
   ```typescript
   {hasScreenshotMode && (
     <View style={styles.devBadge}>
       <Text>📸 Screenshot Mode</Text>
     </View>
   )}
   ```

**Testing:**
1. Grant screenshot_mode to your test user via Admin Dashboard
2. Login as that user
3. Verify ALL ads are hidden throughout the app
4. Verify forecasts still work normally (they should!)

**Files to Modify:**
- `src/purchases/PurchaseContext.tsx` - Add `has_screenshot_mode` to state
- `src/api/subscriptions.ts` - Parse `has_screenshot_mode` from API
- `src/hooks/useScreenshotMode.ts` (create new)
- Ad components that display ads

**No Backend Changes Required** - Backend is ready!

---

#### Task 0: 🚨 URGENT - Add App Signature Headers (REQUIRED FOR API ACCESS)

**Problem:**
- Backend now requires ALL requests to include signature headers
- Without these headers, API returns `{"detail": "Missing app credentials"}`
- **THE APP WILL NOT WORK UNTIL THIS IS IMPLEMENTED**

**What to Implement:**

Every API request must include these two headers:
1. `X-Timestamp` - Current Unix timestamp in seconds
2. `X-App-Signature` - SHA256 hash of `timestamp + APP_SECRET_KEY`

**App Secret Key:**
```
f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30
```
(Store this securely - consider environment variable or config file)

**Implementation Steps:**

1. **Install crypto library** (if not already installed):
   ```bash
   npm install crypto-js
   # or
   npm install react-native-sha256
   ```

2. **Modify `src/api/client.ts`** (or wherever API client is configured):
   ```typescript
   import CryptoJS from 'crypto-js';
   // or: import { sha256 } from 'react-native-sha256';

   const APP_SECRET = 'f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30';

   // Add to all API requests
   function getAppHeaders() {
     const timestamp = Math.floor(Date.now() / 1000).toString();
     const signature = CryptoJS.SHA256(timestamp + APP_SECRET).toString();

     return {
       'X-Timestamp': timestamp,
       'X-App-Signature': signature,
     };
   }

   // Use in axios interceptor or fetch wrapper:
   apiClient.interceptors.request.use((config) => {
     const appHeaders = getAppHeaders();
     config.headers['X-Timestamp'] = appHeaders['X-Timestamp'];
     config.headers['X-App-Signature'] = appHeaders['X-App-Signature'];
     return config;
   });
   ```

**Test Command (from terminal):**
```bash
# This is how the signature is calculated:
timestamp=$(date +%s)
secret="f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30"
sig=$(echo -n "${timestamp}${secret}" | shasum -a 256 | cut -d' ' -f1)
echo "Timestamp: $timestamp"
echo "Signature: $sig"

# Test the API with signature:
curl -H "X-Timestamp: $timestamp" -H "X-App-Signature: $sig" https://256ai.xyz/weekly/2
```

**Verification:**
- Without headers: `{"detail": "Missing app credentials"}` (403)
- With valid headers: Returns the actual reading data (200)

**Security Notes:**
- Timestamp must be within 5 minutes of server time
- Signature is validated server-side against the secret
- This prevents unauthorized API access

---

#### Task 1: ADD Relationship Compatibility Display Section

**Problem:**
- When you add a person in the Relations tab, there is NO section showing the compatibility reading
- The UI for displaying compatibility needs to be ADDED

**Backend Status:** ✅ WORKING - API returns full compatibility data:
```bash
# Test: Add person then get compatibility
curl -X POST 'https://256ai.xyz/api/persons?user_id=2' -H 'Content-Type: application/json' -d '{"name": "Test", "relationship_type": "friend", "birth_date": "1985-06-15"}'
# Returns: person with ID

curl 'https://256ai.xyz/api/relationship/{person_id}?user_id=2'
# Returns: full compatibility with ease_score, durability_score, strengths, watchouts, etc.
```

**Expected API Response:**
```json
{
  "person_id": 6,
  "person_name": "Test Person",
  "relationship_type": "friend",
  "ease_score": 73,
  "durability_score": 74,
  "strengths": ["Day Branch: Trine: shared worldview...", ...],
  "watchouts": [],
  "toxicity": {"index": 0, "level": "Low"},
  "ten_god": {"role": "EatingGod", "interpretation": "..."}
}
```

**Likely Issue:**
- Mobile app might not be calling `/api/relationship/{person_id}` after adding a person
- Or the compatibility display component isn't rendering the data

**What to Build:**
When viewing a person in the Relations tab, show a compatibility card with:
- **Scores**: Ease Score (73), Durability Score (74) - show as gauges or numbers
- **Strengths**: Green list of positive factors (from API `strengths` array)
- **Watchouts**: Yellow/orange list of challenges (from API `watchouts` array)
- **Toxicity**: Show level (Low/Moderate/High/Severe)
- **Ten-God Role**: Show the relationship dynamic (e.g., "EatingGod: Nurturing, expression, pride")

**Files to Check/Modify:**
- `src/screens/relationships/` - relationship screens
- `src/api/relationships.ts` - API calls
- May need to create a `CompatibilityCard.tsx` component

**API Endpoint:** `GET /api/relationship/{person_id}?user_id={user_id}`

**No Backend Changes Required** - API is working correctly.

---

#### Task 2: FIX Elements Reading Card - PERSONALIZED, NOT GENERIC

**Problem with current implementation:**
- Shows ALL elements as "Missing" - that's wrong!
- Shows generic text for every element - not personalized
- It's a "key to elements" not a "reading"

**What we ACTUALLY need:**

The card should analyze the USER'S SPECIFIC element counts and give a PERSONALIZED reading. Example: if user has Wood:0, Fire:2, Earth:5, Metal:0, Water:1, show:

```
┌─────────────────────────────────────────┐
│ Your Element Reading                     │
├─────────────────────────────────────────┤
│                                         │
│ 🌍 DOMINANT: Earth (5)                  │
│ With Earth as your strongest element,   │
│ you are grounded, reliable, and         │
│ practical. You bring stability to       │
│ those around you.                       │
│                                         │
│ 🔥 PRESENT: Fire (2)                    │
│ Fire energy adds warmth and passion     │
│ to your chart, fueling your ambitions.  │
│                                         │
│ 💧 PRESENT: Water (1)                   │
│ A touch of Water gives you intuition    │
│ and adaptability.                       │
│                                         │
│ ⚠️ MISSING: Wood, Metal                 │
│ To balance your chart, consider:        │
│ • Wood: Time in nature, plants, growth  │
│ • Metal: Organization, precision, order │
│                                         │
└─────────────────────────────────────────┘
```

**Logic:**
1. Get element_counts from user profile: `{Wood: 0, Fire: 2, Earth: 5, Metal: 0, Water: 1}`
2. Find DOMINANT (highest count > 0)
3. Find PRESENT (count > 0 but not highest)
4. Find MISSING (count = 0)
5. Show ONLY the relevant sections with personalized interpretations

**DO NOT show all 5 elements with generic text!**
**DO show only what applies to THIS user's chart!**

**Interpretations by element (use these for personalized text):**
- Wood dominant: "Creative, growth-oriented, flexible, visionary"
- Fire dominant: "Passionate, charismatic, energetic, inspiring"
- Earth dominant: "Grounded, reliable, practical, nurturing"
- Metal dominant: "Disciplined, organized, precise, refined"
- Water dominant: "Intuitive, adaptable, wise, reflective"

**File to Modify:** `src/screens/MyChartScreen.tsx`

**No Backend Changes Required** - Use existing element_counts from user profile.

---

#### Task 3: DISPLAY AI-Generated Four Pillars Chart Reading (NEW!)

**What is this?**
A comprehensive, AI-generated personalized reading based on the user's birth chart. This is the "big reading" that adds tons of value - 8 detailed sections covering personality, relationships, career, and more.

**Backend Status:** ✅ COMPLETE AND WORKING

**API Endpoint:** `GET /chart-reading/{user_id}?language=en|zh`

**Test Command:**
```bash
curl 'https://256ai.xyz/chart-reading/2' | python3 -m json.tool
```

**API Response Format:**
```json
{
  "user_id": 2,
  "user_name": "Mark",
  "sections": {
    "core_energy": "Mark, as a Water person with a Day Master of 癸...",
    "element_balance": "As we examine your element distribution...",
    "strengths": "Based on your chart, I've identified these natural talents...",
    "challenges": "Areas for growth include...",
    "relationship_style": "Your chart suggests you're deeply connected to...",
    "work_direction": "Ideal work environments or styles include...",
    "balance_guidance": "To enhance missing elements, I recommend...",
    "closing_summary": "Mark, your BaZi reading reveals a unique blend..."
  },
  "full_content": "## 1. Your Core Energy\n\n...(complete reading)...",
  "language": "en",
  "generated_at": "2026-01-25T04:18:53.256951"
}
```

**8 Sections to Display:**
| Section | Title | Content |
|---------|-------|---------|
| core_energy | Your Core Energy | Day Master personality interpretation |
| element_balance | Your Element Balance | Dominant/missing element analysis |
| strengths | Your Natural Strengths | 3-4 natural talents from chart |
| challenges | Your Growth Areas | 2-3 growth opportunities |
| relationship_style | Your Relationship Style | How they connect in relationships |
| work_direction | Your Work Direction | Career paths and work environments |
| balance_guidance | Bringing Balance | Practical tips (colors, activities, directions) |
| closing_summary | Your Summary | Empowering 2-3 sentence wrap-up |

**Where to Display:**
This should be a new screen or card accessible from "My Chart" tab. Consider:
- A prominent card on MyChartScreen that links to full reading
- OR a dedicated "My Reading" screen in the navigation
- OR accordion/expandable sections showing one section at a time

**UI Design Suggestions:**
1. **Header Card**: Show "Your Four Pillars Reading" with a nice banner
2. **Section Cards**: Each section as a card with:
   - Icon matching the section theme
   - Bold section title
   - Formatted text content (supports markdown-style bullet points)
3. **Reading Time**: Add "~8 min read" indicator since it's comprehensive
4. **Language Toggle**: Allow switching between EN/ZH

**Files to Create/Modify:**
- Create: `src/api/chartReading.ts` - API call to fetch chart reading
- Create: `src/screens/readings/ChartReadingScreen.tsx` - Full reading display
- Modify: `src/screens/MyChartScreen.tsx` - Add link/card to access reading

**Sample API Function:**
```typescript
// src/api/chartReading.ts
export async function getChartReading(userId: number, language: string = 'en') {
  const response = await apiClient.get(`/chart-reading/${userId}?language=${language}`);
  return response.data;
}
```

**Caching Notes:**
- This reading is generated ONCE and cached forever (until birth date changes)
- First request may take 20-30 seconds while AI generates
- Subsequent requests return cached version instantly (~3ms)
- Show loading spinner with encouraging message on first load

**No Backend Changes Required** - Endpoint is complete and tested.

---

### For Both
- [ ] Prepare for App Store submission
- [ ] Test placeholder fix on yvette's yearly reading (should regenerate with her name)

---

## API Response Formats

### Weekly Response
```json
{
  "user_id": 1,
  "user_name": "Test User",
  "week_start": "2026-01-19",
  "week_end": "2026-01-25",
  "content": "AI generated weekly reading...",
  "language": "en",
  "llm_provider": "ollama",
  "generated_at": "2026-01-23T..."
}
```

### Monthly Response
```json
{
  "user_id": 1,
  "user_name": "Test User",
  "month_start": "2026-01-01",
  "month_end": "2026-01-31",
  "month_name": "January",
  "year": 2026,
  "content": "AI generated monthly reading...",
  "language": "en",
  "llm_provider": "ollama",
  "generated_at": "2026-01-23T..."
}
```

### Yearly Response
```json
{
  "user_id": 1,
  "user_name": "Test User",
  "year": 2026,
  "content": "AI generated yearly reading...",
  "language": "en",
  "llm_provider": "ollama",
  "generated_at": "2026-01-23T..."
}
```

### Chart Reading Response (NEW)
```json
{
  "user_id": 1,
  "user_name": "Test User",
  "sections": {
    "core_energy": "As a Water person, your fundamental nature...",
    "element_balance": "Your element distribution shows...",
    "strengths": "Natural talents include...",
    "challenges": "Growth opportunities include...",
    "relationship_style": "In relationships, you...",
    "work_direction": "Career paths that suit you...",
    "balance_guidance": "To balance your chart...",
    "closing_summary": "Your BaZi reveals..."
  },
  "full_content": "Complete reading with all sections...",
  "language": "en",
  "generated_at": "2026-01-25T..."
}
```

---

## Known Issues & Solutions

### Issue: Yearly forecast crashes app
**Cause:** Arrays (yearlyThemes, monthlyOutlook) could be undefined
**Solution:** Added conditional rendering `{array && array.length > 0 && ...}`

### Issue: Race condition with multiple users
**Cause:** Two requests could try to generate same reading simultaneously
**Solution:** PostgreSQL advisory locks before generation

### Issue: Server hangs during AI generation
**Cause:** Single uvicorn worker blocked during 60s+ Ollama call
**Solution:** 4 uvicorn workers + 120s timeout on Ollama client

### Issue: "[your name]" placeholder in AI output
**Cause:** Ollama/llama3 generates sign-offs like "Warm regards, [your name]" as a letter template
**Solution:** Added `replace_name_placeholders()` function that post-processes AI output to replace common placeholder patterns with the actual user name

---

## Quick Commands

### Backend (Windows Claude runs via SSH)
```bash
# Check service status
ssh nazmin@10.0.1.76 "systemctl status bazi-app"

# View logs
ssh nazmin@10.0.1.76 "journalctl -u bazi-app -n 50"

# Test endpoint
ssh nazmin@10.0.1.76 "curl -s http://localhost:8000/yearly/1 | head -c 500"

# Restart service (needs sudo or pkill)
ssh nazmin@10.0.1.76 "pkill -f uvicorn"
```

### Mobile App (Mac Claude)
```bash
# Navigate to project
cd ~/Projects/Bazi/BaziMobileApp

# Install pods
cd ios && pod install && cd ..

# Open Xcode
open ios/BaziMobileApp.xcworkspace

# Build: Cmd+Shift+K (clean), Cmd+R (run)
```

---

## Communication Protocol

When one Claude makes changes that affect the other:

1. **Update this file** with what changed
2. **Note the file paths** that were modified
3. **Include test commands** to verify the change
4. **Mark status** as pending/working/broken

---

## Contact Points

| System | IP | Access |
|--------|-----|--------|
| Backend Server | 10.0.1.76 | SSH as nazmin |
| Mac Build Machine | 10.0.0.143 | SSH as marklombardi |
| Ollama AI Server | 10.0.1.147 | HTTP port 11434 |
| Public API | 256ai.xyz | HTTPS |
