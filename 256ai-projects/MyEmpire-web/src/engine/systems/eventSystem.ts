import type { TickState, TickContext } from './types';
import { tickBuffs, shouldTriggerEvent, triggerEvent, type EventCheckState } from '../events';
import { INITIAL_EVENT_STATE } from '../../data/events/types';

/**
 * Event system: expires active buffs, checks for new random events
 * based on current game state metrics.
 */
export function tickEventSystem(ts: TickState, ctx: TickContext): void {
  ts.eventSystem = tickBuffs(ctx.prevState.eventSystem ?? INITIAL_EVENT_STATE, ts.tickCount);

  const totalProductOz = Object.values(ts.operation.productInventory).reduce(
    (s, e) => s + e.oz,
    0,
  );

  if (shouldTriggerEvent(ts.tickCount, ts.eventSystem, ctx.gameSpeed)) {
    const checkState: EventCheckState = {
      tickCount: ts.tickCount,
      heat: ts.heat,
      rivalHeat: ts.rivalHeat,
      dirtyCash: ts.dirtyCash,
      cleanCash: ts.cleanCash,
      totalDirtyEarned: ts.totalDirtyEarned,
      businessCount: ctx.prevState.businesses.length,
      growRoomCount: ts.operation.growRooms.length,
      dealerCount: ts.operation.dealerCount,
      prestigeCount: ctx.prevState.prestigeCount,
      hitmenCount: (ctx.prevState.crew ?? []).reduce((s, h) => s + h.count, 0),
      hasJob: !!ts.currentJobId,
      hasLawyer: !!ts.activeLawyerId,
      productOz: totalProductOz,
      rivalsDefeated: ts.rivals.filter((r) => r.isDefeated).length,
    };
    ts.eventSystem = triggerEvent(checkState, ts.eventSystem, ctx.season.eventWeights);
  }
}
