import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessInstance, GameState } from '../data/types';
import { INITIAL_GAME_STATE, GROW_ROOM_TYPE_MAP, DEALER_TIERS, WATER_TIERS, LIGHT_TIERS } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { RESOURCE_MAP } from '../data/resources';
import {
  tickCriminalOperation,
  harvestSlot,
  calculateBusinessRevenue,
  calculateBusinessExpenses,
  calculateLaunderTick,
} from '../engine/economy';

interface GameActions {
  tick: () => void;
  harvestGrowRoom: (roomId: string, slotIndex: number) => number;
  buyGrowRoom: (typeId: string) => boolean;
  upgradeRoom: (roomId: string) => boolean;
  hireDealers: (count: number) => boolean;
  upgradeDealerTier: () => boolean;
  buySeed: (quantity: number) => boolean;
  plantSeeds: (roomId: string, slotIndex: number) => boolean;
  sellProduct: (units: number) => number;
  upgradeWater: (roomId: string) => boolean;
  upgradeLighting: (roomId: string) => boolean;
  buyAutoHarvest: (roomId: string) => boolean;
  purchaseBusiness: (businessDefId: string, districtId: string, slotIndex: number) => boolean;
  sellBusiness: (instanceId: string) => void;
  upgradeBusiness: (instanceId: string) => boolean;
  setLaunderRate: (instanceId: string, dirtyPerTick: number) => void;
  purchaseResource: (resourceId: string, quantity: number) => boolean;
  unlockDistrict: (districtId: string) => boolean;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

let nextInstanceId = 1;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_GAME_STATE,

      tick: () => {
        set((state) => {
          let { dirtyCash, cleanCash } = state;

          const { newOp, dirtyEarned } = tickCriminalOperation(state.operation);
          dirtyCash += dirtyEarned;

          let totalDirtyConsumed = 0;
          let totalCleanProduced = 0;
          let totalRevenue = 0;
          let totalExpenses = 0;

          for (const biz of state.businesses) {
            if (!biz.isOperating) continue;
            totalRevenue += calculateBusinessRevenue(biz);
            totalExpenses += calculateBusinessExpenses(biz);
            const { dirtyConsumed, cleanProduced } = calculateLaunderTick(biz, dirtyCash - totalDirtyConsumed);
            totalDirtyConsumed += dirtyConsumed;
            totalCleanProduced += cleanProduced;
          }

          const legitProfit = totalRevenue - totalExpenses;
          dirtyCash = Math.max(0, dirtyCash - totalDirtyConsumed);
          cleanCash += totalCleanProduced + legitProfit;
          if (cleanCash < 0) cleanCash += cleanCash * 0.0001;

          const totalEarned = state.totalDirtyEarned + dirtyEarned;
          const shouldShowNotice = !state.heatNoticeShown && totalEarned >= 100_000;

          return {
            dirtyCash,
            cleanCash,
            operation: newOp,
            totalDirtyEarned: totalEarned,
            totalCleanEarned: state.totalCleanEarned + Math.max(0, totalCleanProduced + legitProfit),
            lastTickDirtyProfit: dirtyEarned,
            lastTickCleanProfit: totalCleanProduced + legitProfit,
            tickCount: state.tickCount + 1,
            heatNoticeShown: state.heatNoticeShown || shouldShowNotice,
          };
        });
      },

