# MyEmpire: Kingpin — Architecture Guide

This document explains how the game engine is organized so future developers (or Claude instances) can navigate, modify, and extend it without breaking things.

---

## Engine Type: Tick-Based State Machine

The game runs on a synchronous tick loop. Every 625-1000ms (depending on game speed), `tick()` runs all game systems in order and produces a new state. React re-renders from state changes via Zustand selectors.

```
setInterval (useGameTick.ts)
  → gameStore.tick()
    → for each system in GAME_SYSTEMS:
        system(tickState, context)
    → return new state → React re-renders
```

---

## File Structure

```
src/
├── data/              # Pure data definitions (no logic)
│   ├── types.ts       # Core interfaces, constants, INITIAL_GAME_STATE
│   ├── businesses.ts  # Business definitions (BUSINESS_MAP)
│   ├── districts.ts   # District & city layout definitions
│   ├── carDefs.ts     # Car definitions + getCarBonuses()
│   ├── currencies.ts  # Currency definitions (dirty/clean)
│   ├── theme.ts       # Game theme labels/icons (for re-skinning)
│   ├── techDefs.ts    # Prestige tech upgrade definitions
│   ├── sessionTechDefs.ts # Per-run tech definitions
│   ├── rivals.ts      # Rival generation
│   ├── resources.ts   # Supply chain resources
│   ├── lawyers.ts     # Lawyer definitions
│   ├── tutorial.ts    # Tutorial step definitions
│   ├── events/        # 400 random events (types, life, criminal, business, vice)
│   └── ...
│
├── engine/            # Pure game logic functions (no state, no UI)
│   ├── economy.ts     # Income, laundering, harvesting, dealer math
│   ├── heat.ts        # Police + rival heat calculations
│   ├── rivals.ts      # Rival AI tick, attacks, defense
│   ├── events.ts      # Event triggering, resolution, buffs
│   ├── tech.ts        # Prestige tech bonus aggregation
│   ├── sessionTech.ts # Session tech bonus aggregation
│   ├── difficulty.ts  # Difficulty multiplier for leaderboard
│   ├── sound.ts       # Audio engine
│   └── systems/       # ★ MODULAR TICK PIPELINE
│       ├── types.ts       # TickState, TickContext, GameSystem interface
│       ├── registry.ts    # Ordered list of all systems
│       ├── criminalOp.ts  # Grow ops, dealer sales
│       ├── businesses.ts  # Laundering, dispensaries, revenue
│       ├── cashFlow.ts    # Reverse flow, net cash
│       ├── streetEconomy.ts # Street sell quota
│       ├── legal.ts       # Lawyer cost, heat calculation
│       ├── jobs.ts        # Job income, hitman upkeep
│       ├── rivalSystem.ts # Rival AI attacks
│       └── eventSystem.ts # Random event triggering
│
├── store/             # Zustand state management
│   ├── gameStore.ts   # ★ Main store (tick + event actions + action spreads)
│   ├── actions/       # ★ MODULAR GAME ACTIONS
│   │   ├── operation.ts   # Harvest, plant, seeds, sell, grow rooms
│   │   ├── dealers.ts     # Hire/fire dealers, tier upgrades
│   │   ├── business.ts    # Buy/sell/upgrade businesses, resources
│   │   ├── territory.ts   # Unlock lots, districts, generated blocks
│   │   ├── legal.ts       # Jobs, lawyers
│   │   ├── combat.ts      # Hitmen, rival attacks
│   │   ├── prestige.ts    # Prestige, tech, reset, wipe
│   │   ├── luxury.ts      # Casino, jewelry, cars
│   │   └── game.ts        # Start/continue, tutorial
│   ├── uiStore.ts     # UI-only state (views, panels, speed)
│   ├── authStore.ts   # Firebase auth + cloud sync
│   ├── cloudSave.ts   # Firestore save/load/leaderboard
│   └── leaderboardStore.ts # Leaderboard data
│
├── hooks/             # Custom React hooks
│   ├── useGameTick.ts      # Game tick loop (setInterval)
│   ├── useTheme.ts         # Access game theme config
│   ├── useOperationStats.ts # Computed grow/dealer stats
│   ├── useCashFlow.ts      # Computed cash flow
│   ├── useHeatStatus.ts    # Computed heat tiers
│   ├── useRivalStatus.ts   # Computed rival status
│   └── useBusinessStats.ts # Computed business financials
│
├── components/        # React UI components
│   ├── layout/        # HUD, NavBar
│   ├── operation/     # Grow room management
│   ├── city/          # City map, district blocks, lots
│   ├── panels/        # Business/market/building panels
│   ├── legal/         # Heat, lawyers, hitmen
│   ├── finance/       # Stats dashboard
│   ├── tech/          # Tech lab, prestige
│   ├── casino/        # Casino games
│   ├── jewelry/       # Jewelry store
│   ├── cars/          # Car dealership
│   ├── auth/          # Login, account
│   ├── ui/            # Tooltip, Tutorial, Notifications, Events, Leaderboard
│   └── warehouse/     # Product inventory
│
└── firebase.ts        # Firebase config
```

