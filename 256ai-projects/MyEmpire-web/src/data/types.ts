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
  upgradeCostMultiplier: number; // scales water/light/nutrient upgrade costs (2× per tier)
}

export interface StrainSlot extends StrainSlotDef {
  isHarvesting: boolean;
  ticksRemaining: number;
}

export interface MaintenanceTier {
  name: string;
  cost: number;           // dirty cash one-time upgrade cost
  yieldBonus: number;     // fraction added to harvest yield (0.05 = +5%)
  speedBonus: number;     // fraction reduction to grow timer (0.01 = 1% faster)
  costPerCycle: number;   // dirty cash charged once per completed grow cycle (per seed harvested)
  icon: string;
}

export const WATER_TIERS: MaintenanceTier[] = [
  { name: 'Tap Water',    cost: 0,     yieldBonus: 0, speedBonus: 0,    costPerCycle: 1,  icon: '🚰' },
  { name: 'Drip System',  cost: 500,   yieldBonus: 0, speedBonus: 0.01, costPerCycle: 2,  icon: '💧' },
  { name: 'Hydro Setup',  cost: 2500,  yieldBonus: 0, speedBonus: 0.02, costPerCycle: 5,  icon: '🌊' },
  { name: 'Aeroponics',   cost: 10000, yieldBonus: 0, speedBonus: 0.03, costPerCycle: 12, icon: '⚗️' },
];

export const LIGHT_TIERS: MaintenanceTier[] = [
  { name: 'Single Bulb',   cost: 0,     yieldBonus: 0,    speedBonus: 0, costPerCycle: 2,  icon: '💡' },
  { name: 'LED Strip',     cost: 800,   yieldBonus: 0.05, speedBonus: 0, costPerCycle: 3,  icon: '🔆' },
  { name: 'Full Spec LED', cost: 4000,  yieldBonus: 0.10, speedBonus: 0, costPerCycle: 8,  icon: '☀️' },
  { name: 'HPS + CO2',     cost: 15000, yieldBonus: 0.15, speedBonus: 0, costPerCycle: 18, icon: '🌡️' },
];

// ── NUTRIENTS (3 independent types per room, each purchasable separately) ──────
export interface NutrientDef {
  id: 'speed' | 'yield' | 'double';
  name: string;
  description: string;
  color: string;        // tailwind text color class
  bgColor: string;      // tailwind bg color class
  icon: string;
  levels: NutrientLevel[];
}

export interface NutrientLevel {
  name: string;
  cost: number;         // dirty cash one-time cost
  costPerCycle: number; // dirty cash per harvest
  speedBonus: number;   // fraction reduction to grow timer
  yieldBonus: number;   // fraction added to harvest yield
  doubleChance: number; // 0–1 probability of doubling the harvest
}

export const NUTRIENT_DEFS: NutrientDef[] = [
  {
    id: 'speed',
    name: 'FloraGro',
    description: 'Green formula — accelerates vegetative growth (faster cycle)',
    color: 'text-green-400',
    bgColor: 'bg-green-900/40',
    icon: '🟢',
    levels: [
      { name: 'FloraGro I',   cost: 600,   costPerCycle: 1, speedBonus: 0.05, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro II',  cost: 3000,  costPerCycle: 3, speedBonus: 0.10, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro III', cost: 12000, costPerCycle: 6, speedBonus: 0.15, yieldBonus: 0, doubleChance: 0 },
    ],
  },
  {
    id: 'yield',
    name: 'FloraMicro',
    description: 'Purple formula — micro nutrients for bigger harvests',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    icon: '🟣',
    levels: [
      { name: 'FloraMicro I',   cost: 800,   costPerCycle: 1, speedBonus: 0, yieldBonus: 0.05, doubleChance: 0 },
      { name: 'FloraMicro II',  cost: 4000,  costPerCycle: 3, speedBonus: 0, yieldBonus: 0.10, doubleChance: 0 },
      { name: 'FloraMicro III', cost: 15000, costPerCycle: 6, speedBonus: 0, yieldBonus: 0.15, doubleChance: 0 },
    ],
  },
  {
    id: 'double',
    name: 'FloraBloom',
    description: 'Pink formula — bloom booster with chance to double crop',
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/40',
    icon: '🩷',
    levels: [
      { name: 'FloraBloom I',   cost: 1200,  costPerCycle: 2, speedBonus: 0, yieldBonus: 0, doubleChance: 0.02 },
      { name: 'FloraBloom II',  cost: 6000,  costPerCycle: 4, speedBonus: 0, yieldBonus: 0, doubleChance: 0.04 },
      { name: 'FloraBloom III', cost: 20000, costPerCycle: 8, speedBonus: 0, yieldBonus: 0, doubleChance: 0.06 },
    ],
  },
];

// Keep a flat NUTRIENT_TIERS alias for economy.ts speed lookups (speed nutrient only)
export const NUTRIENT_TIERS = NUTRIENT_DEFS[0].levels; // legacy alias

export interface GrowRoom {
  id: string;
  typeId: string;          // references GrowRoomTypeDef.id
  name: string;
  upgradeLevel: number;    // 0 = 1 slot active, 1 = 2 slots, 2 = 3 slots, 3 = 4 slots
  slots: StrainSlot[];     // length = upgradeLevel + 1
  waterTier: number;       // index into WATER_TIERS (0–3)
  lightTier: number;       // index into LIGHT_TIERS (0–3)
  nutrientSpeed: number;   // level into NUTRIENT_DEFS[0].levels (0 = none, 1–3)
  nutrientYield: number;   // level into NUTRIENT_DEFS[1].levels (0 = none, 1–3)
  nutrientDouble: number;  // level into NUTRIENT_DEFS[2].levels (0 = none, 1–3)
  autoHarvest: boolean;    // auto-harvests and replants on tick
}

