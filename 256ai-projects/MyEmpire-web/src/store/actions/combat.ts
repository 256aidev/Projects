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

      const playerAttack = state.hitmen.reduce((sum, h) => {
        const def = HITMAN_MAP[h.defId];
        return sum + (def ? h.count * def.attack : 0);
      }, 0);
      const rivalDefense = rival.hitmen * 15;
      const powerRatio = Math.min(2, playerAttack / Math.max(1, rivalDefense));
      const chance = Math.min(0.95, action.successBase * powerRatio);
      const roll = Math.random();
      const success = roll < chance;

      const newRivalHeat = Math.min(1000, (state.rivalHeat ?? 0) + action.heatGain);
      let message: string;
      const updatedRivals = state.rivals.map(r => {
        if (r.id !== rivalId) return r;
        if (!success) return { ...r, aggression: Math.min(1, r.aggression + 0.1) };

        switch (action.type) {
          case 'rob': {
            const stolen = Math.min(r.dirtyCash, 2000 + Math.floor(Math.random() * 8000));
            message = `Robbed ${rival.name} for $${stolen.toLocaleString()}!`;
            return { ...r, dirtyCash: r.dirtyCash - stolen, aggression: Math.min(1, r.aggression + 0.15) };
          }
          case 'raid': {
            const stolenOz = Math.min(r.productOz, 5 + Math.floor(Math.random() * 20));
            message = `Raided ${rival.name} — stole ${stolenOz} oz!`;
            return { ...r, productOz: r.productOz - stolenOz, aggression: Math.min(1, r.aggression + 0.2) };
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
            return { ...r, businesses: updated.filter(b => b.health > 0), aggression: Math.min(1, r.aggression + 0.25) };
          }
          case 'arson': {
            // Only target non-burning businesses
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
            return { ...r, businesses: updated, aggression: Math.min(1, r.aggression + 0.3) };
          }
          default:
            return r;
        }
      });

      if (!success) message = `Attack on ${rival.name} failed! They're on high alert now.`;

      // Add stolen goods to player
      let dirtyCashGain = 0;
      if (success && action.type === 'rob') {
        const stolen = Math.min(rival.dirtyCash, 2000 + Math.floor(Math.random() * 8000));
        dirtyCashGain = stolen;
      }

      const log = [...(state.rivalAttackLog ?? []), message!].slice(-10);
      const newDirtyCash = state.dirtyCash - action.cost + dirtyCashGain;
      set({
        rivals: updatedRivals,
        rivalHeat: newRivalHeat,
        rivalAttackLog: log,
        dirtyCash: newDirtyCash,
      });
      return { success, message: message! };
    },
  };
}
