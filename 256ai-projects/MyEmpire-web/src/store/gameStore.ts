import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessInstance, GameState, GeneratedBlock } from '../data/types';
import { INITIAL_GAME_STATE, GROW_ROOM_TYPE_MAP, DEALER_TIERS, ROOM_UPGRADE_MAP, PRESTIGE_THRESHOLD, PRESTIGE_BONUS_PER_LEVEL, getStrainUnlockCost, getDealerHireCost } from '../data/types';
import { BUSINESS_MAP } from '../data/businesses';
import { DISTRICTS, DISTRICT_MAP } from '../data/districts';

// ── City block helpers ──────────────────────────────────────────────────────

function getBlockName(col: number, row: number): string {
  const dirs = ['East', 'West', 'North', 'South', 'Old', 'New', 'Upper', 'Lower', 'Central'];
  const types = ['Side', 'End', 'Quarter', 'Block', 'Row', 'Way', 'District', 'Heights'];
  return `${dirs[Math.abs(col * 3 + row * 7) % dirs.length]} ${types[Math.abs(col * 5 + row * 11) % types.length]}`;
}

function addNeighborBlocks(
  generatedBlocks: Record<string, GeneratedBlock>,
  unlockedDistricts: string[],
  nextBlockCost: number,
  newCol: number,
  newRow: number,
): Record<string, GeneratedBlock> {
  const covered = new Set<string>();
  for (const d of DISTRICTS) covered.add(`${d.gridPosition.col},${d.gridPosition.row}`);
  for (const b of Object.values(generatedBlocks)) covered.add(`${b.col},${b.row}`);
  for (const id of unlockedDistricts) {
    if (id.startsWith('gen_')) {
      const parts = id.split('_');
      covered.add(`${parts[1]},${parts[2]}`);
    }
  }
  const newBlocks: Record<string, GeneratedBlock> = {};
  for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as [number, number][]) {
    const nc = newCol + dc, nr = newRow + dr;
    const key = `${nc},${nr}`;
    if (covered.has(key) || generatedBlocks[`gen_${nc}_${nr}`]) continue;
    const id = `gen_${nc}_${nr}`;
    newBlocks[id] = { id, col: nc, row: nr, unlockCost: nextBlockCost, name: getBlockName(nc, nr) };
  }
  return newBlocks;
}
import { RESOURCE_MAP } from '../data/resources';
import {
  tickCriminalOperation,
  harvestSlot,
  calculateBusinessRevenue,
  calculateBusinessExpenses,
  calculateLaunderTick,
  calculateDispensaryTick,
} from '../engine/economy';

interface GameActions {
  tick: () => void;
  harvestGrowRoom: (roomId: string, slotIndex: number) => number;
  buyGrowRoom: (typeId: string) => boolean;
  upgradeRoom: (roomId: string) => boolean;
  hireDealers: (count: number) => boolean;
  upgradeDealerTier: () => boolean;
  downgradeDealerTier: () => boolean;
  buySeed: (quantity: number) => boolean;
  plantSeeds: (roomId: string, slotIndex: number) => boolean;
  sellProduct: (units: number) => number;
  buyRoomUpgrade: (roomId: string, upgradeId: string) => boolean;
  purchaseBusiness: (businessDefId: string, districtId: string, slotIndex: number) => boolean;
  unlockLot: (districtId: string) => boolean;
  unlockGeneratedBlock: (blockId: string) => boolean;
  sellBusiness: (instanceId: string) => void;
  upgradeBusiness: (instanceId: string) => boolean;
  setLaunderRate: (instanceId: string, dirtyPerTick: number) => void;
  setCleanToDirtyRate: (instanceId: string, amount: number) => void;
  setDispensaryRate: (instanceId: string, ozPerTick: number) => void;
  purchaseResource: (resourceId: string, quantity: number) => boolean;
  unlockDistrict: (districtId: string) => boolean;
  fireDealers: (count: number) => void;
  prestige: () => boolean;
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