---

## How to Add a New Game System

1. Create `src/engine/systems/myNewSystem.ts`:
```typescript
import type { TickState, TickContext } from './types';

export function tickMyNewSystem(ts: TickState, ctx: TickContext): void {
  // Read from ts (mutable accumulator) and ctx (immutable context)
  // Mutate ts directly — e.g. ts.dirtyCash += 100;
}
```

2. Add it to `src/engine/systems/registry.ts`:
```typescript
import { tickMyNewSystem } from './myNewSystem';
// Add to GAME_SYSTEMS array in the correct position
```

3. If your system needs new state fields, add them to `TickState` in `types.ts` and `GameState` in `data/types.ts`.

**To remove a system:** Delete it from the registry array. That's it.

---

## How to Add a New Game Action

1. Find the right domain file in `src/store/actions/`:
   - Growing/harvesting → `operation.ts`
   - Buying/selling businesses → `business.ts`
   - Combat/hitmen → `combat.ts`
   - etc.

2. Add your action to the return object of `createXxxActions()`:
```typescript
export function createOperationActions(set: SetState, get: GetState) {
  return {
    // existing actions...
    myNewAction: (param: string) => {
      const state = get();
      // do stuff
      set({ someField: newValue });
    },
  };
}
```

3. Add the type signature to `GameActions` interface in `gameStore.ts`.

---

## How to Add Content (Data-Driven)

These are **zero-code-change** additions — just add data entries:

- **New grow room:** Add to `GROW_ROOM_TYPE_DEFS` in `data/types.ts`
- **New business:** Add to `BUSINESSES` array in `data/businesses.ts`
- **New car:** Add to `CAR_DEFS` in `data/carDefs.ts`
- **New job:** Add to `JOB_DEFS` in `data/types.ts`
- **New lawyer:** Add to `LAWYER_DEFS` in `data/lawyers.ts`
- **New hitman:** Add to `HITMAN_DEFS` in `data/types.ts`
- **New event:** Add to the appropriate file in `data/events/`
- **New tech upgrade:** Add to `TECH_UPGRADE_DEFS` in `data/techDefs.ts`
- **New district:** Add to `DISTRICTS` in `data/districts.ts`

---

## How to Add/Rename a Currency

1. Edit `src/data/currencies.ts` — change name, icon, color
2. Components using `<CurrencyDisplay id="dirty" />` auto-update
3. State fields (`dirtyCash`, `cleanCash`) remain unchanged in code

---

## How to Re-Theme the Game

Edit `src/data/theme.ts` to change all game-specific labels:
- `product.name`: "Product" → "Coffee" or "Widgets"
- `workers.name`: "Dealers" → "Sales Reps"
- `production.name`: "Grow Room" → "Kitchen"
- Components using `useTheme()` hook auto-update

---

## State & Persistence

- **Local:** Zustand `persist()` middleware → localStorage (`myempire-save`)
- **Cloud:** Firebase Firestore → `saves/{uid}` (on auth)
- **Leaderboard:** Firebase Firestore → `leaderboard/{uid}` (auto-sync)
- **Save version:** Incremented in `gameStore.ts` → `migrate()` handles old saves
- **Migration:** Always adds new fields with defaults, never removes data

---

## Key Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Mutable accumulator** | Tick systems | Systems are order-dependent; each reads/writes shared TickState |
| **Pure functions** | Engine files | No side effects, testable in isolation |
| **Data-driven content** | Data files | Add content without code changes |
| **Selector pattern** | Components | `useGameStore((s) => s.field)` for minimal re-renders |
| **Action creators** | Store actions | `createXxxActions(set, get)` for domain separation |
| **Portal tooltips** | Tooltip component | `display: contents` + createPortal to avoid layout breakage |
