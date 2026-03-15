import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GeneratedBlock } from '../data/types';
import { INITIAL_GAME_STATE, GROW_ROOM_TYPE_MAP } from '../data/types';
import type { TechUpgradeId } from '../data/techDefs';
import { INITIAL_TECH_UPGRADES } from '../data/techDefs';
import type { SessionTechId } from '../data/sessionTechDefs';
import { INITIAL_SESSION_TECH } from '../data/sessionTechDefs';
import { getTechBonuses } from '../engine/tech';
import { getSessionTechBonuses } from '../engine/sessionTech';
import { resolveEventChoice as resolveChoice, getEventDef } from '../engine/events';
import { INITIAL_EVENT_STATE } from '../data/events/types';
import { getCarBonuses } from '../data/carDefs';
import { getCrewBonuses } from '../data/crewDefs';
import { GAME_SYSTEMS } from '../engine/systems/registry';
import type { TickState, TickContext } from '../engine/systems/types';
import { DISTRICTS, DISTRICT_MAP } from '../data/districts';
import { getSeasonFromTick } from '../data/seasons';
import { useUIStore } from './uiStore';

// ── Domain action creators ────────────────────────────────────────────
import { createOperationActions } from './actions/operation';
import { createDealerActions } from './actions/dealers';
import { createBusinessActions } from './actions/business';
import { createTerritoryActions } from './actions/territory';
import { createLegalActions } from './actions/legal';
import { createCombatActions } from './actions/combat';
import { createPrestigeActions } from './actions/prestige';
import { createLuxuryActions } from './actions/luxury';
import { createGameActions } from './actions/game';

// ── City block helpers (used by migration) ────────────────────────────

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

// ── GameActions interface ─────────────────────────────────────────────

interface GameActions {
  tick: () => void;
  resolveEvent: (choiceIndex: number) => { success: boolean; message: string } | null;
  dismissEvent: () => void;
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
  purchaseSessionTech: (upgradeId: SessionTechId) => boolean;
  resetGame: () => void;
  wipeGame: () => void;
  startNewGame: (rivalCount: number, entryDelayMinutes?: number) => void;
  continueGame: () => void;
  hireCrew: (defId: string) => boolean;
  fireCrew: (defId: string) => boolean;
  attackRival: (rivalId: string, actionType: string) => { success: boolean; message: string } | null;
  settleCasinoBet: (betAmount: number, grossPayout: number) => void;
  buyJewelry: (defId: string) => boolean;
  upgradeJewelry: (index: number) => boolean;
  buyCar: (defId: string) => boolean;
  startTutorial: () => void;
  advanceTutorial: () => void;
  skipTutorial: () => void;
}

type GameStore = GameState & GameActions;

