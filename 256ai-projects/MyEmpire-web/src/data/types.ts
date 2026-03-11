// ─────────────────────────────────────────
// CRIMINAL OPERATION
// ─────────────────────────────────────────

export type GrowRoomTier = 1 | 2 | 3 | 4 | 5;

export interface GrowRoom {
  id: string;
  tier: GrowRoomTier;
  plantsCapacity: number;
  growTimerTicks: number;     // total ticks per harvest cycle
  harvestYield: number;       // product units per harvest
  purchaseCost: number;       // dirty cash
  isHarvesting: boolean;
  ticksRemaining: number;     // ticks left in current grow cycle
}

export interface DealerTier {
  id: string;
  name: string;
  salesRatePerTick: number;   // dirty cash per tick per dealer
  hireCost: number;           // dirty cash per dealer
  cutPercent: number;
  heatPerTick: number;
}

export interface CriminalOperation {
  location: 'basement' | 'safehouse' | 'stash_house' | 'warehouse_op' | 'facility';
  locationName: string;
  growRooms: GrowRoom[];
  productInventory: number;   // units ready to sell
  dealerTierIndex: number;
  dealerCount: number;
  seedStock: number;
  seedCostPerUnit: number;    // dirty cash per seed
}

// ─────────────────────────────────────────
// RESOURCES (for front business supply chain)
// ─────────────────────────────────────────

export interface ResourceDef {
  id: string;
  name: string;
  description: string;
  basePricePerUnit: number;   // clean cash
  unitWeight: number;
}

export interface ResourceConsumption {
  resourceId: string;
  amountPerTick: number;
}

// ─────────────────────────────────────────
// FRONT BUSINESSES (laundering vehicles)
// ─────────────────────────────────────────

export interface UpgradeTier {
  name: string;
  upgradeCost: number;
  launderMultiplier: number;
  revenueMultiplier: number;
  operatingCostMultiplier: number;
  additionalEmployees: number;
}

export type BusinessCategory =
  | 'FoodFront'
  | 'LogisticsSupport'
  | 'LaunderingSupport'
  | 'LuxuryPrestige'
  | 'SupplyProduction'
  | 'TransportAsset';

export interface BusinessDef {
  id: string;
  chainName: string;
  displayName: string;
  description: string;
  category: BusinessCategory;
  purchaseCost: number;             // clean cash
  baseLaunderPerTick: number;       // max dirty cash laundered per tick
  launderEfficiency: number;        // fraction that becomes clean (e.g. 0.8 = 80%)
  baseRevenuePerTick: number;       // small legit revenue (clean cash)
  baseOperatingCostPerTick: number;
  baseEmployeeCount: number;
  employeeSalaryPerTick: number;
  requiredResources: ResourceConsumption[];
  upgradeTiers: UpgradeTier[];
  allowedDistrictIds: string[];
  heatReductionPerTick: number;
  themeColor: string;
  icon: string;
}

export interface BusinessInstance {
  instanceId: string;
  businessDefId: string;
  districtId: string;
  slotIndex: number;
  upgradeLevel: number;
  isOperating: boolean;
  supplyModifier: number;
  dirtyQueuedPerTick: number;   // how much dirty cash to launder per tick (0 = off)
}

// ─────────────────────────────────────────
// DISTRICTS
// ─────────────────────────────────────────

export interface DistrictDef {
  id: string;
  name: string;
  description: string;
  themeColor: string;
  revenueMultiplier: number;
  operatingCostMultiplier: number;
  customerTrafficMultiplier: number;
  unlockCost: number;
  policePresenceMultiplier: number;
  auditChanceMultiplier: number;
  maxBusinessSlots: number;
  gridLayout: { rows: number; cols: number };
}

// ─────────────────────────────────────────
// HEAT
// ─────────────────────────────────────────

export type HeatTier = 0 | 1 | 2 | 3 | 4;

export const HEAT_TIER_NAMES: Record<HeatTier, string> = {
  0: 'Unknown',
  1: 'Noticed',
  2: 'Watched',
  3: 'Pressured',
  4: 'Targeted',
};

export const HEAT_TIER_COLORS: Record<HeatTier, string> = {
  0: '#22c55e',
  1: '#eab308',
  2: '#f97316',
  3: '#ef4444',
  4: '#991b1b',
};

// ─────────────────────────────────────────
// LAWYERS
// ─────────────────────────────────────────

