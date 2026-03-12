// ─────────────────────────────────────────
// CRIMINAL OPERATION
// ─────────────────────────────────────────

export interface StrainSlotDef {
  strainName: string;
  pricePerUnit: number;    // dirty cash per unit when sold through dealers
  plantsCapacity: number;
  growTimerTicks: number;
  harvestYield: number;
}

export interface GrowRoomTypeDef {
  id: string;
  name: string;
  purchaseCost: number;      // dirty cash to buy
  upgradeCosts: number[];    // [cost to unlock slot 2, slot 3, slot 4] — max 3 upgrades
  strainSlots: StrainSlotDef[];  // index = unlock order (max 4)
  autoHarvestCost: number;   // one-time cost to enable auto-harvest for this room
}

export interface StrainSlot extends StrainSlotDef {
  isHarvesting: boolean;
  ticksRemaining: number;
}

export interface MaintenanceTier {
  name: string;
  cost: number;       // dirty cash one-time upgrade cost
  yieldBonus: number; // fraction added to harvest yield (0.2 = +20%)
  icon: string;
}

export const WATER_TIERS: MaintenanceTier[] = [
  { name: 'Tap Water',    cost: 0,     yieldBonus: 0,    icon: '🚰' },
  { name: 'Drip System', cost: 500,   yieldBonus: 0.15, icon: '💧' },
  { name: 'Hydro Setup', cost: 2500,  yieldBonus: 0.35, icon: '🌊' },
  { name: 'Aeroponics',  cost: 10000, yieldBonus: 0.60, icon: '⚗️' },
];

export const LIGHT_TIERS: MaintenanceTier[] = [
  { name: 'Single Bulb',    cost: 0,     yieldBonus: 0,    icon: '💡' },
  { name: 'LED Strip',      cost: 800,   yieldBonus: 0.15, icon: '🔆' },
  { name: 'Full Spec LED',  cost: 4000,  yieldBonus: 0.35, icon: '☀️' },
  { name: 'HPS + CO2',      cost: 15000, yieldBonus: 0.60, icon: '🌡️' },
];

export interface GrowRoom {
  id: string;
  typeId: string;          // references GrowRoomTypeDef.id
  name: string;
  upgradeLevel: number;    // 0 = 1 slot active, 1 = 2 slots, 2 = 3 slots, 3 = 4 slots
  slots: StrainSlot[];     // length = upgradeLevel + 1
  waterTier: number;       // index into WATER_TIERS (0–3)
  lightTier: number;       // index into LIGHT_TIERS (0–3)
  autoHarvest: boolean;    // auto-harvests and replants on tick
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
  prestigeCount: number;       // how many times prestige'd
  prestigeBonus: number;       // cumulative yield multiplier (0.05 per level)
}

// Prestige thresholds and reward
export const PRESTIGE_THRESHOLD = 1_000_000;   // $1M total dirty earned
export const PRESTIGE_BONUS_PER_LEVEL = 0.05;  // +5% grow yield per prestige

// ─────────────────────────────────────────
// STATIC DEFINITIONS
// ─────────────────────────────────────────

