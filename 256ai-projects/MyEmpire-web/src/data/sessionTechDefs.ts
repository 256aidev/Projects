// ─────────────────────────────────────────
// SESSION TECH UPGRADES
// Temporary upgrades that reset on prestige reset or game reset.
// Cost a mix of dirty cash, clean cash, and product (weed oz).
// ─────────────────────────────────────────

export type SessionTechId =
  | 'stech_yield'
  | 'stech_speed'
  | 'stech_dealer'
  | 'stech_launder'
  | 'stech_heat'
  | 'stech_demand'
  | 'stech_seeds';

export interface SessionTechCost {
  dirtyCash: number;
  cleanCash: number;
  productOz: number;  // weed (oz) from product inventory
}

export interface SessionTechDef {
  id: SessionTechId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costs: SessionTechCost[];  // cost per level [L1, L2, L3]
  effectPerLevel: number;
  effectLabel: string;
  bonusType: 'yield' | 'speed' | 'dealer' | 'launder' | 'heat' | 'demand' | 'seeds';
}

export const SESSION_TECH_DEFS: SessionTechDef[] = [
  {
    id: 'stech_yield',
    name: 'Stronger Fertilizer',
    icon: '🧪',
    description: 'Premium nutrients for bigger harvests this run',
    maxLevel: 3,
    costs: [
      { dirtyCash: 50_000,  cleanCash: 25_000,  productOz: 100 },
      { dirtyCash: 200_000, cleanCash: 100_000, productOz: 500 },
      { dirtyCash: 800_000, cleanCash: 400_000, productOz: 2000 },
    ],
    effectPerLevel: 0.10,
    effectLabel: '+10% yield',
    bonusType: 'yield',
  },
  {
    id: 'stech_speed',
    name: 'Overclocked Lights',
    icon: '💡',
    description: 'Push grow lights past safe limits — faster cycles',
    maxLevel: 3,
    costs: [
      { dirtyCash: 40_000,  cleanCash: 20_000,  productOz: 80 },
      { dirtyCash: 160_000, cleanCash: 80_000,   productOz: 400 },
      { dirtyCash: 640_000, cleanCash: 320_000,  productOz: 1600 },
    ],
    effectPerLevel: 0.08,
    effectLabel: '-8% grow time',
    bonusType: 'speed',
  },
  {
    id: 'stech_dealer',
    name: 'Street Connects',
    icon: '🤙',
    description: 'Work the phones — dealers move product faster',
    maxLevel: 3,
    costs: [
      { dirtyCash: 60_000,  cleanCash: 30_000,  productOz: 150 },
      { dirtyCash: 250_000, cleanCash: 125_000, productOz: 600 },
      { dirtyCash: 1_000_000, cleanCash: 500_000, productOz: 2500 },
    ],
    effectPerLevel: 0.15,
    effectLabel: '+15% dealer sales',
    bonusType: 'dealer',
  },
  {
    id: 'stech_launder',
    name: 'Offshore Accounts',
    icon: '🏝️',
    description: 'Route dirty cash through shell companies',
    maxLevel: 3,
    costs: [
      { dirtyCash: 75_000,  cleanCash: 50_000,  productOz: 120 },
      { dirtyCash: 300_000, cleanCash: 200_000, productOz: 500 },
      { dirtyCash: 1_200_000, cleanCash: 800_000, productOz: 2000 },
    ],
    effectPerLevel: 0.10,
    effectLabel: '+10% launder efficiency',
    bonusType: 'launder',
  },
  {
    id: 'stech_heat',
    name: 'Police Scanner',
    icon: '📡',
    description: 'Stay one step ahead — less heat from everything',
    maxLevel: 3,
    costs: [
      { dirtyCash: 45_000,  cleanCash: 30_000,  productOz: 100 },
      { dirtyCash: 180_000, cleanCash: 120_000, productOz: 400 },
      { dirtyCash: 720_000, cleanCash: 480_000, productOz: 1600 },
    ],
    effectPerLevel: 0.10,
    effectLabel: '-10% heat gain',
    bonusType: 'heat',
  },
  {
    id: 'stech_demand',
    name: 'Word of Mouth',
    icon: '📢',
    description: 'Build a rep on the streets — customers come to you',
    maxLevel: 3,
    costs: [
      { dirtyCash: 30_000,  cleanCash: 15_000,  productOz: 200 },
      { dirtyCash: 120_000, cleanCash: 60_000,   productOz: 800 },
      { dirtyCash: 500_000, cleanCash: 250_000,  productOz: 3000 },
    ],
    effectPerLevel: 50,
    effectLabel: '+50 oz street demand',
    bonusType: 'demand',
  },
  {
    id: 'stech_seeds',
    name: 'Bulk Seed Deal',
    icon: '🌱',
    description: 'Negotiate cheaper seed prices from suppliers',
    maxLevel: 3,
    costs: [
      { dirtyCash: 20_000,  cleanCash: 10_000,  productOz: 50 },
      { dirtyCash: 80_000,  cleanCash: 40_000,   productOz: 200 },
      { dirtyCash: 320_000, cleanCash: 160_000,  productOz: 800 },
    ],
    effectPerLevel: 0.15,
    effectLabel: '-15% seed cost',
    bonusType: 'seeds',
  },
];

export const SESSION_TECH_MAP = Object.fromEntries(
  SESSION_TECH_DEFS.map((d) => [d.id, d])
) as Record<SessionTechId, SessionTechDef>;

export const INITIAL_SESSION_TECH: Record<SessionTechId, number> = {
  stech_yield: 0,
  stech_speed: 0,
  stech_dealer: 0,
  stech_launder: 0,
  stech_heat: 0,
  stech_demand: 0,
  stech_seeds: 0,
};