export interface LawyerDef {
  id: string;
  name: string;
  description: string;
  tier: number;
  monthlyRetainer: number;
  defenseSuccessRate: number;
  fineReduction: number;
  heatDecayBonus: number;
  unlockCost: number;
  requiredHeatTier: HeatTier;
}

// ─────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────

export interface EventChoice {
  text: string;
  outcomeDescription: string;
  cashCost: number;
  heatChange: number;
  successChance: number;
  useLawyer: boolean;
}

export interface EventDef {
  id: string;
  name: string;
  description: string;
  minimumHeatTier: HeatTier;
  baseProbability: number;
  penaltyCash: number;
  penaltyHeat: number;
  choices: EventChoice[];
}

// ─────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────

export interface GameState {
  dirtyCash: number;
  cleanCash: number;
  totalDirtyEarned: number;
  totalCleanEarned: number;
  totalSpent: number;
  heat: number;
  heatNoticeShown: boolean;
  operation: CriminalOperation;
  businesses: BusinessInstance[];
  unlockedDistricts: string[];
  inventory: Record<string, number>;
  storageCapacity: number;
  activeLawyerId: string | null;
  lastSaveTimestamp: number;
  lastTickDirtyProfit: number;
  lastTickCleanProfit: number;
  tickCount: number;
  eventCooldown: number;
}

// ─────────────────────────────────────────
// STATIC DEFINITIONS
// ─────────────────────────────────────────

export const GROW_ROOM_DEFS: Omit<GrowRoom, 'id' | 'isHarvesting' | 'ticksRemaining'>[] = [
  { tier: 1, plantsCapacity: 4,   growTimerTicks: 120, harvestYield: 8,   purchaseCost: 0 },
  { tier: 2, plantsCapacity: 12,  growTimerTicks: 100, harvestYield: 28,  purchaseCost: 2500 },
  { tier: 3, plantsCapacity: 30,  growTimerTicks: 90,  harvestYield: 75,  purchaseCost: 8000 },
  { tier: 4, plantsCapacity: 60,  growTimerTicks: 75,  harvestYield: 180, purchaseCost: 25000 },
  { tier: 5, plantsCapacity: 150, growTimerTicks: 60,  harvestYield: 500, purchaseCost: 100000 },
];

export const DEALER_TIERS: DealerTier[] = [
  { id: 'corner',    name: 'Corner Boys',           salesRatePerTick: 0.5,  hireCost: 50,    cutPercent: 30, heatPerTick: 0.005 },
  { id: 'crew',      name: 'Street Crew',           salesRatePerTick: 1.5,  hireCost: 300,   cutPercent: 25, heatPerTick: 0.012 },
  { id: 'network',   name: 'Distribution Network',  salesRatePerTick: 4.0,  hireCost: 1200,  cutPercent: 20, heatPerTick: 0.020 },
  { id: 'syndicate', name: 'City Syndicate',        salesRatePerTick: 12.0, hireCost: 6000,  cutPercent: 15, heatPerTick: 0.035 },
  { id: 'cartel',    name: 'Regional Cartel',       salesRatePerTick: 40.0, hireCost: 30000, cutPercent: 10, heatPerTick: 0.060 },
];

export const INITIAL_OPERATION: CriminalOperation = {
  location: 'basement',
  locationName: "Grandma's Basement",
  growRooms: [
    { id: 'room_start', tier: 1, plantsCapacity: 4, growTimerTicks: 120, harvestYield: 8, purchaseCost: 0, isHarvesting: true, ticksRemaining: 120 },
  ],
  productInventory: 0,
  dealerTierIndex: 0,
  dealerCount: 0,
  seedStock: 10,
  seedCostPerUnit: 20,
};

export const INITIAL_GAME_STATE: GameState = {
  dirtyCash: 500,
  cleanCash: 1500,  // grandma's savings — enough to buy first front business
  totalDirtyEarned: 0,
  totalCleanEarned: 0,
  totalSpent: 0,
  heat: 0,
  heatNoticeShown: false,
  operation: INITIAL_OPERATION,
  businesses: [],
  unlockedDistricts: ['starter'],
  inventory: {},
  storageCapacity: 500,
  activeLawyerId: null,
  lastSaveTimestamp: Date.now(),
  lastTickDirtyProfit: 0,
  lastTickCleanProfit: 0,
  tickCount: 0,
  eventCooldown: 0,
};