export interface DealerTier {
  id: string;
  name: string;
  salesRatePerTick: number;   // units sold per tick per dealer
  hireCost: number;           // dirty cash per dealer
  cutPer8oz: number;          // flat dirty cash fee per 8 units sold
  heatPerTick: number;
}

export interface CriminalOperation {
  location: 'basement' | 'safehouse' | 'stash_house' | 'warehouse_op' | 'facility';
  locationName: string;
  growRooms: GrowRoom[];
  productInventory: Record<string, { oz: number; pricePerUnit: number }>;  // per-strain stash
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
  | 'TransportAsset'
  | 'Dispensary';

export interface BusinessDef {
  id: string;
  chainName: string;
  displayName: string;
  description: string;
  category: BusinessCategory;
  purchaseCost: number;             // clean cash
  baseLaunderPerTick: number;       // max dirty cash laundered per tick (or oz/tick for dispensaries)
  launderEfficiency: number;        // fraction that becomes clean; for dispensaries = fraction of avg street price
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
  isDispensary?: boolean;           // if true: consumes product inventory → clean cash instead of dirty cash
  isRental?: boolean;               // if true: generates clean cash passively, no laundering
}

export interface BusinessInstance {
  instanceId: string;
  businessDefId: string;
  districtId: string;
  slotIndex: number;
  upgradeLevel: number;
  isOperating: boolean;
  supplyModifier: number;
  dirtyQueuedPerTick: number;       // how much dirty cash to launder per tick (0 = off)
  cleanToDirtyPerTick: number;      // reverse: clean cash → dirty cash per tick (0 = off)
  productQueuedPerTick?: number;    // dispensary only: oz of product to sell per tick
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
  gridPosition: { col: number; row: number };  // position on the city block grid
}

// A dynamically generated city block (beyond the 6 defined districts)
export interface GeneratedBlock {
  id: string;
  col: number;
  row: number;
  unlockCost: number;
  name: string;
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
  unlockedSlots: Record<string, number>;   // districtId → how many lots are visible
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
  streetSellQuotaOz: number;       // oz remaining in current sell window (max 160 = 10 lbs)
  streetSellCooldownTicks: number; // ticks until quota refills (600 = 10 min)
  generatedBlocks: Record<string, GeneratedBlock>; // dynamically discovered city blocks
  nextBlockCost: number;           // cost of next generated block (doubles each purchase)
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
    upgradeCostMultiplier: 1,
    strainSlots: [
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 4, growTimerTicks: 30, harvestYield: 8 },
    ],
  },
  {
    id: 'shed',
    name: 'Shed',
    purchaseCost: 1500,
    upgradeCosts: [2000, 4000, 8000],
    autoHarvestCost: 1000,
    upgradeCostMultiplier: 2,
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
    purchaseCost: 16000,
    upgradeCosts: [4000, 8000, 16000],
    autoHarvestCost: 2000,
    upgradeCostMultiplier: 4,
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
    purchaseCost: 100000,
    upgradeCosts: [8000, 16000, 32000],
    autoHarvestCost: 4000,
    upgradeCostMultiplier: 8,
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
    upgradeCosts: [16000, 32000, 64000],
    autoHarvestCost: 8000,
    upgradeCostMultiplier: 16,
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
  { id: 'corner',    name: 'Corner Boys',           salesRatePerTick: 0.5,  hireCost: 500,   cutPer8oz: 3,   heatPerTick: 0.005 },
  { id: 'crew',      name: 'Street Crew',           salesRatePerTick: 1.5,  hireCost: 300,   cutPer8oz: 5,   heatPerTick: 0.012 },
  { id: 'network',   name: 'Distribution Network',  salesRatePerTick: 4.0,  hireCost: 1200,  cutPer8oz: 8,   heatPerTick: 0.020 },
  { id: 'syndicate', name: 'City Syndicate',        salesRatePerTick: 12.0, hireCost: 6000,  cutPer8oz: 15,  heatPerTick: 0.035 },
  { id: 'cartel',    name: 'Regional Cartel',       salesRatePerTick: 40.0, hireCost: 30000, cutPer8oz: 25,  heatPerTick: 0.060 },
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
      nutrientSpeed: 0,
      nutrientYield: 0,
      nutrientDouble: 0,
      autoHarvest: false,
      slots: [
        { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 4, growTimerTicks: 30, harvestYield: 8, isHarvesting: true, ticksRemaining: 30 },
      ],
    },
  ],
  productInventory: {},
  dealerTierIndex: 0,
  dealerCount: 0,
  seedStock: 10,
  seedCostPerUnit: 5,
};

export const INITIAL_GAME_STATE: GameState = {
  dirtyCash: 500,
  cleanCash: 0,
  totalDirtyEarned: 0,
  totalCleanEarned: 0,
  totalSpent: 0,
  heat: 0,
  heatNoticeShown: false,
  operation: INITIAL_OPERATION,
  businesses: [],
  unlockedDistricts: ['starter'],
  unlockedSlots: { starter: 2 },
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
  streetSellQuotaOz: 160,
  streetSellCooldownTicks: 0,
  generatedBlocks: {},
  nextBlockCost: 2000,
};
