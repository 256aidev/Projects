import type { BusinessInstance, CriminalOperation } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { DEALER_TIERS } from '../data/types';

// ─── CRIMINAL OPERATION ───────────────────────────

export function tickCriminalOperation(op: CriminalOperation): {
  newOp: CriminalOperation;
  dirtyEarned: number;
} {
  const dealerTier = DEALER_TIERS[op.dealerTierIndex];
  let dirtyEarned = 0;
  let newProductInventory = op.productInventory;

  // Dealers sell product → dirty cash
  if (op.dealerCount > 0 && newProductInventory > 0) {
    const salesRate = dealerTier.salesRatePerTick * op.dealerCount;
    const productConsumed = Math.min(newProductInventory, salesRate * 0.1); // 0.1 units per $1 earned
    const saleValue = productConsumed * 10 * (1 - dealerTier.cutPercent / 100);
    newProductInventory -= productConsumed;
    dirtyEarned = saleValue;
  }

  // Tick grow rooms
  const newGrowRooms = op.growRooms.map((room) => {
    if (!room.isHarvesting) return room;
    const newTicks = room.ticksRemaining - 1;
    if (newTicks <= 0) {
      // Harvest!
      return { ...room, isHarvesting: false, ticksRemaining: 0 };
    }
    return { ...room, ticksRemaining: newTicks };
  });

  return {
    newOp: { ...op, growRooms: newGrowRooms, productInventory: Math.max(0, newProductInventory) },
    dirtyEarned,
  };
}

export function harvestRoom(op: CriminalOperation, roomId: string): {
  newOp: CriminalOperation;
  unitsHarvested: number;
} {
  const room = op.growRooms.find((r) => r.id === roomId);
  if (!room || room.isHarvesting || room.ticksRemaining > 0) {
    return { newOp: op, unitsHarvested: 0 };
  }

  const newOp = {
    ...op,
    productInventory: op.productInventory + room.harvestYield,
    growRooms: op.growRooms.map((r) =>
      r.id === roomId
        ? { ...r, isHarvesting: true, ticksRemaining: r.growTimerTicks }
        : r
    ),
  };
  return { newOp, unitsHarvested: room.harvestYield };
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