      harvestGrowRoom: (roomId, slotIndex) => {
        const state = get();
        const { newOp, unitsHarvested } = harvestSlot(state.operation, roomId, slotIndex);
        if (unitsHarvested > 0) {
          if (newOp.seedStock > 0) {
            const replanted = {
              ...newOp,
              seedStock: newOp.seedStock - 1,
              growRooms: newOp.growRooms.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      slots: r.slots.map((s, i) =>
                        i === slotIndex ? { ...s, isHarvesting: true, ticksRemaining: s.growTimerTicks } : s
                      ),
                    }
                  : r
              ),
            };
            set({ operation: replanted });
          } else {
            set({ operation: newOp });
          }
        }
        return unitsHarvested;
      },

      sellProduct: (units) => {
        const state = get();
        const toSell = Math.min(units, state.operation.productInventory);
        if (toSell <= 0) return 0;
        const allSlots = state.operation.growRooms.flatMap((r) => r.slots);
        const avgPrice = allSlots.length > 0
          ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
          : 10;
        const dirtyEarned = Math.floor(toSell * avgPrice * 0.7);
        set({
          dirtyCash: state.dirtyCash + dirtyEarned,
          totalDirtyEarned: state.totalDirtyEarned + dirtyEarned,
          operation: { ...state.operation, productInventory: state.operation.productInventory - toSell },
        });
        return dirtyEarned;
      },

      buyGrowRoom: (typeId) => {
        const state = get();
        const def = GROW_ROOM_TYPE_MAP[typeId];
        if (!def || state.dirtyCash < def.purchaseCost) return false;
        const firstSlot = def.strainSlots[0];
        const newRoom: import('../data/types').GrowRoom = {
          id: `room_${Date.now()}`,
          typeId: def.id,
          name: def.name,
          upgradeLevel: 0,
          waterTier: 0,
          lightTier: 0,
          autoHarvest: false,
          slots: [
            { ...firstSlot, isHarvesting: true, ticksRemaining: firstSlot.growTimerTicks },
          ],
        };
        set({
          dirtyCash: state.dirtyCash - def.purchaseCost,
          totalSpent: state.totalSpent + def.purchaseCost,
          operation: { ...state.operation, growRooms: [...state.operation.growRooms, newRoom] },
        });
        return true;
      },

      upgradeRoom: (roomId) => {
        const state = get();
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room) return false;
        const def = GROW_ROOM_TYPE_MAP[room.typeId];
        if (!def) return false;
        const nextLevel = room.upgradeLevel + 1;
        if (nextLevel > def.upgradeCosts.length) return false; // already max
        const cost = def.upgradeCosts[nextLevel - 1];
        if (state.dirtyCash < cost) return false;
        const newSlotDef = def.strainSlots[nextLevel];
        if (!newSlotDef) return false;
        const newSlot: import('../data/types').StrainSlot = {
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

      upgradeWater: (roomId) => {
        const state = get();
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room) return false;
        const nextTier = (room.waterTier ?? 0) + 1;
        if (nextTier >= WATER_TIERS.length) return false;
        const cost = WATER_TIERS[nextTier].cost;
        if (state.dirtyCash < cost) return false;
        set({
          dirtyCash: state.dirtyCash - cost,
          totalSpent: state.totalSpent + cost,
          operation: {
            ...state.operation,
            growRooms: state.operation.growRooms.map((r) =>
              r.id === roomId ? { ...r, waterTier: nextTier } : r
            ),
          },
        });
        return true;
      },

      upgradeLighting: (roomId) => {
        const state = get();
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room) return false;
        const nextTier = (room.lightTier ?? 0) + 1;
        if (nextTier >= LIGHT_TIERS.length) return false;
        const cost = LIGHT_TIERS[nextTier].cost;
        if (state.dirtyCash < cost) return false;
        set({
          dirtyCash: state.dirtyCash - cost,
          totalSpent: state.totalSpent + cost,
          operation: {
            ...state.operation,
            growRooms: state.operation.growRooms.map((r) =>
              r.id === roomId ? { ...r, lightTier: nextTier } : r
            ),
          },
        });
        return true;
      },

      buyAutoHarvest: (roomId) => {
        const state = get();
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room || room.autoHarvest) return false;
        const def = GROW_ROOM_TYPE_MAP[room.typeId];
        if (!def) return false;
        const cost = def.autoHarvestCost;
        if (state.dirtyCash < cost) return false;
        set({
          dirtyCash: state.dirtyCash - cost,
          totalSpent: state.totalSpent + cost,
          operation: {
            ...state.operation,
            growRooms: state.operation.growRooms.map((r) =>
              r.id === roomId ? { ...r, autoHarvest: true } : r
            ),
          },
        });
        return true;
      },

      hireDealers: (count) => {
        const state = get();
        const tier = DEALER_TIERS[state.operation.dealerTierIndex];
        const cost = tier.hireCost * count;
        if (state.dirtyCash < cost) return false;
        set({
          dirtyCash: state.dirtyCash - cost,
          totalSpent: state.totalSpent + cost,
          operation: { ...state.operation, dealerCount: state.operation.dealerCount + count },
        });
        return true;
      },

      upgradeDealerTier: () => {
        const state = get();
        const nextIndex = state.operation.dealerTierIndex + 1;
        if (nextIndex >= DEALER_TIERS.length) return false;
        const nextTier = DEALER_TIERS[nextIndex];
        const upgradeCost = nextTier.hireCost * 3;
        if (state.dirtyCash < upgradeCost) return false;
        set({
          dirtyCash: state.dirtyCash - upgradeCost,
          totalSpent: state.totalSpent + upgradeCost,
          operation: { ...state.operation, dealerTierIndex: nextIndex },
        });
        return true;
      },

      buySeed: (quantity) => {
        const state = get();
        const cost = state.operation.seedCostPerUnit * quantity;
        if (state.dirtyCash < cost) return false;
        set({
          dirtyCash: state.dirtyCash - cost,
          totalSpent: state.totalSpent + cost,
          operation: { ...state.operation, seedStock: state.operation.seedStock + quantity },
        });
        return true;
      },

      plantSeeds: (roomId, slotIndex) => {
        const state = get();
        if (state.operation.seedStock < 1) return false;
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room) return false;
        const slot = room.slots[slotIndex];
        if (!slot || slot.isHarvesting) return false;
        set({
          operation: {
            ...state.operation,
            seedStock: state.operation.seedStock - 1,
            growRooms: state.operation.growRooms.map((r) =>
              r.id === roomId
                ? {
                    ...r,
                    slots: r.slots.map((s, i) =>
                      i === slotIndex ? { ...s, isHarvesting: true, ticksRemaining: s.growTimerTicks } : s
                    ),
                  }
                : r
            ),
          },
        });
        return true;
      },

      purchaseBusiness: (businessDefId, districtId, slotIndex) => {
        const state = get();
        const def = BUSINESS_MAP[businessDefId];
        const district = DISTRICT_MAP[districtId];
        if (!def || !district) return false;
        if (state.cleanCash < def.purchaseCost) return false;
        if (!state.unlockedDistricts.includes(districtId)) return false;
        if (!def.allowedDistrictIds.includes(districtId)) return false;
        const occupied = state.businesses.filter((b) => b.districtId === districtId);
        if (occupied.length >= district.maxBusinessSlots) return false;
        if (occupied.some((b) => b.slotIndex === slotIndex)) return false;
        const instance: BusinessInstance = {
          instanceId: `biz_${nextInstanceId++}_${Date.now()}`,
          businessDefId,
          districtId,
          slotIndex,
          upgradeLevel: 0,
          isOperating: true,
          supplyModifier: 1,
          dirtyQueuedPerTick: 5,
        };
        set({
          cleanCash: state.cleanCash - def.purchaseCost,
          totalSpent: state.totalSpent + def.purchaseCost,
          businesses: [...state.businesses, instance],
        });
        return true;
      },

      sellBusiness: (instanceId) => {
        const state = get();
        const biz = state.businesses.find((b) => b.instanceId === instanceId);
        if (!biz) return;
        const def = BUSINESS_MAP[biz.businessDefId];
        if (!def) return;
        const sellValue = Math.floor(def.purchaseCost * 0.5);
        set({
          cleanCash: state.cleanCash + sellValue,
          businesses: state.businesses.filter((b) => b.instanceId !== instanceId),
        });
      },

      upgradeBusiness: (instanceId) => {
        const state = get();
        const bizIndex = state.businesses.findIndex((b) => b.instanceId === instanceId);
        if (bizIndex === -1) return false;
        const biz = state.businesses[bizIndex];
        const def = BUSINESS_MAP[biz.businessDefId];
        if (!def) return false;
        const nextLevel = biz.upgradeLevel + 1;
        if (nextLevel >= def.upgradeTiers.length) return false;
        const tier = def.upgradeTiers[nextLevel];
        if (state.cleanCash < tier.upgradeCost) return false;
        const newBusinesses = [...state.businesses];
        newBusinesses[bizIndex] = { ...biz, upgradeLevel: nextLevel };
        set({
          cleanCash: state.cleanCash - tier.upgradeCost,
          totalSpent: state.totalSpent + tier.upgradeCost,
          businesses: newBusinesses,
        });
        return true;
      },

      setLaunderRate: (instanceId, dirtyPerTick) => {
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.instanceId === instanceId ? { ...b, dirtyQueuedPerTick: Math.max(0, dirtyPerTick) } : b
          ),
        }));
      },

      purchaseResource: (resourceId, quantity) => {
        const state = get();
        const resource = RESOURCE_MAP[resourceId];
        if (!resource) return false;
        const price = resource.basePricePerUnit * quantity;
        if (state.cleanCash < price) return false;
        const currentWeight = Object.entries(state.inventory).reduce((sum, [id, qty]) => {
          const r = RESOURCE_MAP[id];
          return sum + (r ? r.unitWeight * qty : 0);
        }, 0);
        if (currentWeight + resource.unitWeight * quantity > state.storageCapacity) return false;
        set({
          cleanCash: state.cleanCash - price,
          totalSpent: state.totalSpent + price,
          inventory: { ...state.inventory, [resourceId]: (state.inventory[resourceId] ?? 0) + quantity },
        });
        return true;
      },

      unlockDistrict: (districtId) => {
        const state = get();
        if (state.unlockedDistricts.includes(districtId)) return false;
        const district = DISTRICT_MAP[districtId];
        if (!district || state.cleanCash < district.unlockCost) return false;
        set({
          cleanCash: state.cleanCash - district.unlockCost,
          totalSpent: state.totalSpent + district.unlockCost,
          unlockedDistricts: [...state.unlockedDistricts, districtId],
        });
        return true;
      },

      resetGame: () => set({ ...INITIAL_GAME_STATE }),
    }),
    {
      name: 'myempire-save',
      version: 6,
      // Merge saved state with defaults (preserves money, progress, etc.),
      // then re-sync canonical game balance values so changes take effect immediately.
      migrate: (persisted: unknown, _version: number) => {
        const saved = (persisted ?? {}) as Partial<GameState>;
        const merged = { ...INITIAL_GAME_STATE, ...saved } as GameState;

        // Re-sync operation constants and slot grow timers from canonical defs
        if (merged.operation) {
          merged.operation = {
            ...merged.operation,
            // Always use current seed cost (balance change takes effect on load)
            seedCostPerUnit: INITIAL_GAME_STATE.operation.seedCostPerUnit,
            growRooms: merged.operation.growRooms.map((room) => {
              const def = GROW_ROOM_TYPE_MAP[room.typeId];
              if (!def) return room;
              return {
                ...room,
                slots: room.slots.map((slot, i) => {
                  const defSlot = def.strainSlots[i];
                  if (!defSlot) return slot;
                  // Update grow timer from canonical def — preserves in-progress ticksRemaining
                  return { ...slot, growTimerTicks: defSlot.growTimerTicks };
                }),
              };
            }),
          };
        }

        return merged;
      },
    }
  )
);
