// ─────────────────────────────────────────
// EVENT SYSTEM — Type Definitions
// ─────────────────────────────────────────

export type EventCategory = 'life' | 'criminal' | 'business' | 'vice';

/** Conditions that must be met for an event to be eligible */
export interface EventConditions {
  minTickCount?: number;
  maxTickCount?: number;
  minHeat?: number;
  maxHeat?: number;
  minRivalHeat?: number;
  minDirtyCash?: number;
  minCleanCash?: number;
  maxDirtyCash?: number;
  minTotalDirtyEarned?: number;
  minBusinessCount?: number;
  maxBusinessCount?: number;
  minGrowRoomCount?: number;
  minDealerCount?: number;
  minPrestigeCount?: number;
  minHitmenCount?: number;
  requiresJob?: boolean;
  requiresNoJob?: boolean;
  requiresLawyer?: boolean;
  requiresNoLawyer?: boolean;
  minProductOz?: number;
  minRivalsDefeated?: number;
}

/** Outcome effects applied when a choice is selected */
export interface EventOutcome {
  dirtyCashDelta?: number;       // + or - dirty cash
  cleanCashDelta?: number;       // + or - clean cash
  heatDelta?: number;            // + or - heat (0-1000 scale)
  rivalHeatDelta?: number;       // + or - rival heat
  productDelta?: number;         // + or - product oz (distributed across strains)
  seedDelta?: number;            // + or - seeds
  speedBoostTicks?: number;      // temporary speed boost duration
  speedBoostMultiplier?: number; // temporary speed multiplier
  launderBoostTicks?: number;    // temporary launder boost duration
  launderBoostMultiplier?: number;
  revenueBoostTicks?: number;    // temporary revenue boost duration
  revenueBoostMultiplier?: number;
  heatFreezeTickCount?: number;  // freeze heat for N ticks
  dealerCountDelta?: number;     // gain or lose dealers
}

/** A choice the player can make in response to an event */
export interface GameEventChoice {
  label: string;                 // button text
  description: string;           // what happens if you pick this
  successChance: number;         // 0-1, probability of success outcome
  successOutcome: EventOutcome;  // applied on success
  failureOutcome?: EventOutcome; // applied on failure (if omitted, nothing happens)
  requiresDirtyCash?: number;    // must have this much dirty cash to pick
  requiresCleanCash?: number;    // must have this much clean cash to pick
  requiresLawyer?: boolean;      // must have a lawyer to pick this
  requiresHitmen?: boolean;      // must have hitmen to pick this
}

/** A game event definition */
export interface GameEventDef {
  id: string;
  category: EventCategory;
  name: string;
  icon: string;                  // emoji icon
  description: string;           // flavor text shown to player
  conditions: EventConditions;   // must be met to trigger
  weight: number;                // relative probability (higher = more likely)
  cooldownTicks: number;         // minimum ticks before this event can trigger again
  oneTime: boolean;              // if true, can only trigger once per playthrough
  choices: GameEventChoice[];    // 2-3 choices for the player
}

/** Active event instance in game state */
export interface ActiveEvent {
  eventId: string;
  triggeredAtTick: number;
}

/** Event engine state stored in game state */
export interface EventSystemState {
  activeEvent: ActiveEvent | null;
  completedOneTimeEvents: string[];
  eventCooldowns: Record<string, number>;  // eventId → tick when cooldown expires
  lastEventTick: number;
  // Temporary buffs from events
  activeBuffs: EventBuff[];
}

export interface EventBuff {
  type: 'speed' | 'launder' | 'revenue' | 'heatFreeze';
  multiplier: number;
  expiresAtTick: number;
}

/** Initial event system state */
export const INITIAL_EVENT_STATE: EventSystemState = {
  activeEvent: null,
  completedOneTimeEvents: [],
  eventCooldowns: {},
  lastEventTick: 0,
  activeBuffs: [],
};

/** Minimum ticks between any two events */
export const EVENT_MIN_INTERVAL = 30;  // ~30 seconds at 1x speed

/** Maximum ticks between events (guaranteed event) */
export const EVENT_MAX_INTERVAL = 120; // ~2 minutes at 1x speed
