import type { GameState } from '../../data/types';
import { INITIAL_GAME_STATE, PRESTIGE_THRESHOLD } from '../../data/types';
import type { TechUpgradeId } from '../../data/techDefs';
import { TECH_UPGRADE_MAP, TECH_UPGRADE_DEFS, INITIAL_TECH_UPGRADES, calculatePrestigeTP } from '../../data/techDefs';
import type { SessionTechId } from '../../data/sessionTechDefs';
import { SESSION_TECH_MAP, INITIAL_SESSION_TECH } from '../../data/sessionTechDefs';
import type { RunTechId } from '../../data/runTechDefs';
import { RUN_TECH_MAP, INITIAL_RUN_TECH } from '../../data/runTechDefs';
import { generateRivals } from '../../data/rivals';
import { getJewelryBonuses } from '../../engine/jewelry';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createPrestigeActions(set: SetState, get: GetState) {
  return {
    prestige: () => {
      const state = get();
      if (state.totalDirtyEarned < PRESTIGE_THRESHOLD) return false;
      const jewelryBonuses = getJewelryBonuses(state.jewelry ?? []);
      const { total: baseTP } = calculatePrestigeTP(state);
      const earnedTP = Math.floor(baseTP * (1 + (jewelryBonuses.prestigeSpeed ?? 0)));
      const newCount = (state.prestigeCount ?? 0) + 1;
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { 'Basic Bud': { oz: 12, pricePerUnit: 8 } } };

      // Calculate starting bonuses from permanent tech
      const techUpgrades = state.techUpgrades ?? INITIAL_TECH_UPGRADES;
      const startDirtyLevel = techUpgrades.tech_start_dirty ?? 0;
      const startCleanLevel = techUpgrades.tech_start_clean ?? 0;
      const startSeedsLevel = techUpgrades.tech_start_seeds ?? 0;
      const startDirtyDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_dirty');
      const startCleanDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_clean');
      const startSeedsDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_seeds');
      const bonusDirty = startDirtyLevel > 0 && startDirtyDef?.bonusPerLevel ? (startDirtyDef.bonusPerLevel as number[])[startDirtyLevel - 1] ?? 0 : 0;
      const bonusClean = startCleanLevel > 0 && startCleanDef?.bonusPerLevel ? (startCleanDef.bonusPerLevel as number[])[startCleanLevel - 1] ?? 0 : 0;
      const bonusSeeds = startSeedsLevel > 0 && startSeedsDef?.bonusPerLevel ? (startSeedsDef.bonusPerLevel as number[])[startSeedsLevel - 1] ?? 0 : 0;

      set({
        ...INITIAL_GAME_STATE,
        dirtyCash: INITIAL_GAME_STATE.dirtyCash + bonusDirty,
        cleanCash: INITIAL_GAME_STATE.cleanCash + bonusClean,
        operation: { ...startOp, seedStock: startOp.seedStock + bonusSeeds },
        prestigeCount: newCount,
        prestigeBonus: 0,
        techPoints: (state.techPoints ?? 0) + earnedTP,
        totalTechPointsEarned: (state.totalTechPointsEarned ?? 0) + earnedTP,
        techUpgrades: { ...techUpgrades },
        runTechUpgrades: { ...INITIAL_RUN_TECH },
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

    purchaseRunTech: (upgradeId: RunTechId) => {
      const state = get();
      const def = RUN_TECH_MAP[upgradeId];
      if (!def) return false;
      const currentLevel = (state.runTechUpgrades ?? INITIAL_RUN_TECH)[upgradeId] ?? 0;
      if (currentLevel >= def.maxLevel) return false;
      const cost = def.costs[currentLevel];
      if (state.dirtyCash < cost) return false;
      set({
        dirtyCash: state.dirtyCash - cost,
        totalSpent: state.totalSpent + cost,
        runTechUpgrades: {
          ...(state.runTechUpgrades ?? INITIAL_RUN_TECH),
          [upgradeId]: currentLevel + 1,
        },
      });
      return true;
    },

    resetGame: () => {
      const state = get();
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { 'Basic Bud': { oz: 12, pricePerUnit: 8 } } };

      // Calculate starting bonuses from permanent tech
      const techUpgrades = state.techUpgrades ?? INITIAL_TECH_UPGRADES;
      const startDirtyLevel = techUpgrades.tech_start_dirty ?? 0;
      const startCleanLevel = techUpgrades.tech_start_clean ?? 0;
      const startSeedsLevel = techUpgrades.tech_start_seeds ?? 0;
      const startDirtyDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_dirty');
      const startCleanDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_clean');
      const startSeedsDef = TECH_UPGRADE_DEFS.find(t => t.id === 'tech_start_seeds');
      const bonusDirty = startDirtyLevel > 0 && startDirtyDef?.bonusPerLevel ? (startDirtyDef.bonusPerLevel as number[])[startDirtyLevel - 1] ?? 0 : 0;
      const bonusClean = startCleanLevel > 0 && startCleanDef?.bonusPerLevel ? (startCleanDef.bonusPerLevel as number[])[startCleanLevel - 1] ?? 0 : 0;
      const bonusSeeds = startSeedsLevel > 0 && startSeedsDef?.bonusPerLevel ? (startSeedsDef.bonusPerLevel as number[])[startSeedsLevel - 1] ?? 0 : 0;

      set({
        ...INITIAL_GAME_STATE,
        dirtyCash: INITIAL_GAME_STATE.dirtyCash + bonusDirty,
        cleanCash: INITIAL_GAME_STATE.cleanCash + bonusClean,
        operation: { ...startOp, seedStock: startOp.seedStock + bonusSeeds },
        prestigeCount: state.prestigeCount ?? 0,
        prestigeBonus: 0,
        techPoints: state.techPoints ?? 0,
        totalTechPointsEarned: state.totalTechPointsEarned ?? 0,
        techUpgrades: { ...techUpgrades },
        runTechUpgrades: { ...INITIAL_RUN_TECH },
      });
    },

    wipeGame: () => {
      set({ ...INITIAL_GAME_STATE });
    },
  };
}
