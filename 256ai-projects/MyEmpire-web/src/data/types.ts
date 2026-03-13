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
  purchaseCost: number;      // cost to buy
  purchaseCurrency?: 'dirty' | 'clean'; // default: 'dirty'
  isLegal?: boolean;         // if true, product sells for clean cash (no laundering needed)
  themeColor?: string;       // custom UI color (e.g., gold for legal ops)
  strainUnlockBase: number;  // base cost for first strain unlock (doubles each slot)
  strainSlots: StrainSlotDef[];  // index = unlock order (max 4)
  autoHarvestCost: number;   // one-time cost to enable auto-harvest for this room
  upgradeCostMultiplier: number; // scales water/light/nutrient upgrade costs (×4 per tier)
}

/** Cost to unlock strain slot N (0-indexed). Slot 0 is free, slot 1+ doubles each time. */
export function getStrainUnlockCost(def: GrowRoomTypeDef, slotIndex: number): number {
  if (slotIndex <= 0 || def.strainUnlockBase <= 0) return 0;
  return def.strainUnlockBase * Math.pow(2, slotIndex - 1);
}

/** Escalating dealer hire cost: base × 1.5^ownedCount */
export function getDealerHireCost(tier: DealerTier, ownedCount: number): number {
  return Math.floor(tier.hireCost * Math.pow(1.5, ownedCount));
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

// ── UNIFIED ROOM UPGRADE SYSTEM ─────────────────────────────────────────
export interface RoomUpgradeDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  bonusType: 'speed' | 'yield' | 'double' | 'toggle';
  baseCostPerCycle: number;   // cost/cycle when level=0 (e.g. water base = $1)
  levels: RoomUpgradeLevel[];
}

export interface RoomUpgradeLevel {
  name: string;
  cost: number;
  costPerCycle: number;
  speedBonus: number;
  yieldBonus: number;
  doubleChance: number;
}

export const ROOM_UPGRADE_DEFS: RoomUpgradeDef[] = [
  {
    id: 'flora_gro', name: 'FloraGro', icon: '🟢',
    color: 'text-green-400', bgColor: 'bg-green-900/40', borderColor: 'border-green-900/40',
    bonusType: 'speed', baseCostPerCycle: 0,
    levels: [
      { name: 'FloraGro I',   cost: 600,   costPerCycle: 1, speedBonus: 0.05, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro II',  cost: 3000,  costPerCycle: 3, speedBonus: 0.10, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro III', cost: 12000, costPerCycle: 6, speedBonus: 0.15, yieldBonus: 0, doubleChance: 0 },
    ],
  },
  {
    id: 'flora_micro', name: 'FloraMicro', icon: '🟣',
    color: 'text-purple-400', bgColor: 'bg-purple-900/40', borderColor: 'border-purple-900/40',
    bonusType: 'yield', baseCostPerCycle: 0,
    levels: [
      { name: 'FloraMicro I',   cost: 800,   costPerCycle: 1, speedBonus: 0, yieldBonus: 0.05, doubleChance: 0 },
      { name: 'FloraMicro II',  cost: 4000,  costPerCycle: 3, speedBonus: 0, yieldBonus: 0.10, doubleChance: 0 },
      { name: 'FloraMicro III', cost: 15000, costPerCycle: 6, speedBonus: 0, yieldBonus: 0.15, doubleChance: 0 },
    ],
  },
  {
    id: 'flora_bloom', name: 'FloraBloom', icon: '🩷',
    color: 'text-pink-400', bgColor: 'bg-pink-900/40', borderColor: 'border-pink-900/40',
    bonusType: 'double', baseCostPerCycle: 0,
    levels: [
      { name: 'FloraBloom I',   cost: 1200,  costPerCycle: 2, speedBonus: 0, yieldBonus: 0, doubleChance: 0.02 },
      { name: 'FloraBloom II',  cost: 6000,  costPerCycle: 4, speedBonus: 0, yieldBonus: 0, doubleChance: 0.04 },
      { name: 'FloraBloom III', cost: 20000, costPerCycle: 8, speedBonus: 0, yieldBonus: 0, doubleChance: 0.06 },
    ],
  },
  {
    id: 'water', name: 'Water', icon: '💧',
    color: 'text-blue-400', bgColor: 'bg-blue-900/40', borderColor: 'border-blue-900/40',
    bonusType: 'speed', baseCostPerCycle: 1,
    levels: [
      { name: 'Drip System', cost: 500,   costPerCycle: 2,  speedBonus: 0.01, yieldBonus: 0, doubleChance: 0 },
      { name: 'Hydro Setup', cost: 2500,  costPerCycle: 5,  speedBonus: 0.02, yieldBonus: 0, doubleChance: 0 },
      { name: 'Aeroponics',  cost: 10000, costPerCycle: 12, speedBonus: 0.03, yieldBonus: 0, doubleChance: 0 },
    ],
  },
  {
    id: 'light', name: 'Light', icon: '💡',
    color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', borderColor: 'border-yellow-900/40',
    bonusType: 'yield', baseCostPerCycle: 2,
    levels: [
      { name: 'LED Strip',     cost: 800,   costPerCycle: 3,  speedBonus: 0, yieldBonus: 0.05, doubleChance: 0 },
      { name: 'Full Spec LED', cost: 4000,  costPerCycle: 8,  speedBonus: 0, yieldBonus: 0.10, doubleChance: 0 },
      { name: 'HPS + CO2',     cost: 15000, costPerCycle: 18, speedBonus: 0, yieldBonus: 0.15, doubleChance: 0 },
    ],
  },
  {
    id: 'auto_harvest', name: 'Auto', icon: '⚙️',
    color: 'text-orange-400', bgColor: 'bg-orange-900/40', borderColor: 'border-orange-900/40',
    bonusType: 'toggle', baseCostPerCycle: 0,
    levels: [
      { name: 'Auto-Harvest', cost: 500, costPerCycle: 0, speedBonus: 0, yieldBonus: 0, doubleChance: 0 },
    ],
  },
];

