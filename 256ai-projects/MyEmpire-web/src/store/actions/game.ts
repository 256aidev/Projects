import type { GameState } from '../../data/types';
import { INITIAL_GAME_STATE } from '../../data/types';
import { INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { generateRivals } from '../../data/rivals';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createGameActions(set: SetState, get: GetState) {
  return {
    startNewGame: (rivalCount: number, entryDelayMinutes: number = 10) => {
      const state = get();
      const isFirstEver = (state.prestigeCount ?? 0) === 0 && (state.tickCount ?? 0) === 0;
      // First-ever game: first harvest is free (ticksRemaining = 0) so new players
      // can immediately harvest, sell, and understand the loop.
      const startOp = { ...INITIAL_GAME_STATE.operation };
      if (isFirstEver && startOp.growRooms[0]?.slots[0]) {
        startOp.growRooms = [
          { ...startOp.growRooms[0], slots: [{ ...startOp.growRooms[0].slots[0], ticksRemaining: 0 }] },
        ];
      }
      set({
        ...INITIAL_GAME_STATE,
        operation: startOp,
        prestigeCount: state.prestigeCount ?? 0,
        prestigeBonus: 0,
        techPoints: state.techPoints ?? 0,
        totalTechPointsEarned: state.totalTechPointsEarned ?? 0,
        techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
        gameSettings: { rivalCount, rivalEntryDelay: entryDelayMinutes, gameStarted: true, tutorialActive: false, tutorialStep: 0 },
        rivals: generateRivals(rivalCount, entryDelayMinutes),
        hitmen: [],
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
      const isFirstEver = (state.prestigeCount ?? 0) === 0 && (state.tickCount ?? 0) === 0;
      const startOp = { ...INITIAL_GAME_STATE.operation };
      if (isFirstEver && startOp.growRooms[0]?.slots[0]) {
        startOp.growRooms = [
          { ...startOp.growRooms[0], slots: [{ ...startOp.growRooms[0].slots[0], ticksRemaining: 0 }] },
        ];
      }
      set({
        ...INITIAL_GAME_STATE,
        operation: startOp,
        prestigeCount: state.prestigeCount ?? 0,
        prestigeBonus: 0,
        techPoints: state.techPoints ?? 0,
        totalTechPointsEarned: state.totalTechPointsEarned ?? 0,
        techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
        gameSettings: { rivalCount: 0, rivalEntryDelay: 0, gameStarted: true, tutorialActive: true, tutorialStep: 0 },
        rivals: [],
        hitmen: [],
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
