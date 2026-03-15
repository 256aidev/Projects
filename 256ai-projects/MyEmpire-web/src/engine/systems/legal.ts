import type { TickState, TickContext } from './types';
import { calculateHeatTick, calculateRivalHeatTick, HEAT_MAX } from '../heat';
import { LAWYER_MAP } from '../../data/lawyers';

/**
 * Legal system: lawyer retainer payment + heat calculation.
 * Auto-fires lawyer if player can't afford retainer.
 * Computes both player heat and rival heat.
 */
export function tickLegalSystem(ts: TickState, ctx: TickContext): void {
  // Lawyer retainer (deducted from clean cash each tick)
  ts.activeLawyerId = ctx.prevState.activeLawyerId;
  if (ts.activeLawyerId) {
    const lawyer = LAWYER_MAP[ts.activeLawyerId];
    if (lawyer) {
      if (ts.cleanCash >= lawyer.monthlyRetainer) {
        ts.cleanCash -= lawyer.monthlyRetainer;
      } else {
        ts.activeLawyerId = null; // can't afford — auto-fired
      }
    }
  }

  // Heat calculation
  const heatDelta = calculateHeatTick(
    ctx.prevState.heat,
    ts.dirtyCash,
    ctx.prevState.operation.dealerCount,
    ctx.prevState.operation.dealerTierIndex,
    ctx.prevState.businesses,
    ts.activeLawyerId,
    ctx.tech.heatReduction + ctx.carBonuses.heatReduction,
  );
  ts.heat = Math.max(0, Math.min(HEAT_MAX, ctx.prevState.heat + heatDelta));

  // Rival heat calculation
  const rivalHeatDelta = calculateRivalHeatTick(
    ctx.prevState.rivalHeat ?? 0,
    ctx.prevState.operation.dealerCount,
    ctx.prevState.operation.dealerTierIndex,
    ctx.prevState.businesses,
  );
  ts.rivalHeat = Math.max(0, Math.min(HEAT_MAX, (ctx.prevState.rivalHeat ?? 0) + rivalHeatDelta));
}