export const ROOM_UPGRADE_MAP = Object.fromEntries(ROOM_UPGRADE_DEFS.map((d) => [d.id, d]));

export interface GrowRoom {
  id: string;
  typeId: string;          // references GrowRoomTypeDef.id
  name: string;
  upgradeLevel: number;    // 0 = 1 slot active, 1 = 2 slots, 2 = 3 slots, 3 = 4 slots
  slots: StrainSlot[];     // length = upgradeLevel + 1
  upgradeLevels: Record<string, number>;  // { water: 2, light: 1, flora_gro: 1, auto_harvest: 1 }
  // Legacy fields (kept for save migration)
  waterTier?: number;
  lightTier?: number;
  nutrientSpeed?: number;
  nutrientYield?: number;
  nutrientDouble?: number;
  autoHarvest?: boolean;
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
  | 'AutoFront'
  | 'ServiceFront'
  | 'NightlifeFront'
  | 'FinanceFront'
  | 'RetailFront'
  | 'RealEstate'
  | 'LogisticsSupport'
  | 'LaunderingSupport'
  | 'LuxuryPrestige'
  | 'SupplyProduction'
  | 'TransportAsset'
  | 'Dispensary'
  | 'ShadyFront'
  | 'LegitFront'
  | 'Production'
  | 'Wholesale';

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
  isProduction?: boolean;           // if true: produces resources each tick (stored in inventory)
  producesResourceId?: string;      // resource ID this business produces
  productionPerTick?: number;       // units produced per tick (base, before upgrades)
  isWholesale?: boolean;            // if true: buys resources from inventory → clean cash
  consumesResourceId?: string;      // resource ID this business buys (or 'any' for general stores)
  buyPricePerUnit?: number;         // clean cash paid per unit consumed
  consumptionPerTick?: number;      // units consumed per tick (base, before upgrades)
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
// JOBS (clean cash bootstrap)
// ─────────────────────────────────────────

export interface JobDef {
  id: string;
  name: string;
  bribeCost: number;       // dirty cash to get hired
  cleanPerTick: number;    // clean cash earned per tick
  maxHeat: number;         // auto-fired if heat exceeds this
  icon: string;
  description: string;
}

export const JOB_DEFS: JobDef[] = [
  { id: 'fast_food',    name: 'Fast Food',          bribeCost: 1000,    cleanPerTick: 3,   maxHeat: 750, icon: '🍔', description: 'Flipping burgers, no questions asked' },
  { id: 'retail',       name: 'Retail',             bribeCost: 5000,    cleanPerTick: 8,   maxHeat: 600, icon: '👔', description: 'Folding shirts at the mall' },
  { id: 'clerk',        name: 'Office Clerk',       bribeCost: 25000,   cleanPerTick: 20,  maxHeat: 450, icon: '📋', description: 'Pushing papers downtown' },
  { id: 'warehouse',    name: 'Warehouse Manager',  bribeCost: 100000,  cleanPerTick: 50,  maxHeat: 300, icon: '📦', description: 'Moving boxes, no background check' },
  { id: 'finance',      name: 'Finance Bro',        bribeCost: 400000,  cleanPerTick: 120, maxHeat: 200, icon: '📊', description: 'Cooking the books on Wall Street' },
  { id: 'corporate',    name: 'Corporate Exec',     bribeCost: 1000000, cleanPerTick: 250, maxHeat: 100, icon: '💼', description: 'Corner office, one slip and you\'re done' },
];

export const JOB_MAP = Object.fromEntries(JOB_DEFS.map(j => [j.id, j]));

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
  currentJobId: string | null;     // current job ID or null (from JOB_DEFS)
  jobFiredCooldown: number;        // ticks remaining before can get new job (0 = ready)
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
    purchaseCost: 0,          // free starter (virtual base = $500 for formula coherence)
    strainUnlockBase: 0,      // can't be upgraded — starter room only
    autoHarvestCost: 500,     // = virtual base
    upgradeCostMultiplier: 1, // ×1 (base tier)
    strainSlots: [
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 1, growTimerTicks: 30, harvestYield: 12 },
    ],
  },
  {
    id: 'shed',
    name: 'Shed',
    purchaseCost: 2000,        // ×4 tier 1
    strainUnlockBase: 4000,    // 2× purchaseCost, then doubles: $4K, $8K, $16K
    autoHarvestCost: 2000,     // = purchaseCost
    upgradeCostMultiplier: 4,  // ×4
    strainSlots: [
      { strainName: 'OG Kush',     pricePerUnit: 12, plantsCapacity: 2, growTimerTicks: 40, harvestYield: 24 },
      { strainName: 'White Widow', pricePerUnit: 16, plantsCapacity: 2, growTimerTicks: 38, harvestYield: 24 },
      { strainName: 'Purple Haze', pricePerUnit: 22, plantsCapacity: 2, growTimerTicks: 36, harvestYield: 24 },
      { strainName: 'Blue Dream',  pricePerUnit: 30, plantsCapacity: 2, growTimerTicks: 34, harvestYield: 24 },
    ],
  },
  {
    id: 'garage',
    name: 'Garage',
    purchaseCost: 8000,         // ×4 tier 2
    strainUnlockBase: 16000,    // 2× purchaseCost, then doubles: $16K, $32K, $64K
    autoHarvestCost: 8000,      // = purchaseCost
    upgradeCostMultiplier: 16,  // ×4²
    strainSlots: [
      { strainName: 'Sour Diesel',        pricePerUnit: 20, plantsCapacity: 4, growTimerTicks: 36, harvestYield: 48 },
      { strainName: 'AK-47',              pricePerUnit: 28, plantsCapacity: 4, growTimerTicks: 34, harvestYield: 48 },
      { strainName: 'Gorilla Glue',       pricePerUnit: 36, plantsCapacity: 4, growTimerTicks: 32, harvestYield: 48 },
      { strainName: "Girl Scout Cookies", pricePerUnit: 46, plantsCapacity: 4, growTimerTicks: 30, harvestYield: 48 },
    ],
  },
  {
    id: 'small_grow',
    name: 'Small Grow Facility',
    purchaseCost: 32000,         // ×4 tier 3
    strainUnlockBase: 64000,     // 2× purchaseCost, then doubles: $64K, $128K, $256K
    autoHarvestCost: 32000,      // = purchaseCost
    upgradeCostMultiplier: 64,   // ×4³
    strainSlots: [
      { strainName: 'Durban Poison', pricePerUnit: 35, plantsCapacity: 10, growTimerTicks: 32, harvestYield: 120 },
      { strainName: 'Jack Herer',    pricePerUnit: 45, plantsCapacity: 10, growTimerTicks: 30, harvestYield: 120 },
      { strainName: 'Amnesia Haze',  pricePerUnit: 58, plantsCapacity: 10, growTimerTicks: 28, harvestYield: 120 },
      { strainName: 'Wedding Cake',  pricePerUnit: 72, plantsCapacity: 10, growTimerTicks: 26, harvestYield: 120 },
    ],
  },
  {
    id: 'grow_facility',
    name: 'Grow Facility',
    purchaseCost: 128000,         // ×4 tier 4
    strainUnlockBase: 256000,     // 2× purchaseCost, then doubles: $256K, $512K, $1.02M
    autoHarvestCost: 128000,      // = purchaseCost
    upgradeCostMultiplier: 256,   // ×4⁴
    strainSlots: [
      { strainName: 'Gelato',   pricePerUnit: 60,  plantsCapacity: 25, growTimerTicks: 28, harvestYield: 300 },
      { strainName: 'Runtz',    pricePerUnit: 78,  plantsCapacity: 25, growTimerTicks: 26, harvestYield: 300 },
      { strainName: 'Zkittlez', pricePerUnit: 95,  plantsCapacity: 25, growTimerTicks: 24, harvestYield: 300 },
      { strainName: 'Biscotti', pricePerUnit: 120, plantsCapacity: 25, growTimerTicks: 22, harvestYield: 300 },
    ],
  },
  {
    id: 'large_grow',
    name: 'Large Grow Facility',
    purchaseCost: 512000,          // ×4 tier 5
    strainUnlockBase: 1024000,     // 2× purchaseCost, then doubles: $1.02M, $2.05M, $4.1M
    autoHarvestCost: 512000,       // = purchaseCost
    upgradeCostMultiplier: 1024,   // ×4⁵
    strainSlots: [
      { strainName: 'Exotic Kush',  pricePerUnit: 150, plantsCapacity: 50, growTimerTicks: 20, harvestYield: 600 },
      { strainName: 'Moonrock OG',  pricePerUnit: 200, plantsCapacity: 50, growTimerTicks: 18, harvestYield: 600 },
      { strainName: 'THC Diamond',  pricePerUnit: 260, plantsCapacity: 50, growTimerTicks: 16, harvestYield: 600 },
      { strainName: 'Golden Leaf',  pricePerUnit: 340, plantsCapacity: 50, growTimerTicks: 14, harvestYield: 600 },
    ],
  },
  {
    id: 'legal_distribution',
    name: 'Legal Distribution',
    purchaseCost: 25000000,         // $25M — endgame capstone
    purchaseCurrency: 'clean',      // only grow building purchased with CLEAN cash
    isLegal: true,                  // product sells for clean cash directly
    themeColor: '#D4AF37',          // gold
    strainUnlockBase: 50000000,     // 2× purchaseCost
    autoHarvestCost: 25000000,      // = purchaseCost
    upgradeCostMultiplier: 4096,    // ×4⁶
    strainSlots: [
      { strainName: 'Royal Gold',       pricePerUnit: 38,  plantsCapacity: 100, growTimerTicks: 20, harvestYield: 1200 },
      { strainName: 'Crown Jewel',      pricePerUnit: 50,  plantsCapacity: 100, growTimerTicks: 18, harvestYield: 1200 },
      { strainName: 'Sovereign Kush',   pricePerUnit: 65,  plantsCapacity: 100, growTimerTicks: 16, harvestYield: 1200 },
      { strainName: 'Empire Reserve',   pricePerUnit: 85,  plantsCapacity: 100, growTimerTicks: 14, harvestYield: 1200 },
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
      upgradeLevels: {},
      slots: [
        { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 1, growTimerTicks: 30, harvestYield: 12, isHarvesting: true, ticksRemaining: 30 },
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
  unlockedDistricts: ['starter', 'operations', 'dealer_network', 'job_district'],
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
  currentJobId: null,
  jobFiredCooldown: 0,
};
