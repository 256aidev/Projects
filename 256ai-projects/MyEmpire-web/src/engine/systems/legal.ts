import type { TickState, TickContext } from './types';
import { calculateHeatTick, calculateRivalHeatTick, HEAT_MAX } from '../heat';
import { LAWYER_MAP } from '../../data/lawyers';

/**
 * Legal system: lawyer retainer payment + heat calculation.
 * Multiple lawyers can be hired. Each adds decay bonus and costs retainer.
 * Auto-fires lawyers (cheapest first) if player can't afford total retainer.
 */
export function tickLegalSystem(ts: TickState, ctx: TickContext): void {
  // Calculate total lawyer retainer and decay from all hired lawyers
  const hiredLawyers = ctx.prevState.hiredLawyers ?? [];
  let totalRetainer = 0;
  let totalLawyerDecay = 0;

  for (const hired of hiredLawyers) {
    const def = LAWYER_MAP[hired.defId];
    if (!def) continue;
    totalRetainer += def.monthlyRetainer * hired.count;
    totalLawyerDecay += def.heatDecayBonus * hired.count * (1 + (ctx.sessionTech.lawyerPower ?? 0));
  }

  // Pay retainer — if can't afford, keep what we can
  if (totalRetainer > 0) {
    if (ts.cleanCash >= totalRetainer) {
      ts.cleanCash -= totalRetainer;
    } else {
      // Can't afford full retainer — still deduct what we have but reduce effectiveness
      ts.cleanCash = 0;
      totalLawyerDecay *= 0.5; // half effectiveness when behind on payments
    }
  }

  // Set activeLawyerId for backward compat (highest tier lawyer hired)
  ts.activeLawyerId = hiredLawyers.length > 0 ? hiredLawyers[hiredLawyers.length - 1].defId : ctx.prevState.activeLawyerId;

  // Heat calculation — pass null for activeLawyerId since we handle decay ourselves
  // Add total lawyer decay to the tech heat reduction so it's applied in the formula
  const rawHeatDelta = calculateHeatTick(
    ctx.prevState.heat,
    ts.dirtyCash,
    ctx.prevState.operation.dealerCount,
    ctx.prevState.operation.dealerTierIndex,
    ctx.prevState.businesses,
    null, // no single lawyer — we handle decay via heatReduction param
    ctx.tech.heatReduction + ctx.carBonuses.heatReduction + totalLawyerDecay,
  );
  // Apply season heat multiplier only to heat gain (not decay)
  const heatDelta = rawHeatDelta > 0 ? rawHeatDelta * ctx.season.heatMultiplier : rawHeatDelta;
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
