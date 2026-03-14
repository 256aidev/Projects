import type { BusinessInstance, HeatTier } from '../data/types';
import { DEALER_TIERS } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { LAWYER_MAP } from '../data/lawyers';

// Dirty cash heat constants
const DIRTY_CASH_DIVISOR = 50_000; // at $50K dirty, dirtyCashHeat = DIRTY_CASH_RATE
const DIRTY_CASH_RATE = 0.04;

// Natural decay per tick (always active) — scaled for 0-1000 range
const NATURAL_DECAY = 0.1;

// Maximum heat value
export const HEAT_MAX = 1000;

// ─── POLICE HEAT ─────────────────────────────────

export function getHeatTier(heat: number): HeatTier {
  if (heat >= 900) return 4;
  if (heat >= 750) return 3;
  if (heat >= 500) return 2;
  if (heat >= 250) return 1;
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
  techHeatReduction = 0,
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

  const totalGain = (dirtyCashHeat + dealerHeat) * policeMultiplier * (1 - techHeatReduction);

  // Decay sources
  const naturalDecay = NATURAL_DECAY;

  const lawyer = activeLawyerId ? LAWYER_MAP[activeLawyerId] : null;
  const lawyerDecay = lawyer?.heatDecayBonus ?? 0;

  let businessDecay = 0;
  for (const biz of businesses) {
    if (!biz.isOperating) continue;
    const def = BUSINESS_MAP[biz.businessDefId];
    if (!def) continue;
    businessDecay += def.heatReductionPerTick;
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
  techHeatReduction = 0,
): number {
  const breakdown = getHeatBreakdown(dirtyCash, dealerCount, dealerTierIndex, businesses, activeLawyerId, techHeatReduction);
  const newHeat = Math.max(0, Math.min(HEAT_MAX, currentHeat + breakdown.netPerTick));
  return newHeat - currentHeat;
}

// ─── RIVAL HEAT ──────────────────────────────────

const RIVAL_NATURAL_DECAY = 0.05;

export function getRivalHeatTier(heat: number): HeatTier {
  if (heat >= 900) return 4;
  if (heat >= 750) return 3;
  if (heat >= 500) return 2;
  if (heat >= 250) return 1;
  return 0;
}

export interface RivalHeatBreakdown {
  dealerHeat: number;
  territoryHeat: number;
  totalGain: number;
  naturalDecay: number;
  totalLoss: number;
  netPerTick: number;
}

export function getRivalHeatBreakdown(
  dealerCount: number,
  dealerTierIndex: number,
  businesses: BusinessInstance[],
): RivalHeatBreakdown {
  // Rival gangs notice your dealer presence
  const tier = DEALER_TIERS[dealerTierIndex];
  const dealerHeat = tier ? dealerCount * (tier.heatPerTick * 0.5) : 0;

  // Expanding into districts draws rival attention
  const operatingBizCount = businesses.filter(b => b.isOperating).length;
  const territoryHeat = operatingBizCount * 0.002;

  const totalGain = dealerHeat + territoryHeat;
  const naturalDecay = RIVAL_NATURAL_DECAY;
  const totalLoss = naturalDecay;
  const netPerTick = totalGain - totalLoss;

  return { dealerHeat, territoryHeat, totalGain, naturalDecay, totalLoss, netPerTick };
}

export function calculateRivalHeatTick(
  currentRivalHeat: number,
  dealerCount: number,
  dealerTierIndex: number,
  businesses: BusinessInstance[],
): number {
  const breakdown = getRivalHeatBreakdown(dealerCount, dealerTierIndex, businesses);
  const newHeat = Math.max(0, Math.min(HEAT_MAX, currentRivalHeat + breakdown.netPerTick));
  return newHeat - currentRivalHeat;
}
