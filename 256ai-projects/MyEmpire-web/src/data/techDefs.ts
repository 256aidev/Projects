import type { GameState } from './types';

// ─────────────────────────────────────────
// TECH UPGRADE DEFINITIONS
// ─────────────────────────────────────────

export type TechUpgradeId =
  | 'tech_yield'
  | 'tech_speed'
  | 'tech_double'
  | 'tech_capacity'
  | 'tech_dealer'
  | 'tech_launder'
  | 'tech_heat'
  | 'tech_price'
  | 'tech_flora_gro'
  | 'tech_flora_micro'
  | 'tech_flora_bloom'
  | 'tech_water'
  | 'tech_light'
  | 'tech_start_dirty'
  | 'tech_start_clean'
  | 'tech_start_seeds';

export interface TechUpgradeDef {
  id: TechUpgradeId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costs: number[];          // TP cost per level [L1, L2, L3, L4, L5]
  effectPerLevel: number;   // the numeric bonus per level
  effectLabel: string;      // human-readable per-level effect
  bonusType: 'yield' | 'speed' | 'double' | 'capacity' | 'dealer' | 'launder' | 'heat' | 'price' | 'flora_gro' | 'flora_micro' | 'flora_bloom' | 'water' | 'light' | 'start_dirty' | 'start_clean' | 'start_seeds';
  bonusPerLevel?: number[];  // per-level bonus values (for non-linear scaling, e.g. starting money)
}

/** Generate doubling cost array: baseCost, baseCost*2, baseCost*4, ... */
function doublingCosts(baseCost: number, levels: number): number[] {
  return Array.from({ length: levels }, (_, i) => baseCost * Math.pow(2, i));
}

const ROOM_UPGRADE_MAX = 50; // effectively infinite

