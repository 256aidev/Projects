import type { BusinessInstance, CriminalOperation } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { DEALER_TIERS, WATER_TIERS, LIGHT_TIERS, NUTRIENT_DEFS } from '../data/types';

// ─── CRIMINAL OPERATION ───────────────────────────

export function tickCriminalOperation(op: CriminalOperation, prestigeBonus = 0): {
  newOp: CriminalOperation;
  dirtyEarned: number;
  maintenanceCost: number;
} {
  const dealerTier = DEALER_TIERS[op.dealerTierIndex];
  let dirtyEarned = 0;
  const newProductInventory = { ...op.productInventory };

  // Dealers sell product → dirty cash, per strain at actual prices
  const totalOz = Object.values(newProductInventory).reduce((sum, e) => sum + e.oz, 0);
  if (op.dealerCount > 0 && totalOz > 0) {
    const unitsSold = Math.min(totalOz, dealerTier.salesRatePerTick * op.dealerCount);
    const cutCost = unitsSold * (dealerTier.cutPer8oz / 8);
    let saleValue = 0;
    // Sell proportionally from each strain at its actual price
    for (const strainName of Object.keys(newProductInventory)) {
      const entry = newProductInventory[strainName];
      const fraction = entry.oz / totalOz;
      const strainSold = Math.min(entry.oz, unitsSold * fraction);
      saleValue += strainSold * entry.pricePerUnit;
      newProductInventory[strainName] = { ...entry, oz: entry.oz - strainSold };
    }
    dirtyEarned = Math.max(0, saleValue - cutCost);
  }

  // Tick all grow room slots — auto-harvest if enabled
  const autoHarvestedByStrain: Record<string, { oz: number; pricePerUnit: number }> = {};
  let autoHarvestCycleCost = 0;
  let newSeedStock = op.seedStock;

  const newGrowRooms = op.growRooms.map((room) => {
    const waterBonus  = WATER_TIERS[room.waterTier ?? 0]?.yieldBonus ?? 0;
    const lightBonus  = LIGHT_TIERS[room.lightTier ?? 0]?.yieldBonus ?? 0;
    // FloraGro: speed; FloraMicro: yield; FloraBloom: double chance
    const floraGroLevel   = (room.nutrientSpeed ?? 0);
    const floraMicroLevel = (room.nutrientYield ?? 0);
    const floraBloomLevel = (room.nutrientDouble ?? 0);
    const speedBonus    = floraGroLevel   > 0 ? (NUTRIENT_DEFS[0].levels[floraGroLevel - 1]?.speedBonus   ?? 0) : 0;
    const nutriYield    = floraMicroLevel > 0 ? (NUTRIENT_DEFS[1].levels[floraMicroLevel - 1]?.yieldBonus ?? 0) : 0;
    const doubleChance  = floraBloomLevel > 0 ? (NUTRIENT_DEFS[2].levels[floraBloomLevel - 1]?.doubleChance ?? 0) : 0;
    const nutriCycleCost = (floraGroLevel   > 0 ? (NUTRIENT_DEFS[0].levels[floraGroLevel - 1]?.costPerCycle   ?? 0) : 0)
                         + (floraMicroLevel > 0 ? (NUTRIENT_DEFS[1].levels[floraMicroLevel - 1]?.costPerCycle ?? 0) : 0)
                         + (floraBloomLevel > 0 ? (NUTRIENT_DEFS[2].levels[floraBloomLevel - 1]?.costPerCycle ?? 0) : 0);

    const newSlots = room.slots.map((slot) => {
      if (!slot.isHarvesting) return slot;

      // Count down
      if (slot.ticksRemaining > 1) return { ...slot, ticksRemaining: slot.ticksRemaining - 1 };

      // ticksRemaining === 1: reaches 0 this tick
      if (slot.ticksRemaining === 1) {
        if (room.autoHarvest && newSeedStock > 0) {
          // Auto-harvest: collect yield, apply double chance, restart timer
          const baseUnits = Math.floor(slot.harvestYield * (1 + waterBonus + lightBonus + nutriYield + prestigeBonus));
          const doubled = doubleChance > 0 && Math.random() < doubleChance;
          const harvestedUnits = doubled ? baseUnits * 2 : baseUnits;
          if (!autoHarvestedByStrain[slot.strainName]) {
            autoHarvestedByStrain[slot.strainName] = { oz: 0, pricePerUnit: slot.pricePerUnit };
          }
          autoHarvestedByStrain[slot.strainName].oz += harvestedUnits;
          newSeedStock -= 1;
          autoHarvestCycleCost += (WATER_TIERS[room.waterTier ?? 0]?.costPerCycle ?? 0)
            + (LIGHT_TIERS[room.lightTier ?? 0]?.costPerCycle ?? 0)
            + nutriCycleCost;
          const effectiveTimer = Math.max(1, Math.ceil(slot.growTimerTicks * (1 - speedBonus)));
          return { ...slot, ticksRemaining: effectiveTimer };
        }
        // No auto-harvest: let it reach 0 for manual harvest
        return { ...slot, ticksRemaining: 0 };
      }

      // ticksRemaining === 0: already ready, waiting for manual harvest
      if (slot.ticksRemaining <= 0) return slot;

      return { ...slot, ticksRemaining: slot.ticksRemaining - 1 };
    });

    return { ...room, slots: newSlots };
  });

  // Add auto-harvested units to per-strain inventory
  for (const [strainName, harvested] of Object.entries(autoHarvestedByStrain)) {
    if (!newProductInventory[strainName]) {
      newProductInventory[strainName] = { oz: 0, pricePerUnit: harvested.pricePerUnit };
    }
    newProductInventory[strainName] = {
      oz: newProductInventory[strainName].oz + harvested.oz,
      pricePerUnit: harvested.pricePerUnit,
    };
  }

  return {
    newOp: { ...op, growRooms: newGrowRooms, productInventory: newProductInventory, seedStock: newSeedStock },
    dirtyEarned,
    maintenanceCost: autoHarvestCycleCost,
  };
}

