import type { GameState } from '../../data/types';
import { INITIAL_GAME_STATE } from '../../data/types';
import { TECH_UPGRADE_DEFS, INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { INITIAL_RUN_TECH } from '../../data/runTechDefs';
import { generateRivals } from '../../data/rivals';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

// Starting stash so the player has something to sell immediately
const STARTING_INVENTORY: Record<string, { oz: number; pricePerUnit: number }> = {
  'Basic Bud': { oz: 12, pricePerUnit: 8 },
};

export function createGameActions(set: SetState, get: GetState) {
  return {
    startNewGame: (rivalCount: number, entryDelayMinutes: number = 10) => {
      const state = get();
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { ...STARTING_INVENTORY } };

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
        gameSettings: { rivalCount, rivalEntryDelay: entryDelayMinutes, gameStarted: true, tutorialActive: false, tutorialStep: 0 },
        rivals: generateRivals(rivalCount, entryDelayMinutes),
        crew: [],
        rivalAttackLog: [],
      });
    },

    continueGame: () => {
      const state = get();
      set({
        gameSettings: { ...state.gameSettings, gameStarted: true },
      });
    },

    // ── Tutorial ─────────────────────────────────────────────────────────
    startTutorial: () => {
      const state = get();
      const startOp = { ...INITIAL_GAME_STATE.operation, productInventory: { ...STARTING_INVENTORY } };

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
        gameSettings: { rivalCount: 0, rivalEntryDelay: 0, gameStarted: true, tutorialActive: true, tutorialStep: 0 },
        rivals: [],
        crew: [],
        rivalAttackLog: [],
      });
    },

    advanceTutorial: () => {
      const state = get();
      const gs = state.gameSettings;
      if (!gs.tutorialActive) return;
      const { TUTORIAL_STEPS } = require('../../data/tutorial');
      const nextStep = gs.tutorialStep + 1;
      if (nextStep >= TUTORIAL_STEPS.length) {
        // Tutorial complete
        set({ gameSettings: { ...gs, tutorialActive: false, tutorialStep: 0 } });
      } else {
        set({ gameSettings: { ...gs, tutorialStep: nextStep } });
      }
    },

    skipTutorial: () => {
      const state = get();
      set({ gameSettings: { ...state.gameSettings, tutorialActive: false, tutorialStep: 0 } });
    },
  };
}
