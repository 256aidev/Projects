/**
 * GAME TUNING DEFAULTS — all tunable game parameters in one place.
 * Admin dashboard writes overrides to localStorage (+ optional Firestore).
 */

export interface GameTuning {
  // ─── Rival Economy ─────────────────────────────────────────
  rivalTickInterval: number;
  rivalDirtyBase: number;
  rivalDirtyPerPower: number;
  rivalCleanBase: number;
  rivalCleanPerPower: number;
  rivalCleanThreshold: number;
  rivalProductPerPower: number;
  rivalPowerGrowth: number;
  rivalPowerCap: number;
  rivalLotBuyChance: number;
  rivalLotCost: number;
  rivalLotBuildCooldown: number;
  rivalHitmanHireChance: number;
  rivalHitmanCost: number;

  // ─── Rival Combat ──────────────────────────────────────────
  rivalAttackMultiplier: number;
  rivalStolenCashBase: number;
  rivalStolenCashPerPower: number;
  rivalStolenProductBase: number;
  rivalStolenProductPerPower: number;
  arsonDuration: number;
  arsonInsurance: number;

  // ─── Heat System ───────────────────────────────────────────
  heatMax: number;
  heatNaturalDecay: number;
  heatDirtyCashDivisor: number;
  heatDirtyCashRate: number;
  rivalHeatNaturalDecay: number;
  rivalDealerHeatMult: number;
  rivalTerritoryHeatMult: number;

  // ─── Street Economy ────────────────────────────────────────
  baseStreetDemandOz: number;
  baseRefillPerMin: number;
  streetSellHeatPerOz: number;
  streetSellJobTierHeatMult: number;
  demandBonusRefillMult: number;

  // ─── Grow Rooms ────────────────────────────────────────────
  seedCostPerUnit: number;
  closetGrowTime: number;
  closetYield: number;
  shedGrowTime: number;
  shedYield: number;
  garageGrowTime: number;
  garageYield: number;
  smallGrowTime: number;
  smallGrowYield: number;
  facilityGrowTime: number;
  facilityYield: number;
  largeGrowTime: number;
  largeGrowYield: number;

  // ─── Dealers ───────────────────────────────────────────────
  cornerBoysSalesRate: number;
  cornerBoysHireCost: number;
  cornerBoysHeatPerTick: number;
  streetCrewSalesRate: number;
  streetCrewHireCost: number;
  streetCrewHeatPerTick: number;
  distNetworkSalesRate: number;
  distNetworkHireCost: number;
  distNetworkHeatPerTick: number;
  citySyndicateSalesRate: number;
  citySyndicateHireCost: number;
  citySyndicateHeatPerTick: number;
  regionalCartelSalesRate: number;
  regionalCartelHireCost: number;
  regionalCartelHeatPerTick: number;
  dealerCostScaling: number;

  // ─── Business / Laundering ─────────────────────────────────
  globalRevenueMultiplier: number;
  globalOperatingCostMultiplier: number;
  globalLaunderMultiplier: number;
  globalLaunderEfficiency: number;
  reverseFlowEfficiency: number;

  // ─── Casino ────────────────────────────────────────────────
  casinoTaxRate: number;
  casinoMinBet: number;
  casinoMaxBet: number;
  blackjackPayout: number;
  blackjackNaturalPayout: number;

  // ─── Bank ──────────────────────────────────────────────────
  bankDepositInterestRate: number;
  bankLoan1YearRate: number;
  bankLoan1YearMax: number;
  bankLoan3YearRate: number;
  bankLoan3YearMax: number;
  bankLoan5YearRate: number;
  bankLoan5YearMax: number;

  // ─── Lawyers ───────────────────────────────────────────────
  publicDefenderCost: number;
  publicDefenderDecay: number;
  stripMallCost: number;
  stripMallDecay: number;
  criminalAttorneyCost: number;
  criminalAttorneyDecay: number;
  fixerCost: number;
  fixerDecay: number;
  cartelCounselCost: number;
  cartelCounselDecay: number;

