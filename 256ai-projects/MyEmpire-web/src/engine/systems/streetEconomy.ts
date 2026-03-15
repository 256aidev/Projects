import type { TickState, TickContext } from './types';
import { getMaxStreetDemand, getStreetRefillRate } from '../economy';
import { JOB_MAP } from '../../data/types';

/**
 * Street economy system: manages street sell quota based on
 * current job + business count + session tech demand bonus.
 */
export function tickStreetEconomySystem(ts: TickState, ctx: TickContext): void {
  const currentJobDef = ctx.prevState.currentJobId ? JOB_MAP[ctx.prevState.currentJobId] ?? null : null;
  const baseDemand = getMaxStreetDemand(currentJobDef, ctx.prevState.businesses, ctx.carBonuses.streetDemand) + ctx.sessionTech.demandBonus;
  const maxDemand = Math.floor(baseDemand * ctx.season.demandMultiplier);
  const refillRate = getStreetRefillRate(maxDemand);
  ts.streetSellQuotaOz = Math.min(
    maxDemand,
    (ctx.prevState.streetSellQuotaOz ?? maxDemand) + refillRate,
  );
}
