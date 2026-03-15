import type { GameState, RivalActionType } from '../../data/types';
import { HITMAN_MAP, RIVAL_ACTIONS } from '../../data/types';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

export function createCombatActions(set: SetState, get: GetState) {
  return {
    hireHitman: (defId: string) => {
      const state = get();
      const def = HITMAN_MAP[defId];
      if (!def || state.dirtyCash < def.cost) return false;
      const existing = state.hitmen.find(h => h.defId === defId);
      const newHitmen = existing
        ? state.hitmen.map(h => h.defId === defId ? { ...h, count: h.count + 1 } : h)
        : [...state.hitmen, { defId, count: 1 }];
      set({
        dirtyCash: state.dirtyCash - def.cost,
        totalSpent: state.totalSpent + def.cost,
        hitmen: newHitmen,
      });
      return true;
    },

    fireHitman: (defId: string) => {
      const state = get();
      const existing = state.hitmen.find(h => h.defId === defId);
      if (!existing || existing.count <= 0) return false;
      const newHitmen = existing.count <= 1
        ? state.hitmen.filter(h => h.defId !== defId)
        : state.hitmen.map(h => h.defId === defId ? { ...h, count: h.count - 1 } : h);
      set({ hitmen: newHitmen });
      return true;
    },

    attackRival: (rivalId: string, actionType: string) => {
      const state = get();
      const rival = state.rivals.find(r => r.id === rivalId);
      if (!rival || rival.isDefeated) return null;
      const action = RIVAL_ACTIONS.find(a => a.type === actionType as RivalActionType);
      if (!action) return null;

      // Check cost
      if (state.dirtyCash < action.cost) {
        return { success: false, message: `Need $${action.cost.toLocaleString()} dirty cash` };
      }

      const playerHitmen = state.hitmen.reduce((sum, h) => {
        const def = HITMAN_MAP[h.defId];
        return sum + (def ? h.count : 0);
      }, 0);
      if (playerHitmen < action.hitmenRequired) {
        return { success: false, message: `Need at least ${action.hitmenRequired} hitmen` };
      }

      // Assassination special requirements
      if (action.type === 'assassinate') {
        if ((rival.weakness ?? 0) < 67) {
          return { success: false, message: `${rival.name} is too strong (${Math.floor(rival.weakness ?? 0)}% weakness, need 67%)` };
        }
        if (rival.hitmen > 1) {
          return { success: false, message: `${rival.name} has ${rival.hitmen} hitmen protecting them. Take them out first.` };
        }
      }

      // Calculate success chance
      const playerAttack = state.hitmen.reduce((sum, h) => {
        const def = HITMAN_MAP[h.defId];
        return sum + (def ? h.count * def.attack : 0);
      }, 0);
      const rivalDefense = rival.hitmen * 15;
      const powerRatio = Math.min(2, playerAttack / Math.max(1, rivalDefense));

      let chance: number;
      if (action.type === 'assassinate') {
        // Assassination: chance based on weakness, reduced by remaining hitmen
        const baseChance = (rival.weakness ?? 0) / 100 * 0.8;
        const hitmanPenalty = rival.hitmen * 0.15;
        chance = Math.max(0.05, Math.min(0.95, baseChance - hitmanPenalty));
      } else {
        chance = Math.min(0.95, action.successBase * powerRatio);
      }

      const roll = Math.random();
      const success = roll < chance;

      const newRivalHeat = Math.min(1000, (state.rivalHeat ?? 0) + action.heatGain);
      let message: string = '';
      let playerHitmenLost = 0;

      const updatedRivals = state.rivals.map(r => {
        if (r.id !== rivalId) return r;
        const weakness = r.weakness ?? 0;

        if (!success) {
          // Failed attack — rival gets angry, weakness drops slightly on assassination
          if (action.type === 'assassinate') {
            message = `Assassination attempt on ${rival.name} FAILED! Lost hitmen in the process.`;
            playerHitmenLost = 1 + Math.floor(Math.random() * 2); // lose 1-2 hitmen
            return { ...r, aggression: Math.min(1, r.aggression + 0.2), weakness: Math.max(0, weakness - 10) };
          }
          return { ...r, aggression: Math.min(1, r.aggression + 0.1) };
        }

        switch (action.type) {
          case 'rob': {
            const stolen = Math.min(r.dirtyCash, 2000 + Math.floor(Math.random() * 8000));
            message = `Robbed ${rival.name} for $${stolen.toLocaleString()}!`;
            return { ...r, dirtyCash: r.dirtyCash - stolen, aggression: Math.min(1, r.aggression + 0.15), weakness: Math.min(100, weakness + 3) };
          }
          case 'raid': {
            const stolenOz = Math.min(r.productOz, 5 + Math.floor(Math.random() * 20));
            message = `Raided ${rival.name} — stole ${stolenOz} oz!`;
            return { ...r, productOz: r.productOz - stolenOz, aggression: Math.min(1, r.aggression + 0.2), weakness: Math.min(100, weakness + 4) };
          }
          case 'sabotage': {
            if (r.businesses.length === 0) {
              message = `${rival.name} has no businesses to sabotage!`;
              return r;
            }
            const idx = Math.floor(Math.random() * r.businesses.length);
            const biz = r.businesses[idx];
            message = `Sabotaged ${rival.name}'s business! (-50% health)`;
            const updated = [...r.businesses];
            updated[idx] = { ...biz, health: Math.max(0, biz.health - 50) };
            return { ...r, businesses: updated.filter(b => b.health > 0), aggression: Math.min(1, r.aggression + 0.25), weakness: Math.min(100, weakness + 6) };
          }
          case 'arson': {
            const active = r.businesses.filter(b => !b.burnedAtTick);
            if (active.length === 0) {
              message = `${rival.name} has no businesses to burn!`;
              return r;
            }
            const target = active[Math.floor(Math.random() * active.length)];
            message = `Burned down ${rival.name}'s business! 🔥`;
            const updated = r.businesses.map(b =>
              b === target ? { ...b, burnedAtTick: state.tickCount, health: 0 } : b
            );
            return { ...r, businesses: updated, aggression: Math.min(1, r.aggression + 0.3), weakness: Math.min(100, weakness + 10) };
          }
          case 'hit': {
            if (r.hitmen <= 0) {
              message = `${rival.name} has no hitmen left!`;
              return r;
            }
            message = `Took out one of ${rival.name}'s hitmen! (${r.hitmen - 1} remaining)`;
            return { ...r, hitmen: r.hitmen - 1, aggression: Math.min(1, r.aggression + 0.2), weakness: Math.min(100, weakness + 7) };
          }
          case 'assassinate': {
            message = `☠️ ${rival.name} has been eliminated! Their empire crumbles.`;
            return { ...r, isDefeated: true, weakness: 100, businesses: [], hitmen: 0, dirtyCash: 0, cleanCash: 0, productOz: 0 };
          }
          default:
            return r;
        }
      });

      if (!success && !message) message = `Attack on ${rival.name} failed! They're on high alert now.`;

      // Add stolen goods to player
      let dirtyCashGain = 0;
      if (success && action.type === 'rob') {
        const stolen = Math.min(rival.dirtyCash, 2000 + Math.floor(Math.random() * 8000));
        dirtyCashGain = stolen;
      }

      // Handle player hitmen lost on failed assassination
      let newPlayerHitmen = state.hitmen;
      if (playerHitmenLost > 0) {
        let remaining = playerHitmenLost;
        newPlayerHitmen = state.hitmen.map(h => {
          if (remaining <= 0) return h;
          const lose = Math.min(h.count, remaining);
          remaining -= lose;
          return { ...h, count: h.count - lose };
        }).filter(h => h.count > 0);
      }

      const log = [...(state.rivalAttackLog ?? []), message].slice(-10);
      const newDirtyCash = state.dirtyCash - action.cost + dirtyCashGain;
      set({
        rivals: updatedRivals,
        rivalHeat: newRivalHeat,
        rivalAttackLog: log,
        dirtyCash: newDirtyCash,
        hitmen: newPlayerHitmen,
      });
      return { success, message };
    },
  };
}
