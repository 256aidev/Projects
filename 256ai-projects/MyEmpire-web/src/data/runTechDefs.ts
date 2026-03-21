// ─────────────────────────────────────────
// RUN TECH UPGRADES
// Temporary upgrades that reset on prestige reset or game reset.
// Cost only dirty cash (simpler than session tech).
// ─────────────────────────────────────────

export type RunTechId =
  | 'rtech_yield' | 'rtech_speed' | 'rtech_dealer' | 'rtech_launder'
  | 'rtech_heat' | 'rtech_price' | 'rtech_demand' | 'rtech_seeds';

export interface RunTechDef {
  id: RunTechId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costs: number[];  // dirty cash per level
  bonusType: string;
  bonusPerLevel: number;
}

export const RUN_TECH_UPGRADES: RunTechDef[] = [
  { id: 'rtech_yield', name: 'Growth Formula', icon: '🧬', description: 'Enhanced nutrients for bigger harvests', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'yield', bonusPerLevel: 0.05 },
  { id: 'rtech_speed', name: 'Turbo Lights', icon: '⚡', description: 'Overclocked lights for faster cycles', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'speed', bonusPerLevel: 0.05 },
  { id: 'rtech_dealer', name: 'Distribution Network', icon: '🤝', description: 'Optimized dealer routes for faster sales', maxLevel: 5, costs: [12000, 30000, 75000, 180000, 450000], bonusType: 'dealer', bonusPerLevel: 0.08 },
  { id: 'rtech_launder', name: 'Shell Companies', icon: '🏢', description: 'Complex corporate structures for laundering', maxLevel: 5, costs: [15000, 40000, 100000, 250000, 600000], bonusType: 'launder', bonusPerLevel: 0.05 },
  { id: 'rtech_heat', name: 'Lookout Crew', icon: '👀', description: 'Eyes on the street — less heat from everything', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'heat', bonusPerLevel: 0.05 },
  { id: 'rtech_price', name: 'Street Cred', icon: '💲', description: 'Reputation commands higher prices', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'price', bonusPerLevel: 0.05 },
  { id: 'rtech_demand', name: 'Market Expansion', icon: '📈', description: 'More customers seeking your product', maxLevel: 5, costs: [6000, 15000, 40000, 100000, 250000], bonusType: 'demand', bonusPerLevel: 30 },
  { id: 'rtech_seeds', name: 'Seed Supplier', icon: '🌱', description: 'Bulk deals from trusted suppliers', maxLevel: 5, costs: [5000, 12000, 30000, 75000, 200000], bonusType: 'seeds', bonusPerLevel: 0.10 },
];

export const RUN_TECH_MAP = Object.fromEntries(
  RUN_TECH_UPGRADES.map((d) => [d.id, d])
) as Record<RunTechId, RunTechDef>;

export const INITIAL_RUN_TECH: Record<RunTechId, number> = Object.fromEntries(
  RUN_TECH_UPGRADES.map(u => [u.id, 0])
) as Record<RunTechId, number>;

export function getRunTechBonuses(upgrades: Record<RunTechId, number>) {
  let yieldBonus = 0, speedBonus = 0, dealerMultiplier = 1, launderMultiplier = 1;
  let heatReduction = 0, priceBonus = 0, demandBonus = 0, seedDiscount = 0;
  for (const def of RUN_TECH_UPGRADES) {
    const level = upgrades[def.id] ?? 0;
    if (level === 0) continue;
    switch (def.bonusType) {
      case 'yield': yieldBonus += level * def.bonusPerLevel; break;
      case 'speed': speedBonus += level * def.bonusPerLevel; break;
      case 'dealer': dealerMultiplier *= 1 + level * def.bonusPerLevel; break;
      case 'launder': launderMultiplier *= 1 + level * def.bonusPerLevel; break;
      case 'heat': heatReduction += level * def.bonusPerLevel; break;
      case 'price': priceBonus += level * def.bonusPerLevel; break;
      case 'demand': demandBonus += level * def.bonusPerLevel; break;
      case 'seeds': seedDiscount += level * def.bonusPerLevel; break;
    }
  }
  return { yieldBonus, speedBonus, dealerMultiplier, launderMultiplier, heatReduction, priceBonus, demandBonus, seedDiscount };
}
