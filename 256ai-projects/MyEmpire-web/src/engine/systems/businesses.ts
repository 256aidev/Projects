import type { TickState, TickContext } from './types';
import {
  calculateBusinessRevenue,
  calculateBusinessExpenses,
  calculateDispensaryTick,
  calculateLaunderTick,
} from '../economy';
import { BUSINESS_MAP } from '../../data/businesses';

/**
 * Business economy system: laundering, dispensaries, rental revenue.
 * Reads dirtyCash from ts (set by criminal op). Updates operation inventory
 * if dispensaries consume product.
 */
export function tickBusinessesSystem(ts: TickState, ctx: TickContext): void {
  let totalDirtyConsumed = 0;
  let totalCleanProduced = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  // Compute total oz and weighted avg price from per-strain inventory
  const invEntries = Object.entries(ts.operation.productInventory);
  const totalInventoryOz = invEntries.reduce((sum, [, e]) => sum + e.oz, 0);
  const weightedAvgPrice =
    totalInventoryOz > 0
      ? invEntries.reduce((sum, [, e]) => sum + e.oz * e.pricePerUnit, 0) / totalInventoryOz
      : 10;
  let totalProductConsumed = 0;

  for (const biz of ctx.prevState.businesses) {
    if (!biz.isOperating) continue;
    const bizDef = BUSINESS_MAP[biz.businessDefId];
    totalRevenue += calculateBusinessRevenue(biz);
    totalExpenses += calculateBusinessExpenses(biz);

    if (bizDef?.isDispensary) {
      const { productConsumed, cleanProduced } = calculateDispensaryTick(
        biz,
        totalInventoryOz - totalProductConsumed,
        weightedAvgPrice,
      );
      totalProductConsumed += productConsumed;
      totalCleanProduced += cleanProduced;
    } else if (bizDef?.isRental) {
      // rental revenue is 100% clean cash — already counted in totalRevenue above
    } else {
      const { dirtyConsumed, cleanProduced } = calculateLaunderTick(
        biz,
        ts.dirtyCash - totalDirtyConsumed,
        ctx.tech.launderMultiplier * (1 + ctx.carBonuses.launderBoost),
      );
      totalDirtyConsumed += dirtyConsumed;
      totalCleanProduced += cleanProduced;
    }
  }

  // Consume dispensary product proportionally from per-strain inventory
  let finalOp = ts.operation;
  if (totalProductConsumed > 0 && totalInventoryOz > 0) {
    const newInventory = { ...ts.operation.productInventory };
    for (const strainName of Object.keys(newInventory)) {
      const entry = newInventory[strainName];
      const fraction = entry.oz / totalInventoryOz;
      const strainConsumed = Math.min(entry.oz, totalProductConsumed * fraction);
      newInventory[strainName] = { ...entry, oz: entry.oz - strainConsumed };
    }
    finalOp = { ...ts.operation, productInventory: newInventory };
  }

  ts.operation = finalOp;
  ts.cleanProduced = totalCleanProduced;
  ts.legitProfit = totalRevenue - totalExpenses;

  // Store intermediate values for cashFlow system via closure-free approach:
  // We temporarily stash totalDirtyConsumed in dirtyCash adjustment
  ts.dirtyCash = Math.max(0, ts.dirtyCash - totalDirtyConsumed);
}
