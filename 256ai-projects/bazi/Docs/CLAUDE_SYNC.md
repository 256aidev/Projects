# Claude Sync File - BaZi App Development

> **Last Updated:** 2026-01-30 UTC
> **Purpose:** Keep Windows Claude (backend) and Mac Claude (mobile app) in sync
> **Doc Location:** ~/Projects/Bazi/Docs/

---

## 🆕 NEW - Person API Now Returns Full Chart (2026-01-28)

### Windows Claude Implemented:

**Request from Mac Claude:** Return full Four Pillars data in Person API

**API Response Now Includes:**
```json
{
  "id": 1,
  "name": "Alex",
  "year_pillar": "甲子",
  "month_pillar": "甲戌",
  "day_pillar": "丁酉",
  "hour_pillar": "庚午",
  "day_master": "丁",
  "day_master_element": "Fire",
  "day_master_polarity": "Yin",
  "element_counts": {
    "Wood": 2,
    "Fire": 2,
    "Earth": 1,
    "Metal": 2,
    "Water": 1
  },
  "confidence_percent": 100
}
```

### Mac Claude Action Required:
1. Update `src/api/relationships.ts` - Person interface with new fields
2. Update `RelationshipDetailScreen` to show Four Pillars and Element Balance
3. Deploy and test

---

## ✅ COMPLETED - Display Score Curve (2026-01-28)

**Purpose:** Make strong BaZi matches visually reach deep green without altering raw math.

**API Response Includes:**
- `ease_score` / `durability_score` - Raw scores (internal math)
- `display_ease` / `display_durability` - Display scores (visual/UI)
- `display_label` - Label based on display score
- `deep_green_eligible` - Passed gate conditions

**Display Curve:**
- Raw < 55: unchanged
- Raw 55-70: +0 to +4.5
- Raw 70-85: +4 to +13
- Raw 85+: cap at 100

**Deep Green Gate (2 of 5 required):**
1. Day branch COMBINE or TRINE
2. Day stem GENERATING
3. Positive Ten-God
4. No CLASH on day palace
5. Confidence >= 85%

---

## ✅ COMPLETED - CompatibilitySpectrumChart Component (2026-01-27)

**Component:** `src/components/CompatibilitySpectrumChart.tsx`
- Visual spectrum: Toxic → Poor → Challenging → Mixed → Strong → Excellent
- Accepts `displayEase` and `displayDurability` for visual position
- Raw scores shown as numbers, display scores for marker

---

## ✅ COMPLETED - Screenshot Mode Uses Backend Flag

Screenshot Mode controlled via Admin Dashboard, not hardcoded emails.

---

## Current System Status

### Backend (Linux 10.0.1.76) - ✅ WORKING
- **API Base:** https://256ai.xyz
- **Database:** PostgreSQL
- **Ollama:** http://10.0.1.147:11434

### Test Results (Alex spouse):
- Raw: 70/70 → Display: 74/74
- Deep Green Eligible: true

---

## Contact Points

| System | IP | Access |
|--------|-----|--------|
| Backend Server | 10.0.1.76 | SSH as nazmin |
| Mac Build Machine | 10.0.0.143 | SSH as marklombardi |
| Ollama AI Server | 10.0.1.147 | HTTP port 11434 |
| Public API | 256ai.xyz | HTTPS |
# Mac Claude Sync Update (2026-01-29)

## Add this section to ~/projects/bazi/docs/CLAUDE_SYNC.md

---

## 2026-01-29: Effort-Based Language Reframe

### Summary
Relationship labels reframed from judgment ("Toxic", "Poor") to effort-based language ("High-Effort Relationship", "Growth-Focused"). This is a **presentation-only change** - no scoring math was modified.

### New Label Mapping
| Score | Old Label | New Label |
|-------|-----------|-----------|
| 80-100 | Excellent | Low-Friction Dynamic |
| 65-79 | Strong | Stable with Awareness |
| 50-64 | Mixed | Workable with Intention |
| 35-49 | Poor | Growth-Focused |
| 0-34 | Toxic | High-Effort Relationship |

### Backend Changes (Already Deployed)
**File:** `engines/relationship_engine.py`
- Added `EFFORT_LABELS`, `EFFORT_FRAMING`, `QUADRANT_LABELS`, `STANDARD_DISCLAIMER`
- Added `get_effort_label()`, `get_effort_framing()`, `get_quadrant_interpretation()`
- Updated `CompatibilityResult` dataclass with new fields

**File:** `routers/relationship_router.py`
- API now returns: `effort_label`, `effort_framing`, `quadrant_interpretation`, `disclaimer`
- `display_label` field now contains effort-based label (backward compat)

### Frontend Changes (Need to Sync to Mac)

