import { useGameStore } from '../store/gameStore';

/** Computed cash flow stats — used by HUD, FinanceView, LeaderboardView */
export function useCashFlow() {
  const dirtyCash = useGameStore((s) => s.dirtyCash);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const lastTickDirtyProfit = useGameStore((s) => s.lastTickDirtyProfit);
  const lastTickCleanProfit = useGameStore((s) => s.lastTickCleanProfit);
  const totalDirtyEarned = useGameStore((s) => s.totalDirtyEarned);
  const totalCleanEarned = useGameStore((s) => s.totalCleanEarned);
  const totalSpent = useGameStore((s) => s.totalSpent);

  const netWorth = dirtyCash + cleanCash;
  const totalEarned = totalDirtyEarned + totalCleanEarned;

  return {
    dirtyCash,
    cleanCash,
    dirtyRate: lastTickDirtyProfit,
    cleanRate: lastTickCleanProfit,
    totalDirtyEarned,
    totalCleanEarned,
    totalSpent,
    netWorth,
    totalEarned,
  };
}