export const TECH_UPGRADE_DEFS: TechUpgradeDef[] = [
  {
    id: 'tech_yield',
    name: 'Hybrid Genetics',
    icon: '🧬',
    description: 'Advanced strain genetics for bigger harvests',
    maxLevel: 5,
    costs: [1, 2, 4, 7, 12],
    effectPerLevel: 0.05,
    effectLabel: '+5% yield',
    bonusType: 'yield',
  },
  {
    id: 'tech_speed',
    name: 'LED Matrix',
    icon: '⚡',
    description: 'High-efficiency grow lights for faster cycles',
    maxLevel: 5,
    costs: [1, 2, 4, 7, 12],
    effectPerLevel: 0.03,
    effectLabel: '-3% grow time',
    bonusType: 'speed',
  },
  {
    id: 'tech_double',
    name: 'Selective Breeding',
    icon: '🎰',
    description: 'Careful phenotype selection for double yields',
    maxLevel: 5,
    costs: [1, 3, 5, 8, 14],
    effectPerLevel: 0.02,
    effectLabel: '+2% double chance',
    bonusType: 'double',
  },
  {
    id: 'tech_capacity',
    name: 'Vertical Farming',
    icon: '🏗️',
    description: 'Stacked grow racks — more plants per room',
    maxLevel: 5,
    costs: [2, 3, 5, 8, 14],
    effectPerLevel: 1,
    effectLabel: '+1 plant/room',
    bonusType: 'capacity',
  },
  {
    id: 'tech_dealer',
    name: 'Supply Chain',
    icon: '🤝',
    description: 'Optimized distribution for faster dealer sales',
    maxLevel: 5,
    costs: [2, 4, 6, 10, 16],
    effectPerLevel: 0.10,
    effectLabel: '+10% dealer sales',
    bonusType: 'dealer',
  },
  {
    id: 'tech_launder',
    name: 'Creative Accounting',
    icon: '📒',
    description: 'Better books — more clean cash per dollar laundered',
    maxLevel: 5,
    costs: [2, 4, 6, 10, 16],
    effectPerLevel: 0.05,
    effectLabel: '+5% launder efficiency',
    bonusType: 'launder',
  },
  {
    id: 'tech_heat',
    name: 'Clean Operation',
    icon: '🧹',
    description: 'Tighter OPSEC — less heat from all sources',
    maxLevel: 5,
    costs: [3, 5, 8, 12, 18],
    effectPerLevel: 0.08,
    effectLabel: '-8% heat gain',
    bonusType: 'heat',
  },
  {
    id: 'tech_price',
    name: 'Premium Branding',
    icon: '💲',
    description: 'Reputation & packaging — higher price per ounce',
    maxLevel: 5,
    costs: [2, 4, 7, 11, 18],
    effectPerLevel: 0.10,
    effectLabel: '+10% sell price',
    bonusType: 'price',
  },
  // ─── ROOM UPGRADE BOOSTERS — infinite +1% per level, cost doubles ───
  {
    id: 'tech_flora_gro',
    name: 'FloraGro Research',
    icon: '🟢',
    description: 'Improve FloraGro nutrient formula — +1% grow speed per level',
    maxLevel: ROOM_UPGRADE_MAX,
    costs: doublingCosts(1, ROOM_UPGRADE_MAX),
    effectPerLevel: 0.01,
    effectLabel: '+1% grow speed',
    bonusType: 'flora_gro',
  },
  {
    id: 'tech_flora_micro',
    name: 'FloraMicro Research',
    icon: '🟣',
    description: 'Refine FloraMicro nutrients — +1% yield per level',
    maxLevel: ROOM_UPGRADE_MAX,
    costs: doublingCosts(1, ROOM_UPGRADE_MAX),
    effectPerLevel: 0.01,
    effectLabel: '+1% yield',
    bonusType: 'flora_micro',
  },
  {
    id: 'tech_flora_bloom',
    name: 'FloraBloom Research',
    icon: '🔴',
    description: 'Perfect FloraBloom ratios — +1% double harvest chance per level',
    maxLevel: ROOM_UPGRADE_MAX,
    costs: doublingCosts(1, ROOM_UPGRADE_MAX),
    effectPerLevel: 0.01,
    effectLabel: '+1% double chance',
    bonusType: 'flora_bloom',
  },
  {
    id: 'tech_water',
    name: 'Water Systems Research',
    icon: '💧',
    description: 'Advanced irrigation tech — +1% grow speed per level',
    maxLevel: ROOM_UPGRADE_MAX,
    costs: doublingCosts(1, ROOM_UPGRADE_MAX),
    effectPerLevel: 0.01,
    effectLabel: '+1% grow speed',
    bonusType: 'water',
  },
  {
    id: 'tech_light',
    name: 'Light Tech Research',
    icon: '💡',
    description: 'Next-gen lighting science — +1% grow speed per level',
    maxLevel: ROOM_UPGRADE_MAX,
    costs: doublingCosts(1, ROOM_UPGRADE_MAX),
    effectPerLevel: 0.01,
    effectLabel: '+1% grow speed',
    bonusType: 'light',
  },
  // ─── STARTING MONEY BOOSTERS — applied at prestige/new game ───
  {
    id: 'tech_start_dirty',
    name: 'Seed Money',
    icon: '💵',
    description: 'Start each run with bonus dirty cash',
    maxLevel: 5,
    costs: [2, 4, 6, 10, 16],
    effectPerLevel: 0,
    effectLabel: 'bonus starting dirty cash',
    bonusType: 'start_dirty',
    bonusPerLevel: [5000, 15000, 30000, 60000, 120000],
  },
  {
    id: 'tech_start_clean',
    name: 'Trust Fund',
    icon: '🏦',
    description: 'Start each run with bonus clean cash',
    maxLevel: 5,
    costs: [2, 4, 6, 10, 16],
    effectPerLevel: 0,
    effectLabel: 'bonus starting clean cash',
    bonusType: 'start_clean',
    bonusPerLevel: [2000, 6000, 15000, 35000, 75000],
  },
  {
    id: 'tech_start_seeds',
    name: 'Seed Vault',
    icon: '🌱',
    description: 'Start each run with bonus seeds',
    maxLevel: 5,
    costs: [1, 2, 4, 7, 12],
    effectPerLevel: 0,
    effectLabel: 'bonus starting seeds',
    bonusType: 'start_seeds',
    bonusPerLevel: [50, 150, 400, 1000, 3000],
  },
];

export const TECH_UPGRADE_MAP = Object.fromEntries(
  TECH_UPGRADE_DEFS.map((d) => [d.id, d])
) as Record<TechUpgradeId, TechUpgradeDef>;

export const INITIAL_TECH_UPGRADES: Record<TechUpgradeId, number> = {
  tech_yield: 0,
  tech_speed: 0,
  tech_double: 0,
  tech_capacity: 0,
  tech_dealer: 0,
  tech_launder: 0,
  tech_heat: 0,
  tech_price: 0,
  tech_flora_gro: 0,
  tech_flora_micro: 0,
  tech_flora_bloom: 0,
  tech_water: 0,
  tech_light: 0,
  tech_start_dirty: 0,
  tech_start_clean: 0,
  tech_start_seeds: 0,
};

// ─────────────────────────────────────────
// PRESTIGE MILESTONES
// ─────────────────────────────────────────

export interface PrestigeMilestone {
  id: string;
  name: string;
  icon: string;
  check: (state: GameState) => boolean;
  bonusTP: number;
}

