import type { GameState } from '../../data/types';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createLuxuryActions(set: SetState, get: GetState) {
  return {
    // ─── CASINO ────────────────────────────────────────────────
    settleCasinoBet: (betAmount: number, grossPayout: number) => {
      const state = get();
      if (state.dirtyCash < betAmount) return;
      const taxAmount = grossPayout > 0 ? Math.floor(grossPayout * 0.15) : 0;
      const cleanWon = grossPayout - taxAmount;
      const history = state.casinoHistory ?? { totalGambled: 0, totalWon: 0, totalLost: 0, gamesPlayed: 0 };
      set({
        dirtyCash: state.dirtyCash - betAmount,
        cleanCash: state.cleanCash + Math.max(0, cleanWon),
        totalCleanEarned: state.totalCleanEarned + Math.max(0, cleanWon),
        casinoHistory: {
          totalGambled: history.totalGambled + betAmount,
          totalWon: history.totalWon + Math.max(0, cleanWon),
          totalLost: history.totalLost + (grossPayout === 0 ? betAmount : 0),
          gamesPlayed: history.gamesPlayed + 1,
        },
      });
    },

    // ─── JEWELRY ───────────────────────────────────────────────
    buyJewelry: (defId: string) => {
      const state = get();
      const { JEWELRY_DEF_MAP, JEWELRY_SLOT_LIMITS } = require('../../data/jewelryDefs');
      const def = JEWELRY_DEF_MAP[defId];
      if (!def || state.cleanCash < def.baseCost) return false;
      // Check slot limits
      const slotsUsed = (state.jewelry ?? []).filter((j: { slotType: string }) => j.slotType === def.slotType).length;
      if (slotsUsed >= JEWELRY_SLOT_LIMITS[def.slotType]) return false;
      // Check not already owned
      if ((state.jewelry ?? []).some((j: { defId: string }) => j.defId === defId)) return false;
      set({
        cleanCash: state.cleanCash - def.baseCost,
        totalSpent: state.totalSpent + def.baseCost,
        jewelry: [...(state.jewelry ?? []), { defId, slotType: def.slotType, tier: 0, equippedSlotIndex: slotsUsed }],
      });
      return true;
    },

    upgradeJewelry: (index: number) => {
      const state = get();
      const jewelry = [...(state.jewelry ?? [])];
      const piece = jewelry[index];
      if (!piece || piece.tier >= 4) return false;
      const { JEWELRY_DEF_MAP } = require('../../data/jewelryDefs');
      const def = JEWELRY_DEF_MAP[piece.defId];
      if (!def) return false;
      const nextTier = def.tiers[piece.tier + 1];
      if (!nextTier || state.cleanCash < nextTier.upgradeCost) return false;
      jewelry[index] = { ...piece, tier: piece.tier + 1 };
      set({
        cleanCash: state.cleanCash - nextTier.upgradeCost,
        totalSpent: state.totalSpent + nextTier.upgradeCost,
        jewelry,
      });
      return true;
    },

    // ─── CARS ──────────────────────────────────────────────────
    buyCar: (defId: string) => {
      const state = get();
      const { CAR_DEF_MAP } = require('../../data/carDefs');
      const def = CAR_DEF_MAP[defId];
      if (!def) return false;
      const useDirty = def.currency === 'dirty';
      const wallet = useDirty ? state.dirtyCash : state.cleanCash;
      if (wallet < def.cost) return false;
      // Check not already owned
      if ((state.cars ?? []).some((c: { defId: string }) => c.defId === defId)) return false;
      set({
        ...(useDirty ? { dirtyCash: state.dirtyCash - def.cost } : { cleanCash: state.cleanCash - def.cost }),
        totalSpent: state.totalSpent + def.cost,
        cars: [...(state.cars ?? []), { defId, purchasedAtTick: state.tickCount }],
      });
      return true;
    },
  };
}
