import type { TickState, TickContext } from './types';

/**
 * Cash flow reconciliation: reverse flow (clean -> dirty at 95%),
 * net clean cash from laundering + legit profit.
 */
export function tickCashFlowSystem(ts: TickState, ctx: TickContext): void {
  // Reverse flow: clean cash -> dirty cash (95% efficiency — 5% handling cost)
  let totalCleanToDirty = 0;
  let totalDirtyFromClean = 0;
  for (const biz of ctx.prevState.businesses) {
    if (!biz.isOperating) continue;
    const rate = biz.cleanToDirtyPerTick ?? 0;
    if (rate <= 0) continue;
    const available = ts.cleanCash - totalCleanToDirty;
    const consumed = Math.min(rate, Math.max(0, available));
    totalCleanToDirty += consumed;
    totalDirtyFromClean += consumed * 0.95;
  }

  ts.dirtyCash += totalDirtyFromClean;
  ts.cleanCash = ts.cleanCash - totalCleanToDirty + ts.cleanProduced + ts.legitProfit;
  if (ts.cleanCash < 0) ts.cleanCash += ts.cleanCash * 0.0001;

  // Track totals
  ts.totalDirtyEarned = ctx.prevState.totalDirtyEarned + ts.dirtyEarned;
  ts.heatNoticeShown = ctx.prevState.heatNoticeShown || (!ctx.prevState.heatNoticeShown && ts.totalDirtyEarned >= 100_000);
}
