import type { GameState } from '../../data/types';
import { GROW_ROOM_TYPE_MAP, ROOM_UPGRADE_MAP, INITIAL_GAME_STATE, getStrainUnlockCost } from '../../data/types';
import { harvestSlot, getMaxStreetDemand, getStreetSellHeat } from '../../engine/economy';
import { getTechBonuses } from '../../engine/tech';
import { INITIAL_TECH_UPGRADES } from '../../data/techDefs';
import { INITIAL_SESSION_TECH } from '../../data/sessionTechDefs';
import { getSessionTechBonuses } from '../../engine/sessionTech';
import { HEAT_MAX } from '../../engine/heat';
import { JOB_MAP } from '../../data/types';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

/** Advance tutorial if current step matches the given action */
export function checkTutorialAdvance(get: GetState, action: string) {
  const gs = (get() as any).gameSettings;
  if (!gs.tutorialActive) return;
  const { TUTORIAL_STEPS } = require('../../data/tutorial');
  const step = TUTORIAL_STEPS[gs.tutorialStep];
  if (step?.advanceOn === action) {
    (get() as any).advanceTutorial();
  }
}

export function createOperationActions(set: SetState, get: GetState) {
  return {
    harvestGrowRoom: (roomId: string, slotIndex: number) => {
      const state = get();
      const tech = getTechBonuses(state.techUpgrades ?? INITIAL_TECH_UPGRADES);
      const sTech2 = getSessionTechBonuses(state.sessionTechUpgrades ?? INITIAL_SESSION_TECH);
      const combinedTech = {
        ...tech,
        yieldBonus: tech.yieldBonus + sTech2.yieldBonus,
        speedBonus: tech.speedBonus + sTech2.speedBonus,
      };
      const { newOp, unitsHarvested, cycleCost, speedBonus } = harvestSlot(state.operation, roomId, slotIndex, combinedTech);
      if (unitsHarvested > 0) {
        const updates: Partial<typeof state> = { dirtyCash: Math.max(0, state.dirtyCash - cycleCost) };
        if (newOp.seedStock > 0) {
          const room = newOp.growRooms.find((r) => r.id === roomId);
          const canonicalTimer = room
            ? (GROW_ROOM_TYPE_MAP[room.typeId]?.strainSlots[slotIndex]?.growTimerTicks ?? room.slots[slotIndex]?.growTimerTicks ?? 30)
            : 30;
          const effectiveTimer = Math.max(1, Math.ceil(canonicalTimer * (1 - speedBonus)));
          const replanted = {
            ...newOp,
            seedStock: newOp.seedStock - 1,
            growRooms: newOp.growRooms.map((r) =>
              r.id === roomId
                ? {
                    ...r,
                    slots: r.slots.map((s, i) =>
                      i === slotIndex ? { ...s, isHarvesting: true, ticksRemaining: effectiveTimer, growTimerTicks: canonicalTimer } : s
                    ),
                  }
                : r
            ),
          };
          set({ ...updates, operation: replanted });
        } else {
          set({ ...updates, operation: newOp });
        }
      }
      if (unitsHarvested > 0) checkTutorialAdvance(get, 'harvest');
      return unitsHarvested;
    },

    sellProduct: (units: number) => {
      const state = get();
      const currentJobDef = state.currentJobId ? JOB_MAP[state.currentJobId] ?? null : null;
      const maxDemand = getMaxStreetDemand(currentJobDef, state.businesses);
      const quotaOz = Math.min(state.streetSellQuotaOz ?? maxDemand, maxDemand);
      if (quotaOz <= 0) return 0;
      const inventoryEntries = Object.entries(state.operation.productInventory);
      const totalOz = inventoryEntries.reduce((sum, [, e]) => sum + e.oz, 0);
      const toSell = Math.min(units, totalOz, quotaOz);
      if (toSell <= 0) return 0;
      // Sell proportionally from each strain at its actual price
      let dirtyEarned = 0;
      const newInventory = { ...state.operation.productInventory };
      for (const [strainName, entry] of inventoryEntries) {
        const fraction = totalOz > 0 ? entry.oz / totalOz : 0;
        const strainSold = Math.min(entry.oz, toSell * fraction);
        dirtyEarned += strainSold * entry.pricePerUnit * 0.7;
        newInventory[strainName] = { ...entry, oz: entry.oz - strainSold };
      }
      dirtyEarned = Math.floor(dirtyEarned);
      const newQuota = quotaOz - toSell;
      // Tiny heat from street selling
      const sellHeat = getStreetSellHeat(toSell, currentJobDef);
      set({
        dirtyCash: state.dirtyCash + dirtyEarned,
        totalDirtyEarned: state.totalDirtyEarned + dirtyEarned,
        lastTickDirtyProfit: state.lastTickDirtyProfit + dirtyEarned,
        operation: { ...state.operation, productInventory: newInventory },
        streetSellQuotaOz: newQuota,
        heat: Math.min(HEAT_MAX, state.heat + sellHeat),
      });
      checkTutorialAdvance(get, 'sell');
      return dirtyEarned;
    },

    buyGrowRoom: (typeId: string) => {
      const state = get();
      const def = GROW_ROOM_TYPE_MAP[typeId];
      if (!def) return false;
      const useClean = def.purchaseCurrency === 'clean';
      const wallet = useClean ? state.cleanCash : state.dirtyCash;
      if (wallet < def.purchaseCost) return false;
      const firstSlot = def.strainSlots[0];
      const newRoom: import('../../data/types').GrowRoom = {
        id: `room_${Date.now()}`,
        typeId: def.id,
        name: def.name,
        upgradeLevel: 0,
        upgradeLevels: {},
        slots: [
          { ...firstSlot, isHarvesting: true, ticksRemaining: firstSlot.growTimerTicks },
        ],
      };
      set({
        ...(useClean
          ? { cleanCash: state.cleanCash - def.purchaseCost }
          : { dirtyCash: state.dirtyCash - def.purchaseCost }),
        totalSpent: state.totalSpent + def.purchaseCost,
        operation: { ...state.operation, growRooms: [...state.operation.growRooms, newRoom] },
      });
      return true;
    },

    upgradeRoom: (roomId: string) => {
      const state = get();
      const room = state.operation.growRooms.find((r) => r.id === roomId);
      if (!room) return false;
      const def = GROW_ROOM_TYPE_MAP[room.typeId];
      if (!def) return false;
      const nextLevel = room.upgradeLevel + 1;
      if (nextLevel >= def.strainSlots.length) return false; // already max
      const cost = getStrainUnlockCost(def, nextLevel);
      if (cost <= 0 || state.dirtyCash < cost) return false;
      const newSlotDef = def.strainSlots[nextLevel];
      if (!newSlotDef) return false;
      const newSlot: import('../../data/types').StrainSlot = {
        ...newSlotDef,
        isHarvesting: false,
        ticksRemaining: 0,
      };
      set({
        dirtyCash: state.dirtyCash - cost,
        totalSpent: state.totalSpent + cost,
        operation: {
          ...state.operation,
          growRooms: state.operation.growRooms.map((r) =>
            r.id === roomId
              ? { ...r, upgradeLevel: nextLevel, slots: [...r.slots, newSlot] }
              : r
          ),
        },
      });
      return true;
    },

    buyRoomUpgrade: (roomId: string, upgradeId: string) => {
      const state = get();
      const room = state.operation.growRooms.find((r) => r.id === roomId);
      if (!room) return false;
      const upgDef = ROOM_UPGRADE_MAP[upgradeId];
      if (!upgDef) return false;
      const roomDef = GROW_ROOM_TYPE_MAP[room.typeId];
      const currentLevel = room.upgradeLevels?.[upgradeId] ?? 0;
      // Enforce per-room upgrade cap
      const roomCap = roomDef?.maxUpgradeLevels?.[upgradeId] ?? upgDef.levels.length;
      if (currentLevel >= roomCap) return false;
      const nextLvl = upgDef.levels[currentLevel];
      if (!nextLvl) return false; // already maxed
      const mult = roomDef?.upgradeCostMultiplier ?? 1;
      const cost = nextLvl.cost * mult;
      if (state.dirtyCash < cost) return false;
      set({
        dirtyCash: state.dirtyCash - cost,
        totalSpent: state.totalSpent + cost,
        operation: {
          ...state.operation,
          growRooms: state.operation.growRooms.map((r) =>
            r.id === roomId
              ? { ...r, upgradeLevels: { ...r.upgradeLevels, [upgradeId]: currentLevel + 1 } }
              : r
          ),
        },
      });
      return true;
    },

    buySeed: (quantity: number) => {
      const state = get();
      const base = INITIAL_GAME_STATE.operation.seedCostPerUnit; // $5
      const discount = quantity >= 30000 ? 3 : quantity >= 20000 ? 2 : quantity >= 10000 ? 1 : 0;
      const seedTech = getSessionTechBonuses(state.sessionTechUpgrades ?? INITIAL_SESSION_TECH);
      const pricePerSeed = Math.max(1, Math.floor((base - discount) * (1 - seedTech.seedDiscount)));
      const cost = pricePerSeed * quantity;
      if (state.dirtyCash < cost) return false;
      set({
        dirtyCash: state.dirtyCash - cost,
        totalSpent: state.totalSpent + cost,
        operation: { ...state.operation, seedStock: state.operation.seedStock + quantity },
      });
      checkTutorialAdvance(get, 'buy-seed');
      return true;
    },

    plantSeeds: (roomId: string, slotIndex: number) => {
      const state = get();
      if (state.operation.seedStock < 1) return false;
      const room = state.operation.growRooms.find((r) => r.id === roomId);
      if (!room) return false;
      const slot = room.slots[slotIndex];
      if (!slot || slot.isHarvesting) return false;
      // Always use the canonical grow time from the def, not whatever is saved in the slot
      const canonicalTimer = GROW_ROOM_TYPE_MAP[room.typeId]?.strainSlots[slotIndex]?.growTimerTicks ?? slot.growTimerTicks;
      set({
        operation: {
          ...state.operation,
          seedStock: state.operation.seedStock - 1,
          growRooms: state.operation.growRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  slots: r.slots.map((s, i) =>
                    i === slotIndex ? { ...s, isHarvesting: true, ticksRemaining: canonicalTimer, growTimerTicks: canonicalTimer } : s
                  ),
                }
              : r
          ),
        },
      });
      checkTutorialAdvance(get, 'plant');
      return true;
    },
  };
}
