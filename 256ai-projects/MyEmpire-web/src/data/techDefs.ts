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
  | 'tech_heat';

export interface TechUpgradeDef {
  id: TechUpgradeId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costs: number[];          // TP cost per level [L1, L2, L3, L4, L5]
  effectPerLevel: number;   // the numeric bonus per level
  effectLabel: string;      // human-readable per-level effect
  bonusType: 'yield' | 'speed' | 'double' | 'capacity' | 'dealer' | 'launder' | 'heat';
}

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
  { id: 'rival_1',    name: '1 rival defeated',     icon: '🔫', check: (s) => s.rivals.filter(r => r.isDefeated).length >= 1, bonusTP: 1 },
  { id: 'rival_all',  name: 'All rivals defeated',  icon: '🔫', check: (s) => s.rivals.length > 0 && s.rivals.every(r => r.isDefeated), bonusTP: 2 },
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
