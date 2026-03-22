import type { SessionTechId } from '../data/sessionTechDefs';
import { SESSION_TECH_MAP } from '../data/sessionTechDefs';

export interface SessionTechBonuses {
  yieldBonus: number;        // additive yield boost
  speedBonus: number;        // additive speed boost (fraction)
  dealerMultiplier: number;  // e.g. 1.45 for +45% dealer sales
  launderMultiplier: number; // e.g. 1.30 for +30% launder efficiency
  heatReduction: number;     // e.g. 0.30 means 30% less heat gain
  demandBonus: number;       // flat +N oz street demand
  seedDiscount: number;      // e.g. 0.45 means 45% cheaper seeds
  // Room upgrade boosters (session)
  floraGroBonus: number;
  floraMicroBonus: number;
  floraBloomBonus: number;
  waterBonus: number;
  lightBonus: number;
  // Run tech pass-through bonuses
  dealerCutReduction: number;  // fraction to reduce dealer cut
  bizIncome: number;           // fraction to boost business revenue
  bizCapacity: number;         // fraction to boost launder capacity
  lawyerPower: number;         // fraction to boost lawyer decay
  crewDef: number;             // fraction to boost crew defense
}

/** Compute session tech bonuses from current upgrade levels */
export function getSessionTechBonuses(sessionTech: Record<SessionTechId, number>): SessionTechBonuses {
  return {
    yieldBonus: sessionTech.stech_yield * SESSION_TECH_MAP.stech_yield.effectPerLevel,
    speedBonus: sessionTech.stech_speed * SESSION_TECH_MAP.stech_speed.effectPerLevel,
    dealerMultiplier: 1 + sessionTech.stech_dealer * SESSION_TECH_MAP.stech_dealer.effectPerLevel,
    launderMultiplier: 1 + sessionTech.stech_launder * SESSION_TECH_MAP.stech_launder.effectPerLevel,
    heatReduction: sessionTech.stech_heat * SESSION_TECH_MAP.stech_heat.effectPerLevel,
    demandBonus: sessionTech.stech_demand * SESSION_TECH_MAP.stech_demand.effectPerLevel,
    seedDiscount: sessionTech.stech_seeds * SESSION_TECH_MAP.stech_seeds.effectPerLevel,
    floraGroBonus: (sessionTech.stech_flora_gro ?? 0) * SESSION_TECH_MAP.stech_flora_gro.effectPerLevel,
    floraMicroBonus: (sessionTech.stech_flora_micro ?? 0) * SESSION_TECH_MAP.stech_flora_micro.effectPerLevel,
    floraBloomBonus: (sessionTech.stech_flora_bloom ?? 0) * SESSION_TECH_MAP.stech_flora_bloom.effectPerLevel,
    waterBonus: (sessionTech.stech_water ?? 0) * SESSION_TECH_MAP.stech_water.effectPerLevel,
    lightBonus: (sessionTech.stech_light ?? 0) * SESSION_TECH_MAP.stech_light.effectPerLevel,
    dealerCutReduction: 0,
    bizIncome: 0,
    bizCapacity: 0,
    lawyerPower: 0,
    crewDef: 0,
  };
}
