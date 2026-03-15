import type { TickState, TickContext } from './types';
import { getMaxStreetDemand, getStreetRefillRate } from '../economy';
import { JOB_MAP } from '../../data/types';

/**
 * Street economy system: manages street sell quota based on
 * active jobs + business count + session tech demand bonus.
 */
export function tickStreetEconomySystem(ts: TickState, ctx: TickContext): void {
  const activeJobs = ctx.prevState.activeJobIds ?? [];
  const jobDefs = activeJobs.map(id => JOB_MAP[id]).filter(Boolean);
  const baseDemand = getMaxStreetDemand(jobDefs, ctx.prevState.businesses, ctx.carBonuses.streetDemand) + ctx.sessionTech.demandBonus;
  const maxDemand = Math.floor(baseDemand * ctx.season.demandMultiplier);
  const refillRate = getStreetRefillRate(maxDemand);
  ts.streetSellQuotaOz = Math.min(
    maxDemand,
    (ctx.prevState.streetSellQuotaOz ?? maxDemand) + refillRate,
  );
}
