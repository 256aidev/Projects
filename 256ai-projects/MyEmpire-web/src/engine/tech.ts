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
  priceMultiplier: number;   // e.g. 1.2 for +20% sell price per oz
  // Room upgrade tech boosters (each +1% per level, stacks with room upgrades)
  floraGroBonus: number;     // extra grow speed from FloraGro research
  floraMicroBonus: number;   // extra yield from FloraMicro research
  floraBloomBonus: number;   // extra double chance from FloraBloom research
  waterBonus: number;        // extra grow speed from Water research
  lightBonus: number;        // extra grow speed from Light research
  // Crew combat bonuses
  crewAttackBonus: number;   // e.g. 0.15 = +15% crew attack per level
  crewDefenseBonus: number;  // e.g. 0.15 = +15% crew defense per level
  crewDiscount: number;      // e.g. 0.10 = -10% crew hire cost per level
  demandBonus: number;       // flat oz added to street demand
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
    priceMultiplier: 1 + (techUpgrades.tech_price ?? 0) * TECH_UPGRADE_MAP.tech_price.effectPerLevel,
    floraGroBonus: (techUpgrades.tech_flora_gro ?? 0) * TECH_UPGRADE_MAP.tech_flora_gro.effectPerLevel,
    floraMicroBonus: (techUpgrades.tech_flora_micro ?? 0) * TECH_UPGRADE_MAP.tech_flora_micro.effectPerLevel,
    floraBloomBonus: (techUpgrades.tech_flora_bloom ?? 0) * TECH_UPGRADE_MAP.tech_flora_bloom.effectPerLevel,
    waterBonus: (techUpgrades.tech_water ?? 0) * TECH_UPGRADE_MAP.tech_water.effectPerLevel,
    lightBonus: (techUpgrades.tech_light ?? 0) * TECH_UPGRADE_MAP.tech_light.effectPerLevel,
    crewAttackBonus: (techUpgrades.tech_crew_attack ?? 0) * (TECH_UPGRADE_MAP.tech_crew_attack?.effectPerLevel ?? 0.15),
    crewDefenseBonus: (techUpgrades.tech_crew_defense ?? 0) * (TECH_UPGRADE_MAP.tech_crew_defense?.effectPerLevel ?? 0.15),
    crewDiscount: (techUpgrades.tech_crew_discount ?? 0) * (TECH_UPGRADE_MAP.tech_crew_discount?.effectPerLevel ?? 0.10),
    demandBonus: (techUpgrades.tech_demand ?? 0) * (TECH_UPGRADE_MAP.tech_demand?.effectPerLevel ?? 20),
  };
}
