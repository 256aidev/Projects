import type { GameState } from '../../data/types';
import { INITIAL_GAME_STATE, PRESTIGE_THRESHOLD } from '../../data/types';
import type { TechUpgradeId } from '../../data/techDefs';
import { TECH_UPGRADE_MAP, INITIAL_TECH_UPGRADES, calculatePrestigeTP } from '../../data/techDefs';
import type { SessionTechId } from '../../data/sessionTechDefs';
import { SESSION_TECH_MAP, INITIAL_SESSION_TECH } from '../../data/sessionTechDefs';
import { generateRivals } from '../../data/rivals';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createPrestigeActions(set: SetState, get: GetState) {
  return {
    prestige: () => {
      const state = get();
      if (state.totalDirtyEarned < PRESTIGE_THRESHOLD) return false;
      const { total: earnedTP } = calculatePrestigeTP(state);
      const newCount = (state.prestigeCount ?? 0) + 1;
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { 'Basic Bud': { oz: 12, pricePerUnit: 8 } } };
      set({
        ...INITIAL_GAME_STATE,
        operation: startOp,
        prestigeCount: newCount,
        prestigeBonus: 0,
        techPoints: (state.techPoints ?? 0) + earnedTP,
        totalTechPointsEarned: (state.totalTechPointsEarned ?? 0) + earnedTP,
        techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
        gameSettings: { ...state.gameSettings },
        rivals: generateRivals(state.gameSettings.rivalCount, state.gameSettings.rivalEntryDelay ?? 2),
        crew: [],
        rivalAttackLog: [],
      });
      return true;
    },

    purchaseTechUpgrade: (upgradeId: TechUpgradeId) => {
      const state = get();
      const def = TECH_UPGRADE_MAP[upgradeId];
      if (!def) return false;
      const currentLevel = (state.techUpgrades ?? INITIAL_TECH_UPGRADES)[upgradeId] ?? 0;
      if (currentLevel >= def.maxLevel) return false;
      const cost = def.costs[currentLevel];
      if ((state.techPoints ?? 0) < cost) return false;
      set({
        techPoints: (state.techPoints ?? 0) - cost,
        techUpgrades: {
          ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES),
          [upgradeId]: currentLevel + 1,
        },
      });
      return true;
    },

    purchaseSessionTech: (upgradeId: SessionTechId) => {
      const state = get();
      const def = SESSION_TECH_MAP[upgradeId];
      if (!def) return false;
      const currentLevel = (state.sessionTechUpgrades ?? INITIAL_SESSION_TECH)[upgradeId] ?? 0;
      if (currentLevel >= def.maxLevel) return false;
      const cost = def.costs[currentLevel];
      if (state.dirtyCash < cost.dirtyCash) return false;
      if (state.cleanCash < cost.cleanCash) return false;
      // Check total product inventory
      const totalOz = Object.values(state.operation.productInventory).reduce((s, e) => s + e.oz, 0);
      if (totalOz < cost.productOz) return false;
      // Deduct product from inventory (drain from each strain proportionally)
      let remaining = cost.productOz;
      const newInv = { ...state.operation.productInventory };
      for (const strain of Object.keys(newInv)) {
        if (remaining <= 0) break;
        const take = Math.min(newInv[strain].oz, remaining);
        newInv[strain] = { ...newInv[strain], oz: newInv[strain].oz - take };
        remaining -= take;
      }
      set({
        dirtyCash: state.dirtyCash - cost.dirtyCash,
        cleanCash: state.cleanCash - cost.cleanCash,
        totalSpent: state.totalSpent + cost.dirtyCash + cost.cleanCash,
        operation: { ...state.operation, productInventory: newInv },
        sessionTechUpgrades: {
          ...(state.sessionTechUpgrades ?? INITIAL_SESSION_TECH),
          [upgradeId]: currentLevel + 1,
        },
      });
      return true;
    },

    resetGame: () => {
      const state = get();
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { 'Basic Bud': { oz: 12, pricePerUnit: 8 } } };
      set({
        ...INITIAL_GAME_STATE,
        operation: startOp,
        prestigeCount: state.prestigeCount ?? 0,
        prestigeBonus: 0,
        techPoints: state.techPoints ?? 0,
        totalTechPointsEarned: state.totalTechPointsEarned ?? 0,
        techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
      });
    },

    wipeGame: () => {
      set({ ...INITIAL_GAME_STATE });
    },
  };
}
