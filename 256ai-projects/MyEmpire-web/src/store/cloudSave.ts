import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState } from '../data/types';
import { INITIAL_GAME_STATE } from '../data/types';
import { getDifficultyMultiplier } from '../engine/difficulty';

const SAVE_VERSION = 4;

// Strip Zustand action functions before saving — filters by typeof instead of hardcoded list
function serializeState(state: Record<string, unknown>): GameState {
  const gameData: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    if (typeof state[key] !== 'function') gameData[key] = state[key];
  }
  return gameData as unknown as GameState;
}

export async function saveToCloud(uid: string, state: Record<string, unknown>): Promise<void> {
  const ref = doc(db, 'saves', uid);
  await setDoc(ref, {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: serializeState(state),
  });
}

export async function updateLeaderboardEntry(
  uid: string,
  displayName: string,
  state: Record<string, unknown>,
): Promise<void> {
  const gs = state as unknown as GameState;

  // Category point calculations — balanced so no single category dominates
  // Money: dirty worth 2x clean (harder to earn), logarithmic scaling for big earners
  const dirtyEarned = gs.totalDirtyEarned ?? 0;
  const cleanEarned = gs.totalCleanEarned ?? 0;
  const moneyPts = Math.floor(dirtyEarned / 500) + Math.floor(cleanEarned / 1000);

  // Territory: businesses, districts, lots owned
  const bizCount = Array.isArray(gs.businesses) ? gs.businesses.length : 0;
  const districtCount = Array.isArray(gs.unlockedDistricts) ? gs.unlockedDistricts.length : 0;
  const lotCount = gs.unlockedSlots ? Object.values(gs.unlockedSlots).reduce((s, v) => s + (v as number), 0) : 0;
  const territoryPts = bizCount * 2000 + districtCount * 1000 + lotCount * 500;

  // Criminal: grow rooms, dealers, dealer tier (flattened — no single item worth too much)
  const rooms = gs.operation?.growRooms?.length ?? 0;
  const dealers = gs.operation?.dealerCount ?? 0;
  const tierIndex = gs.operation?.dealerTierIndex ?? 0;
  const criminalPts = rooms * 3000 + dealers * 500 + tierIndex * 5000;

  // Combat: rivals defeated, crew members (nerfed from old values)
  const defeated = Array.isArray(gs.rivals) ? gs.rivals.filter((r: { isDefeated?: boolean }) => r.isDefeated).length : 0;
  const hitmenCount = Array.isArray(gs.crew) ? gs.crew.reduce((s: number, h: { count: number }) => s + h.count, 0) : 0;
  const combatPts = defeated * 10000 + hitmenCount * 2000;

  // Prestige: heavily nerfed — still valuable but doesn't dominate
  const prestigePts = (gs.prestigeCount ?? 0) * 25000 + (gs.totalTechPointsEarned ?? 0) * 5000;

  // Collection: cars + jewelry (cosmetic, modest points)
  const carCount = Array.isArray(gs.cars) ? gs.cars.length : 0;
  const jewelryCount = Array.isArray(gs.jewelry) ? gs.jewelry.length : 0;
  const collectionPts = carCount * 5000 + jewelryCount * 3000;

  const baseScore = moneyPts + territoryPts + criminalPts + combatPts + prestigePts + collectionPts;
  const settings = gs.gameSettings;
  const diffMultiplier = settings
    ? getDifficultyMultiplier(settings.rivalCount, settings.rivalEntryDelay)
    : 1;
  const score = Math.floor(baseScore * diffMultiplier);

  const ref = doc(db, 'leaderboard', uid);
  await setDoc(ref, {
    displayName: displayName || 'Anonymous',
    score,
    moneyPts,
    territoryPts,
    criminalPts,
    combatPts,
    prestigePts,
    collectionPts,
    totalDirtyEarned: gs.totalDirtyEarned ?? 0,
    totalCleanEarned: gs.totalCleanEarned ?? 0,
    prestigeCount: gs.prestigeCount ?? 0,
    businessCount: bizCount,
    rivalsDefeated: defeated,
    carCount,
    jewelryCount,
    tickCount: gs.tickCount ?? 0,
    difficultyMultiplier: diffMultiplier,
    rivalCount: settings?.rivalCount ?? 0,
    rivalEntryDelay: settings?.rivalEntryDelay ?? 0,
    updatedAt: Date.now(),
  });
}

export async function loadCloudSave(uid: string): Promise<GameState | null> {
  const ref = doc(db, 'saves', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const savedState = data.state as Partial<GameState>;

  // Merge with INITIAL_GAME_STATE to fill in any new fields added since the save
  const merged = { ...INITIAL_GAME_STATE, ...savedState } as GameState;
  // Migrate flat productInventory number → per-strain Record
  if (merged.operation && typeof (merged.operation.productInventory as unknown) !== 'object') {
    merged.operation = { ...merged.operation, productInventory: {} };
  }
  return merged;
}