export function harvestSlot(op: CriminalOperation, roomId: string, slotIndex: number, prestigeBonus = 0): {
  newOp: CriminalOperation;
  unitsHarvested: number;
  cycleCost: number;
  speedBonus: number;
} {
  const room = op.growRooms.find((r) => r.id === roomId);
  if (!room) return { newOp: op, unitsHarvested: 0, cycleCost: 0, speedBonus: 0 };
  const slot = room.slots[slotIndex];
  if (!slot || !slot.isHarvesting || slot.ticksRemaining > 0) return { newOp: op, unitsHarvested: 0, cycleCost: 0, speedBonus: 0 };

  // Apply all bonuses to yield
  const waterBonus = WATER_TIERS[room.waterTier ?? 0]?.yieldBonus ?? 0;
  const lightBonus = LIGHT_TIERS[room.lightTier ?? 0]?.yieldBonus ?? 0;
  const floraGroLevel   = room.nutrientSpeed  ?? 0;
  const floraMicroLevel = room.nutrientYield  ?? 0;
  const floraBloomLevel = room.nutrientDouble ?? 0;
  const nutriYield     = floraMicroLevel > 0 ? (NUTRIENT_DEFS[1].levels[floraMicroLevel - 1]?.yieldBonus  ?? 0) : 0;
  const doubleChance   = floraBloomLevel > 0 ? (NUTRIENT_DEFS[2].levels[floraBloomLevel - 1]?.doubleChance ?? 0) : 0;
  const speedBonus     = floraGroLevel   > 0 ? (NUTRIENT_DEFS[0].levels[floraGroLevel - 1]?.speedBonus    ?? 0) : 0;
  const baseUnits = Math.floor(slot.harvestYield * (1 + waterBonus + lightBonus + nutriYield + prestigeBonus));
  const doubled = doubleChance > 0 && Math.random() < doubleChance;
  const unitsHarvested = doubled ? baseUnits * 2 : baseUnits;
  const cycleCost = (WATER_TIERS[room.waterTier ?? 0]?.costPerCycle ?? 0)
    + (LIGHT_TIERS[room.lightTier ?? 0]?.costPerCycle ?? 0)
    + (floraGroLevel   > 0 ? (NUTRIENT_DEFS[0].levels[floraGroLevel - 1]?.costPerCycle   ?? 0) : 0)
    + (floraMicroLevel > 0 ? (NUTRIENT_DEFS[1].levels[floraMicroLevel - 1]?.costPerCycle ?? 0) : 0)
    + (floraBloomLevel > 0 ? (NUTRIENT_DEFS[2].levels[floraBloomLevel - 1]?.costPerCycle ?? 0) : 0);

  // Add harvested units to per-strain inventory
  const newInventory = { ...op.productInventory };
  if (!newInventory[slot.strainName]) {
    newInventory[slot.strainName] = { oz: 0, pricePerUnit: slot.pricePerUnit };
  }
  newInventory[slot.strainName] = {
    oz: newInventory[slot.strainName].oz + unitsHarvested,
    pricePerUnit: slot.pricePerUnit,
  };

  const newOp = {
    ...op,
    productInventory: newInventory,
    growRooms: op.growRooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            slots: r.slots.map((s, i) =>
              i === slotIndex ? { ...s, isHarvesting: false, ticksRemaining: 0 } : s
            ),
          }
        : r
    ),
  };
  return { newOp, unitsHarvested, cycleCost, speedBonus };
}

