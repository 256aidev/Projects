import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessInstance, GameState } from '../data/types';
import { INITIAL_GAME_STATE, GROW_ROOM_DEFS, DEALER_TIERS } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICT_MAP } from '../data/districts';
import { RESOURCE_MAP } from '../data/resources';
import {
  tickCriminalOperation,
  harvestRoom,
  calculateBusinessRevenue,
  calculateBusinessExpenses,
  calculateLaunderTick,
} from '../engine/economy';

interface GameActions {
  tick: () => void;
  harvestGrowRoom: (roomId: string) => number;
  buyGrowRoom: (tier: number) => boolean;
  hireDealers: (count: number) => boolean;
  upgradeDealerTier: () => boolean;
  buySeed: (quantity: number) => boolean;
  plantSeeds: (roomId: string) => boolean;
  sellProduct: (units: number) => number;
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

      harvestGrowRoom: (roomId) => {
        const state = get();
        const { newOp, unitsHarvested } = harvestRoom(state.operation, roomId);
        if (unitsHarvested > 0) {
          // Auto-replant if seeds are available
          if (newOp.seedStock > 0) {
            const replanted = {
              ...newOp,
              seedStock: newOp.seedStock - 1,
              growRooms: newOp.growRooms.map((r) =>
                r.id === roomId ? { ...r, isHarvesting: true, ticksRemaining: r.growTimerTicks } : r
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
        const dirtyEarned = toSell * 7; // street price — less than dealer rate of $10
        set({
          dirtyCash: state.dirtyCash + dirtyEarned,
          totalDirtyEarned: state.totalDirtyEarned + dirtyEarned,
          operation: { ...state.operation, productInventory: state.operation.productInventory - toSell },
        });
        return dirtyEarned;
      },

      buyGrowRoom: (tier) => {
        const state = get();
        const def = GROW_ROOM_DEFS[tier - 1];
        if (!def || state.dirtyCash < def.purchaseCost) return false;
        const newRoom = {
          id: `room_${Date.now()}`,
          tier: def.tier,
          plantsCapacity: def.plantsCapacity,
          growTimerTicks: def.growTimerTicks,
          harvestYield: def.harvestYield,
          purchaseCost: def.purchaseCost,
          isHarvesting: true,
          ticksRemaining: def.growTimerTicks,
        };
        set({
          dirtyCash: state.dirtyCash - def.purchaseCost,
          totalSpent: state.totalSpent + def.purchaseCost,
          operation: { ...state.operation, growRooms: [...state.operation.growRooms, newRoom] },
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

      plantSeeds: (roomId) => {
        const state = get();
        if (state.operation.seedStock < 1) return false;
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room || room.isHarvesting) return false;
        set({
          operation: {
            ...state.operation,
            seedStock: state.operation.seedStock - 1,
            growRooms: state.operation.growRooms.map((r) =>
              r.id === roomId ? { ...r, isHarvesting: true, ticksRemaining: r.growTimerTicks } : r
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
    { name: 'myempire-save', version: 3 }
  )
);