**NEW FILE: `src/components/RelationshipGridChart.tsx`**
- 2D grid chart showing Ease (X) × Durability (Y)
- Neutral quadrant backgrounds (no alarming colors)
- Marker dot colored by effort label
- Quadrant labels: "Easy + Stable", "Stable but Effortful", etc.

**MODIFIED: `src/types/family.ts`**
Added to `CompatibilityReading` interface:
```typescript
effort_label?: string;
effort_framing?: string;
quadrant_interpretation?: string;
disclaimer?: string;
```

**MODIFIED: `src/screens/family/FamilyMemberDetailScreen.tsx`**
- Import changed from `CompatibilitySpectrumChart` to `RelationshipGridChart`
- Added framing and disclaimer display sections
- Added new styles: `framingContainer`, `framingText`, `disclaimerContainer`, `disclaimerText`

**MODIFIED: `src/components/CompatibilitySpectrumChart.tsx`**
- Marked as `@deprecated`
- Updated SCORE_ZONES labels to effort-based (in case used elsewhere)

### Files to Copy from Windows to Mac
1. `src/components/RelationshipGridChart.tsx` (NEW)
2. `src/types/family.ts` (MODIFIED)
3. `src/screens/family/FamilyMemberDetailScreen.tsx` (MODIFIED)
4. `src/components/CompatibilitySpectrumChart.tsx` (MODIFIED)
5. `CLAUDE_CONTEXT.md` (MODIFIED)

### Forbidden Terms (Never Use)
These words must NOT appear in user-facing text:
- "toxic"
- "poor"
- "bad"
- "incompatible"
- "destined"
- "doomed"

---

## Commands to Sync (when Mac is online)

From Windows, run:
```bash
# Copy frontend files to Mac
scp "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\components\RelationshipGridChart.tsx" "mark lombardi"@10.0.0.143:~/projects/bazi/BaziMobileApp/src/components/
scp "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\types\family.ts" "mark lombardi"@10.0.0.143:~/projects/bazi/BaziMobileApp/src/types/
scp "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\screens\family\FamilyMemberDetailScreen.tsx" "mark lombardi"@10.0.0.143:~/projects/bazi/BaziMobileApp/src/screens/family/
scp "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\src\components\CompatibilitySpectrumChart.tsx" "mark lombardi"@10.0.0.143:~/projects/bazi/BaziMobileApp/src/components/
scp "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp\CLAUDE_CONTEXT.md" "mark lombardi"@10.0.0.143:~/projects/bazi/BaziMobileApp/
```

---

## 2026-01-30: Relationship Tab UX Restructure (CEO Spec)

### Summary
Complete UX restructure of the Relationship Tab per CEO directive. **Presentation-only changes** - no scoring math modified.

### Key Changes
1. **Lead with 2D Ease × Durability chart**, not numeric scores
2. **Added "Today's Relationship Focus"** behind ad wall
3. **De-emphasized numeric scores** (smaller, muted, secondary)
4. **Added relationship disclaimer** about personal choices
5. **Removed all forbidden terms** from UI

### New Layout Structure
```
┌─────────────────────────────────────┐
│   [Effort Label Badge - Primary]    │
│   "Low-Friction Dynamic"            │
├─────────────────────────────────────┤
│   [Effort Framing - Guidance]       │
│   "This relationship has..."        │
├─────────────────────────────────────┤
│   ┌─────────────────────────────┐   │
│   │    2D GRID CHART            │   │
│   │    Y=Durability             │   │
│   │           ●                 │   │
│   │    X=Ease                   │   │
│   └─────────────────────────────┘   │
├─────────────────────────────────────┤
│   [Scores - De-emphasized]          │
│   72 Ease  |  68 Durability         │
├─────────────────────────────────────┤
│  🔒 Today's Relationship Focus      │
│   [Watch Ad to Unlock]              │
├─────────────────────────────────────┤
│   Relationship Insights             │
│   [Strengths / Watch-Outs]          │
├─────────────────────────────────────┤
│   [Ten God / Quadrant Interp]       │
├─────────────────────────────────────┤
│   Weekly/Monthly/Yearly Forecasts   │
├─────────────────────────────────────┤
│   ⚖️ Disclaimer                     │
│   "Insights describe tendencies..." │
├─────────────────────────────────────┤
│   🗑️ Delete Family Member           │
└─────────────────────────────────────┘
```

### Frontend Changes

**MODIFIED: `src/components/RelationshipGridChart.tsx`**
- Added `effortFraming` prop for actionable guidance text
- Layout restructured: Label Badge → Framing → Grid → Scores → Guide
- Scores de-emphasized (opacity: 0.7, smaller font)
- Removed "What this means" title, simplified to inline guide