// ─── DISPENSARY ───────────────────────────────────

export function calculateDispensaryCapacity(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return 0;
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseLaunderPerTick * tier.launderMultiplier * district.customerTrafficMultiplier;
}

// Returns { productConsumed, cleanProduced } for one dispensary tick
export function calculateDispensaryTick(biz: BusinessInstance, availableProduct: number, avgPrice: number): {
  productConsumed: number;
  cleanProduced: number;
} {
  const def = BUSINESS_MAP[biz.businessDefId];
  if (!def || !biz.isOperating || !def.isDispensary) return { productConsumed: 0, cleanProduced: 0 };
  const capacity = calculateDispensaryCapacity(biz);
  const productConsumed = Math.min(availableProduct, capacity, biz.productQueuedPerTick ?? 0);
  const cleanProduced = productConsumed * avgPrice * def.launderEfficiency;
  return { productConsumed, cleanProduced };
}

// ─── FRONT BUSINESS LAUNDERING ────────────────────

export function calculateLaunderCapacity(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return 0;
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseLaunderPerTick * tier.launderMultiplier * district.customerTrafficMultiplier;
}

export function calculateBusinessRevenue(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return 0;
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseRevenuePerTick * tier.revenueMultiplier * biz.supplyModifier * district.revenueMultiplier;
}

export function calculateBusinessExpenses(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  const district = DISTRICT_MAP[biz.districtId];
  if (!def || !district) return 0;
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  const totalEmployees = def.baseEmployeeCount + tier.additionalEmployees;
  const opCost = def.baseOperatingCostPerTick * tier.operatingCostMultiplier * district.operatingCostMultiplier;
  const salaryCost = totalEmployees * def.employeeSalaryPerTick;
  return opCost + salaryCost;
}

// Returns { dirtyConsumed, cleanProduced } for one tick of laundering
export function calculateLaunderTick(biz: BusinessInstance, availableDirty: number): {
  dirtyConsumed: number;
  cleanProduced: number;
} {
  const def = BUSINESS_MAP[biz.businessDefId];
  if (!def || !biz.isOperating) return { dirtyConsumed: 0, cleanProduced: 0 };
  const capacity = calculateLaunderCapacity(biz);
  const dirtyConsumed = Math.min(availableDirty, capacity, biz.dirtyQueuedPerTick);
  const cleanProduced = dirtyConsumed * def.launderEfficiency;
  return { dirtyConsumed, cleanProduced };
}

// ─── FORMATTING ───────────────────────────────────

export function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toString();
}

// Unit naming: 1 unit = 1 oz  |  16 oz = 1 lb  |  100 lbs = 1 crate (1,600 units)
export function formatUnits(units: number): string {
  const oz = Math.floor(units);
  if (oz >= 1_600) {
    const crates = Math.floor(oz / 1_600);
    const lbsRem = Math.floor((oz % 1_600) / 16);
    return lbsRem > 0 ? `${crates} crate${crates > 1 ? 's' : ''} ${lbsRem}lb` : `${crates} crate${crates > 1 ? 's' : ''}`;
  }
  if (oz >= 16) {
    const lbs = Math.floor(oz / 16);
    const ozRem = oz % 16;
    return ozRem > 0 ? `${lbs}lb ${ozRem}oz` : `${lbs}lb`;
  }
  return `${oz}oz`;
}
