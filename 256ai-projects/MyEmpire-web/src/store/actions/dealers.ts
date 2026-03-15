import type { GameState } from '../../data/types';
import { DEALER_TIERS, getDealerHireCost } from '../../data/types';
import { HEAT_MAX } from '../../engine/heat';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createDealerActions(set: SetState, get: GetState) {
  return {
    hireDealers: (count: number) => {
      const state = get();
      const tier = DEALER_TIERS[state.operation.dealerTierIndex];
      // Escalating cost: each successive dealer costs 1.5× more
      let totalCost = 0;
      for (let i = 0; i < count; i++) {
        totalCost += getDealerHireCost(tier, state.operation.dealerCount + i);
      }
      if (state.dirtyCash < totalCost) return false;
      set({
        dirtyCash: state.dirtyCash - totalCost,
        totalSpent: state.totalSpent + totalCost,
        operation: { ...state.operation, dealerCount: state.operation.dealerCount + count },
        heat: Math.min(HEAT_MAX, state.heat + count * 2),
      });
      return true;
    },

    fireDealers: (count: number) => {
      const state = get();
      const remove = Math.min(count, state.operation.dealerCount);
      if (remove <= 0) return;
      set({ operation: { ...state.operation, dealerCount: state.operation.dealerCount - remove } });
    },

    upgradeDealerTier: () => {
      const state = get();
      const nextIndex = state.operation.dealerTierIndex + 1;
      if (nextIndex >= DEALER_TIERS.length) return false;
      const nextTier = DEALER_TIERS[nextIndex];
      const upgradeCost = nextTier.hireCost * 3;
      if (state.dirtyCash < upgradeCost) return false;
      set({
        dirtyCash: state.dirtyCash - upgradeCost,
        totalSpent: state.totalSpent + upgradeCost,
        operation: { ...state.operation, dealerTierIndex: nextIndex },
      });
      return true;
    },

    downgradeDealerTier: () => {
      const state = get();
      const prevIndex = state.operation.dealerTierIndex - 1;
      if (prevIndex < 0) return false;
      // Refund 50% of the tier's upgrade cost
      const currentTier = DEALER_TIERS[state.operation.dealerTierIndex];
      const refund = Math.floor(currentTier.hireCost * 3 * 0.5);
      set({
        dirtyCash: state.dirtyCash + refund,
        operation: { ...state.operation, dealerTierIndex: prevIndex },
      });
      return true;
    },
  };
}
