import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BusinessInstance, GameState, GeneratedBlock, RivalActionType } from '../data/types';
import { INITIAL_GAME_STATE, GROW_ROOM_TYPE_MAP, DEALER_TIERS, ROOM_UPGRADE_MAP, PRESTIGE_THRESHOLD, getStrainUnlockCost, getDealerHireCost, JOB_MAP, JOB_DEFS, HITMAN_MAP, RIVAL_ACTIONS } from '../data/types';
import type { TechUpgradeId } from '../data/techDefs';
import { TECH_UPGRADE_MAP, INITIAL_TECH_UPGRADES, calculatePrestigeTP } from '../data/techDefs';
import { getTechBonuses } from '../engine/tech';
import { generateRivals } from '../data/rivals';
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
import { LAWYER_MAP } from '../data/lawyers';
import {
  tickCriminalOperation,
  harvestSlot,
  calculateBusinessRevenue,
  calculateBusinessExpenses,
  calculateLaunderTick,
  calculateDispensaryTick,
  getMaxStreetDemand,
  getStreetRefillRate,
  getStreetSellHeat,
} from '../engine/economy';
import { calculateHeatTick, calculateRivalHeatTick, getHeatTier, HEAT_MAX } from '../engine/heat';
import { tickRivals, getPlayerDefense, getHitmanUpkeep, RIVAL_TICK_INTERVAL } from '../engine/rivals';

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
  applyForJob: (jobId: string) => boolean;
  quitJob: () => void;
  hireLawyer: (lawyerId: string) => boolean;
  fireLawyer: () => void;
  prestige: () => boolean;
  purchaseTechUpgrade: (upgradeId: TechUpgradeId) => boolean;
  resetGame: () => void;
  // Rivals & hitmen
  startNewGame: (rivalCount: number) => void;
  continueGame: () => void;
  hireHitman: (defId: string) => boolean;
  fireHitman: (defId: string) => boolean;
  attackRival: (rivalId: string, actionType: string) => { success: boolean; message: string } | null;
  // Casino, Jewelry, Cars
  settleCasinoBet: (betAmount: number, grossPayout: number) => void;
  buyJewelry: (defId: string) => boolean;
  upgradeJewelry: (index: number) => boolean;
  buyCar: (defId: string) => boolean;
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

          const tech = getTechBonuses(state.techUpgrades ?? INITIAL_TECH_UPGRADES);
          const { newOp, dirtyEarned, maintenanceCost } = tickCriminalOperation(state.operation, tech);
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
              const { dirtyConsumed, cleanProduced } = calculateLaunderTick(biz, dirtyCash - totalDirtyConsumed, tech.launderMultiplier);
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

          // Street sell quota: dynamic max based on job + businesses
          const currentJobDef = state.currentJobId ? JOB_MAP[state.currentJobId] ?? null : null;
          const maxDemand = getMaxStreetDemand(currentJobDef, state.businesses);
          const refillRate = getStreetRefillRate(maxDemand);
          const streetSellQuotaOz = Math.min(maxDemand, (state.streetSellQuotaOz ?? maxDemand) + refillRate);

          // Lawyer retainer (deducted from clean cash each tick)
          let activeLawyerId = state.activeLawyerId;
          if (activeLawyerId) {
            const lawyer = LAWYER_MAP[activeLawyerId];
            if (lawyer) {
              if (cleanCash >= lawyer.monthlyRetainer) {
                cleanCash -= lawyer.monthlyRetainer;
              } else {
                activeLawyerId = null; // can't afford — auto-fired
              }
            }
          }

          // Heat calculation
          const heatDelta = calculateHeatTick(
            state.heat, dirtyCash,
            state.operation.dealerCount, state.operation.dealerTierIndex,
            state.businesses, activeLawyerId, tech.heatReduction,
          );
          const newHeat = Math.max(0, Math.min(HEAT_MAX, state.heat + heatDelta));

          // Rival heat calculation
          const rivalHeatDelta = calculateRivalHeatTick(
            state.rivalHeat ?? 0,
            state.operation.dealerCount, state.operation.dealerTierIndex,
            state.businesses,
          );
          const newRivalHeat = Math.max(0, Math.min(HEAT_MAX, (state.rivalHeat ?? 0) + rivalHeatDelta));

          // Job income (clean cash) + heat-based firing
          let jobIncome = 0;
          let currentJobId = state.currentJobId;
          let jobFiredCooldown = Math.max(0, (state.jobFiredCooldown ?? 0) - 1);
          if (currentJobId) {
            const jobDef = JOB_MAP[currentJobId];
            if (jobDef && newHeat > jobDef.maxHeat) {
              // FIRED — heat too high
              currentJobId = null;
              jobFiredCooldown = 60; // 1 minute cooldown
            } else if (jobDef) {
              jobIncome = jobDef.cleanPerTick;
            }
          }
          cleanCash += jobIncome;

          // Hitman upkeep (dirty cash per tick)
          const hitmanCost = getHitmanUpkeep(state.hitmen ?? []);
          dirtyCash = Math.max(0, dirtyCash - hitmanCost);

          // Rival AI tick (runs every RIVAL_TICK_INTERVAL ticks)
          let rivals = state.rivals ?? [];
          let rivalAttackLog = state.rivalAttackLog ?? [];
          let unlockedDistrictsUpdated: string[] | null = null;
          const newTickCount = state.tickCount + 1;
          if (rivals.length > 0 && newTickCount % RIVAL_TICK_INTERVAL === 0) {
            const totalProductOz = Object.values(finalOp.productInventory).reduce((s, e) => s + e.oz, 0);
            const result = tickRivals(
              rivals, newRivalHeat, dirtyCash, totalProductOz,
              state.businesses, getPlayerDefense(state.hitmen ?? []),
              newTickCount, state.unlockedSlots,
            );
            rivals = result.rivals;
            dirtyCash = Math.max(0, dirtyCash - result.playerDirtyCashLost);
            cleanCash = Math.max(0, cleanCash - result.playerCleanCashLost);
            if (result.attackMessages.length > 0) {
              rivalAttackLog = [...rivalAttackLog, ...result.attackMessages].slice(-10);
            }
            // TODO: handle businessesDamaged and productLost

            // Rival district reveal — if a rival has a business in a district
            // the player hasn't unlocked, auto-reveal it (free unlock)
            const revealedDistricts = new Set(state.unlockedDistricts);
            for (const rival of rivals) {
              if (rival.isDefeated) continue;
              for (const rb of rival.businesses) {
                if (!revealedDistricts.has(rb.districtId) && !rb.districtId.startsWith('gen_')) {
                  revealedDistricts.add(rb.districtId);
                }
              }
            }
            if (revealedDistricts.size > state.unlockedDistricts.length) {
              unlockedDistrictsUpdated = [...revealedDistricts];
            }
          }

          return {
            dirtyCash,
            cleanCash,
            heat: newHeat,
            rivalHeat: newRivalHeat,
            activeLawyerId,
            operation: finalOp,
            totalDirtyEarned: totalEarned,
            totalCleanEarned: state.totalCleanEarned + Math.max(0, totalCleanProduced + legitProfit + jobIncome),
            lastTickDirtyProfit: dirtyEarned - maintenanceCost - hitmanCost,
            lastTickCleanProfit: totalCleanProduced + legitProfit + jobIncome,
            tickCount: newTickCount,
            heatNoticeShown: state.heatNoticeShown || shouldShowNotice,
            streetSellQuotaOz,
            currentJobId,
            jobFiredCooldown,
            rivals,
            rivalAttackLog,
            ...(unlockedDistrictsUpdated ? { unlockedDistricts: unlockedDistrictsUpdated } : {}),
          };
        });
      },

      harvestGrowRoom: (roomId, slotIndex) => {
        const state = get();
        const tech = getTechBonuses(state.techUpgrades ?? INITIAL_TECH_UPGRADES);
        const { newOp, unitsHarvested, cycleCost, speedBonus } = harvestSlot(state.operation, roomId, slotIndex, tech);
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
        return dirtyEarned;
      },

      buyGrowRoom: (typeId) => {
        const state = get();
        const def = GROW_ROOM_TYPE_MAP[typeId];
        if (!def) return false;
        const useClean = def.purchaseCurrency === 'clean';
        const wallet = useClean ? state.cleanCash : state.dirtyCash;
        if (wallet < def.purchaseCost) return false;
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
          ...(useClean
            ? { cleanCash: state.cleanCash - def.purchaseCost }
            : { dirtyCash: state.dirtyCash - def.purchaseCost }),
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
          heat: Math.min(HEAT_MAX, state.heat + count * 2),
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
        if (!def.isRental && !isGenBlock && !def.allowedDistrictIds.includes(districtId)) return false;
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

      unlockLot: (districtId) => {
        const state = get();
        const district = DISTRICT_MAP[districtId];
        const isGenBlock = !district && districtId.startsWith('gen_') && state.unlockedDistricts.includes(districtId);
        if (!district && !isGenBlock) return false;
        const maxSlots = district?.maxBusinessSlots ?? 6;
        const currentUnlocked = state.unlockedSlots?.[districtId] ?? 2;
        if (currentUnlocked >= maxSlots) return false;
        // Linear lot pricing: baseCost × lotNumber (lot 3 = base×1, lot 4 = base×2, ...)
        const baseCost = district?.lotBaseCost ?? 1000;
        const cost = baseCost * (currentUnlocked - 1);
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

      applyForJob: (jobId) => {
        const state = get();
        const jobDef = JOB_MAP[jobId];
        if (!jobDef) return false;
        if ((state.jobFiredCooldown ?? 0) > 0) return false;
        if (state.heat > jobDef.maxHeat) return false;
        if (state.dirtyCash < jobDef.bribeCost) return false;
        const jobIndex = JOB_DEFS.findIndex(j => j.id === jobId);
        const heatBump = 5 + (jobIndex >= 0 ? jobIndex : 0) * 5;
        set({
          dirtyCash: state.dirtyCash - jobDef.bribeCost,
          totalSpent: state.totalSpent + jobDef.bribeCost,
          currentJobId: jobId,
          heat: Math.min(HEAT_MAX, state.heat + heatBump),
        });
        return true;
      },

      quitJob: () => {
        set({ currentJobId: null });
      },

      hireLawyer: (lawyerId) => {
        const state = get();
        const lawyer = LAWYER_MAP[lawyerId];
        if (!lawyer) return false;
        if (state.cleanCash < lawyer.unlockCost) return false;
        if (getHeatTier(state.heat) < lawyer.requiredHeatTier) return false;
        set({
          cleanCash: state.cleanCash - lawyer.unlockCost,
          totalSpent: state.totalSpent + lawyer.unlockCost,
          activeLawyerId: lawyerId,
        });
        return true;
      },

      fireLawyer: () => {
        set({ activeLawyerId: null });
      },

      prestige: () => {
        const state = get();
        if (state.totalDirtyEarned < PRESTIGE_THRESHOLD) return false;
        const { total: earnedTP } = calculatePrestigeTP(state);
        const newCount = (state.prestigeCount ?? 0) + 1;
        set({
          ...INITIAL_GAME_STATE,
          prestigeCount: newCount,
          prestigeBonus: 0,
          techPoints: (state.techPoints ?? 0) + earnedTP,
          totalTechPointsEarned: (state.totalTechPointsEarned ?? 0) + earnedTP,
          techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
          gameSettings: { ...state.gameSettings },
          rivals: generateRivals(state.gameSettings.rivalCount),
          hitmen: [],
          rivalAttackLog: [],
        });
        return true;
      },

      purchaseTechUpgrade: (upgradeId: TechUpgradeId) => {
        const state = get();
        const def = TECH_UPGRADE_MAP[upgradeId];
        if (!def) return false;
        const currentLevel = (state.techUpgrades ?? INITIAL_TECH_UPGRADES)[upgradeId] ?? 0;
        if (currentLevel >= def.maxLevel) return false;
        const cost = def.costs[currentLevel];
        if ((state.techPoints ?? 0) < cost) return false;
        set({
          techPoints: (state.techPoints ?? 0) - cost,
          techUpgrades: {
            ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES),
            [upgradeId]: currentLevel + 1,
          },
        });
        return true;
      },

      resetGame: () => {
        const state = get();
        set({
          ...INITIAL_GAME_STATE,
          prestigeCount: state.prestigeCount ?? 0,
          prestigeBonus: 0,
          techPoints: state.techPoints ?? 0,
          totalTechPointsEarned: state.totalTechPointsEarned ?? 0,
          techUpgrades: { ...(state.techUpgrades ?? INITIAL_TECH_UPGRADES) },
        });
      },

      startNewGame: (rivalCount) => {
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
          gameSettings: { rivalCount, gameStarted: true },
          rivals: generateRivals(rivalCount),
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

      hireHitman: (defId) => {
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

      fireHitman: (defId) => {
        const state = get();
        const existing = state.hitmen.find(h => h.defId === defId);
        if (!existing || existing.count <= 0) return false;
        const newHitmen = existing.count <= 1
          ? state.hitmen.filter(h => h.defId !== defId)
          : state.hitmen.map(h => h.defId === defId ? { ...h, count: h.count - 1 } : h);
        set({ hitmen: newHitmen });
        return true;
      },

      attackRival: (rivalId, actionType) => {
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

      // ─── CASINO ────────────────────────────────────────────────
      settleCasinoBet: (betAmount, grossPayout) => {
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
      buyJewelry: (defId) => {
        const state = get();
        const { JEWELRY_DEF_MAP, JEWELRY_SLOT_LIMITS } = require('../data/jewelryDefs');
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

      upgradeJewelry: (index) => {
        const state = get();
        const jewelry = [...(state.jewelry ?? [])];
        const piece = jewelry[index];
        if (!piece || piece.tier >= 4) return false;
        const { JEWELRY_DEF_MAP } = require('../data/jewelryDefs');
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
      buyCar: (defId) => {
        const state = get();
        const { CAR_DEF_MAP } = require('../data/carDefs');
        const def = CAR_DEF_MAP[defId];
        if (!def || state.cleanCash < def.cost) return false;
        // Check not already owned
        if ((state.cars ?? []).some((c: { defId: string }) => c.defId === defId)) return false;
        set({
          cleanCash: state.cleanCash - def.cost,
          totalSpent: state.totalSpent + def.cost,
          cars: [...(state.cars ?? []), { defId, purchasedAtTick: state.tickCount }],
        });
        return true;
      },
    }),
    {
      name: 'myempire-save',
      version: 22,
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
                    plantsCapacity: defSlot.plantsCapacity,
                    harvestYield: defSlot.harvestYield,
                    pricePerUnit: defSlot.pricePerUnit,
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
        if (!merged.unlockedDistricts.includes('job_district')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'job_district'];
        }

        // Backfill job fields for old saves
        if (merged.currentJobId === undefined) merged.currentJobId = null;
        if (merged.jobFiredCooldown === undefined) merged.jobFiredCooldown = 0;

        // Backfill lawyer/heat fields for old saves
        if (merged.activeLawyerId === undefined) (merged as any).activeLawyerId = null;

        // Backfill cleanToDirtyPerTick for old saves
        for (const biz of merged.businesses) {
          if (biz.cleanToDirtyPerTick === undefined) (biz as any).cleanToDirtyPerTick = 0;
        }

        // Preserve prestige across migrations
        if (!merged.prestigeCount) merged.prestigeCount = 0;
        if (!merged.prestigeBonus) merged.prestigeBonus = 0;

        // Tech Points system (v21) — migrate old prestigeBonus into tech_yield levels
        if (!merged.techUpgrades) merged.techUpgrades = { ...INITIAL_TECH_UPGRADES };
        if (merged.techPoints === undefined) merged.techPoints = 0;
        if (merged.totalTechPointsEarned === undefined) merged.totalTechPointsEarned = 0;
        if (_version < 21 && merged.prestigeBonus > 0) {
          // Convert old flat prestigeBonus into tech_yield levels (1 level per 0.05, max 5)
          const yieldLevels = Math.min(5, Math.round(merged.prestigeBonus / 0.05));
          merged.techUpgrades = { ...merged.techUpgrades, tech_yield: yieldLevels };
          merged.prestigeBonus = 0;
        }

        // Heat scale migration: 0-100 → 0-1000 (v18)
        if (_version < 18 && merged.heat > 0 && merged.heat <= 100) {
          merged.heat = merged.heat * 10;
        }

        // Rival heat (v19)
        if (merged.rivalHeat === undefined) merged.rivalHeat = 0;

        // Rivals & hitmen (v20) — existing saves with progress should auto-continue
        if (!merged.gameSettings) merged.gameSettings = { rivalCount: 3, gameStarted: (merged.tickCount ?? 0) > 0 };
        if (!merged.rivals) merged.rivals = [];
        if (!merged.hitmen) merged.hitmen = [];
        if (!merged.rivalAttackLog) merged.rivalAttackLog = [];

        // Casino, Jewelry, Cars (v22)
        if (!merged.casinoHistory) merged.casinoHistory = { totalGambled: 0, totalWon: 0, totalLost: 0, gamesPlayed: 0 };
        if (!merged.jewelry) merged.jewelry = [];
        if (!merged.cars) merged.cars = [];

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
