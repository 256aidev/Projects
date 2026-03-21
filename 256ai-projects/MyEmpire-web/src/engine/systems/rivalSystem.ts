import type { TickState, TickContext } from './types';
import { tickRivals, getPlayerDefense } from '../rivals';
import { getTuning } from '../../store/tuningStore';

/**
 * Rival AI system: runs every tunable tick interval.
 * Rivals attack player, steal cash/product, reveal districts.
 */
export function tickRivalSystem(ts: TickState, ctx: TickContext): void {
  ts.rivals = ctx.prevState.rivals ?? [];
  ts.rivalAttackLog = ctx.prevState.rivalAttackLog ?? [];

  const interval = getTuning().rivalTickInterval;
  if (ts.rivals.length > 0 && ts.tickCount % interval === 0) {
    const totalProductOz = Object.values(ts.operation.productInventory).reduce(
      (s, e) => s + e.oz,
      0,
    );
    // Seasonal rival activity multiplier affects effective rival heat for attack calculations
    const result = tickRivals(
      ts.rivals,
      ts.rivalHeat * ctx.season.rivalActivityMultiplier,
      ts.dirtyCash,
      totalProductOz,
      ctx.prevState.businesses,
      getPlayerDefense(ctx.prevState.crew ?? [], ctx.tech.crewDefenseBonus),
      ts.tickCount,
      ctx.prevState.unlockedSlots,
    );

    ts.rivals = result.rivals;
    ts.dirtyCash = Math.max(0, ts.dirtyCash - result.playerDirtyCashLost);
    ts.cleanCash = Math.max(0, ts.cleanCash - result.playerCleanCashLost);

    if (result.attackMessages.length > 0) {
      ts.rivalAttackLog = [...ts.rivalAttackLog, ...result.attackMessages].slice(-10);
    }

    // Rival district reveal — if a rival has a business in a district
    // the player hasn't unlocked, auto-reveal it (free unlock)
    const revealedDistricts = new Set(ctx.prevState.unlockedDistricts);
    for (const rival of ts.rivals) {
      if (rival.isDefeated) continue;
      for (const rb of rival.businesses) {
        if (!revealedDistricts.has(rb.districtId) && !rb.districtId.startsWith('gen_')) {
          revealedDistricts.add(rb.districtId);
        }
      }
    }
    if (revealedDistricts.size > ctx.prevState.unlockedDistricts.length) {
      ts.unlockedDistricts = [...revealedDistricts];
    }
  }
}
