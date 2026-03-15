import type { GameState } from '../../data/types';
import { HOUSE_TIERS, HQ_TIERS } from '../../data/houseDefs';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createHouseActions(set: SetState, get: GetState) {
  return {
    upgradeHouse: () => {
      const state = get();
      const currentLevel = state.houseLevel ?? 0;
      const nextTier = HOUSE_TIERS[currentLevel + 1];
      if (!nextTier) return false;
      if (state.cleanCash < nextTier.upgradeCost) return false;
      set({
        cleanCash: state.cleanCash - nextTier.upgradeCost,
        totalSpent: state.totalSpent + nextTier.upgradeCost,
        houseLevel: currentLevel + 1,
      });
      return true;
    },

    upgradeHQ: () => {
      const state = get();
      const currentLevel = state.hqLevel ?? 0;
      const nextTier = HQ_TIERS[currentLevel + 1];
      if (!nextTier) return false;
      if (state.dirtyCash < nextTier.upgradeCost) return false;
      set({
        dirtyCash: state.dirtyCash - nextTier.upgradeCost,
        totalSpent: state.totalSpent + nextTier.upgradeCost,
        hqLevel: currentLevel + 1,
      });
      return true;
    },
  };
}