          const { newOp, dirtyEarned, maintenanceCost } = tickCriminalOperation(state.operation, state.prestigeBonus);
          dirtyCash += dirtyEarned;
          dirtyCash = Math.max(0, dirtyCash - maintenanceCost);

          let totalDirtyConsumed = 0;
          let totalCleanProduced = 0;
          let totalRevenue = 0;
          let totalExpenses = 0;

          // Compute total oz and weighted avg price from per-strain inventory
          const invEntries = Object.entries(newOp.productInventory);
          const totalInventoryOz = invEntries.reduce((sum, [, e]) => sum + e.oz, 0);
          const weightedAvgPrice = totalInventoryOz > 0
            ? invEntries.reduce((sum, [, e]) => sum + e.oz * e.pricePerUnit, 0) / totalInventoryOz
            : 10;
          let totalProductConsumed = 0;

          for (const biz of state.businesses) {
            if (!biz.isOperating) continue;
            const bizDef = BUSINESS_MAP[biz.businessDefId];
            totalRevenue += calculateBusinessRevenue(biz);
            totalExpenses += calculateBusinessExpenses(biz);
            if (bizDef?.isDispensary) {
              const { productConsumed, cleanProduced } = calculateDispensaryTick(biz, totalInventoryOz - totalProductConsumed, weightedAvgPrice);
              totalProductConsumed += productConsumed;
              totalCleanProduced += cleanProduced;
            } else if (bizDef?.isRental) {
              // rental revenue is 100% clean cash — already counted in totalRevenue above
            } else {
              const { dirtyConsumed, cleanProduced } = calculateLaunderTick(biz, dirtyCash - totalDirtyConsumed);
              totalDirtyConsumed += dirtyConsumed;
              totalCleanProduced += cleanProduced;
            }
          }

          // Consume dispensary product proportionally from per-strain inventory
          let finalOp = newOp;
          if (totalProductConsumed > 0 && totalInventoryOz > 0) {
            const newInventory = { ...newOp.productInventory };
            for (const strainName of Object.keys(newInventory)) {
              const entry = newInventory[strainName];
              const fraction = entry.oz / totalInventoryOz;
              const strainConsumed = Math.min(entry.oz, totalProductConsumed * fraction);
              newInventory[strainName] = { ...entry, oz: entry.oz - strainConsumed };
            }
            finalOp = { ...newOp, productInventory: newInventory };
          }

          // Reverse flow: clean cash → dirty cash (95% efficiency — 5% handling cost)
          let totalCleanToDirty = 0;
          let totalDirtyFromClean = 0;
          for (const biz of state.businesses) {
            if (!biz.isOperating) continue;
            const rate = biz.cleanToDirtyPerTick ?? 0;
            if (rate <= 0) continue;
            const available = cleanCash - totalCleanToDirty; // remaining clean cash
            const consumed = Math.min(rate, Math.max(0, available));
            totalCleanToDirty += consumed;
            totalDirtyFromClean += consumed * 0.95;
          }

          const legitProfit = totalRevenue - totalExpenses;
          dirtyCash = Math.max(0, dirtyCash - totalDirtyConsumed) + totalDirtyFromClean;
          cleanCash = cleanCash - totalCleanToDirty + totalCleanProduced + legitProfit;
          if (cleanCash < 0) cleanCash += cleanCash * 0.0001;

          const totalEarned = state.totalDirtyEarned + dirtyEarned;
          const shouldShowNotice = !state.heatNoticeShown && totalEarned >= 100_000;

          // Street sell quota: drip refill at 1 lb (16 oz) per minute = 16/60 oz per tick
          const streetSellQuotaOz = Math.min(160, (state.streetSellQuotaOz ?? 160) + 16 / 60);

