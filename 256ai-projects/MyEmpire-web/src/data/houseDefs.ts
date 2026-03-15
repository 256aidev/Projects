// ─────────────────────────────────────────
// HOUSE & HQ UPGRADE DEFINITIONS
// ─────────────────────────────────────────

export interface HouseTier {
  name: string;
  icon: string;
  description: string;
  upgradeCost: number;       // clean cash to upgrade
  // Bonuses
  heatDecayBonus: number;    // additive heat decay per tick (safe at home)
  storageBonus: number;      // extra oz stash capacity (flavor)
}

export interface HQTier {
  name: string;
  icon: string;
  description: string;
  upgradeCost: number;       // dirty cash to upgrade
  // Bonuses
  crewCapBonus: number;      // +N max crew slots across all tiers
  rivalInfoLevel: number;    // 0=none, 1=basic stats, 2=full intel
  planningBonus: number;     // % bonus to attack success
}

export const HOUSE_TIERS: HouseTier[] = [
  {
    name: 'Starter Pad',
    icon: '🏚️',
    description: 'A run-down apartment. At least the rent is cheap.',
    upgradeCost: 0,
    heatDecayBonus: 0,
    storageBonus: 0,
  },
  {
    name: 'Bungalow',
    icon: '🏠',
    description: 'Small house with a yard. Starting to look legit.',
    upgradeCost: 25000,
    heatDecayBonus: 0.02,
    storageBonus: 100,
  },
  {
    name: 'Villa',
    icon: '🏡',
    description: 'Nice place with a pool out back. The neighbors are suspicious.',
    upgradeCost: 150000,
    heatDecayBonus: 0.05,
    storageBonus: 500,
  },
  {
    name: 'Mansion',
    icon: '🏰',
    description: 'Gated estate. Security cameras. Wine cellar hides the real cellar.',
    upgradeCost: 750000,
    heatDecayBonus: 0.10,
    storageBonus: 2000,
  },
  {
    name: 'Mega Mansion',
    icon: '👑',
    description: 'Hilltop palace with helipad. You made it. Giant pool, nature surrounds it.',
    upgradeCost: 5000000,
    heatDecayBonus: 0.20,
    storageBonus: 10000,
  },
];

export const HQ_TIERS: HQTier[] = [
  {
    name: 'No HQ',
    icon: '🚫',
    description: 'Operating out of your car. Not ideal.',
    upgradeCost: 0,
    crewCapBonus: 0,
    rivalInfoLevel: 0,
    planningBonus: 0,
  },
  {
    name: 'Back Room',
    icon: '🚪',
    description: 'A room behind the laundromat. Maps on the wall, burner phones.',
    upgradeCost: 10000,
    crewCapBonus: 2,
    rivalInfoLevel: 1,
    planningBonus: 0.05,
  },
  {
    name: 'Office',
    icon: '🏢',
    description: 'Legit-looking office space. Security system. Planning table.',
    upgradeCost: 100000,
    crewCapBonus: 5,
    rivalInfoLevel: 1,
    planningBonus: 0.10,
  },
  {
    name: 'Compound',
    icon: '🏗️',
    description: 'Walled compound with guard posts. War room with full intel.',
    upgradeCost: 500000,
    crewCapBonus: 10,
    rivalInfoLevel: 2,
    planningBonus: 0.20,
  },
  {
    name: 'Fortress',
    icon: '🏰',
    description: 'Underground bunker. Surveillance on every rival. Untouchable.',
    upgradeCost: 3000000,
    crewCapBonus: 20,
    rivalInfoLevel: 2,
    planningBonus: 0.35,
  },
];