// ── Store ─────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_GAME_STATE,

      // ── Core tick — delegates to modular system pipeline ──
      tick: () => {
        set((state) => {
          const tech = getTechBonuses(state.techUpgrades ?? INITIAL_TECH_UPGRADES);
          const sTech = getSessionTechBonuses(state.sessionTechUpgrades ?? INITIAL_SESSION_TECH);
          const carBonus = getCarBonuses(state.cars ?? []);
          const crewBonus = getCrewBonuses(state.crew ?? []);
          const effectiveTech = {
            ...tech,
            yieldBonus: tech.yieldBonus + sTech.yieldBonus + tech.floraMicroBonus + sTech.floraMicroBonus,
            speedBonus: tech.speedBonus + sTech.speedBonus + carBonus.growSpeed + tech.floraGroBonus + tech.waterBonus + tech.lightBonus + sTech.floraGroBonus + sTech.waterBonus + sTech.lightBonus,
            doubleChance: tech.doubleChance + tech.floraBloomBonus + sTech.floraBloomBonus,
            dealerMultiplier: tech.dealerMultiplier * sTech.dealerMultiplier * (1 + crewBonus.dealerBoost),
            launderMultiplier: tech.launderMultiplier * sTech.launderMultiplier * (1 + crewBonus.launderBoost),
            heatReduction: tech.heatReduction + sTech.heatReduction + crewBonus.heatReduction,
          };
          const { seasonDef } = getSeasonFromTick(state.tickCount + 1);
          const ctx: TickContext = {
            prevState: state,
            tech: effectiveTech,
            sessionTech: sTech,
            carBonuses: carBonus,
            gameSpeed: useUIStore.getState().gameSpeed,
            season: seasonDef,
          };

          const ts: TickState = {
            dirtyCash: state.dirtyCash,
            cleanCash: state.cleanCash,
            heat: state.heat,
            rivalHeat: state.rivalHeat ?? 0,
            operation: state.operation,
            activeLawyerId: state.activeLawyerId,
            currentJobId: state.currentJobId,
            jobFiredCooldown: Math.max(0, (state.jobFiredCooldown ?? 0) - 1),
            streetSellQuotaOz: state.streetSellQuotaOz ?? 160,
            rivals: state.rivals ?? [],
            rivalAttackLog: state.rivalAttackLog ?? [],
            unlockedDistricts: state.unlockedDistricts,
            eventSystem: state.eventSystem ?? INITIAL_EVENT_STATE,
            dirtyEarned: 0,
            maintenanceCost: 0,
            cleanProduced: 0,
            legitProfit: 0,
            jobIncome: 0,
            hitmanCost: 0,
            tickCount: state.tickCount + 1,
            heatNoticeShown: state.heatNoticeShown,
            totalDirtyEarned: state.totalDirtyEarned,
            totalCleanEarned: state.totalCleanEarned,
          };

          for (const system of GAME_SYSTEMS) {
            system(ts, ctx);
          }

          return {
            dirtyCash: ts.dirtyCash,
            cleanCash: ts.cleanCash,
            heat: ts.heat,
            rivalHeat: ts.rivalHeat,
            activeLawyerId: ts.activeLawyerId,
            operation: ts.operation,
            totalDirtyEarned: ts.totalDirtyEarned,
            totalCleanEarned: ts.totalCleanEarned,
            lastTickDirtyProfit: ts.dirtyEarned - ts.maintenanceCost - ts.hitmanCost,
            lastTickCleanProfit: ts.cleanProduced + ts.legitProfit + ts.jobIncome,
            tickCount: ts.tickCount,
            heatNoticeShown: ts.heatNoticeShown,
            streetSellQuotaOz: ts.streetSellQuotaOz,
            currentJobId: ts.currentJobId,
            jobFiredCooldown: ts.jobFiredCooldown,
            rivals: ts.rivals,
            rivalAttackLog: ts.rivalAttackLog,
            eventSystem: ts.eventSystem,
            ...(ts.unlockedDistricts !== state.unlockedDistricts ? { unlockedDistricts: ts.unlockedDistricts } : {}),
          };
        });
      },

      // ── Event actions (kept inline — small + use engine imports directly) ──
      resolveEvent: (choiceIndex) => {
        const state = get();
        const es = state.eventSystem ?? INITIAL_EVENT_STATE;
        if (!es.activeEvent) return null;
        const eventDef = getEventDef(es.activeEvent.eventId);
        if (!eventDef) { set({ eventSystem: { ...es, activeEvent: null, lastEventTick: state.tickCount } }); return null; }
        const { outcome, eventState, success } = resolveChoice(eventDef, choiceIndex, es, state.tickCount);
        const updates: Partial<GameState> = { eventSystem: eventState };
        if (outcome.dirtyCashDelta) updates.dirtyCash = Math.max(0, state.dirtyCash + outcome.dirtyCashDelta);
        if (outcome.cleanCashDelta) updates.cleanCash = Math.max(0, state.cleanCash + outcome.cleanCashDelta);
        if (outcome.heatDelta) updates.heat = Math.max(0, Math.min(1000, state.heat + outcome.heatDelta));
        if (outcome.rivalHeatDelta) updates.rivalHeat = Math.max(0, Math.min(1000, (state.rivalHeat ?? 0) + outcome.rivalHeatDelta));
        if (outcome.seedDelta) {
          updates.operation = { ...state.operation, seedStock: Math.max(0, state.operation.seedStock + outcome.seedDelta) };
        }
        if (outcome.dealerCountDelta) {
          const op = updates.operation ?? state.operation;
          updates.operation = { ...op, dealerCount: Math.max(0, op.dealerCount + outcome.dealerCountDelta) };
        }
        set(updates);
        return { success, message: success ? eventDef.choices[choiceIndex].description : (eventDef.choices[choiceIndex].description + ' (failed)') };
      },

      dismissEvent: () => {
        const state = get();
        const es = state.eventSystem ?? INITIAL_EVENT_STATE;
        set({ eventSystem: { ...es, activeEvent: null, lastEventTick: state.tickCount } });
      },

      // ── Domain actions (modular — each domain in its own file) ──
      ...createOperationActions(set, get),
      ...createDealerActions(set, get),
      ...createBusinessActions(set, get),
      ...createTerritoryActions(set, get),
      ...createLegalActions(set, get),
      ...createCombatActions(set, get),
      ...createPrestigeActions(set, get),
      ...createLuxuryActions(set, get),
      ...createGameActions(set, get),
    }),
    {
      name: 'myempire-save',
      version: 27,
      migrate: (persisted: unknown, _version: number) => {
        try {
        const saved = (persisted ?? {}) as Partial<GameState>;
        const merged = { ...INITIAL_GAME_STATE, ...saved } as GameState;

        // Re-sync operation constants and slot grow timers from canonical defs
        if (merged.operation) {
          merged.operation = {
            ...merged.operation,
            seedCostPerUnit: INITIAL_GAME_STATE.operation.seedCostPerUnit,
            growRooms: merged.operation.growRooms.map((room) => {
              const def = GROW_ROOM_TYPE_MAP[room.typeId];
              if (!def) return room;
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

        if (merged.operation && typeof (merged.operation.productInventory as unknown) !== 'object') {
          merged.operation = { ...merged.operation, productInventory: {} };
        }
        if (merged.operation && merged.operation.productInventory === null) {
          merged.operation = { ...merged.operation, productInventory: {} };
        }

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

        if (!merged.unlockedDistricts.includes('operations')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'operations'];
        }
        if (!merged.unlockedDistricts.includes('dealer_network')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'dealer_network'];
        }
        if (!merged.unlockedDistricts.includes('job_district')) {
          merged.unlockedDistricts = [...merged.unlockedDistricts, 'job_district'];
        }
        for (const shopId of ['casino_district', 'jewelry_district', 'car_district']) {
          if (!merged.unlockedDistricts.includes(shopId)) {
            merged.unlockedDistricts = [...merged.unlockedDistricts, shopId];
          }
        }

        if (merged.currentJobId === undefined) merged.currentJobId = null;
        if (merged.jobFiredCooldown === undefined) merged.jobFiredCooldown = 0;
        if (merged.activeLawyerId === undefined) (merged as any).activeLawyerId = null;

        for (const biz of merged.businesses) {
          if (biz.cleanToDirtyPerTick === undefined) (biz as any).cleanToDirtyPerTick = 0;
        }

        if (!merged.prestigeCount) merged.prestigeCount = 0;
        if (!merged.prestigeBonus) merged.prestigeBonus = 0;

        if (!merged.techUpgrades) merged.techUpgrades = { ...INITIAL_TECH_UPGRADES };
        if (merged.techPoints === undefined) merged.techPoints = 0;
        if (merged.totalTechPointsEarned === undefined) merged.totalTechPointsEarned = 0;
        if (_version < 21 && merged.prestigeBonus > 0) {
          const yieldLevels = Math.min(5, Math.round(merged.prestigeBonus / 0.05));
          merged.techUpgrades = { ...merged.techUpgrades, tech_yield: yieldLevels };
          merged.prestigeBonus = 0;
        }

        if (_version < 18 && merged.heat > 0 && merged.heat <= 100) {
          merged.heat = merged.heat * 10;
        }

        if (merged.rivalHeat === undefined) merged.rivalHeat = 0;

        if (!merged.gameSettings) merged.gameSettings = { rivalCount: 3, rivalEntryDelay: 2, gameStarted: (merged.tickCount ?? 0) > 0, tutorialActive: false, tutorialStep: 0 };
        if (merged.gameSettings.tutorialActive === undefined) { merged.gameSettings.tutorialActive = false; merged.gameSettings.tutorialStep = 0; }
        if (merged.gameSettings.rivalEntryDelay === undefined) merged.gameSettings.rivalEntryDelay = 2;
        if (!merged.rivals) merged.rivals = [];
        // Backfill weakness for existing rivals
        merged.rivals = merged.rivals.map((r: any) => ({ ...r, weakness: r.weakness ?? 0 }));
        // Migrate hitmen → crew (v28)
        if (!merged.crew || merged.crew.length === 0) {
          const oldHitmen = (merged as any).hitmen ?? [];
          if (oldHitmen.length > 0) {
            merged.crew = oldHitmen.map((h: any) => ({
              defId: h.defId === 'thug' ? 'soldier' : h.defId === 'enforcer' ? 'lieutenant' : h.defId === 'assassin' ? 'captain' : h.defId === 'spec_ops' ? 'consigliere' : h.defId,
              count: h.count,
            }));
          } else {
            merged.crew = [];
          }
        }
        if (!merged.rivalAttackLog) merged.rivalAttackLog = [];

        if (!merged.casinoHistory) merged.casinoHistory = { totalGambled: 0, totalWon: 0, totalLost: 0, gamesPlayed: 0 };
        if (!merged.jewelry) merged.jewelry = [];
        if (!merged.cars) merged.cars = [];

        if (!merged.unlockedSlots) {
          const slots: Record<string, number> = { starter: 0 };
          for (const biz of merged.businesses) {
            const prev = slots[biz.districtId] ?? 0;
            const bizCount = merged.businesses.filter((b) => b.districtId === biz.districtId).length;
            slots[biz.districtId] = Math.max(prev, bizCount + 1);
          }
          merged.unlockedSlots = slots;
        }

        if (!merged.lotBuildTimers) merged.lotBuildTimers = {};

        // v27: Ensure unlockedSlots covers all existing businesses (no more free lots)
        if (merged.unlockedSlots && merged.businesses) {
          for (const biz of merged.businesses) {
            const current = merged.unlockedSlots[biz.districtId] ?? 0;
            if (biz.slotIndex >= current) {
              merged.unlockedSlots[biz.districtId] = biz.slotIndex + 1;
            }
          }
        }

        return merged;
        } catch {
          return { ...INITIAL_GAME_STATE };
        }
      },
    }
  )
);
