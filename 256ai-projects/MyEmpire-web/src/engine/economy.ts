import type { BusinessInstance, CriminalOperation, GrowRoom } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { DEALER_TIERS, ROOM_UPGRADE_DEFS } from '../data/types';

// ─── ROOM UPGRADE HELPERS ────────────────────────

export function getRoomBonus(room: GrowRoom, bonusType: 'speed' | 'yield' | 'double'): number {
  let total = 0;
  for (const def of ROOM_UPGRADE_DEFS) {
    if (def.bonusType !== bonusType) continue;
    const level = room.upgradeLevels?.[def.id] ?? 0;
    if (level === 0) continue;
    const lvl = def.levels[level - 1];
    if (!lvl) continue;
    if (bonusType === 'speed') total += lvl.speedBonus;
    if (bonusType === 'yield') total += lvl.yieldBonus;
    if (bonusType === 'double') total += lvl.doubleChance;
  }
  return total;
}

export function getRoomCycleCost(room: GrowRoom): number {
  let total = 0;
  for (const def of ROOM_UPGRADE_DEFS) {
    const level = room.upgradeLevels?.[def.id] ?? 0;
    if (level === 0) {
      total += def.baseCostPerCycle;
    } else {
      const lvl = def.levels[level - 1];
      total += lvl?.costPerCycle ?? def.baseCostPerCycle;
    }
  }
  return total;
}

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
    const speedBonus = getRoomBonus(room, 'speed');
    const yieldBonus = getRoomBonus(room, 'yield');
    const doubleChance = getRoomBonus(room, 'double');
    const isAutoHarvest = (room.upgradeLevels?.auto_harvest ?? 0) > 0;
    const cycleCost = getRoomCycleCost(room);

    const newSlots = room.slots.map((slot) => {
      if (!slot.isHarvesting) return slot;

      // Count down
      if (slot.ticksRemaining > 1) return { ...slot, ticksRemaining: slot.ticksRemaining - 1 };

      // ticksRemaining === 1: reaches 0 this tick
      if (slot.ticksRemaining === 1) {
        if (isAutoHarvest && newSeedStock > 0) {
          const baseUnits = Math.floor(slot.harvestYield * (1 + yieldBonus + prestigeBonus));
          const doubled = doubleChance > 0 && Math.random() < doubleChance;
          const harvestedUnits = doubled ? baseUnits * 2 : baseUnits;
          if (!autoHarvestedByStrain[slot.strainName]) {
            autoHarvestedByStrain[slot.strainName] = { oz: 0, pricePerUnit: slot.pricePerUnit };
          }
          autoHarvestedByStrain[slot.strainName].oz += harvestedUnits;
          newSeedStock -= 1;
          autoHarvestCycleCost += cycleCost;
          const effectiveTimer = Math.max(1, Math.ceil(slot.growTimerTicks * (1 - speedBonus)));
          return { ...slot, ticksRemaining: effectiveTimer };
        }
        return { ...slot, ticksRemaining: 0 };
      }

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

  const speedBonus = getRoomBonus(room, 'speed');
  const yieldBonus = getRoomBonus(room, 'yield');
  const doubleChance = getRoomBonus(room, 'double');
  const cycleCost = getRoomCycleCost(room);

  const baseUnits = Math.floor(slot.harvestYield * (1 + yieldBonus + prestigeBonus));
  const doubled = doubleChance > 0 && Math.random() < doubleChance;
  const unitsHarvested = doubled ? baseUnits * 2 : baseUnits;

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
  if (!def) return 0;
  const district = DISTRICT_MAP[biz.districtId];
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseLaunderPerTick * tier.launderMultiplier * (district?.customerTrafficMultiplier ?? 1);
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
  if (!def) return 0;
  const district = DISTRICT_MAP[biz.districtId];
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseLaunderPerTick * tier.launderMultiplier * (district?.customerTrafficMultiplier ?? 1);
}

export function calculateBusinessRevenue(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  if (!def) return 0;
  const district = DISTRICT_MAP[biz.districtId];
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  return def.baseRevenuePerTick * tier.revenueMultiplier * biz.supplyModifier * (district?.revenueMultiplier ?? 1);
}

export function calculateBusinessExpenses(biz: BusinessInstance): number {
  const def = BUSINESS_MAP[biz.businessDefId];
  if (!def) return 0;
  const district = DISTRICT_MAP[biz.districtId];
  const tier = def.upgradeTiers[biz.upgradeLevel] ?? def.upgradeTiers[0];
  const totalEmployees = def.baseEmployeeCount + tier.additionalEmployees;
  const opCost = def.baseOperatingCostPerTick * tier.operatingCostMultiplier * (district?.operatingCostMultiplier ?? 1);
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
