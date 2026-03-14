import type { TechUpgradeId } from '../data/techDefs';
import { TECH_UPGRADE_MAP } from '../data/techDefs';

export interface TechBonuses {
  yieldBonus: number;        // additive with room yield bonus
  speedBonus: number;        // additive with room speed bonus
  doubleChance: number;      // additive with room double chance
  capacityBonus: number;     // flat +N plants per room
  dealerMultiplier: number;  // e.g. 1.2 for +20% dealer sales
  launderMultiplier: number; // e.g. 1.1 for +10% launder efficiency
  heatReduction: number;     // e.g. 0.16 means 16% less heat gain
}

/** Compute all tech bonuses from current upgrade levels */
export function getTechBonuses(techUpgrades: Record<TechUpgradeId, number>): TechBonuses {
  return {
    yieldBonus: techUpgrades.tech_yield * TECH_UPGRADE_MAP.tech_yield.effectPerLevel,
    speedBonus: techUpgrades.tech_speed * TECH_UPGRADE_MAP.tech_speed.effectPerLevel,
    doubleChance: techUpgrades.tech_double * TECH_UPGRADE_MAP.tech_double.effectPerLevel,
    capacityBonus: techUpgrades.tech_capacity * TECH_UPGRADE_MAP.tech_capacity.effectPerLevel,
    dealerMultiplier: 1 + techUpgrades.tech_dealer * TECH_UPGRADE_MAP.tech_dealer.effectPerLevel,
    launderMultiplier: 1 + techUpgrades.tech_launder * TECH_UPGRADE_MAP.tech_launder.effectPerLevel,
    heatReduction: techUpgrades.tech_heat * TECH_UPGRADE_MAP.tech_heat.effectPerLevel,
  };
}
