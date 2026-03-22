import type { TickState, TickContext } from './types';
import { tickCriminalOperation } from '../economy';
import { getCrewBonuses } from '../../data/crewDefs';

/**
 * Criminal operation system: grows product, sells through dealers,
 * deducts maintenance. Produces dirty cash and updates operation state.
 */
export function tickCriminalOpSystem(ts: TickState, ctx: TickContext): void {
  const { newOp, dirtyEarned: rawDirtyEarned, maintenanceCost } = tickCriminalOperation(
    ctx.prevState.operation,
    ctx.tech,
    ctx.sessionTech.dealerCutReduction,
  );

  const crewBonuses = getCrewBonuses(ctx.prevState.crew ?? []);

  // Apply car income multiplier + dealer boost + crew income multiplier + seasonal yield to dirty income
  const dirtyEarned = Math.floor(
    rawDirtyEarned * (1 + ctx.carBonuses.incomeMultiplier + ctx.carBonuses.dealerBoost + crewBonuses.incomeMultiplier) * ctx.season.yieldMultiplier,
  );

  // Apply jewelry operation discount + crew cost reduction to maintenance
  const discountedMaintenance = Math.floor(maintenanceCost * (1 - ctx.jewelryBonuses.operationDiscount) * (1 - crewBonuses.costReduction));

  ts.dirtyCash += dirtyEarned;
  ts.dirtyCash = Math.max(0, ts.dirtyCash - discountedMaintenance);
  ts.operation = newOp;
  ts.dirtyEarned = dirtyEarned;
  ts.maintenanceCost = discountedMaintenance;
}
