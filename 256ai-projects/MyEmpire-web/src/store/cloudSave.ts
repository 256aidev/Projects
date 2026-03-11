import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState } from '../data/types';
import { INITIAL_GAME_STATE } from '../data/types';

const SAVE_VERSION = 4;

const ACTION_KEYS = new Set([
  'tick', 'harvestGrowRoom', 'buyGrowRoom', 'upgradeRoom', 'hireDealers', 'upgradeDealerTier',
  'buySeed', 'plantSeeds', 'sellProduct', 'purchaseBusiness', 'sellBusiness', 'upgradeBusiness',
  'setLaunderRate', 'purchaseResource', 'unlockDistrict', 'resetGame',
]);

// Strip Zustand action functions before saving
function serializeState(state: Record<string, unknown>): GameState {
  const gameData: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    if (!ACTION_KEYS.has(key)) gameData[key] = state[key];
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

export async function loadCloudSave(uid: string): Promise<GameState | null> {
  const ref = doc(db, 'saves', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const savedState = data.state as Partial<GameState>;

  // Merge with INITIAL_GAME_STATE to fill in any new fields added since the save
  return { ...INITIAL_GAME_STATE, ...savedState } as GameState;
}