  // ─── Crew ──────────────────────────────────────────────────
  soldierCost: number;
  soldierAttack: number;
  soldierDefense: number;
  soldierUpkeep: number;
  lieutenantCost: number;
  lieutenantAttack: number;
  lieutenantDefense: number;
  lieutenantUpkeep: number;
  captainCost: number;
  captainAttack: number;
  captainDefense: number;
  captainUpkeep: number;
  consigliereCost: number;
  consigliereAttack: number;
  consigliereDefense: number;
  consigliereUpkeep: number;

  // ─── House & HQ ────────────────────────────────────────────
  bungalowCost: number;
  villaCost: number;
  mansionCost: number;
  megaMansionCost: number;
  backRoomCost: number;
  officeCost: number;
  compoundCost: number;
  fortressCost: number;

  // ─── Player Starting Values ────────────────────────────────
  startingDirtyCash: number;
  startingSeeds: number;
  startingProductOz: number;

  // ─── Global Multipliers ────────────────────────────────────
  globalIncomeMultiplier: number;
  globalCostMultiplier: number;
  globalHeatMultiplier: number;
  globalGrowSpeedMultiplier: number;
  globalYieldMultiplier: number;

  // ─── Timing ────────────────────────────────────────────────
  playerLotBuildCooldown: number;
  jobFiredCooldown: number;
  heatNoticeThreshold: number;
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
  arsonDuration: 100,
  arsonInsurance: 5000,

  // Heat
  heatMax: 1000,
  heatNaturalDecay: 0.1,
  heatDirtyCashDivisor: 50000,
  heatDirtyCashRate: 0.04,
  rivalHeatNaturalDecay: 0.05,
  rivalDealerHeatMult: 0.5,
  rivalTerritoryHeatMult: 0.002,

  // Street Economy
  baseStreetDemandOz: 160,
  baseRefillPerMin: 16,
  streetSellHeatPerOz: 0.0002,
  streetSellJobTierHeatMult: 0.005,
  demandBonusRefillMult: 0.08,

  // Grow Rooms
  seedCostPerUnit: 5,
  closetGrowTime: 25,
  closetYield: 12,
  shedGrowTime: 35,
  shedYield: 24,
  garageGrowTime: 31,
  garageYield: 48,
  smallGrowTime: 27,
  smallGrowYield: 120,
  facilityGrowTime: 23,
  facilityYield: 300,
  largeGrowTime: 15,
  largeGrowYield: 600,

  // Dealers
  cornerBoysSalesRate: 0.5,
  cornerBoysHireCost: 500,
  cornerBoysHeatPerTick: 0.005,
  streetCrewSalesRate: 1.5,
  streetCrewHireCost: 300,
  streetCrewHeatPerTick: 0.012,
  distNetworkSalesRate: 4.0,
  distNetworkHireCost: 1200,
  distNetworkHeatPerTick: 0.020,
  citySyndicateSalesRate: 12.0,
  citySyndicateHireCost: 6000,
  citySyndicateHeatPerTick: 0.035,
  regionalCartelSalesRate: 40.0,
  regionalCartelHireCost: 30000,
  regionalCartelHeatPerTick: 0.060,
  dealerCostScaling: 1.5,

  // Business / Laundering
  globalRevenueMultiplier: 1.0,
  globalOperatingCostMultiplier: 1.0,
  globalLaunderMultiplier: 1.0,
  globalLaunderEfficiency: 1.0,
  reverseFlowEfficiency: 0.95,

  // Casino
  casinoTaxRate: 0.15,
  casinoMinBet: 100,
  casinoMaxBet: 100000,
  blackjackPayout: 1.0,
  blackjackNaturalPayout: 1.5,

