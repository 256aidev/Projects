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
  const totalEarned = (gs.totalDirtyEarned ?? 0) + (gs.totalCleanEarned ?? 0);
  const baseScore = totalEarned + (gs.prestigeCount ?? 0) * 500_000;

  // Apply difficulty multiplier based on game settings
  const settings = gs.gameSettings;
  const diffMultiplier = settings
    ? getDifficultyMultiplier(settings.rivalCount, settings.rivalEntryDelay)
    : 1;
  const score = Math.floor(baseScore * diffMultiplier);

  const ref = doc(db, 'leaderboard', uid);
  await setDoc(ref, {
    displayName: displayName || 'Anonymous',
    score,
    totalDirtyEarned: gs.totalDirtyEarned ?? 0,
    totalCleanEarned: gs.totalCleanEarned ?? 0,
    prestigeCount: gs.prestigeCount ?? 0,
    businessCount: Array.isArray(gs.businesses) ? gs.businesses.length : 0,
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
