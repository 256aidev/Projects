/**
 * GAME TUNING DEFAULTS — all tunable game parameters in one place.
 * The admin dashboard writes overrides to Firestore `gameConfig/tuning`.
 * The tuningStore merges Firestore overrides on top of these defaults.
 */

export interface GameTuning {
  // ─── Rival Economy ─────────────────────────────────────────
  rivalTickInterval: number;        // how often rival AI ticks (game ticks)
  rivalDirtyBase: number;           // base dirty $/rival-tick
  rivalDirtyPerPower: number;       // dirty $ per power level/rival-tick
  rivalCleanBase: number;           // base clean $/rival-tick
  rivalCleanPerPower: number;       // clean $ per power level/rival-tick
  rivalCleanThreshold: number;      // dirty $ needed before clean starts
  rivalProductPerPower: number;     // oz per power level/rival-tick
  rivalPowerGrowth: number;         // power gain per rival-tick
  rivalPowerCap: number;            // max rival power
  rivalLotBuyChance: number;        // % chance per rival-tick to buy a lot
  rivalLotCost: number;             // flat lot cost for rivals
  rivalLotBuildCooldown: number;    // ticks before building on a lot
  rivalHitmanHireChance: number;    // % chance per rival-tick to hire hitman
  rivalHitmanCost: number;          // cost per hitman

  // ─── Rival Combat ──────────────────────────────────────────
  rivalAttackMultiplier: number;    // multiplier on base attack chance formula
  rivalStolenCashBase: number;      // base cash stolen on robbery
  rivalStolenCashPerPower: number;  // extra stolen per power
  rivalStolenProductBase: number;   // base oz stolen on raid
  rivalStolenProductPerPower: number;

  // ─── Heat ──────────────────────────────────────────────────
  heatMax: number;
  heatNaturalDecay: number;         // per tick
  heatDirtyCashDivisor: number;     // every X dirty = heatDirtyCashRate heat
  heatDirtyCashRate: number;

  // ─── Street Economy ────────────────────────────────────────
  baseStreetDemandOz: number;
  baseRefillPerMin: number;
  streetSellHeatPerOz: number;

  // ─── Seed & Room Costs ─────────────────────────────────────
  seedCostPerUnit: number;
  playerLotBaseCost: number;        // first lot cost (multiplied by slot+1)

  // ─── General Multipliers ───────────────────────────────────
  globalIncomeMultiplier: number;   // scales ALL income (dirty+clean)
  globalCostMultiplier: number;     // scales ALL purchase costs
  globalHeatMultiplier: number;     // scales all heat generation
}

export const DEFAULT_TUNING: GameTuning = {
  // Rival Economy
  rivalTickInterval: 10,
  rivalDirtyBase: 200,
  rivalDirtyPerPower: 100,
  rivalCleanBase: 100,
  rivalCleanPerPower: 80,
  rivalCleanThreshold: 10000,
  rivalProductPerPower: 0.5,
  rivalPowerGrowth: 0.005,
  rivalPowerCap: 20,
  rivalLotBuyChance: 0.05,
  rivalLotCost: 2000,
  rivalLotBuildCooldown: 60,
  rivalHitmanHireChance: 0.05,
  rivalHitmanCost: 5000,

  // Rival Combat
  rivalAttackMultiplier: 0.15,
  rivalStolenCashBase: 1000,
  rivalStolenCashPerPower: 500,
  rivalStolenProductBase: 2,
  rivalStolenProductPerPower: 2,

  // Heat
  heatMax: 1000,
  heatNaturalDecay: 0.1,
  heatDirtyCashDivisor: 50000,
  heatDirtyCashRate: 0.04,

  // Street Economy
  baseStreetDemandOz: 160,
  baseRefillPerMin: 16,
  streetSellHeatPerOz: 0.0002,

  // Seeds & Lots
  seedCostPerUnit: 5,
  playerLotBaseCost: 1000,

  // Global Multipliers
  globalIncomeMultiplier: 1.0,
  globalCostMultiplier: 1.0,
  globalHeatMultiplier: 1.0,
};

/** Slider definitions for the admin dashboard */
export interface TuningSlider {
  key: keyof GameTuning;
  label: string;
  group: string;
  min: number;
  max: number;
  step: number;
  format?: 'money' | 'percent' | 'decimal' | 'int';
}