  // Bank
  bankDepositInterestRate: 0.05,
  bankLoan1YearRate: 0.08,
  bankLoan1YearMax: 100000,
  bankLoan3YearRate: 0.12,
  bankLoan3YearMax: 500000,
  bankLoan5YearRate: 0.18,
  bankLoan5YearMax: 2000000,

  // Lawyers
  publicDefenderCost: 500,
  publicDefenderDecay: 0.05,
  stripMallCost: 5000,
  stripMallDecay: 0.15,
  criminalAttorneyCost: 25000,
  criminalAttorneyDecay: 0.35,
  fixerCost: 100000,
  fixerDecay: 0.60,
  cartelCounselCost: 500000,
  cartelCounselDecay: 1.0,

  // Crew
  soldierCost: 5000,
  soldierAttack: 10,
  soldierDefense: 5,
  soldierUpkeep: 2,
  lieutenantCost: 25000,
  lieutenantAttack: 25,
  lieutenantDefense: 15,
  lieutenantUpkeep: 8,
  captainCost: 100000,
  captainAttack: 60,
  captainDefense: 30,
  captainUpkeep: 25,
  consigliereCost: 500000,
  consigliereAttack: 150,
  consigliereDefense: 80,
  consigliereUpkeep: 80,

  // House & HQ
  bungalowCost: 25000,
  villaCost: 150000,
  mansionCost: 750000,
  megaMansionCost: 5000000,
  backRoomCost: 10000,
  officeCost: 100000,
  compoundCost: 500000,
  fortressCost: 3000000,

  // Starting Values
  startingDirtyCash: 500,
  startingSeeds: 10,
  startingProductOz: 12,

  // Global Multipliers
  globalIncomeMultiplier: 1.0,
  globalCostMultiplier: 1.0,
  globalHeatMultiplier: 1.0,
  globalGrowSpeedMultiplier: 1.0,
  globalYieldMultiplier: 1.0,

  // Timing
  playerLotBuildCooldown: 60,
  jobFiredCooldown: 60,
  heatNoticeThreshold: 100000,
};

/** Tab definitions for admin dashboard */
export const TUNING_TABS = [
  'Rivals',
  'Heat & Police',
  'Growing',
  'Dealers',
  'Business',
  'Casino & Bank',
  'Lawyers & Crew',
  'Housing',
  'Global',
] as const;

export type TuningTab = typeof TUNING_TABS[number];

/** Slider definitions for the admin dashboard */
export interface TuningSlider {
  key: keyof GameTuning;
  label: string;
  tab: TuningTab;
  min: number;
  max: number;
  step: number;
  format?: 'money' | 'percent' | 'decimal' | 'int' | 'ticks';
}

