import type { GameState } from '../../data/types';
import { JEWELRY_DEF_MAP, JEWELRY_SLOT_LIMITS } from '../../data/jewelryDefs';
import { CAR_DEF_MAP } from '../../data/carDefs';
import { getRunTechBonuses, INITIAL_RUN_TECH } from '../../data/runTechDefs';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createLuxuryActions(set: SetState, get: GetState) {
  return {
    // ─── CASINO ────────────────────────────────────────────────
    settleCasinoBet: (betAmount: number, grossPayout: number) => {
      // Use set() updater to avoid race with tick system
      set((state) => {
        const runTech = getRunTechBonuses(state.runTechUpgrades ?? INITIAL_RUN_TECH);
        const boostedPayout = grossPayout > 0 ? Math.floor(grossPayout * (1 + runTech.casinoLuck)) : 0;
        const dirtyAfterBet = Math.max(0, state.dirtyCash - betAmount);
        const taxAmount = boostedPayout > 0 ? Math.floor(boostedPayout * 0.15) : 0;
        const cleanWon = Math.max(0, boostedPayout - taxAmount);
        const history = state.casinoHistory ?? { totalGambled: 0, totalWon: 0, totalLost: 0, gamesPlayed: 0 };
        console.log(`[Casino] bet=${betAmount} gross=${grossPayout} tax=${taxAmount} cleanWon=${cleanWon} dirtyBefore=${state.dirtyCash} dirtyAfter=${dirtyAfterBet} cleanBefore=${state.cleanCash}`);
        return {
          dirtyCash: dirtyAfterBet,
          cleanCash: state.cleanCash + cleanWon,
          totalCleanEarned: state.totalCleanEarned + cleanWon,
          casinoHistory: {
            totalGambled: history.totalGambled + betAmount,
            totalWon: history.totalWon + cleanWon,
            totalLost: history.totalLost + (grossPayout === 0 ? betAmount : 0),
            gamesPlayed: history.gamesPlayed + 1,
          },
        };
      });
    },

    // ─── JEWELRY ───────────────────────────────────────────────
    buyJewelry: (defId: string) => {
      const state = get();
      const def = JEWELRY_DEF_MAP[defId];
      if (!def || state.dirtyCash < def.baseCost) return false;
      // Check slot limits
      const slotsUsed = (state.jewelry ?? []).filter((j: { slotType: string }) => j.slotType === def.slotType).length;
      if (slotsUsed >= JEWELRY_SLOT_LIMITS[def.slotType]) return false;
      // Check not already owned
      if ((state.jewelry ?? []).some((j: { defId: string }) => j.defId === defId)) return false;
      set({
        dirtyCash: state.dirtyCash - def.baseCost,
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
      const def = JEWELRY_DEF_MAP[piece.defId];
      if (!def) return false;
      const nextTier = def.tiers[piece.tier + 1];
      if (!nextTier || state.dirtyCash < nextTier.upgradeCost) return false;
      jewelry[index] = { ...piece, tier: piece.tier + 1 };
      set({
        dirtyCash: state.dirtyCash - nextTier.upgradeCost,
        totalSpent: state.totalSpent + nextTier.upgradeCost,
        jewelry,
      });
      return true;
    },

    // ─── CARS ──────────────────────────────────────────────────
    buyCar: (defId: string) => {
      const state = get();
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
