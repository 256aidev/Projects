import { useGameStore } from '../store/gameStore';
import { DEALER_TIERS } from '../data/types';

/** Computed operation stats — replaces inline calculations in components */
export function useOperationStats() {
  const op = useGameStore((s) => s.operation);
  const prestigeBonus = useGameStore((s) => s.prestigeBonus ?? 0);

  const currentDealerTier = DEALER_TIERS[op.dealerTierIndex];
  const nextDealerTier = DEALER_TIERS[op.dealerTierIndex + 1] ?? null;

  const invEntries = Object.entries(op.productInventory);
  const totalInventoryOz = invEntries.reduce((sum, [, e]) => sum + e.oz, 0);
  const weightedAvgPrice = totalInventoryOz > 0
    ? invEntries.reduce((sum, [, e]) => sum + e.oz * e.pricePerUnit, 0) / totalInventoryOz
    : 10;

  const dealerSalesRate = currentDealerTier.salesRatePerTick * op.dealerCount;
  const dealerCutPerTick = dealerSalesRate * (currentDealerTier.cutPer8oz / 8);
  const dealerIncome = Math.max(0, dealerSalesRate * weightedAvgPrice - dealerCutPerTick);

  const ownedTypeIds = new Set(op.growRooms.map((r) => r.typeId));

  return {
    op,
    currentDealerTier,
    nextDealerTier,
    invEntries,
    totalInventoryOz,
    weightedAvgPrice,
    dealerSalesRate,
    dealerCutPerTick,
    dealerIncome,
    ownedTypeIds,
    prestigeBonus,
  };
}
