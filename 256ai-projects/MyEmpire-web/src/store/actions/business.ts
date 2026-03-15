import type { BusinessInstance, GameState } from '../../data/types';
import { LOT_BUILD_COOLDOWN } from '../../data/types';
import { BUSINESS_MAP } from '../../data/businesses';
import { DISTRICT_MAP } from '../../data/districts';
import { RESOURCE_MAP } from '../../data/resources';

type SetState = (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void;
type GetState = () => GameState;

let nextInstanceId = 1;

export function createBusinessActions(set: SetState, get: GetState) {
  return {
    purchaseBusiness: (businessDefId: string, districtId: string, slotIndex: number) => {
      const state = get();
      const def = BUSINESS_MAP[businessDefId];
      if (!def) return false;
      const district = DISTRICT_MAP[districtId];
      const isGenBlock = !district && districtId.startsWith('gen_') && state.unlockedDistricts.includes(districtId);
      if (!district && !isGenBlock) return false;
      if (state.cleanCash < def.purchaseCost) return false;
      if (!state.unlockedDistricts.includes(districtId)) return false;
      if (!def.isRental && !isGenBlock && !def.allowedDistrictIds.includes(districtId)) return false;
      const maxSlots = district?.maxBusinessSlots ?? 6;
      const occupied = state.businesses.filter((b) => b.districtId === districtId);
      if (occupied.length >= maxSlots) return false;
      if (occupied.some((b) => b.slotIndex === slotIndex)) return false;
      // Enforce lot build cooldown — must own the lot for LOT_BUILD_COOLDOWN ticks before building
      const slotTimerKey = `${districtId}:${slotIndex}`;
      const lotBoughtAt = state.lotBuildTimers?.[slotTimerKey];
      if (lotBoughtAt != null && state.tickCount - lotBoughtAt < LOT_BUILD_COOLDOWN) return false;
      const instance: BusinessInstance = {
        instanceId: `biz_${nextInstanceId++}_${Date.now()}`,
        businessDefId,
        districtId,
        slotIndex,
        upgradeLevel: 0,
        isOperating: true,
        supplyModifier: 1,
        dirtyQueuedPerTick: (def.isDispensary || def.isRental) ? 0 : 5,
        cleanToDirtyPerTick: 0,
        ...(def.isDispensary ? { productQueuedPerTick: 2 } : {}),
      };
      // Clear this slot from any rival's blacklist (player buying clears the title)
      const slotKey = `${districtId}:${slotIndex}`;
      const updatedRivals = state.rivals.map(r => {
        if (!r.blacklistedSlots?.includes(slotKey)) return r;
        return { ...r, blacklistedSlots: r.blacklistedSlots.filter(s => s !== slotKey) };
      });

      set({
        cleanCash: state.cleanCash - def.purchaseCost,
        totalSpent: state.totalSpent + def.purchaseCost,
        businesses: [...state.businesses, instance],
        rivals: updatedRivals,
      });
      return true;
    },

    sellBusiness: (instanceId: string) => {
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

    upgradeBusiness: (instanceId: string) => {
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

    setLaunderRate: (instanceId: string, dirtyPerTick: number) => {
      set((state) => ({
        businesses: state.businesses.map((b) =>
          b.instanceId === instanceId ? { ...b, dirtyQueuedPerTick: Math.max(0, dirtyPerTick) } : b
        ),
      }));
    },

    setCleanToDirtyRate: (instanceId: string, amount: number) => {
      set((state) => ({
        businesses: state.businesses.map((b) =>
          b.instanceId === instanceId ? { ...b, cleanToDirtyPerTick: Math.max(0, amount) } : b
        ),
      }));
    },

    setDispensaryRate: (instanceId: string, ozPerTick: number) => {
      set((state) => ({
        businesses: state.businesses.map((b) =>
          b.instanceId === instanceId ? { ...b, productQueuedPerTick: Math.max(0, ozPerTick) } : b
        ),
      }));
    },

    purchaseResource: (resourceId: string, quantity: number) => {
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
  };
}