**MODIFIED: `src/types/family.ts`**
Added to `CompatibilityReading` interface:
```typescript
// New Ease × Durability scores
ease_score?: number;
durability_score?: number;
display_ease?: number;
display_durability?: number;
// Effort-based labels (user-facing)
effort_label?: string;
effort_framing?: string;
quadrant_interpretation?: string;
// Additional metadata
toxicity_index?: number;
toxicity_level?: string;
confidence_percent?: number;
confidence_level?: string;
strengths?: string[];
watchouts?: string[];
ten_god_role?: string;
ten_god_interpretation?: string;
```

Added new interface:
```typescript
export interface DailyRelationshipReading {
  user_id: number;
  partner_id: number;
  date: string;
  content: string;
  generated_at: string;
}
```

**MODIFIED: `src/screens/family/FamilyMemberDetailScreen.tsx`**
- Added imports: `RelationshipGridChart`, `DailyRelationshipReading`
- Added `RELATIONSHIP_DISCLAIMER` constant
- Added state: `dailyReading`, `isDailyUnlocked`, `isLoadingDaily`
- Added `unlockDailyReading()` with interstitial ad wall
- Added `generateDailyRelationshipContent()` with day-of-week tips
- Layout restructured per diagram above
- Added new styles: `dailyFocusSection`, `insightsSection`, `disclaimerContainer`

### Files to Copy (Updated List)
```bash
# From Windows to Mac
scp "I:\2026CodeProjects\BaZi\BaziMobileApp\src\components\RelationshipGridChart.tsx" marklombardi@10.0.0.143:~/projects/bazi/BaziMobileApp/src/components/
scp "I:\2026CodeProjects\BaZi\BaziMobileApp\src\types\family.ts" marklombardi@10.0.0.143:~/projects/bazi/BaziMobileApp/src/types/
scp "I:\2026CodeProjects\BaZi\BaziMobileApp\src\screens\family\FamilyMemberDetailScreen.tsx" marklombardi@10.0.0.143:~/projects/bazi/BaziMobileApp/src/screens/family/
```

### Ad Wall Integration
"Today's Relationship Focus" uses existing `interstitialManager`:
```typescript
import { interstitialManager } from '../../utils/ads/InterstitialManager';

const unlockDailyReading = async () => {
  const adShown = await interstitialManager.showInterstitialAd('relationship_daily_reading');
  if (adShown) {
    setIsDailyUnlocked(true);
    generateDailyRelationshipContent();
  }
};
```

### Forbidden Terms Audit
Verified NO forbidden terms in user-facing UI:
- ❌ "toxic" → ✅ "High-Effort Relationship"
- ❌ "poor" → ✅ "Growth-Focused"
- ❌ "bad" → ✅ (removed)
- ❌ "incompatible" → ✅ (removed)
- ❌ "destined" → ✅ (removed)
- ❌ "doomed" → ✅ (removed)

### Disclaimer Text
```
"These compatibility insights describe tendencies based on BaZi patterns,
not predictions of relationship success. Every relationship can thrive
with awareness, communication, and mutual effort. Use this as a guide
for understanding, not as a judgment of your connection."
```

---

## 2026-01-30: Product Architecture Restructure (In Progress)

### Summary
Major tab restructure per CEO-approved Product Architecture. Windows Claude is creating navigation + screens.

### New Tab Structure
```
Old: Readings | Profile | Calendar | Settings
New: You (🧍) | Relationships (❤️) | World (☯) | Settings (⚙)
```

### Files Being Created on Windows (Will need sync)

**Navigation:**
- `src/navigation/YouStack.tsx` - NEW
- `src/navigation/RelationshipsStack.tsx` - NEW
- `src/navigation/WorldStack.tsx` - NEW
- `src/navigation/MainTabs.tsx` - MODIFIED

**Screens:**
- `src/screens/main/YouScreen.tsx` - NEW (combines Readings + Profile)
- `src/screens/main/ReadingHistoryScreen.tsx` - NEW (from Calendar)
- `src/screens/relationships/RelationshipsScreen.tsx` - NEW
- `src/screens/world/WorldScreen.tsx` - NEW
- `src/screens/world/ElementsScreen.tsx` - NEW
- `src/screens/world/AnimalsScreen.tsx` - NEW
- `src/screens/world/EcosystemScreen.tsx` - NEW

**Components:**
- `src/components/BaZiIntelligenceCard.tsx` - NEW
- `src/data/dayMasterIntelligence.ts` - NEW (10 Day Master profiles)

### Mac Claude Tasks (Can Start Now)

1. **Review RelationshipGridChart** - Already synced, confirm working
2. **Prepare FamilySection** - May need extraction to standalone screen
3. **Test existing compatibility flow** - Ensure Ease×Durability works
4. **Check interstitialManager imports** - May vary between components

### Architecture Document
See `Docs/PRODUCT_ARCHITECTURE.md` for full spec.

---