export const TUNING_SLIDERS: TuningSlider[] = [
  // ─── Rivals Tab ────────────────────────────────────────────
  { key: 'rivalTickInterval', label: 'AI Tick Interval', tab: 'Rivals', min: 1, max: 60, step: 1, format: 'ticks' },
  { key: 'rivalDirtyBase', label: 'Dirty $ Base/tick', tab: 'Rivals', min: 0, max: 5000, step: 50, format: 'money' },
  { key: 'rivalDirtyPerPower', label: 'Dirty $ Per Power', tab: 'Rivals', min: 0, max: 2000, step: 25, format: 'money' },
  { key: 'rivalCleanBase', label: 'Clean $ Base/tick', tab: 'Rivals', min: 0, max: 2000, step: 25, format: 'money' },
  { key: 'rivalCleanPerPower', label: 'Clean $ Per Power', tab: 'Rivals', min: 0, max: 1000, step: 10, format: 'money' },
  { key: 'rivalCleanThreshold', label: 'Dirty $ Before Clean', tab: 'Rivals', min: 0, max: 500000, step: 1000, format: 'money' },
  { key: 'rivalProductPerPower', label: 'Oz Per Power', tab: 'Rivals', min: 0, max: 20, step: 0.1, format: 'decimal' },
  { key: 'rivalPowerGrowth', label: 'Power Growth/tick', tab: 'Rivals', min: 0, max: 0.1, step: 0.001, format: 'decimal' },
  { key: 'rivalPowerCap', label: 'Max Power', tab: 'Rivals', min: 1, max: 100, step: 1, format: 'int' },
  { key: 'rivalLotBuyChance', label: 'Lot Buy Chance', tab: 'Rivals', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'rivalLotCost', label: 'Lot Cost', tab: 'Rivals', min: 100, max: 50000, step: 500, format: 'money' },
  { key: 'rivalLotBuildCooldown', label: 'Build Cooldown', tab: 'Rivals', min: 1, max: 300, step: 5, format: 'ticks' },
  { key: 'rivalHitmanHireChance', label: 'Hitman Hire Chance', tab: 'Rivals', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'rivalHitmanCost', label: 'Hitman Cost', tab: 'Rivals', min: 500, max: 100000, step: 500, format: 'money' },
  { key: 'rivalAttackMultiplier', label: 'Attack Chance Mult', tab: 'Rivals', min: 0, max: 1, step: 0.01, format: 'decimal' },
  { key: 'rivalStolenCashBase', label: 'Stolen Cash Base', tab: 'Rivals', min: 0, max: 50000, step: 100, format: 'money' },
  { key: 'rivalStolenCashPerPower', label: 'Stolen Cash/Power', tab: 'Rivals', min: 0, max: 10000, step: 100, format: 'money' },
  { key: 'rivalStolenProductBase', label: 'Stolen Oz Base', tab: 'Rivals', min: 0, max: 50, step: 1, format: 'int' },
  { key: 'rivalStolenProductPerPower', label: 'Stolen Oz/Power', tab: 'Rivals', min: 0, max: 50, step: 1, format: 'int' },
  { key: 'arsonDuration', label: 'Arson Duration', tab: 'Rivals', min: 10, max: 500, step: 10, format: 'ticks' },
  { key: 'arsonInsurance', label: 'Arson Insurance', tab: 'Rivals', min: 0, max: 50000, step: 500, format: 'money' },

  // ─── Heat & Police Tab ─────────────────────────────────────
  { key: 'heatMax', label: 'Max Heat', tab: 'Heat & Police', min: 100, max: 10000, step: 100, format: 'int' },
  { key: 'heatNaturalDecay', label: 'Natural Decay/tick', tab: 'Heat & Police', min: 0, max: 2, step: 0.01, format: 'decimal' },
  { key: 'heatDirtyCashDivisor', label: 'Dirty $ Per Heat Unit', tab: 'Heat & Police', min: 1000, max: 500000, step: 1000, format: 'money' },
  { key: 'heatDirtyCashRate', label: 'Heat Rate Per Unit', tab: 'Heat & Police', min: 0, max: 0.5, step: 0.005, format: 'decimal' },
  { key: 'rivalHeatNaturalDecay', label: 'Rival Heat Decay/tick', tab: 'Heat & Police', min: 0, max: 1, step: 0.01, format: 'decimal' },
  { key: 'rivalDealerHeatMult', label: 'Rival Dealer Heat Mult', tab: 'Heat & Police', min: 0, max: 5, step: 0.1, format: 'decimal' },
  { key: 'rivalTerritoryHeatMult', label: 'Rival Territory Heat Mult', tab: 'Heat & Police', min: 0, max: 0.05, step: 0.001, format: 'decimal' },
  { key: 'globalHeatMultiplier', label: 'Global Heat Multiplier', tab: 'Heat & Police', min: 0, max: 5, step: 0.1, format: 'decimal' },
  { key: 'heatNoticeThreshold', label: 'Heat Notice $ Threshold', tab: 'Heat & Police', min: 10000, max: 1000000, step: 10000, format: 'money' },

  // ─── Growing Tab ───────────────────────────────────────────
  { key: 'seedCostPerUnit', label: 'Seed Cost', tab: 'Growing', min: 1, max: 200, step: 1, format: 'money' },
  { key: 'globalGrowSpeedMultiplier', label: 'Grow Speed Multiplier', tab: 'Growing', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalYieldMultiplier', label: 'Yield Multiplier', tab: 'Growing', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'closetGrowTime', label: 'Closet Grow Time', tab: 'Growing', min: 5, max: 100, step: 1, format: 'ticks' },
  { key: 'closetYield', label: 'Closet Yield (oz)', tab: 'Growing', min: 1, max: 200, step: 1, format: 'int' },
  { key: 'shedGrowTime', label: 'Shed Grow Time', tab: 'Growing', min: 5, max: 100, step: 1, format: 'ticks' },
  { key: 'shedYield', label: 'Shed Yield (oz)', tab: 'Growing', min: 1, max: 400, step: 5, format: 'int' },
  { key: 'garageGrowTime', label: 'Garage Grow Time', tab: 'Growing', min: 5, max: 100, step: 1, format: 'ticks' },
  { key: 'garageYield', label: 'Garage Yield (oz)', tab: 'Growing', min: 1, max: 800, step: 5, format: 'int' },
  { key: 'smallGrowTime', label: 'Small Grow Time', tab: 'Growing', min: 5, max: 100, step: 1, format: 'ticks' },
  { key: 'smallGrowYield', label: 'Small Grow Yield (oz)', tab: 'Growing', min: 5, max: 2000, step: 10, format: 'int' },
  { key: 'facilityGrowTime', label: 'Facility Grow Time', tab: 'Growing', min: 5, max: 100, step: 1, format: 'ticks' },
  { key: 'facilityYield', label: 'Facility Yield (oz)', tab: 'Growing', min: 10, max: 5000, step: 25, format: 'int' },
  { key: 'largeGrowTime', label: 'Large Grow Time', tab: 'Growing', min: 3, max: 100, step: 1, format: 'ticks' },
  { key: 'largeGrowYield', label: 'Large Grow Yield (oz)', tab: 'Growing', min: 50, max: 10000, step: 50, format: 'int' },

  // ─── Dealers Tab ───────────────────────────────────────────
  { key: 'baseStreetDemandOz', label: 'Base Street Demand (oz)', tab: 'Dealers', min: 10, max: 2000, step: 10, format: 'int' },
  { key: 'baseRefillPerMin', label: 'Demand Refill/min (oz)', tab: 'Dealers', min: 1, max: 200, step: 1, format: 'int' },
  { key: 'demandBonusRefillMult', label: 'Bonus Refill Mult', tab: 'Dealers', min: 0, max: 0.5, step: 0.01, format: 'decimal' },
  { key: 'streetSellHeatPerOz', label: 'Sell Heat Per Oz', tab: 'Dealers', min: 0, max: 0.01, step: 0.0001, format: 'decimal' },
  { key: 'streetSellJobTierHeatMult', label: 'Job Tier Heat Mult', tab: 'Dealers', min: 0, max: 0.05, step: 0.001, format: 'decimal' },
  { key: 'dealerCostScaling', label: 'Dealer Cost Scaling', tab: 'Dealers', min: 1, max: 3, step: 0.05, format: 'decimal' },
  { key: 'cornerBoysSalesRate', label: 'Corner Boys: Sales/tick', tab: 'Dealers', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'cornerBoysHireCost', label: 'Corner Boys: Hire Cost', tab: 'Dealers', min: 50, max: 10000, step: 50, format: 'money' },
  { key: 'cornerBoysHeatPerTick', label: 'Corner Boys: Heat/tick', tab: 'Dealers', min: 0, max: 0.1, step: 0.001, format: 'decimal' },
  { key: 'streetCrewSalesRate', label: 'Street Crew: Sales/tick', tab: 'Dealers', min: 0.1, max: 20, step: 0.1, format: 'decimal' },
  { key: 'streetCrewHireCost', label: 'Street Crew: Hire Cost', tab: 'Dealers', min: 50, max: 10000, step: 50, format: 'money' },
  { key: 'streetCrewHeatPerTick', label: 'Street Crew: Heat/tick', tab: 'Dealers', min: 0, max: 0.2, step: 0.001, format: 'decimal' },
  { key: 'distNetworkSalesRate', label: 'Dist Network: Sales/tick', tab: 'Dealers', min: 0.5, max: 50, step: 0.5, format: 'decimal' },
  { key: 'distNetworkHireCost', label: 'Dist Network: Hire Cost', tab: 'Dealers', min: 100, max: 50000, step: 100, format: 'money' },
  { key: 'distNetworkHeatPerTick', label: 'Dist Network: Heat/tick', tab: 'Dealers', min: 0, max: 0.5, step: 0.005, format: 'decimal' },
  { key: 'citySyndicateSalesRate', label: 'City Syndicate: Sales/tick', tab: 'Dealers', min: 1, max: 100, step: 1, format: 'decimal' },
  { key: 'citySyndicateHireCost', label: 'City Syndicate: Hire Cost', tab: 'Dealers', min: 500, max: 100000, step: 500, format: 'money' },
  { key: 'citySyndicateHeatPerTick', label: 'City Syndicate: Heat/tick', tab: 'Dealers', min: 0, max: 0.5, step: 0.005, format: 'decimal' },
  { key: 'regionalCartelSalesRate', label: 'Regional Cartel: Sales/tick', tab: 'Dealers', min: 5, max: 500, step: 5, format: 'decimal' },
  { key: 'regionalCartelHireCost', label: 'Regional Cartel: Hire Cost', tab: 'Dealers', min: 1000, max: 500000, step: 1000, format: 'money' },
  { key: 'regionalCartelHeatPerTick', label: 'Regional Cartel: Heat/tick', tab: 'Dealers', min: 0, max: 1, step: 0.01, format: 'decimal' },

  // ─── Business Tab ──────────────────────────────────────────
  { key: 'globalRevenueMultiplier', label: 'Revenue Multiplier', tab: 'Business', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalOperatingCostMultiplier', label: 'Operating Cost Mult', tab: 'Business', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalLaunderMultiplier', label: 'Launder Rate Mult', tab: 'Business', min: 0.1, max: 10, step: 0.1, format: 'decimal' },
  { key: 'globalLaunderEfficiency', label: 'Launder Efficiency Mult', tab: 'Business', min: 0.1, max: 2, step: 0.05, format: 'decimal' },
  { key: 'reverseFlowEfficiency', label: 'Reverse Flow Rate', tab: 'Business', min: 0.5, max: 1, step: 0.01, format: 'percent' },
  { key: 'globalIncomeMultiplier', label: 'Global Income Mult', tab: 'Business', min: 0.1, max: 20, step: 0.1, format: 'decimal' },
  { key: 'globalCostMultiplier', label: 'Global Cost Mult', tab: 'Business', min: 0.1, max: 10, step: 0.1, format: 'decimal' },

  // ─── Casino & Bank Tab ─────────────────────────────────────
  { key: 'casinoTaxRate', label: 'Casino Tax Rate', tab: 'Casino & Bank', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'casinoMinBet', label: 'Min Bet', tab: 'Casino & Bank', min: 10, max: 10000, step: 10, format: 'money' },
  { key: 'casinoMaxBet', label: 'Max Bet', tab: 'Casino & Bank', min: 1000, max: 10000000, step: 10000, format: 'money' },
  { key: 'blackjackPayout', label: 'Blackjack Payout', tab: 'Casino & Bank', min: 0.5, max: 5, step: 0.1, format: 'decimal' },
  { key: 'blackjackNaturalPayout', label: 'Blackjack Natural', tab: 'Casino & Bank', min: 1, max: 5, step: 0.1, format: 'decimal' },
  { key: 'bankDepositInterestRate', label: 'Deposit APR', tab: 'Casino & Bank', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'bankLoan1YearRate', label: '1yr Loan Rate', tab: 'Casino & Bank', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'bankLoan1YearMax', label: '1yr Loan Max', tab: 'Casino & Bank', min: 10000, max: 5000000, step: 10000, format: 'money' },
  { key: 'bankLoan3YearRate', label: '3yr Loan Rate', tab: 'Casino & Bank', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'bankLoan3YearMax', label: '3yr Loan Max', tab: 'Casino & Bank', min: 50000, max: 10000000, step: 50000, format: 'money' },
  { key: 'bankLoan5YearRate', label: '5yr Loan Rate', tab: 'Casino & Bank', min: 0, max: 0.5, step: 0.01, format: 'percent' },
  { key: 'bankLoan5YearMax', label: '5yr Loan Max', tab: 'Casino & Bank', min: 100000, max: 50000000, step: 100000, format: 'money' },

  // ─── Lawyers & Crew Tab ────────────────────────────────────
  { key: 'publicDefenderCost', label: 'Public Defender Cost', tab: 'Lawyers & Crew', min: 50, max: 10000, step: 50, format: 'money' },
  { key: 'publicDefenderDecay', label: 'Public Defender Decay', tab: 'Lawyers & Crew', min: 0, max: 0.5, step: 0.01, format: 'decimal' },
  { key: 'stripMallCost', label: 'Strip Mall Lawyer Cost', tab: 'Lawyers & Crew', min: 500, max: 100000, step: 500, format: 'money' },
  { key: 'stripMallDecay', label: 'Strip Mall Decay', tab: 'Lawyers & Crew', min: 0, max: 1, step: 0.01, format: 'decimal' },
  { key: 'criminalAttorneyCost', label: 'Criminal Attorney Cost', tab: 'Lawyers & Crew', min: 1000, max: 500000, step: 1000, format: 'money' },
  { key: 'criminalAttorneyDecay', label: 'Criminal Attorney Decay', tab: 'Lawyers & Crew', min: 0, max: 2, step: 0.05, format: 'decimal' },
  { key: 'fixerCost', label: 'The Fixer Cost', tab: 'Lawyers & Crew', min: 5000, max: 1000000, step: 5000, format: 'money' },
  { key: 'fixerDecay', label: 'The Fixer Decay', tab: 'Lawyers & Crew', min: 0, max: 3, step: 0.05, format: 'decimal' },
  { key: 'cartelCounselCost', label: 'Cartel Counsel Cost', tab: 'Lawyers & Crew', min: 50000, max: 5000000, step: 50000, format: 'money' },
  { key: 'cartelCounselDecay', label: 'Cartel Counsel Decay', tab: 'Lawyers & Crew', min: 0, max: 5, step: 0.1, format: 'decimal' },
  { key: 'soldierCost', label: 'Soldier Cost', tab: 'Lawyers & Crew', min: 500, max: 100000, step: 500, format: 'money' },
  { key: 'soldierAttack', label: 'Soldier Attack', tab: 'Lawyers & Crew', min: 1, max: 100, step: 1, format: 'int' },
  { key: 'soldierDefense', label: 'Soldier Defense', tab: 'Lawyers & Crew', min: 1, max: 50, step: 1, format: 'int' },
  { key: 'soldierUpkeep', label: 'Soldier Upkeep', tab: 'Lawyers & Crew', min: 0, max: 50, step: 1, format: 'money' },
  { key: 'lieutenantCost', label: 'Lieutenant Cost', tab: 'Lawyers & Crew', min: 5000, max: 500000, step: 5000, format: 'money' },
  { key: 'lieutenantAttack', label: 'Lieutenant Attack', tab: 'Lawyers & Crew', min: 5, max: 200, step: 5, format: 'int' },
  { key: 'lieutenantDefense', label: 'Lieutenant Defense', tab: 'Lawyers & Crew', min: 1, max: 100, step: 1, format: 'int' },
  { key: 'lieutenantUpkeep', label: 'Lieutenant Upkeep', tab: 'Lawyers & Crew', min: 0, max: 100, step: 1, format: 'money' },
  { key: 'captainCost', label: 'Captain Cost', tab: 'Lawyers & Crew', min: 10000, max: 1000000, step: 10000, format: 'money' },
  { key: 'captainAttack', label: 'Captain Attack', tab: 'Lawyers & Crew', min: 10, max: 500, step: 10, format: 'int' },
  { key: 'captainDefense', label: 'Captain Defense', tab: 'Lawyers & Crew', min: 5, max: 200, step: 5, format: 'int' },
  { key: 'captainUpkeep', label: 'Captain Upkeep', tab: 'Lawyers & Crew', min: 0, max: 200, step: 5, format: 'money' },
  { key: 'consigliereCost', label: 'Consigliere Cost', tab: 'Lawyers & Crew', min: 50000, max: 5000000, step: 50000, format: 'money' },
  { key: 'consigliereAttack', label: 'Consigliere Attack', tab: 'Lawyers & Crew', min: 25, max: 1000, step: 25, format: 'int' },
  { key: 'consigliereDefense', label: 'Consigliere Defense', tab: 'Lawyers & Crew', min: 10, max: 500, step: 10, format: 'int' },
  { key: 'consigliereUpkeep', label: 'Consigliere Upkeep', tab: 'Lawyers & Crew', min: 0, max: 500, step: 10, format: 'money' },

  // ─── Housing Tab ───────────────────────────────────────────
  { key: 'bungalowCost', label: 'Bungalow Cost', tab: 'Housing', min: 5000, max: 500000, step: 5000, format: 'money' },
  { key: 'villaCost', label: 'Villa Cost', tab: 'Housing', min: 25000, max: 2000000, step: 25000, format: 'money' },
  { key: 'mansionCost', label: 'Mansion Cost', tab: 'Housing', min: 100000, max: 10000000, step: 100000, format: 'money' },
  { key: 'megaMansionCost', label: 'Mega Mansion Cost', tab: 'Housing', min: 500000, max: 50000000, step: 500000, format: 'money' },
  { key: 'backRoomCost', label: 'Back Room HQ Cost', tab: 'Housing', min: 1000, max: 200000, step: 1000, format: 'money' },
  { key: 'officeCost', label: 'Office HQ Cost', tab: 'Housing', min: 10000, max: 1000000, step: 10000, format: 'money' },
  { key: 'compoundCost', label: 'Compound HQ Cost', tab: 'Housing', min: 50000, max: 5000000, step: 50000, format: 'money' },
  { key: 'fortressCost', label: 'Fortress HQ Cost', tab: 'Housing', min: 100000, max: 20000000, step: 100000, format: 'money' },

  // ─── Global Tab ────────────────────────────────────────────
  { key: 'startingDirtyCash', label: 'Starting Dirty Cash', tab: 'Global', min: 0, max: 100000, step: 100, format: 'money' },
  { key: 'startingSeeds', label: 'Starting Seeds', tab: 'Global', min: 0, max: 500, step: 5, format: 'int' },
  { key: 'startingProductOz', label: 'Starting Product (oz)', tab: 'Global', min: 0, max: 500, step: 5, format: 'int' },
  { key: 'playerLotBuildCooldown', label: 'Player Lot Build CD', tab: 'Global', min: 1, max: 300, step: 5, format: 'ticks' },
  { key: 'jobFiredCooldown', label: 'Job Fired Cooldown', tab: 'Global', min: 1, max: 300, step: 5, format: 'ticks' },
];