          return {
            dirtyCash,
            cleanCash,
            operation: finalOp,
            totalDirtyEarned: totalEarned,
            totalCleanEarned: state.totalCleanEarned + Math.max(0, totalCleanProduced + legitProfit),
            lastTickDirtyProfit: dirtyEarned - maintenanceCost,
            lastTickCleanProfit: totalCleanProduced + legitProfit,
            tickCount: state.tickCount + 1,
            heatNoticeShown: state.heatNoticeShown || shouldShowNotice,
            streetSellQuotaOz,
          };
        });
      },

      harvestGrowRoom: (roomId, slotIndex) => {
        const state = get();
        const { newOp, unitsHarvested, cycleCost, speedBonus } = harvestSlot(state.operation, roomId, slotIndex, state.prestigeBonus);
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
        return unitsHarvested;
      },

      sellProduct: (units) => {
        const state = get();
        const quotaOz = state.streetSellQuotaOz ?? 160;
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
        set({
          dirtyCash: state.dirtyCash + dirtyEarned,
          totalDirtyEarned: state.totalDirtyEarned + dirtyEarned,
          lastTickDirtyProfit: state.lastTickDirtyProfit + dirtyEarned,
          operation: { ...state.operation, productInventory: newInventory },
          streetSellQuotaOz: newQuota,
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
          upgradeLevels: {},
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
        if (nextLevel >= def.strainSlots.length) return false; // already max
        const cost = getStrainUnlockCost(def, nextLevel);
        if (cost <= 0 || state.dirtyCash < cost) return false;
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

      buyRoomUpgrade: (roomId, upgradeId) => {
        const state = get();
        const room = state.operation.growRooms.find((r) => r.id === roomId);
        if (!room) return false;
        const upgDef = ROOM_UPGRADE_MAP[upgradeId];
        if (!upgDef) return false;
        const currentLevel = room.upgradeLevels?.[upgradeId] ?? 0;
        const nextLvl = upgDef.levels[currentLevel];
        if (!nextLvl) return false; // already maxed
        const mult = GROW_ROOM_TYPE_MAP[room.typeId]?.upgradeCostMultiplier ?? 1;
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

      hireDealers: (count) => {
        const state = get();
        const tier = DEALER_TIERS[state.operation.dealerTierIndex];
        // Escalating cost: each successive dealer costs 1.5× more
        let totalCost = 0;
        for (let i = 0; i < count; i++) {
          totalCost += getDealerHireCost(tier, state.operation.dealerCount + i);
        }
        if (state.dirtyCash < totalCost) return false;
        set({
          dirtyCash: state.dirtyCash - totalCost,
          totalSpent: state.totalSpent + totalCost,
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

      downgradeDealerTier: () => {
        const state = get();
        const prevIndex = state.operation.dealerTierIndex - 1;
        if (prevIndex < 0) return false;
        // Refund 50% of the tier's upgrade cost
        const currentTier = DEALER_TIERS[state.operation.dealerTierIndex];
        const refund = Math.floor(currentTier.hireCost * 3 * 0.5);
        set({
          dirtyCash: state.dirtyCash + refund,
          operation: { ...state.operation, dealerTierIndex: prevIndex },
        });
        return true;
      },

      buySeed: (quantity) => {
        const state = get();
        const base = INITIAL_GAME_STATE.operation.seedCostPerUnit; // $5
        const discount = quantity >= 30000 ? 3 : quantity >= 20000 ? 2 : quantity >= 10000 ? 1 : 0;
        const pricePerSeed = base - discount;
        const cost = pricePerSeed * quantity;
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
        return true;
      },

      purchaseBusiness: (businessDefId, districtId, slotIndex) => {
        const state = get();
        const def = BUSINESS_MAP[businessDefId];
        if (!def) return false;
        const district = DISTRICT_MAP[districtId];
        const isGenBlock = !district && districtId.startsWith('gen_') && state.unlockedDistricts.includes(districtId);
        if (!district && !isGenBlock) return false;
        if (state.cleanCash < def.purchaseCost) return false;
        if (!state.unlockedDistricts.includes(districtId)) return false;
        if (!def.isRental && !def.allowedDistrictIds.includes(districtId)) return false;
        const maxSlots = district?.maxBusinessSlots ?? 6;
        const occupied = state.businesses.filter((b) => b.districtId === districtId);
        if (occupied.length >= maxSlots) return false;
        if (occupied.some((b) => b.slotIndex === slotIndex)) return false;
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
        set({
          cleanCash: state.cleanCash - def.purchaseCost,
          totalSpent: state.totalSpent + def.purchaseCost,
          businesses: [...state.businesses, instance],
        });
        return true;
      },

      unlockLot: (districtId) => {
        const state = get();
        const district = DISTRICT_MAP[districtId];
        const isGenBlock = !district && districtId.startsWith('gen_') && state.unlockedDistricts.includes(districtId);
        if (!district && !isGenBlock) return false;
        const maxSlots = district?.maxBusinessSlots ?? 6;
        const currentUnlocked = state.unlockedSlots?.[districtId] ?? 2;
        if (currentUnlocked >= maxSlots) return false;
        // Cost doubles each lot: lot 3 = $1k, lot 4 = $2k, lot 5 = $4k...
        const cost = 1000 * Math.pow(2, currentUnlocked - 2);
        if (state.cleanCash < cost) return false;
        set({
          cleanCash: state.cleanCash - cost,
          totalSpent: state.totalSpent + cost,
          unlockedSlots: { ...(state.unlockedSlots ?? {}), [districtId]: currentUnlocked + 1 },
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

      setCleanToDirtyRate: (instanceId, amount) => {
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.instanceId === instanceId ? { ...b, cleanToDirtyPerTick: Math.max(0, amount) } : b
          ),
        }));
      },

      setDispensaryRate: (instanceId, ozPerTick) => {
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.instanceId === instanceId ? { ...b, productQueuedPerTick: Math.max(0, ozPerTick) } : b
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
        const newNeighbors = addNeighborBlocks(
          state.generatedBlocks, state.unlockedDistricts,
          state.nextBlockCost, district.gridPosition.col, district.gridPosition.row,
        );
        set({
          cleanCash: state.cleanCash - district.unlockCost,
          totalSpent: state.totalSpent + district.unlockCost,
          unlockedDistricts: [...state.unlockedDistricts, districtId],
          generatedBlocks: { ...state.generatedBlocks, ...newNeighbors },
          unlockedSlots: { ...(state.unlockedSlots ?? {}), [districtId]: state.unlockedSlots?.[districtId] ?? 2 },
        });
        return true;
      },

      unlockGeneratedBlock: (blockId) => {
        const state = get();
        if (!blockId.startsWith('gen_')) return false;
        if (state.unlockedDistricts.includes(blockId)) return false;
        const parts = blockId.split('_');
        const col = parseInt(parts[1]), row = parseInt(parts[2]);
        if (isNaN(col) || isNaN(row)) return false;
        const cost = state.nextBlockCost;
        if (state.cleanCash < cost) return false;
        const newGenBlocks = { ...state.generatedBlocks };
        delete newGenBlocks[blockId];
        const newNeighbors = addNeighborBlocks(
          newGenBlocks, [...state.unlockedDistricts, blockId],
          state.nextBlockCost * 2, col, row,
        );
        set({
          cleanCash: state.cleanCash - cost,
          totalSpent: state.totalSpent + cost,
          unlockedDistricts: [...state.unlockedDistricts, blockId],
          generatedBlocks: { ...newGenBlocks, ...newNeighbors },
          nextBlockCost: state.nextBlockCost * 2,
          unlockedSlots: { ...(state.unlockedSlots ?? {}), [blockId]: 2 },
        });
        return true;
      },

      fireDealers: (count) => {
        const state = get();
        const remove = Math.min(count, state.operation.dealerCount);
        if (remove <= 0) return;
        set({ operation: { ...state.operation, dealerCount: state.operation.dealerCount - remove } });
      },

      prestige: () => {
        const state = get();
        if (state.totalDirtyEarned < PRESTIGE_THRESHOLD) return false;
        const newCount = (state.prestigeCount ?? 0) + 1;
        set({
          ...INITIAL_GAME_STATE,
          prestigeCount: newCount,
          prestigeBonus: newCount * PRESTIGE_BONUS_PER_LEVEL,
        });
        return true;
      },

      resetGame: () => {
        const state = get();
        set({
          ...INITIAL_GAME_STATE,
          prestigeCount: state.prestigeCount ?? 0,
          prestigeBonus: state.prestigeBonus ?? 0,
        });
      },
    }),
    {
      name: 'myempire-save',
      version: 14,
      // Merge saved state with defaults (preserves money, progress, etc.),
      // then re-sync canonical game balance values so changes take effect immediately.
      migrate: (persisted: unknown, _version: number) => {
        try {
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
              // Migrate legacy fields → upgradeLevels
              const upgradeLevels: Record<string, number> = { ...(room.upgradeLevels ?? {}) };
              if (!upgradeLevels.water && (room as any).waterTier > 0) upgradeLevels.water = (room as any).waterTier;
              if (!upgradeLevels.light && (room as any).lightTier > 0) upgradeLevels.light = (room as any).lightTier;
              if (!upgradeLevels.flora_gro && (room as any).nutrientSpeed > 0) upgradeLevels.flora_gro = (room as any).nutrientSpeed;
              if (!upgradeLevels.flora_micro && (room as any).nutrientYield > 0) upgradeLevels.flora_micro = (room as any).nutrientYield;
              if (!upgradeLevels.flora_bloom && (room as any).nutrientDouble > 0) upgradeLevels.flora_bloom = (room as any).nutrientDouble;
              if (!upgradeLevels.auto_harvest && (room as any).autoHarvest) upgradeLevels.auto_harvest = 1;
              return {
                ...room,
                upgradeLevels,
                slots: room.slots.map((slot, i) => {
                  const defSlot = def.strainSlots[i];
                  if (!defSlot) return slot;
                  return {
                    ...slot,
                    growTimerTicks: defSlot.growTimerTicks,
                    ticksRemaining: Math.min(slot.ticksRemaining, defSlot.growTimerTicks),
                  };
                }),
              };
            }),
          };
        }

        // Migrate flat productInventory number → per-strain Record
        if (merged.operation && typeof (merged.operation.productInventory as unknown) !== 'object') {
          merged.operation = { ...merged.operation, productInventory: {} };
        }
        if (merged.operation && merged.operation.productInventory === null) {
          merged.operation = { ...merged.operation, productInventory: {} };
        }

        // Seed generatedBlocks for any unlocked districts if empty (handles old saves + fresh installs via migrate)
        if (!merged.generatedBlocks || Object.keys(merged.generatedBlocks).length === 0) {
          merged.generatedBlocks = {};
          merged.nextBlockCost = merged.nextBlockCost ?? 2000;
          for (const districtId of merged.unlockedDistricts) {
            const d = DISTRICT_MAP[districtId];
            if (d) {
              const neighbors = addNeighborBlocks(
                merged.generatedBlocks, merged.unlockedDistricts,
                merged.nextBlockCost, d.gridPosition.col, d.gridPosition.row,
              );
              Object.assign(merged.generatedBlocks, neighbors);
            }
          }
        }

        // Ensure operations + dealer districts are always unlocked
        if (!merged.unlockedDistricts.includes('operations')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'operations'];
        }
        if (!merged.unlockedDistricts.includes('dealer_network')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'dealer_network'];
        }

        // Backfill cleanToDirtyPerTick for old saves
        for (const biz of merged.businesses) {
          if (biz.cleanToDirtyPerTick === undefined) (biz as any).cleanToDirtyPerTick = 0;
        }

        // Preserve prestige across migrations
        if (!merged.prestigeCount) merged.prestigeCount = 0;
        if (!merged.prestigeBonus) merged.prestigeBonus = 0;

        // Bootstrap unlocked slots for existing saves
        if (!merged.unlockedSlots) {
          const slots: Record<string, number> = { starter: 2 };
          // Unlock slots based on businesses already placed
          for (const biz of merged.businesses) {
            const prev = slots[biz.districtId] ?? 2;
            const bizCount = merged.businesses.filter((b) => b.districtId === biz.districtId).length;
            slots[biz.districtId] = Math.max(prev, bizCount + 1);
          }
          merged.unlockedSlots = slots;
        }

        return merged;
        } catch {
          return { ...INITIAL_GAME_STATE };
        }
      },
    }
  )
);