export const GROW_ROOM_TYPE_DEFS: GrowRoomTypeDef[] = [
  {
    id: 'closet',
    name: 'Closet',
    purchaseCost: 0,
    upgradeCosts: [],  // can't be upgraded — starter room only
    autoHarvestCost: 500,
    strainSlots: [
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 4, growTimerTicks: 30, harvestYield: 8 },
    ],
  },
  {
    id: 'shed',
    name: 'Shed',
    purchaseCost: 1500,
    upgradeCosts: [2000, 4000, 7000],
    autoHarvestCost: 2500,
    strainSlots: [
      { strainName: 'OG Kush',     pricePerUnit: 12, plantsCapacity: 12, growTimerTicks: 40, harvestYield: 28 },
      { strainName: 'White Widow', pricePerUnit: 16, plantsCapacity: 12, growTimerTicks: 38, harvestYield: 28 },
      { strainName: 'Purple Haze', pricePerUnit: 22, plantsCapacity: 12, growTimerTicks: 36, harvestYield: 28 },
      { strainName: 'Blue Dream',  pricePerUnit: 30, plantsCapacity: 12, growTimerTicks: 34, harvestYield: 28 },
    ],
  },
  {
    id: 'garage',
    name: 'Garage',
    purchaseCost: 6000,
    upgradeCosts: [8000, 15000, 25000],
    autoHarvestCost: 8000,
    strainSlots: [
      { strainName: 'Sour Diesel',        pricePerUnit: 20, plantsCapacity: 20, growTimerTicks: 36, harvestYield: 55 },
      { strainName: 'AK-47',              pricePerUnit: 28, plantsCapacity: 20, growTimerTicks: 34, harvestYield: 55 },
      { strainName: 'Gorilla Glue',       pricePerUnit: 36, plantsCapacity: 20, growTimerTicks: 32, harvestYield: 55 },
      { strainName: "Girl Scout Cookies", pricePerUnit: 46, plantsCapacity: 20, growTimerTicks: 30, harvestYield: 55 },
    ],
  },
  {
    id: 'small_grow',
    name: 'Small Grow Facility',
    purchaseCost: 20000,
    upgradeCosts: [25000, 45000, 80000],
    autoHarvestCost: 25000,
    strainSlots: [
      { strainName: 'Durban Poison', pricePerUnit: 35, plantsCapacity: 30, growTimerTicks: 32, harvestYield: 100 },
      { strainName: 'Jack Herer',    pricePerUnit: 45, plantsCapacity: 30, growTimerTicks: 30, harvestYield: 100 },
      { strainName: 'Amnesia Haze',  pricePerUnit: 58, plantsCapacity: 30, growTimerTicks: 28, harvestYield: 100 },
      { strainName: 'Wedding Cake',  pricePerUnit: 72, plantsCapacity: 30, growTimerTicks: 26, harvestYield: 100 },
    ],
  },
  {
    id: 'grow_facility',
    name: 'Grow Facility',
    purchaseCost: 80000,
    upgradeCosts: [100000, 200000, 400000],
    autoHarvestCost: 100000,
    strainSlots: [
      { strainName: 'Gelato',   pricePerUnit: 60,  plantsCapacity: 50, growTimerTicks: 28, harvestYield: 200 },
      { strainName: 'Runtz',    pricePerUnit: 78,  plantsCapacity: 50, growTimerTicks: 26, harvestYield: 200 },
      { strainName: 'Zkittlez', pricePerUnit: 95,  plantsCapacity: 50, growTimerTicks: 24, harvestYield: 200 },
      { strainName: 'Biscotti', pricePerUnit: 120, plantsCapacity: 50, growTimerTicks: 22, harvestYield: 200 },
    ],
  },
];

export const GROW_ROOM_TYPE_MAP = Object.fromEntries(GROW_ROOM_TYPE_DEFS.map((d) => [d.id, d]));

export const DEALER_TIERS: DealerTier[] = [
  { id: 'corner',    name: 'Corner Boys',           salesRatePerTick: 0.5,  hireCost: 500,   cutPercent: 30, heatPerTick: 0.005 },
  { id: 'crew',      name: 'Street Crew',           salesRatePerTick: 1.5,  hireCost: 300,   cutPercent: 25, heatPerTick: 0.012 },
  { id: 'network',   name: 'Distribution Network',  salesRatePerTick: 4.0,  hireCost: 1200,  cutPercent: 20, heatPerTick: 0.020 },
  { id: 'syndicate', name: 'City Syndicate',        salesRatePerTick: 12.0, hireCost: 6000,  cutPercent: 15, heatPerTick: 0.035 },
  { id: 'cartel',    name: 'Regional Cartel',       salesRatePerTick: 40.0, hireCost: 30000, cutPercent: 10, heatPerTick: 0.060 },
];

export const INITIAL_OPERATION: CriminalOperation = {
  location: 'basement',
  locationName: "Grandma's Basement",
  growRooms: [
    {
      id: 'room_start',
      typeId: 'closet',
      name: 'Closet',
      upgradeLevel: 0,
      waterTier: 0,
      lightTier: 0,
      autoHarvest: false,
      slots: [
        { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 4, growTimerTicks: 30, harvestYield: 8, isHarvesting: true, ticksRemaining: 30 },
      ],
    },
  ],
  productInventory: 0,
  dealerTierIndex: 0,
  dealerCount: 0,
  seedStock: 10,
  seedCostPerUnit: 5,
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
  prestigeCount: 0,
  prestigeBonus: 0,
};
