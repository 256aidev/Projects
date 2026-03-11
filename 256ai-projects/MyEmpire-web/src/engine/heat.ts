import type { BusinessInstance, HeatTier } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';

const HEAT_NOTICE_THRESHOLD = 100_000;

export function getHeatTier(heat: number): HeatTier {
  if (heat >= 90) return 4;
  if (heat >= 75) return 3;
  if (heat >= 50) return 2;
  if (heat >= 25) return 1;
  return 0;
}

export function calculateHeatTick(
  currentHeat: number,
  totalEarned: number,
  businesses: BusinessInstance[],
): number {
  if (totalEarned < HEAT_NOTICE_THRESHOLD) return 0;

  const businessCount = businesses.filter((b) => b.isOperating).length;

  // Base gain from running businesses
  const baseGain = businessCount * 0.005;

  // Natural decay
  let decay = 0.01;

  // Heat reduction from front businesses
  for (const biz of businesses) {
    if (!biz.isOperating) continue;
    const def = BUSINESS_MAP[biz.businessDefId];
    if (!def) continue;
    decay += def.heatReductionPerTick * 0.005;
  }

  // Average police presence multiplier from districts with businesses
  const districtIds = [...new Set(businesses.filter((b) => b.isOperating).map((b) => b.districtId))];
  let policeMultiplier = 1;
  if (districtIds.length > 0) {
    policeMultiplier = districtIds.reduce((sum, id) => {
      const d = DISTRICT_MAP[id];
      return sum + (d?.policePresenceMultiplier ?? 1);
    }, 0) / districtIds.length;
  }

  const heatDelta = (baseGain * policeMultiplier) - decay;
  const newHeat = Math.max(0, Math.min(100, currentHeat + heatDelta));
  return newHeat - currentHeat;
}
