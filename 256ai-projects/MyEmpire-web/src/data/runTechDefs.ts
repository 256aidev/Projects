// ─────────────────────────────────────────
// RUN TECH UPGRADES
// Temporary upgrades that reset on prestige reset or game reset.
// Cost only dirty cash (simpler than session tech).
// ─────────────────────────────────────────

export type RunTechId =
  // Original 8
  | 'rtech_yield' | 'rtech_speed' | 'rtech_dealer' | 'rtech_launder'
  | 'rtech_heat' | 'rtech_price' | 'rtech_demand' | 'rtech_seeds'
  // New 16
  | 'rtech_double' | 'rtech_harvest_size' | 'rtech_auto_speed' | 'rtech_dealer_cut'
  | 'rtech_biz_income' | 'rtech_biz_capacity' | 'rtech_lot_discount' | 'rtech_lawyer_power'
  | 'rtech_crew_atk' | 'rtech_crew_def' | 'rtech_crew_cost' | 'rtech_rival_weak'
  | 'rtech_casino_luck' | 'rtech_jewelry_value' | 'rtech_car_boost' | 'rtech_xp_boost';

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
  // ── Growing & Production ──
  { id: 'rtech_yield', name: 'Growth Formula', icon: '🧬', description: 'Enhanced nutrients for bigger harvests', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'yield', bonusPerLevel: 0.05 },
  { id: 'rtech_speed', name: 'Turbo Lights', icon: '⚡', description: 'Overclocked lights for faster cycles', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'speed', bonusPerLevel: 0.05 },
  { id: 'rtech_double', name: 'Selective Cloning', icon: '🔬', description: 'Clone top phenotypes for double harvests', maxLevel: 5, costs: [15000, 35000, 80000, 200000, 500000], bonusType: 'double', bonusPerLevel: 0.03 },
  { id: 'rtech_harvest_size', name: 'Mega Pots', icon: '🪴', description: 'Larger containers = bigger plants per slot', maxLevel: 5, costs: [12000, 30000, 70000, 175000, 450000], bonusType: 'harvest_size', bonusPerLevel: 0.08 },
  { id: 'rtech_auto_speed', name: 'Smart Timers', icon: '⏱️', description: 'Automated scheduling shaves grow cycles', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'auto_speed', bonusPerLevel: 0.03 },
  { id: 'rtech_seeds', name: 'Seed Supplier', icon: '🌱', description: 'Bulk deals from trusted suppliers', maxLevel: 5, costs: [5000, 12000, 30000, 75000, 200000], bonusType: 'seeds', bonusPerLevel: 0.10 },

  // ── Sales & Distribution ──
  { id: 'rtech_dealer', name: 'Distribution Network', icon: '🤝', description: 'Optimized dealer routes for faster sales', maxLevel: 5, costs: [12000, 30000, 75000, 180000, 450000], bonusType: 'dealer', bonusPerLevel: 0.08 },
  { id: 'rtech_price', name: 'Street Cred', icon: '💲', description: 'Reputation commands higher prices', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'price', bonusPerLevel: 0.05 },
  { id: 'rtech_demand', name: 'Market Expansion', icon: '📈', description: 'More customers seeking your product', maxLevel: 5, costs: [6000, 15000, 40000, 100000, 250000], bonusType: 'demand', bonusPerLevel: 30 },
  { id: 'rtech_dealer_cut', name: 'Loyalty Program', icon: '🤑', description: 'Dealers take a smaller cut per sale', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'dealer_cut', bonusPerLevel: 0.05 },

  // ── Laundering & Business ──
  { id: 'rtech_launder', name: 'Shell Companies', icon: '🏢', description: 'Complex corporate structures for laundering', maxLevel: 5, costs: [15000, 40000, 100000, 250000, 600000], bonusType: 'launder', bonusPerLevel: 0.05 },
  { id: 'rtech_biz_income', name: 'Front Optimization', icon: '📊', description: 'Squeeze more clean cash from each business', maxLevel: 5, costs: [12000, 30000, 75000, 180000, 450000], bonusType: 'biz_income', bonusPerLevel: 0.06 },
  { id: 'rtech_biz_capacity', name: 'Expansion Permits', icon: '📋', description: 'Each business launders more per tick', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'biz_capacity', bonusPerLevel: 0.08 },
  { id: 'rtech_lot_discount', name: 'Real Estate Connections', icon: '🏠', description: 'Insider deals on lot purchases', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'lot_discount', bonusPerLevel: 0.08 },

  // ── Heat & Legal ──
  { id: 'rtech_heat', name: 'Lookout Crew', icon: '👀', description: 'Eyes on the street — less heat from everything', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'heat', bonusPerLevel: 0.05 },
  { id: 'rtech_lawyer_power', name: 'Legal Retainer', icon: '⚖️', description: 'Lawyers work harder — faster heat decay', maxLevel: 5, costs: [12000, 30000, 75000, 180000, 450000], bonusType: 'lawyer_power', bonusPerLevel: 0.10 },

  // ── Combat & Crew ──
  { id: 'rtech_crew_atk', name: 'Combat Training', icon: '🥊', description: 'Train your crew to hit harder', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'crew_atk', bonusPerLevel: 0.08 },
  { id: 'rtech_crew_def', name: 'Body Armor', icon: '🛡️', description: 'Better protection for your crew', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'crew_def', bonusPerLevel: 0.08 },
  { id: 'rtech_crew_cost', name: 'Recruitment Drive', icon: '📢', description: 'Cheaper crew hiring costs', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'crew_cost', bonusPerLevel: 0.06 },
  { id: 'rtech_rival_weak', name: 'Intelligence Network', icon: '🕵️', description: 'Attacks deal more weakness to rivals', maxLevel: 5, costs: [15000, 40000, 100000, 250000, 600000], bonusType: 'rival_weak', bonusPerLevel: 0.10 },

  // ── Luxury & Prestige ──
  { id: 'rtech_casino_luck', name: 'Card Counting', icon: '🃏', description: 'Better odds at the casino', maxLevel: 5, costs: [8000, 20000, 50000, 125000, 300000], bonusType: 'casino_luck', bonusPerLevel: 0.05 },
  { id: 'rtech_jewelry_value', name: 'Gem Appraiser', icon: '💎', description: 'Jewelry appreciates faster', maxLevel: 5, costs: [10000, 25000, 60000, 150000, 400000], bonusType: 'jewelry_value', bonusPerLevel: 0.10 },
  { id: 'rtech_car_boost', name: 'Performance Tuning', icon: '🏎️', description: 'All car bonuses amplified', maxLevel: 5, costs: [12000, 30000, 75000, 180000, 450000], bonusType: 'car_boost', bonusPerLevel: 0.05 },
  { id: 'rtech_xp_boost', name: 'Street Wisdom', icon: '📚', description: 'Earn more score points from everything', maxLevel: 5, costs: [20000, 50000, 125000, 300000, 750000], bonusType: 'xp_boost', bonusPerLevel: 0.05 },
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
  let doubleChance = 0, harvestSize = 0, dealerCutReduction = 0;
  let bizIncome = 0, bizCapacity = 0, lotDiscount = 0, lawyerPower = 0;
  let crewAtk = 0, crewDef = 0, crewCost = 0, rivalWeak = 0;
  let casinoLuck = 0, jewelryValue = 0, carBoost = 0, xpBoost = 0;

  for (const def of RUN_TECH_UPGRADES) {
    const level = upgrades[def.id] ?? 0;
    if (level === 0) continue;
    switch (def.bonusType) {
      case 'yield': yieldBonus += level * def.bonusPerLevel; break;
      case 'speed': speedBonus += level * def.bonusPerLevel; break;
      case 'double': doubleChance += level * def.bonusPerLevel; break;
      case 'harvest_size': harvestSize += level * def.bonusPerLevel; break;
      case 'auto_speed': speedBonus += level * def.bonusPerLevel; break; // stacks with speed
      case 'dealer': dealerMultiplier *= 1 + level * def.bonusPerLevel; break;
      case 'launder': launderMultiplier *= 1 + level * def.bonusPerLevel; break;
      case 'heat': heatReduction += level * def.bonusPerLevel; break;
      case 'price': priceBonus += level * def.bonusPerLevel; break;
      case 'demand': demandBonus += level * def.bonusPerLevel; break;
      case 'seeds': seedDiscount += level * def.bonusPerLevel; break;
      case 'dealer_cut': dealerCutReduction += level * def.bonusPerLevel; break;
      case 'biz_income': bizIncome += level * def.bonusPerLevel; break;
      case 'biz_capacity': bizCapacity += level * def.bonusPerLevel; break;
      case 'lot_discount': lotDiscount += level * def.bonusPerLevel; break;
      case 'lawyer_power': lawyerPower += level * def.bonusPerLevel; break;
      case 'crew_atk': crewAtk += level * def.bonusPerLevel; break;
      case 'crew_def': crewDef += level * def.bonusPerLevel; break;
      case 'crew_cost': crewCost += level * def.bonusPerLevel; break;
      case 'rival_weak': rivalWeak += level * def.bonusPerLevel; break;
      case 'casino_luck': casinoLuck += level * def.bonusPerLevel; break;
      case 'jewelry_value': jewelryValue += level * def.bonusPerLevel; break;
      case 'car_boost': carBoost += level * def.bonusPerLevel; break;
      case 'xp_boost': xpBoost += level * def.bonusPerLevel; break;
    }
  }
  return {
    yieldBonus, speedBonus, dealerMultiplier, launderMultiplier,
    heatReduction, priceBonus, demandBonus, seedDiscount,
    doubleChance, harvestSize, dealerCutReduction,
    bizIncome, bizCapacity, lotDiscount, lawyerPower,
    crewAtk, crewDef, crewCost, rivalWeak,
    casinoLuck, jewelryValue, carBoost, xpBoost,
  };
}
