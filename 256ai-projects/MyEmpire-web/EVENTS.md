# Event System — My Empire: Kingpin

## Overview

The event system adds 400 random events across 4 categories that trigger during gameplay. Events present the player with 2-3 choices, each with different risk/reward outcomes. Some events are one-time story moments, others recur throughout the game.

## Categories

| Category | Count | Theme | Examples |
|----------|-------|-------|----------|
| **Life** | 100 | Personal, family, neighborhood | Grandma passes away, family needs money, block party, birthday, high school reunion |
| **Criminal** | 100 | Law enforcement, rivals, underground | Police raid, undercover cop, rival turf war, black market deal, smuggling route |
| **Business** | 100 | Front businesses, market, finance | Health inspector, tax audit, economic boom, franchise opportunity, celebrity endorsement |
| **Vice** | 100 | Gambling, temptation, moral dilemmas | Underground poker, luxury car deal, community donation, gambling debt collector |

## How It Works

### Triggering
- Events check every tick after a minimum interval (30 ticks / ~30 seconds)
- Probability increases over time, guaranteed event by 120 ticks (~2 minutes)
- Each event has **conditions** (minimum heat, cash, businesses, etc.) that must be met
- One-time events only fire once per playthrough
- Each event has a cooldown before it can trigger again

### Choices
- Each event presents 2-3 choices
- Choices have a **success chance** (0-100%)
- Success and failure have different outcomes
- Some choices require minimum cash or a lawyer/hitmen
- An "Ignore" option is always available (no effect)

### Outcomes
Events can affect:
- **Dirty/Clean Cash** — gain or lose money
- **Heat** — increase or decrease police heat
- **Rival Heat** — increase or decrease gang heat
- **Seeds/Dealers** — gain or lose resources
- **Temporary Buffs** — speed boost, revenue boost, launder boost, heat freeze

### Buffs
Events can grant temporary buffs that last a set number of ticks:
- `speed` — multiplier on grow speed
- `revenue` — multiplier on business revenue
- `launder` — multiplier on laundering efficiency
- `heatFreeze` — prevents heat from increasing

## Architecture

### Files

| File | Purpose |
|------|---------|
| `src/data/events/types.ts` | Type definitions for events, choices, outcomes, buffs |
| `src/data/events/lifeEvents.ts` | 100 life events |
| `src/data/events/criminalEvents.ts` | 100 criminal events |
| `src/data/events/businessEvents.ts` | 100 business events |
| `src/data/events/viceEvents.ts` | 50 vice events (gambling + temptation) |
| `src/data/events/viceEventsPart2.ts` | 50 vice events (lifestyle + moral dilemmas) |
| `src/data/events/index.ts` | Registry combining all events |
| `src/engine/events.ts` | Event engine (selection, resolution, buff management) |
| `src/components/ui/EventPopup.tsx` | Event popup UI component |

### State (in GameState.eventSystem)

```typescript
interface EventSystemState {
  activeEvent: ActiveEvent | null;       // currently displayed event
  completedOneTimeEvents: string[];      // IDs of fired one-time events
  eventCooldowns: Record<string, number>; // eventId → tick when cooldown expires
  lastEventTick: number;                  // when last event triggered
  activeBuffs: EventBuff[];               // temporary buffs from events
}
```

### Adding New Events

1. Create a new event object following the `GameEventDef` interface
2. Add it to the appropriate category file (or create a new one)
3. Import and spread it into `ALL_EVENTS` in `src/data/events/index.ts`

Example event:
```typescript
{
  id: 'life_101',
  category: 'life',
  name: 'New Neighbor',
  icon: '👋',
  description: 'A new family moved in next door. They seem friendly but nosy.',
  conditions: { minTickCount: 60 },
  weight: 3,
  cooldownTicks: 200,
  oneTime: false,
  choices: [
    {
      label: 'Welcome them with a gift',
      description: 'Bring over some food and make friends',
      successChance: 0.9,
      successOutcome: { heatDelta: -10, cleanCashDelta: -200 },
      failureOutcome: { heatDelta: 5 },
    },
    {
      label: 'Keep your distance',
      description: 'Wave politely but maintain boundaries',
      successChance: 1.0,
      successOutcome: {},
    },
  ],
}
```

### Integration Points

- **Game Store tick()**: Checks `shouldTriggerEvent()` → calls `triggerEvent()` if conditions met
- **resolveEvent(choiceIndex)**: Action in game store that resolves player's choice
- **dismissEvent()**: Action to ignore the event
- **EventPopup component**: Renders in App.tsx at z-index 60 (above everything else)
- **Buff system**: `tickBuffs()` runs every tick to expire old buffs; `getBuffMultiplier()` can be used by economy engine

## Event Condition Reference

| Condition | Type | Description |
|-----------|------|-------------|
| `minTickCount` | number | Minimum game ticks elapsed |
| `minHeat` / `maxHeat` | number | Police heat range (0-1000) |
| `minRivalHeat` | number | Minimum rival heat |
| `minDirtyCash` / `maxDirtyCash` | number | Dirty cash range |
| `minCleanCash` | number | Minimum clean cash |
| `minTotalDirtyEarned` | number | Lifetime dirty earnings |
| `minBusinessCount` | number | Number of front businesses |
| `minGrowRoomCount` | number | Number of grow rooms |
| `minDealerCount` | number | Number of dealers |
| `minPrestigeCount` | number | Prestige level |
| `minHitmenCount` | number | Number of hired hitmen |
| `requiresJob` | boolean | Must have a job |
| `requiresLawyer` | boolean | Must have a lawyer |
| `minProductOz` | number | Minimum product in stash |
| `minRivalsDefeated` | number | Number of defeated rivals |
