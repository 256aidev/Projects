# MyEmpire: Kingpin — Web Architecture

A mobile-first browser tycoon game built with React + TypeScript + Vite.
Players run a cannabis grow operation, launder money through front businesses,
manage heat, and expand across city districts.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 7 |
| State | Zustand 5 (with `persist` middleware) |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Auth (Google Sign-In) |
| Cloud save | Firebase Firestore |
| Sound | 256ai Sound Engine (FastAPI @ 10.0.1.147:5200) → static WAV files |

---

## Project Structure

```
src/
├── main.tsx                 React entry point
├── App.tsx                  Root component — view routing, cloud sync, music init
├── firebase.ts              Firebase app + Auth + Firestore init
│
├── data/                    Static game data (never mutated at runtime)
│   ├── types.ts             All TypeScript interfaces + balance constants
│   ├── businesses.ts        BusinessDef array + BUSINESS_MAP lookup
│   ├── districts.ts         DistrictDef array + DISTRICT_MAP lookup
│   └── resources.ts         ResourceDef array + RESOURCE_MAP lookup
│
├── engine/                  Pure calculation functions (no React, no state)
│   ├── economy.ts           Tick logic, launder math, harvest calc, formatters
│   ├── heat.ts              Heat level tiers + police event logic
│   └── sound.ts             SoundEngine class — plays WAV SFX + loops music
│
├── store/                   Zustand stores — all mutable runtime state
│   ├── gameStore.ts         Main game state + 26 actions (see below)
│   ├── authStore.ts         Firebase user, sign-in/out, cloud sync
│   ├── uiStore.ts           Active view, panels, overlays, notifications
│   └── cloudSave.ts         Firestore read/write helpers
│
├── hooks/
│   └── useGameTick.ts       setInterval(1000ms) → calls gameStore.tick()
│
└── components/
    ├── auth/
    │   ├── LoginScreen.tsx  Guest / Google sign-in gate
    │   └── AccountScreen.tsx Bottom sheet: user info, stats, sign out
    ├── layout/
    │   ├── HUD.tsx          Top bar: dirty cash, clean cash, inventory, mute
    │   └── NavBar.tsx       Bottom tabs: Operation / City / Warehouse / Legal
    ├── city/
    │   ├── CityMap.tsx      District slot grid
    │   ├── BuildingLot.tsx  Single lot tile
    │   └── DistrictSelector.tsx
    ├── operation/
    │   └── OperationView.tsx Grow rooms, dealers, seeds, auto-harvest
    ├── panels/
    │   ├── BuyBusinessPanel.tsx  Purchase a front business
    │   ├── BuildingMenu.tsx      Manage / upgrade an owned business
    │   └── ResourceMarketPanel.tsx Buy supplies
    ├── warehouse/
    │   └── WarehouseView.tsx  Inventory management
    ├── legal/
    │   └── LegalView.tsx      Lawyer hire / heat reduction
    └── ui/
        ├── CannabisLeaf.tsx   Neon SVG icon component
        └── Notifications.tsx  Toast notification overlay

public/
└── sounds/                  Pre-generated WAV files (via 256ai Sound Engine)
    ├── notify_success.wav
    ├── notify_warning.wav
    ├── plant.wav
    ├── harvest.wav
    ├── cash.wav
    ├── buy.wav
    ├── dealer_hire.wav
    └── bg_lofi.wav
```

---

## Game Loop

```
useGameTick (hook)
  └─ setInterval(1000ms)
       └─ gameStore.tick()
            ├─ tickCriminalOperation(op)       ← engine/economy.ts
            │    ├─ Dealers sell product → dirty cash earned
            │    ├─ Grow timers decrement on all slots
            │    └─ Auto-harvest: collect + replant if enabled + seeds available
            ├─ For each BusinessInstance:
            │    ├─ calculateLaunderTick()     ← dirty → clean conversion
            │    └─ calculateBusinessRevenue() ← legit clean income
            ├─ Update dirtyCash, cleanCash, heat
            └─ lastTickDirtyProfit / lastTickCleanProfit → HUD sparkline
```

---

## State Architecture

### gameStore (Zustand + localStorage persist, version 7)

**Shape:**
```typescript
{
  dirtyCash, cleanCash              // current wallets
  totalDirtyEarned, totalCleanEarned, totalSpent   // lifetime stats
  heat                              // 0–100, triggers police events
  operation: CriminalOperation      // entire grow op state
  businesses: BusinessInstance[]    // front businesses
  unlockedDistricts: string[]
  inventory: Record<string, number> // supply resources
  storageCapacity: number
  activeLawyerId: string | null
  tickCount: number
  lastTickDirtyProfit, lastTickCleanProfit
}
```

