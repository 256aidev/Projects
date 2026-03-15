import { useGameStore } from '../store/gameStore';
import { calculateLaunderCapacity, calculateBusinessRevenue, calculateBusinessExpenses } from '../engine/economy';

/** Computed business stats — used by HUD, FinanceView */
export function useBusinessStats() {
  const businesses = useGameStore((s) => s.businesses);
  const unlockedDistricts = useGameStore((s) => s.unlockedDistricts);

  const bizCount = businesses.length;
  const districts = unlockedDistricts.length;
  const launderCapacity = businesses.reduce((s, b) => s + calculateLaunderCapacity(b), 0);
  const bizRevenue = businesses.reduce((s, b) => s + calculateBusinessRevenue(b), 0);
  const bizExpenses = businesses.reduce((s, b) => s + calculateBusinessExpenses(b), 0);
  const bizNetProfit = bizRevenue - bizExpenses;

  return {
    businesses,
    bizCount,
    districts,
    launderCapacity,
    bizRevenue,
    bizExpenses,
    bizNetProfit,
  };
}
