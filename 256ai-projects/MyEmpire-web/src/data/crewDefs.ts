// ─────────────────────────────────────────
// CRIME FAMILY — Crew Member Definitions
// ─────────────────────────────────────────
// Crew replace hitmen. Each tier provides combat stats AND passive bonuses.
// The player is the Boss. Crew are AI members of your crime family.

export type CrewTier = 'soldier' | 'lieutenant' | 'captain' | 'consigliere';

export interface CrewBonuses {
  heatReduction: number;     // additive (0.02 = -2% heat gain)
  costReduction: number;     // multiplier (0.05 = -5% costs)
  incomeMultiplier: number;  // multiplier (0.05 = +5% dirty income)
  dealerBoost: number;       // multiplier (0.03 = +3% dealer sales)
  launderBoost: number;      // multiplier (0.05 = +5% launder efficiency)
}

export interface CrewDef {
  id: string;
  name: string;
  tier: CrewTier;
  icon: string;
  cost: number;           // dirty cash to recruit
  attack: number;
  defense: number;
  upkeep: number;         // dirty cash per tick
  maxCount: number;
  // Per-member bonus (stacks with count)
  bonuses: Partial<CrewBonuses>;
  description: string;
}

export interface HiredCrew {
  defId: string;
  count: number;
}

export const CREW_DEFS: CrewDef[] = [
  {
    id: 'soldier',
    name: 'Street Soldier',
    tier: 'soldier',
    icon: '🔫',
    cost: 5000,
    attack: 10,
    defense: 5,
    upkeep: 2,
    maxCount: 10,
    bonuses: { heatReduction: 0.02 },
    description: 'Low-level muscle. Each soldier reduces heat gain by 2%.',
  },
  {
    id: 'lieutenant',
    name: 'Lieutenant',
    tier: 'lieutenant',
    icon: '🎖️',
    cost: 25000,
    attack: 25,
    defense: 15,
    upkeep: 8,
    maxCount: 5,
    bonuses: { costReduction: 0.05, dealerBoost: 0.03 },
    description: 'Mid-level enforcer. Reduces crew costs by 5% and boosts dealer sales by 3%.',
  },
  {
    id: 'captain',
    name: 'Captain',
    tier: 'captain',
    icon: '⭐',
    cost: 100000,
    attack: 60,
    defense: 30,
    upkeep: 25,
    maxCount: 3,
    bonuses: { incomeMultiplier: 0.05, heatReduction: 0.05, launderBoost: 0.05 },
    description: 'High-level operator. +5% income, -5% heat, +5% launder efficiency.',
  },
  {
    id: 'consigliere',
    name: 'Consigliere',
    tier: 'consigliere',
    icon: '👔',
    cost: 500000,
    attack: 150,
    defense: 80,
    upkeep: 80,
    maxCount: 1,
    bonuses: { costReduction: 0.15, incomeMultiplier: 0.10, heatReduction: 0.10 },
    description: 'Your right hand. -15% all costs, +10% income, -10% heat.',
  },
];

export const CREW_MAP = Object.fromEntries(CREW_DEFS.map(c => [c.id, c]));

export const CREW_TIER_ORDER: CrewTier[] = ['soldier', 'lieutenant', 'captain', 'consigliere'];

/** Calculate total bonuses from all hired crew members */
export function getCrewBonuses(hiredCrew: HiredCrew[]): CrewBonuses {
  const totals: CrewBonuses = {
    heatReduction: 0,
    costReduction: 0,
    incomeMultiplier: 0,
    dealerBoost: 0,
    launderBoost: 0,
  };
  for (const hired of hiredCrew) {
    const def = CREW_MAP[hired.defId];
    if (!def) continue;
    const b = def.bonuses;
    totals.heatReduction += (b.heatReduction ?? 0) * hired.count;
    totals.costReduction += (b.costReduction ?? 0) * hired.count;
    totals.incomeMultiplier += (b.incomeMultiplier ?? 0) * hired.count;
    totals.dealerBoost += (b.dealerBoost ?? 0) * hired.count;
    totals.launderBoost += (b.launderBoost ?? 0) * hired.count;
  }
  return totals;
}

/** Get total crew attack power */
export function getCrewAttack(hiredCrew: HiredCrew[], techBonus = 0): number {
  const base = hiredCrew.reduce((sum, h) => {
    const def = CREW_MAP[h.defId];
    return sum + (def ? h.count * def.attack : 0);
  }, 0);
  return Math.floor(base * (1 + techBonus));
}

/** Get total crew defense power */
export function getCrewDefense(hiredCrew: HiredCrew[], techBonus = 0): number {
  const base = hiredCrew.reduce((sum, h) => {
    const def = CREW_MAP[h.defId];
    return sum + (def ? h.count * def.defense : 0);
  }, 0);
  return Math.floor(base * (1 + techBonus));
}

/** Get total crew upkeep per tick */
export function getCrewUpkeep(hiredCrew: HiredCrew[]): number {
  return hiredCrew.reduce((sum, h) => {
    const def = CREW_MAP[h.defId];
    return sum + (def ? h.count * def.upkeep : 0);
  }, 0);
}

/** Get total crew member count */
export function getCrewCount(hiredCrew: HiredCrew[]): number {
  return hiredCrew.reduce((sum, h) => sum + h.count, 0);
}