**Key actions:**
| Action | Description |
|---|---|
| `tick()` | Main game loop — called every second |
| `plantSeeds(roomId, slotIndex)` | Start grow timer (reads canonical timer from GROW_ROOM_TYPE_MAP) |
| `harvestGrowRoom(roomId, slotIndex)` | Collect yield, optionally replant |
| `buyAutoHarvest(roomId)` | Enable auto-harvest for a room |
| `buySeed(qty)` | Deduct dirty cash (reads canonical price from INITIAL_OPERATION) |
| `hireDealers(count)` | Add dealers for current tier |
| `upgradeDealerTier()` | Advance to next dealer tier |
| `purchaseBusiness(defId, districtId, slot)` | Buy a front business |
| `upgradeBusiness(instanceId)` | Tier up a business |
| `resetGame()` | Wipe save and start fresh |

**Canonical values pattern:**
Saved localStorage data can become stale across game balance updates. To avoid
needing migration every time a value changes, actions always read balance
constants from the canonical definition maps at action time:
- `plantSeeds` → `GROW_ROOM_TYPE_MAP[typeId].strainSlots[i].growTimerTicks`
- `buySeed` → `INITIAL_OPERATION.seedCostPerUnit`

### authStore
Firebase Auth state. Handles Google sign-in, guest mode, and cloud sync.
Guest users get `uid = 'guest'` — state is localStorage-only.

### uiStore
Ephemeral UI state: active view, open panels, overlay flags, notification queue.
`addNotification()` also triggers the appropriate SFX via `sound.play()`.

---

## Two-Currency Economy

```
Criminal Operation
  └─ Grow rooms produce product (oz)
  └─ Dealers sell product → DIRTY CASH

Dirty Cash
  └─ Front Businesses launder it → CLEAN CASH
  └─ Heat increases as dirty cash flows

Clean Cash
  └─ Used to buy businesses, upgrades, lawyers
```

---

## Sound System

**Source:** 256ai Sound Engine (FastAPI @ `http://10.0.1.147:5200`)
**Endpoints used:** `/generate/sfx`, `/generate/music`
**Model:** MusicGen (facebook/musicgen-small) + Kokoro TTS (unused in-game)

Sounds are pre-generated and shipped as static WAV files in `public/sounds/`.
The in-game `SoundEngine` class (`src/engine/sound.ts`) uses `HTMLAudioElement`
pools for zero-latency SFX playback and a single looping `<audio>` for music.

**Sound events:**
| Event | File | Triggered by |
|---|---|---|
| Notification success | notify_success.wav | `uiStore.addNotification(..., 'success')` |
| Notification warning | notify_warning.wav | `uiStore.addNotification(..., 'warning')` |
| Plant seed | plant.wav | Plant button in OperationView |
| Harvest | harvest.wav | Harvest button in OperationView |
| Buy seeds | buy.wav | Buy seeds button in OperationView |
| Hire dealer | dealer_hire.wav | Hire dealer button in OperationView |
| Background music | bg_lofi.wav | First click/touch on App root |

Mute is toggled via the 🔊/🔇 button in the HUD. Preference persists in
`localStorage` as `myempire-muted`.

---

## Save System

| Layer | Mechanism | Scope |
|---|---|---|
| Local | Zustand `persist` → `localStorage['myempire-save']` | Always |
| Cloud | Firestore doc `saves/{uid}` | Signed-in users only |
| Auto-sync | Every 60 game ticks (≈ 1 min) via `useEffect` in App.tsx | Signed-in users |
| Manual sync | On sign-out | Signed-in users |

Cloud save serializes the full `GameState` snapshot and merges it on load via
`cloudSave.ts`. Guest saves are local-only and lost on browser clear.

---

## Key Data Files

### src/data/types.ts
Single source of truth for all game balance. Contains:
- `GROW_ROOM_TYPE_DEFS` — 5 grow rooms (Closet → Grow Facility), each with strain slots, costs, capacities
- `DEALER_TIERS` — 5 tiers (Corner Boys → Regional Cartel)
- `WATER_TIERS` / `LIGHT_TIERS` — 4 upgrade tiers each
- `INITIAL_OPERATION` — starting state (canonical seed price, starting room)
- `INITIAL_GAME_STATE` — starting wallet ($500 dirty, $1500 clean)

### src/data/businesses.ts
~20 front business types (Car Wash, Pizza Shop, Nightclub, etc.) each with:
base launder capacity, base revenue, upgrade tier multipliers, district affinity.

### src/data/districts.ts
6 city districts, each with a revenue/launder multiplier and unlock cost.

---

## Adding New Features

**New game balance value:** Add to `types.ts` constants. Read at action time
from the canonical constant (never from saved state) to avoid migration issues.

**New sound:** Generate via `POST http://10.0.1.147:5200/generate/sfx`, copy
WAV to `public/sounds/`, add key to `SoundKey` union and `SOUND_PATHS` in
`src/engine/sound.ts`, call `sound.play('your_key')` at the right event.

**New view/screen:** Add to `ViewName` in `uiStore.ts`, add tab in `NavBar.tsx`,
render conditionally in `App.tsx`.
