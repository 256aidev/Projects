import type { TechUpgradeId } from './techDefs';
import { INITIAL_TECH_UPGRADES } from './techDefs';
import type { SessionTechId } from './sessionTechDefs';
import { INITIAL_SESSION_TECH } from './sessionTechDefs';

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
  maxUpgradeLevels: Record<string, number>; // per-upgrade cap for this room (e.g. closet=0, shed=1)
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
      { name: 'FloraGro I',   cost: 600,    costPerCycle: 1,  speedBonus: 0.05, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro II',  cost: 3000,   costPerCycle: 3,  speedBonus: 0.10, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro III', cost: 12000,  costPerCycle: 6,  speedBonus: 0.15, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro IV',  cost: 50000,  costPerCycle: 10, speedBonus: 0.20, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro V',   cost: 200000, costPerCycle: 16, speedBonus: 0.25, yieldBonus: 0, doubleChance: 0 },
      { name: 'FloraGro VI',  cost: 800000, costPerCycle: 24, speedBonus: 0.30, yieldBonus: 0, doubleChance: 0 },
    ],
  },
  {
    id: 'flora_micro', name: 'FloraMicro', icon: '🟣',
    color: 'text-purple-400', bgColor: 'bg-purple-900/40', borderColor: 'border-purple-900/40',
    bonusType: 'yield', baseCostPerCycle: 0,
    levels: [
      { name: 'FloraMicro I',   cost: 800,     costPerCycle: 1,  speedBonus: 0, yieldBonus: 0.05, doubleChance: 0 },
      { name: 'FloraMicro II',  cost: 4000,    costPerCycle: 3,  speedBonus: 0, yieldBonus: 0.10, doubleChance: 0 },
      { name: 'FloraMicro III', cost: 15000,   costPerCycle: 6,  speedBonus: 0, yieldBonus: 0.15, doubleChance: 0 },
      { name: 'FloraMicro IV',  cost: 60000,   costPerCycle: 10, speedBonus: 0, yieldBonus: 0.20, doubleChance: 0 },
      { name: 'FloraMicro V',   cost: 250000,  costPerCycle: 16, speedBonus: 0, yieldBonus: 0.25, doubleChance: 0 },
      { name: 'FloraMicro VI',  cost: 1000000, costPerCycle: 24, speedBonus: 0, yieldBonus: 0.30, doubleChance: 0 },
    ],
  },
  {
    id: 'flora_bloom', name: 'FloraBloom', icon: '🩷',
    color: 'text-pink-400', bgColor: 'bg-pink-900/40', borderColor: 'border-pink-900/40',
    bonusType: 'double', baseCostPerCycle: 0,
    levels: [
      { name: 'FloraBloom I',   cost: 1200,   costPerCycle: 2,  speedBonus: 0, yieldBonus: 0, doubleChance: 0.02 },
      { name: 'FloraBloom II',  cost: 6000,   costPerCycle: 4,  speedBonus: 0, yieldBonus: 0, doubleChance: 0.04 },
      { name: 'FloraBloom III', cost: 20000,  costPerCycle: 8,  speedBonus: 0, yieldBonus: 0, doubleChance: 0.06 },
      { name: 'FloraBloom IV',  cost: 80000,  costPerCycle: 12, speedBonus: 0, yieldBonus: 0, doubleChance: 0.08 },
      { name: 'FloraBloom V',   cost: 320000, costPerCycle: 18, speedBonus: 0, yieldBonus: 0, doubleChance: 0.10 },
      { name: 'FloraBloom VI',  cost: 1200000,costPerCycle: 26, speedBonus: 0, yieldBonus: 0, doubleChance: 0.12 },
    ],
  },
  {
    id: 'water', name: 'Water', icon: '💧',
    color: 'text-blue-400', bgColor: 'bg-blue-900/40', borderColor: 'border-blue-900/40',
    bonusType: 'speed', baseCostPerCycle: 1,
    levels: [
      { name: 'Drip System',      cost: 500,    costPerCycle: 2,  speedBonus: 0.01, yieldBonus: 0, doubleChance: 0 },
      { name: 'Hydro Setup',      cost: 2500,   costPerCycle: 5,  speedBonus: 0.02, yieldBonus: 0, doubleChance: 0 },
      { name: 'Aeroponics',       cost: 10000,  costPerCycle: 12, speedBonus: 0.03, yieldBonus: 0, doubleChance: 0 },
      { name: 'Deep Water Cul.',   cost: 40000,  costPerCycle: 18, speedBonus: 0.04, yieldBonus: 0, doubleChance: 0 },
      { name: 'Nutrient Film',    cost: 160000, costPerCycle: 25, speedBonus: 0.05, yieldBonus: 0, doubleChance: 0 },
      { name: 'Ebb & Flow Pro',   cost: 640000, costPerCycle: 35, speedBonus: 0.06, yieldBonus: 0, doubleChance: 0 },
    ],
  },
  {
    id: 'light', name: 'Light', icon: '💡',
    color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', borderColor: 'border-yellow-900/40',
    bonusType: 'yield', baseCostPerCycle: 2,
    levels: [
      { name: 'LED Strip',       cost: 800,    costPerCycle: 3,  speedBonus: 0, yieldBonus: 0.05, doubleChance: 0 },
      { name: 'Full Spec LED',   cost: 4000,   costPerCycle: 8,  speedBonus: 0, yieldBonus: 0.10, doubleChance: 0 },
      { name: 'HPS + CO2',       cost: 15000,  costPerCycle: 18, speedBonus: 0, yieldBonus: 0.15, doubleChance: 0 },
      { name: 'Double-End HPS',  cost: 60000,  costPerCycle: 28, speedBonus: 0, yieldBonus: 0.20, doubleChance: 0 },
      { name: 'Plasma + UV',     cost: 250000, costPerCycle: 40, speedBonus: 0, yieldBonus: 0.25, doubleChance: 0 },
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
  streetDemandBonus?: number;       // extra oz added to max street demand when owned (e.g. car_wash = 24, burger = 4)
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
  lotBaseCost?: number;    // linear lot price base (default 1000); lot N costs lotBaseCost × N
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

// Rival heat (gang rivalry)
export const RIVAL_TIER_NAMES: Record<HeatTier, string> = {
  0: 'Off Radar',
  1: 'On Their Radar',
  2: 'Rival Territory',
  3: 'Turf War',
  4: 'All-Out War',
};

export const RIVAL_TIER_COLORS: Record<HeatTier, string> = {
  0: '#22c55e',
  1: '#a855f7',
  2: '#c026d3',
  3: '#e11d48',
  4: '#7f1d1d',
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
  streetDemandBonus: number; // extra oz added to max street demand when employed
}

export const JOB_DEFS: JobDef[] = [
  { id: 'fast_food',    name: 'Fast Food',          bribeCost: 1000,    cleanPerTick: 3,   maxHeat: 750, icon: '🍔', description: 'Flipping burgers, no questions asked', streetDemandBonus: 8 },
  { id: 'retail',       name: 'Retail',             bribeCost: 5000,    cleanPerTick: 8,   maxHeat: 600, icon: '👔', description: 'Folding shirts at the mall', streetDemandBonus: 16 },
  { id: 'clerk',        name: 'Office Clerk',       bribeCost: 25000,   cleanPerTick: 20,  maxHeat: 450, icon: '📋', description: 'Pushing papers downtown', streetDemandBonus: 24 },
  { id: 'warehouse',    name: 'Warehouse Manager',  bribeCost: 100000,  cleanPerTick: 50,  maxHeat: 300, icon: '📦', description: 'Moving boxes, no background check', streetDemandBonus: 32 },
  { id: 'finance',      name: 'Finance Bro',        bribeCost: 400000,  cleanPerTick: 120, maxHeat: 200, icon: '📊', description: 'Cooking the books on Wall Street', streetDemandBonus: 48 },
  { id: 'corporate',    name: 'Corporate Exec',     bribeCost: 1000000, cleanPerTick: 250, maxHeat: 100, icon: '💼', description: 'Corner office, one slip and you\'re done', streetDemandBonus: 64 },
];

export const JOB_MAP = Object.fromEntries(JOB_DEFS.map(j => [j.id, j]));

// ─────────────────────────────────────────
// RIVALS & HITMEN
// ─────────────────────────────────────────

export interface RivalBusiness {
  districtId: string;
  slotIndex: number;
  businessDefId: string;
  health: number;          // 0-100, destroyed at 0
  burnedAtTick?: number;   // tick when arson hit — shows fire for ARSON_DURATION ticks
}

export const ARSON_DURATION = 100; // ~10 seconds of fire/rubble before lot clears
export const ARSON_INSURANCE = 5000; // rival gets insurance payout when fire clears

export interface RivalSyndicate {
  id: string;
  name: string;
  color: string;
  icon: string;
  dirtyCash: number;
  cleanCash: number;
  productOz: number;
  businesses: RivalBusiness[];
  hitmen: number;
  aggression: number;      // 0-1, how likely to attack per tick
  power: number;           // overall strength scaling (grows over time)
  isDefeated: boolean;
  blacklistedSlots?: string[]; // "districtId:slotIndex" — can't rebuy after arson insurance
  activeAtTick?: number;       // tick when this rival enters the game (Royal Rumble stagger)
}

export interface HitmanDef {
  id: string;
  name: string;
  cost: number;            // dirty cash to hire
  attack: number;          // damage dealt on offense
  defense: number;         // damage blocked on defense
  upkeep: number;          // dirty cash per tick
}

export const HITMAN_DEFS: HitmanDef[] = [
  { id: 'thug',       name: 'Street Thug',       cost: 5000,    attack: 10, defense: 5,  upkeep: 2 },
  { id: 'enforcer',   name: 'Enforcer',          cost: 25000,   attack: 25, defense: 15, upkeep: 8 },
  { id: 'assassin',   name: 'Professional Hit',  cost: 100000,  attack: 60, defense: 30, upkeep: 25 },
  { id: 'spec_ops',   name: 'Spec Ops Crew',     cost: 500000,  attack: 150, defense: 80, upkeep: 80 },
];

export const HITMAN_MAP = Object.fromEntries(HITMAN_DEFS.map(h => [h.id, h]));

export type RivalActionType = 'rob' | 'raid' | 'sabotage' | 'arson';

export interface RivalAction {
  type: RivalActionType;
  name: string;
  description: string;
  hitmenRequired: number;   // min hitmen needed
  successBase: number;      // base success chance 0-1
  heatGain: number;         // rival heat gained
  cost: number;             // dirty cash cost to attempt
}

export const RIVAL_ACTIONS: RivalAction[] = [
  { type: 'rob',      name: 'Rob',      description: 'Steal their dirty cash',           hitmenRequired: 1, successBase: 0.8,  heatGain: 5,  cost: 2000 },
  { type: 'raid',     name: 'Raid',     description: 'Steal their product stash',        hitmenRequired: 2, successBase: 0.7,  heatGain: 10, cost: 5000 },
  { type: 'sabotage', name: 'Sabotage', description: 'Damage a business (50% health)',   hitmenRequired: 2, successBase: 0.75, heatGain: 15, cost: 8000 },
  { type: 'arson',    name: 'Arson',    description: 'Burn it down (destroy business)',   hitmenRequired: 4, successBase: 0.65, heatGain: 30, cost: 20000 },
];

export interface HiredHitman {
  defId: string;
  count: number;
}

export interface GameSettings {
  rivalCount: number;       // 1-5
  rivalEntryDelay: number;  // minutes between each rival entry (Royal Rumble style)
  gameStarted: boolean;     // false = show start screen
  tutorialActive: boolean;  // true = guided tutorial in progress
  tutorialStep: number;     // current step index in TUTORIAL_STEPS
}

// ─── CASINO ───────────────────────────────────────────────────────────
export type CasinoGame = 'poker' | 'roulette' | 'blackjack';

export interface CasinoHistory {
  totalGambled: number;      // lifetime dirty cash wagered
  totalWon: number;          // lifetime clean cash won (after tax)
  totalLost: number;         // lifetime dirty cash lost
  gamesPlayed: number;
}

// ─── JEWELRY ──────────────────────────────────────────────────────────
export type JewelrySlotType = 'ring' | 'bracelet' | 'necklace' | 'pendant';

export interface JewelryPieceDef {
  id: string;
  name: string;
  slotType: JewelrySlotType;
  icon: string;
  baseCost: number;
  tiers: JewelryTierDef[];
  bonusType: 'prestige_speed' | 'hitman_discount' | 'operation_discount' | 'yield_boost' | 'heat_decay' | 'launder_boost';
  bonusPerTier: number;
}

export interface JewelryTierDef {
  name: string;
  upgradeCost: number;
  icon: string;
}

export interface OwnedJewelry {
  defId: string;
  slotType: JewelrySlotType;
  tier: number;               // 0-4
  equippedSlotIndex: number;  // which slot it occupies
}

// ─── CARS ──────────────────────────────────────────────────────────────
export type CarTier = 'economy' | 'sport' | 'luxury' | 'exotic' | 'supercar';

export type CarBonusType = 'heatReduction' | 'growSpeed' | 'dealerBoost' | 'incomeMultiplier' | 'launderBoost';

export interface CarDef {
  id: string;
  name: string;
  tier: CarTier;
  cost: number;
  currency?: 'clean' | 'dirty'; // default 'clean'
  bonusType: CarBonusType;
  bonusValue: number;           // percentage as decimal (0.05 = 5%)
  icon: string;
  description: string;
}

export interface OwnedCar {
  defId: string;
  purchasedAtTick: number;
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
  rivalHeat: number;
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
  prestigeBonus: number;       // DEPRECATED — kept for migration, use techUpgrades instead
  techPoints: number;                             // unspent Tech Points
  totalTechPointsEarned: number;                  // lifetime Tech Points earned
  techUpgrades: Record<TechUpgradeId, number>;    // upgrade ID → current level (0-5)
  sessionTechUpgrades: Record<SessionTechId, number>; // session tech → current level (resets on prestige/game reset)
  streetSellQuotaOz: number;       // oz remaining in current sell window (max 160 = 10 lbs)
  streetSellCooldownTicks: number; // ticks until quota refills (600 = 10 min)
  generatedBlocks: Record<string, GeneratedBlock>; // dynamically discovered city blocks
  nextBlockCost: number;           // cost of next generated block (doubles each purchase)
  currentJobId: string | null;     // current job ID or null (from JOB_DEFS)
  jobFiredCooldown: number;        // ticks remaining before can get new job (0 = ready)
  // Rivals & hitmen
  gameSettings: GameSettings;
  rivals: RivalSyndicate[];
  hitmen: HiredHitman[];           // player's hired hitmen
  rivalAttackLog: string[];        // recent attack messages (last 10)
  // Casino, Jewelry, Cars
  casinoHistory: CasinoHistory;
  jewelry: OwnedJewelry[];
  cars: OwnedCar[];
  // Event system
  eventSystem: import('./events/types').EventSystemState;
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
    strainUnlockBase: 500,    // cheap upgrades: $500, $1K, $2K to unlock more Basic Bud slots
    autoHarvestCost: 500,     // = virtual base
    upgradeCostMultiplier: 1, // ×1 (base tier)
    maxUpgradeLevels: { flora_gro: 0, flora_micro: 0, flora_bloom: 0, water: 0, light: 0, auto_harvest: 1 },
    strainSlots: [
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 1, growTimerTicks: 30, harvestYield: 12 },
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 1, growTimerTicks: 30, harvestYield: 12 },
      { strainName: 'Basic Bud', pricePerUnit: 8, plantsCapacity: 1, growTimerTicks: 30, harvestYield: 12 },
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
    maxUpgradeLevels: { flora_gro: 1, flora_micro: 1, flora_bloom: 1, water: 1, light: 1, auto_harvest: 1 },
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
    maxUpgradeLevels: { flora_gro: 2, flora_micro: 2, flora_bloom: 2, water: 2, light: 2, auto_harvest: 1 },
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
    maxUpgradeLevels: { flora_gro: 3, flora_micro: 3, flora_bloom: 3, water: 3, light: 2, auto_harvest: 1 },
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
    maxUpgradeLevels: { flora_gro: 4, flora_micro: 4, flora_bloom: 4, water: 4, light: 3, auto_harvest: 1 },
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
    maxUpgradeLevels: { flora_gro: 5, flora_micro: 5, flora_bloom: 5, water: 5, light: 4, auto_harvest: 1 },
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
    maxUpgradeLevels: { flora_gro: 6, flora_micro: 6, flora_bloom: 6, water: 6, light: 5, auto_harvest: 1 },
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
  rivalHeat: 0,
  heatNoticeShown: false,
  operation: INITIAL_OPERATION,
  businesses: [],
  unlockedDistricts: ['starter', 'operations', 'dealer_network', 'job_district', 'casino_district', 'jewelry_district', 'car_district'],
  unlockedSlots: { starter: 0 },
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
  techPoints: 0,
  totalTechPointsEarned: 0,
  techUpgrades: { ...INITIAL_TECH_UPGRADES },
  sessionTechUpgrades: { ...INITIAL_SESSION_TECH },
  streetSellQuotaOz: 160,
  streetSellCooldownTicks: 0,
  generatedBlocks: {},
  nextBlockCost: 2000,
  currentJobId: null,
  jobFiredCooldown: 0,
  gameSettings: { rivalCount: 3, rivalEntryDelay: 10, gameStarted: false, tutorialActive: false, tutorialStep: 0 },
  rivals: [],
  hitmen: [],
  rivalAttackLog: [],
  casinoHistory: { totalGambled: 0, totalWon: 0, totalLost: 0, gamesPlayed: 0 },
  jewelry: [],
  cars: [],
  eventSystem: { activeEvent: null, completedOneTimeEvents: [], eventCooldowns: {}, lastEventTick: 0, activeBuffs: [] },
};
