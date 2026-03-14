// ─────────────────────────────────────────
// EVENT ENGINE — Selection, Resolution, Buffs
// ─────────────────────────────────────────

import type { GameEventDef, EventSystemState, ActiveEvent, EventBuff, EventOutcome } from '../data/events/types';
import { EVENT_MIN_INTERVAL, EVENT_MAX_INTERVAL } from '../data/events/types';
import { ALL_EVENTS } from '../data/events';

/** Check all conditions for an event against current game state */
export function isEventEligible(
  event: GameEventDef,
  state: EventCheckState,
  eventState: EventSystemState,
): boolean {
  const c = event.conditions;

  // One-time events that already fired
  if (event.oneTime && eventState.completedOneTimeEvents.includes(event.id)) return false;

  // Cooldown check
  const cooldownExpiry = eventState.eventCooldowns[event.id];
  if (cooldownExpiry && state.tickCount < cooldownExpiry) return false;

  // Condition checks
  if (c.minTickCount !== undefined && state.tickCount < c.minTickCount) return false;
  if (c.maxTickCount !== undefined && state.tickCount > c.maxTickCount) return false;
  if (c.minHeat !== undefined && state.heat < c.minHeat) return false;
  if (c.maxHeat !== undefined && state.heat > c.maxHeat) return false;
  if (c.minRivalHeat !== undefined && state.rivalHeat < c.minRivalHeat) return false;
  if (c.minDirtyCash !== undefined && state.dirtyCash < c.minDirtyCash) return false;
  if (c.minCleanCash !== undefined && state.cleanCash < c.minCleanCash) return false;
  if (c.maxDirtyCash !== undefined && state.dirtyCash > c.maxDirtyCash) return false;
  if (c.minTotalDirtyEarned !== undefined && state.totalDirtyEarned < c.minTotalDirtyEarned) return false;
  if (c.minBusinessCount !== undefined && state.businessCount < c.minBusinessCount) return false;
  if (c.maxBusinessCount !== undefined && state.businessCount > c.maxBusinessCount) return false;
  if (c.minGrowRoomCount !== undefined && state.growRoomCount < c.minGrowRoomCount) return false;
  if (c.minDealerCount !== undefined && state.dealerCount < c.minDealerCount) return false;
  if (c.minPrestigeCount !== undefined && state.prestigeCount < c.minPrestigeCount) return false;
  if (c.minHitmenCount !== undefined && state.hitmenCount < c.minHitmenCount) return false;
  if (c.requiresJob === true && !state.hasJob) return false;
  if (c.requiresNoJob === true && state.hasJob) return false;
  if (c.requiresLawyer === true && !state.hasLawyer) return false;
  if (c.requiresNoLawyer === true && state.hasLawyer) return false;
  if (c.minProductOz !== undefined && state.productOz < c.minProductOz) return false;
  if (c.minRivalsDefeated !== undefined && state.rivalsDefeated < c.minRivalsDefeated) return false;

  return true;
}

/** Simplified game state for event condition checking */
export interface EventCheckState {
  tickCount: number;
  heat: number;
  rivalHeat: number;
  dirtyCash: number;
  cleanCash: number;
  totalDirtyEarned: number;
  businessCount: number;
  growRoomCount: number;
  dealerCount: number;
  prestigeCount: number;
  hitmenCount: number;
  hasJob: boolean;
  hasLawyer: boolean;
  productOz: number;
  rivalsDefeated: number;
}

/** Select a random event using weighted probability from eligible events */
export function selectRandomEvent(
  state: EventCheckState,
  eventState: EventSystemState,
): GameEventDef | null {
  const eligible = ALL_EVENTS.filter((e) => isEventEligible(e, state, eventState));
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return eligible[eligible.length - 1];
}

/** Check if it's time for a new event.
 *  gameSpeed scales the intervals so events feel the same in real-time
 *  regardless of game speed (1x/2x/4x/8x). */