export const PRESTIGE_MILESTONES: PrestigeMilestone[] = [
  // Total Dirty Earned
  { id: 'dirty_50m',   name: '$50M dirty earned',    icon: '💵', check: (s) => s.totalDirtyEarned >= 50_000_000,         bonusTP: 1 },
  { id: 'dirty_250m',  name: '$250M dirty earned',   icon: '💵', check: (s) => s.totalDirtyEarned >= 250_000_000,        bonusTP: 2 },
  { id: 'dirty_1b',    name: '$1B dirty earned',     icon: '💵', check: (s) => s.totalDirtyEarned >= 1_000_000_000,      bonusTP: 3 },
  { id: 'dirty_10b',   name: '$10B dirty earned',    icon: '💵', check: (s) => s.totalDirtyEarned >= 10_000_000_000,     bonusTP: 5 },
  { id: 'dirty_100b',  name: '$100B dirty earned',   icon: '💵', check: (s) => s.totalDirtyEarned >= 100_000_000_000,    bonusTP: 8 },
  { id: 'dirty_1t',    name: '$1T dirty earned',     icon: '💵', check: (s) => s.totalDirtyEarned >= 1_000_000_000_000,  bonusTP: 15 },
  // Total Clean Earned
  { id: 'clean_1m',    name: '$1M clean earned',     icon: '🏦', check: (s) => s.totalCleanEarned >= 1_000_000,       bonusTP: 1 },
  { id: 'clean_5m',   name: '$5M clean earned',     icon: '🏦', check: (s) => s.totalCleanEarned >= 5_000_000,     bonusTP: 2 },
  { id: 'clean_50m',  name: '$50M clean earned',    icon: '🏦', check: (s) => s.totalCleanEarned >= 50_000_000,    bonusTP: 3 },
  { id: 'clean_100m', name: '$100M clean earned',   icon: '🏦', check: (s) => s.totalCleanEarned >= 100_000_000,   bonusTP: 5 },
  { id: 'clean_1b',   name: '$1B clean earned',     icon: '🏦', check: (s) => s.totalCleanEarned >= 1_000_000_000, bonusTP: 8 },
  // Grow Rooms
  { id: 'rooms_3',    name: '3 grow rooms',         icon: '🌿', check: (s) => s.operation.growRooms.length >= 3,    bonusTP: 1 },
  { id: 'rooms_6',    name: '6 grow rooms',         icon: '🌿', check: (s) => s.operation.growRooms.length >= 6,    bonusTP: 1 },
  { id: 'rooms_10',   name: '10 grow rooms',        icon: '🌿', check: (s) => s.operation.growRooms.length >= 10,   bonusTP: 2 },
  // Front Businesses
  { id: 'biz_3',      name: '3 front businesses',   icon: '🏢', check: (s) => s.businesses.length >= 3,             bonusTP: 1 },
  { id: 'biz_8',      name: '8 front businesses',   icon: '🏢', check: (s) => s.businesses.length >= 8,             bonusTP: 1 },
  { id: 'biz_15',     name: '15 front businesses',  icon: '🏢', check: (s) => s.businesses.length >= 15,            bonusTP: 2 },
  // Districts
  { id: 'dist_4',     name: '4 districts unlocked', icon: '🗺️', check: (s) => s.unlockedDistricts.length >= 4,      bonusTP: 1 },
  { id: 'dist_8',     name: '8 districts unlocked', icon: '🗺️', check: (s) => s.unlockedDistricts.length >= 8,      bonusTP: 2 },
  // Rivals
  { id: 'rival_1',    name: '1 rival defeated',      icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 1, bonusTP: 1 },
  { id: 'rival_2',    name: '2 rivals defeated',     icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 2, bonusTP: 2 },
  { id: 'rival_3',    name: '3 rivals defeated',     icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 3, bonusTP: 3 },
  { id: 'rival_4',    name: '4 rivals defeated',     icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 4, bonusTP: 4 },
  { id: 'rival_5',    name: '5 rivals defeated',     icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 5, bonusTP: 5 },
];

/** Calculate Tech Points earned for a prestige reset */
export function calculatePrestigeTP(state: GameState): { total: number; milestones: { milestone: PrestigeMilestone; achieved: boolean }[] } {
  const milestones = PRESTIGE_MILESTONES.map((m) => ({
    milestone: m,
    achieved: m.check(state),
  }));
  const bonusTP = milestones.filter((m) => m.achieved).reduce((sum, m) => sum + m.milestone.bonusTP, 0);
  return { total: 1 + bonusTP, milestones }; // 1 base + milestone bonuses
}
