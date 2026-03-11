import type { BusinessInstance, CriminalOperation } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { DEALER_TIERS, WATER_TIERS, LIGHT_TIERS } from '../data/types';

// ─── CRIMINAL OPERATION ───────────────────────────

export function tickCriminalOperation(op: CriminalOperation): {
  newOp: CriminalOperation;
  dirtyEarned: number;
} {
  const dealerTier = DEALER_TIERS[op.dealerTierIndex];
  let dirtyEarned = 0;
  let newProductInventory = op.productInventory;

  // Dealers sell product → dirty cash
  // avgPrice = average pricePerUnit across ALL active slots in ALL rooms
  if (op.dealerCount > 0 && newProductInventory > 0) {
    const allSlots = op.growRooms.flatMap((r) => r.slots);
    const avgPrice = allSlots.length > 0
      ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
      : 10;
    const unitsSold = Math.min(newProductInventory, dealerTier.salesRatePerTick * op.dealerCount);
    const saleValue = unitsSold * avgPrice * (1 - dealerTier.cutPercent / 100);
    newProductInventory -= unitsSold;
    dirtyEarned = saleValue;
  }

  // Tick all grow room slots — auto-harvest if enabled
  let autoHarvestedUnits = 0;
  let newSeedStock = op.seedStock;

  const newGrowRooms = op.growRooms.map((room) => {
    const waterBonus = WATER_TIERS[room.waterTier ?? 0]?.yieldBonus ?? 0;
    const lightBonus = LIGHT_TIERS[room.lightTier ?? 0]?.yieldBonus ?? 0;

    const newSlots = room.slots.map((slot) => {
      if (!slot.isHarvesting) return slot;

      // Count down
      if (slot.ticksRemaining > 1) return { ...slot, ticksRemaining: slot.ticksRemaining - 1 };

      // ticksRemaining === 1: reaches 0 this tick
      if (slot.ticksRemaining === 1) {
        if (room.autoHarvest && newSeedStock > 0) {
          // Auto-harvest: collect yield, consume a seed, restart timer
          const units = Math.floor(slot.harvestYield * (1 + waterBonus + lightBonus));
          autoHarvestedUnits += units;
          newSeedStock -= 1;
          return { ...slot, ticksRemaining: slot.growTimerTicks }; // restart
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

  newProductInventory += autoHarvestedUnits;

  return {
    newOp: { ...op, growRooms: newGrowRooms, productInventory: Math.max(0, newProductInventory), seedStock: newSeedStock },
    dirtyEarned,
  };
}

export function harvestSlot(op: CriminalOperation, roomId: string, slotIndex: number): {
  newOp: CriminalOperation;
  unitsHarvested: number;
} {
  const room = op.growRooms.find((r) => r.id === roomId);
  if (!room) return { newOp: op, unitsHarvested: 0 };
  const slot = room.slots[slotIndex];
  if (!slot || !slot.isHarvesting || slot.ticksRemaining > 0) return { newOp: op, unitsHarvested: 0 };

  // Apply maintenance bonuses to yield
  const waterBonus = WATER_TIERS[room.waterTier ?? 0]?.yieldBonus ?? 0;
  const lightBonus = LIGHT_TIERS[room.lightTier ?? 0]?.yieldBonus ?? 0;
  const unitsHarvested = Math.floor(slot.harvestYield * (1 + waterBonus + lightBonus));

  const newOp = {
    ...op,
    productInventory: op.productInventory + unitsHarvested,
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
  return { newOp, unitsHarvested };
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