export const TUNING_SLIDERS: TuningSlider[] = [
  // Rival Economy
  { key: 'rivalTickInterval', label: 'Rival Tick Interval', group: 'Rival Economy', min: 1, max: 60, step: 1, format: 'int' },
  { key: 'rivalDirtyBase', label: 'Rival Dirty $/tick (base)', group: 'Rival Economy', min: 0, max: 2000, step: 10, format: 'money' },
  { key: 'rivalDirtyPerPower', label: 'Rival Dirty $/power', group: 'Rival Economy', min: 0, max: 1000, step: 10, format: 'money' },
  { key: 'rivalCleanBase', label: 'Rival Clean $/tick (base)', group: 'Rival Economy', min: 0, max: 1000, step: 10, format: 'money' },
  { key: 'rivalCleanPerPower', label: 'Rival Clean $/power', group: 'Rival Economy', min: 0, max: 500, step: 10, format: 'money' },
  { key: 'rivalCleanThreshold', label: 'Dirty $ needed for clean', group: 'Rival Economy', min: 0, max: 200000, step: 1000, format: 'money' },
  { key: 'rivalProductPerPower', label: 'Rival Oz/power', group: 'Rival Economy', min: 0, max: 10, step: 0.1, format: 'decimal' },
  { key: 'rivalPowerGrowth', label: 'Power growth/tick', group: 'Rival Economy', min: 0, max: 0.1, step: 0.001, format: 'decimal' },
  { key: 'rivalPowerCap', label: 'Max rival power', group: 'Rival Economy', min: 1, max: 100, step: 1, format: 'int' },
  { key: 'rivalLotBuyChance', label: 'Lot buy chance', group: 'Rival Economy', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'rivalLotCost', label: 'Rival lot cost', group: 'Rival Economy', min: 500, max: 50000, step: 500, format: 'money' },
  { key: 'rivalHitmanHireChance', label: 'Hitman hire chance', group: 'Rival Economy', min: 0, max: 0.5, step: 0.01, format: 'percent' },

  // Rival Combat
  { key: 'rivalAttackMultiplier', label: 'Attack chance mult', group: 'Rival Combat', min: 0, max: 1, step: 0.01, format: 'decimal' },
  { key: 'rivalStolenCashBase', label: 'Cash stolen (base)', group: 'Rival Combat', min: 0, max: 10000, step: 100, format: 'money' },
  { key: 'rivalStolenCashPerPower', label: 'Cash stolen/power', group: 'Rival Combat', min: 0, max: 5000, step: 50, format: 'money' },
  { key: 'rivalStolenProductBase', label: 'Oz stolen (base)', group: 'Rival Combat', min: 0, max: 20, step: 1, format: 'int' },
  { key: 'rivalStolenProductPerPower', label: 'Oz stolen/power', group: 'Rival Combat', min: 0, max: 20, step: 1, format: 'int' },

  // Heat
  { key: 'heatMax', label: 'Max Heat', group: 'Heat System', min: 100, max: 5000, step: 100, format: 'int' },
  { key: 'heatNaturalDecay', label: 'Natural decay/tick', group: 'Heat System', min: 0, max: 1, step: 0.01, format: 'decimal' },
  { key: 'heatDirtyCashDivisor', label: 'Dirty $ per heat unit', group: 'Heat System', min: 1000, max: 500000, step: 1000, format: 'money' },
  { key: 'heatDirtyCashRate', label: 'Heat rate per unit', group: 'Heat System', min: 0, max: 0.5, step: 0.005, format: 'decimal' },

  // Street Economy
  { key: 'baseStreetDemandOz', label: 'Base street demand (oz)', group: 'Street Economy', min: 10, max: 1000, step: 10, format: 'int' },
  { key: 'baseRefillPerMin', label: 'Demand refill/min (oz)', group: 'Street Economy', min: 1, max: 100, step: 1, format: 'int' },
  { key: 'streetSellHeatPerOz', label: 'Sell heat/oz', group: 'Street Economy', min: 0, max: 0.01, step: 0.0001, format: 'decimal' },

  // Costs
  { key: 'seedCostPerUnit', label: 'Seed cost', group: 'Costs', min: 1, max: 100, step: 1, format: 'money' },
  { key: 'playerLotBaseCost', label: 'Player lot base cost', group: 'Costs', min: 100, max: 10000, step: 100, format: 'money' },

  // Global Multipliers
  { key: 'globalIncomeMultiplier', label: 'Income multiplier', group: 'Global Multipliers', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalCostMultiplier', label: 'Cost multiplier', group: 'Global Multipliers', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalHeatMultiplier', label: 'Heat multiplier', group: 'Global Multipliers', min: 0, max: 5, step: 0.1, format: 'decimal' },
];
