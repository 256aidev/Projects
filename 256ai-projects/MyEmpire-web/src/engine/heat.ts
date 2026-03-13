import type { BusinessInstance, HeatTier } from '../data/types';
import { DEALER_TIERS } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { LAWYER_MAP } from '../data/lawyers';

// Dirty cash heat constants
const DIRTY_CASH_DIVISOR = 50_000; // at $50K dirty, dirtyCashHeat = DIRTY_CASH_RATE
const DIRTY_CASH_RATE = 0.04;

// Natural decay per tick (always active)
const NATURAL_DECAY = 0.01;

export function getHeatTier(heat: number): HeatTier {
  if (heat >= 90) return 4;
  if (heat >= 75) return 3;
  if (heat >= 50) return 2;
  if (heat >= 25) return 1;
  return 0;
}

export interface HeatBreakdown {
  dirtyCashHeat: number;
  dealerHeat: number;
  policeMultiplier: number;
  totalGain: number;
  naturalDecay: number;
  lawyerDecay: number;
  businessDecay: number;
  totalLoss: number;
  netPerTick: number;
}

export function getHeatBreakdown(
  dirtyCash: number,
  dealerCount: number,
  dealerTierIndex: number,
  businesses: BusinessInstance[],
  activeLawyerId: string | null,
): HeatBreakdown {
  // Heat gain from holding dirty cash
  const dirtyCashHeat = (dirtyCash / DIRTY_CASH_DIVISOR) * DIRTY_CASH_RATE;

  // Heat gain from dealer operations
  const tier = DEALER_TIERS[dealerTierIndex];
  const dealerHeat = tier ? dealerCount * tier.heatPerTick : 0;

  // Police presence multiplier from districts with active businesses
  const districtIds = [...new Set(businesses.filter(b => b.isOperating).map(b => b.districtId))];
  let policeMultiplier = 1;
  if (districtIds.length > 0) {
    policeMultiplier = districtIds.reduce((sum, id) => {
      const d = DISTRICT_MAP[id];
      return sum + (d?.policePresenceMultiplier ?? 1);
    }, 0) / districtIds.length;
  }

  const totalGain = (dirtyCashHeat + dealerHeat) * policeMultiplier;

  // Decay sources
  const naturalDecay = NATURAL_DECAY;

  const lawyer = activeLawyerId ? LAWYER_MAP[activeLawyerId] : null;
  const lawyerDecay = lawyer?.heatDecayBonus ?? 0;

  let businessDecay = 0;
  for (const biz of businesses) {
    if (!biz.isOperating) continue;
    const def = BUSINESS_MAP[biz.businessDefId];
    if (!def) continue;
    businessDecay += def.heatReductionPerTick * 0.005;
  }

  const totalLoss = naturalDecay + lawyerDecay + businessDecay;
  const netPerTick = totalGain - totalLoss;

  return {
    dirtyCashHeat,
    dealerHeat,
    policeMultiplier,
    totalGain,
    naturalDecay,
    lawyerDecay,
    businessDecay,
    totalLoss,
    netPerTick,
  };
}

export function calculateHeatTick(
  currentHeat: number,
  dirtyCash: number,
  dealerCount: number,
  dealerTierIndex: number,
  businesses: BusinessInstance[],
  activeLawyerId: string | null,
): number {
  const breakdown = getHeatBreakdown(dirtyCash, dealerCount, dealerTierIndex, businesses, activeLawyerId);
  const newHeat = Math.max(0, Math.min(100, currentHeat + breakdown.netPerTick));
  return newHeat - currentHeat;
}
