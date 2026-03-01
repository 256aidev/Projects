# Claude Context - BaZi Mobile App

This document provides context for Claude AI to quickly understand the codebase after disconnection or session breaks.

---

## App Summary

**BaZi Mobile App** is a React Native app that provides personalized Chinese astrology readings based on the user's Four Pillars of Destiny (BaZi). Users enter their birth data, and the app calculates their pillars and generates AI-powered readings.

---

## Current State (January 2026)

### NEW 4-Tab Architecture (CEO Approved)

```
┌──────────┬──────────────┬──────────┬──────────┐
│   You    │ Relationships│  World   │ Settings │
│    🧍    │      ❤️      │    ☯     │    ⚙     │
└──────────┴──────────────┴──────────┴──────────┘
```

**Tab 1 - You (🧍):** Personal readings, Day Master, BaZi Intelligence, Forecasts, Reading History
**Tab 2 - Relationships (❤️):** Family members, compatibility, add Partner/Child/Parent/Sibling/Friend
**Tab 3 - World (☯):** Educational content - Elements, Animals, Ecosystem
**Tab 4 - Settings (⚙):** Account, preferences, premium

### What Works
- Full authentication flow (email, Google, Apple)
- User registration with birth data
- Four Pillars calculation (via backend)
- Daily readings display
- Day Master display
- Weekly/Monthly/Yearly forecasts (ad-gated)
- Family member management
- Compatibility readings (Ease × Durability grid)
- Banner and interstitial ads
- World tab educational content

### In Progress
- **BaZi Intelligence display** - Component exists, needs to be added to YouScreen
- Backend support for 'sibling' and 'friend' relationship types

---

## IMMEDIATE TASKS FOR MAC CLAUDE

### Task 1: Add BaZi Intelligence to YouScreen

The `BaZiIntelligenceCard` component exists at `src/components/BaZiIntelligenceCard.tsx` but is NOT displayed yet.

**Edit `src/screens/main/YouScreen.tsx`:**

1. Add import:
```typescript
import { BaZiIntelligenceCard } from '../../components/BaZiIntelligenceCard';
```

2. Add BEFORE the Forecasts section (around line 277):
```tsx
        {/* BaZi Intelligence */}
        {profile?.day_master && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your BaZi Intelligence</Text>
            <Text style={styles.intelligenceSubtitle}>
              How you naturally process, decide, and respond
            </Text>
            <BaZiIntelligenceCard dayMaster={profile.day_master} />
          </View>
        )}
```

3. Add style:
```typescript
  intelligenceSubtitle: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12,
    fontStyle: 'italic',
  },
```

### Task 2: Verify Relationships Tab

Should have buttons for: Partner, Child, Parent, Sibling, Friend

### Task 3: Build and Test
```bash
cd ~/BaziMobileApp
npx react-native start --reset-cache
npx react-native run-ios
```

---

## Key Files Reference

### Navigation (NEW STRUCTURE)
| File | Purpose |
|------|---------|
| `src/navigation/MainTabs.tsx` | Bottom tab navigator (4 tabs) |
| `src/navigation/YouStack.tsx` | You tab stack |
| `src/navigation/RelationshipsStack.tsx` | Relationships tab stack |
| `src/navigation/WorldStack.tsx` | World tab stack |

### Screens
| File | Purpose |
|------|---------|
| `src/screens/main/YouScreen.tsx` | Combined readings + profile + BaZi Intelligence |
| `src/screens/relationships/RelationshipsScreen.tsx` | Family members list + add buttons |
| `src/screens/world/WorldScreen.tsx` | Educational hub |
| `src/screens/world/ElementsScreen.tsx` | Five Elements education |
| `src/screens/world/AnimalsScreen.tsx` | Twelve Animals education |
| `src/screens/world/EcosystemScreen.tsx` | 256ai app ecosystem |

### Components
| File | Purpose |
|------|---------|
| `src/components/BaZiIntelligenceCard.tsx` | Cognitive style card by Day Master |
| `src/components/ads/AdBanner.tsx` | Banner ad component |
| `src/components/ads/InterstitialManager.ts` | Interstitial ad singleton |
| `src/components/ads/AdGatedAccessManager.ts` | Manages ad-gated content access |

### Data
| File | Purpose |
|------|---------|
| `src/data/dayMasterIntelligence.ts` | Cognitive profiles for 10 Day Masters |

### Types
| File | Purpose |
|------|---------|
| `src/types/index.ts` | Core types: User, Reading, Auth |
| `src/types/family.ts` | FamilyRelationship: spouse/partner/child/parent/sibling/friend |

---

## Code Patterns

### Color Constants
- Primary: `#8B4513` (Saddle Brown)
- Background: `#FDF5E6` (Cream)
- Accent: `#D4A574` (Gold)
- Dark text: `#5D3A1A`
- Muted text: `#8B7355`

### Auth Access
```typescript
const { user, isLoading, isAuthenticated, logout } = useAuth();
```

### Ad-Gated Content Pattern
```typescript
import { adGatedAccessManager } from '../../components/ads';
import { interstitialManager } from '../../components/ads';

// Check if unlocked
if (adGatedAccessManager.isUnlocked('weekly')) {
  // Navigate directly
} else {
  // Show ad first
  await interstitialManager.showAd();
  adGatedAccessManager.unlock('weekly');
}
```

---

## Backend API

**Linux Server:** 10.0.1.76 (uvicorn)
**API Base:** https://256ai.xyz

### Family Endpoints
- `GET /users/{userId}/family` - List family members
- `POST /users/{userId}/family` - Add family member
- `GET /compatibility/{userId}/{memberId}` - Compatibility reading

**Note:** Backend needs update to accept 'sibling' and 'friend' relationship types.

---

## Forbidden Language (Product Doctrine)

Never use in UI:
- "toxic" / "toxicity"
- "poor compatibility"
- "bad match"
- "incompatible"
- "destined" / "doomed"
- "red flag"

Use instead: effort-based language (Low-Friction, Workable with Intention, Growth-Focused, High-Effort)

---

## Recent Changes

### 2026-01-30
- Restructured to 4-tab architecture (You, Relationships, World, Settings)
- Added Sibling and Friend relationship types
- Changed "Spouse" display to "Partner"
- Added BaZi Intelligence content for all 10 Day Masters
- Created World tab with Elements, Animals, Ecosystem screens
- Added AD labels and descriptions to forecast buttons