export function shouldTriggerEvent(
  tickCount: number,
  eventState: EventSystemState,
  gameSpeed: number = 1,
): boolean {
  // Don't trigger if there's already an active event
  if (eventState.activeEvent) return false;

  const speed = Math.max(1, gameSpeed);
  const ticksSinceLastEvent = tickCount - eventState.lastEventTick;

  // Scale intervals by game speed — at 8x, require 8x more ticks between events
  const scaledMinInterval = EVENT_MIN_INTERVAL * speed;
  const scaledMaxInterval = EVENT_MAX_INTERVAL * speed;

  // Minimum interval not met
  if (ticksSinceLastEvent < scaledMinInterval) return false;

  // Guaranteed event at max interval
  if (ticksSinceLastEvent >= scaledMaxInterval) return true;

  // Increasing probability as we approach max interval
  const progress = (ticksSinceLastEvent - scaledMinInterval) / (scaledMaxInterval - scaledMinInterval);
  return Math.random() < progress * 0.15; // up to 15% chance per tick near max
}

/** Trigger a new event — returns updated event state */
export function triggerEvent(
  state: EventCheckState,
  eventState: EventSystemState,
): EventSystemState {
  const event = selectRandomEvent(state, eventState);
  if (!event) return eventState;

  const activeEvent: ActiveEvent = {
    eventId: event.id,
    triggeredAtTick: state.tickCount,
  };

  return {
    ...eventState,
    activeEvent,
    lastEventTick: state.tickCount,
  };
}

/** Resolve a player's choice — returns outcome and updated event state */
export function resolveEventChoice(
  event: GameEventDef,
  choiceIndex: number,
  eventState: EventSystemState,
  tickCount: number,
): { outcome: EventOutcome; eventState: EventSystemState; success: boolean } {
  const choice = event.choices[choiceIndex];
  const success = Math.random() < choice.successChance;
  const outcome = success ? choice.successOutcome : (choice.failureOutcome ?? {});

  // Build new buffs from outcome
  const newBuffs: EventBuff[] = [];
  if (outcome.speedBoostTicks && outcome.speedBoostMultiplier) {
    newBuffs.push({
      type: 'speed',
      multiplier: outcome.speedBoostMultiplier,
      expiresAtTick: tickCount + outcome.speedBoostTicks,
    });
  }
  if (outcome.launderBoostTicks && outcome.launderBoostMultiplier) {
    newBuffs.push({
      type: 'launder',
      multiplier: outcome.launderBoostMultiplier,
      expiresAtTick: tickCount + outcome.launderBoostTicks,
    });
  }
  if (outcome.revenueBoostTicks && outcome.revenueBoostMultiplier) {
    newBuffs.push({
      type: 'revenue',
      multiplier: outcome.revenueBoostMultiplier,
      expiresAtTick: tickCount + outcome.revenueBoostTicks,
    });
  }
  if (outcome.heatFreezeTickCount) {
    newBuffs.push({
      type: 'heatFreeze',
      multiplier: 0,
      expiresAtTick: tickCount + outcome.heatFreezeTickCount,
    });
  }

  // Update cooldown
  const newCooldowns = { ...eventState.eventCooldowns };
  newCooldowns[event.id] = tickCount + event.cooldownTicks;

  // Track one-time events
  const completedOneTime = event.oneTime
    ? [...eventState.completedOneTimeEvents, event.id]
    : eventState.completedOneTimeEvents;

  return {
    outcome,
    success,
    eventState: {
      ...eventState,
      activeEvent: null,
      completedOneTimeEvents: completedOneTime,
      eventCooldowns: newCooldowns,
      activeBuffs: [...eventState.activeBuffs, ...newBuffs],
    },
  };
}

/** Tick active buffs — remove expired ones */
export function tickBuffs(eventState: EventSystemState, tickCount: number): EventSystemState {
  const activeBuffs = eventState.activeBuffs.filter((b) => b.expiresAtTick > tickCount);
  if (activeBuffs.length === eventState.activeBuffs.length) return eventState;
  return { ...eventState, activeBuffs };
}

/** Get active buff multiplier for a given type (returns 1.0 if no buff) */
export function getBuffMultiplier(eventState: EventSystemState, type: EventBuff['type']): number {
  const buff = eventState.activeBuffs.find((b) => b.type === type);
  return buff ? buff.multiplier : 1.0;
}

/** Check if heat is frozen by a buff */
export function isHeatFrozen(eventState: EventSystemState): boolean {
  return eventState.activeBuffs.some((b) => b.type === 'heatFreeze');
}

/** Get event def by id */
export function getEventDef(eventId: string): GameEventDef | undefined {
  return ALL_EVENTS.find((e) => e.id === eventId);
}

/** Get counts of events by category */
export function getEventCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of ALL_EVENTS) {
    counts[event.category] = (counts[event.category] ?? 0) + 1;
  }
  return counts;
}
