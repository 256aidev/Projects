import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_TUNING, type GameTuning } from '../data/tuning';

interface TuningState {
  tuning: GameTuning;
  loaded: boolean;
  saving: boolean;
  /** Start listening to Firestore for live updates */
  subscribe: () => () => void;
  /** Update a single tuning value (writes to Firestore immediately) */
  set: (key: keyof GameTuning, value: number) => Promise<void>;
  /** Reset all tuning to defaults */
  resetAll: () => Promise<void>;
}

const TUNING_DOC = doc(db, 'gameConfig', 'tuning');

export const useTuningStore = create<TuningState>((set, get) => ({
  tuning: { ...DEFAULT_TUNING },
  loaded: false,
  saving: false,

  subscribe: () => {
    const unsub = onSnapshot(TUNING_DOC, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<GameTuning>;
        set({ tuning: { ...DEFAULT_TUNING, ...data }, loaded: true });
      } else {
        set({ tuning: { ...DEFAULT_TUNING }, loaded: true });
      }
    });
    return unsub;
  },

  set: async (key, value) => {
    const current = get().tuning;
    const updated = { ...current, [key]: value };
    set({ tuning: updated, saving: true });
    try {
      await setDoc(TUNING_DOC, updated, { merge: true });
    } finally {
      set({ saving: false });
    }
  },

  resetAll: async () => {
    set({ tuning: { ...DEFAULT_TUNING }, saving: true });
    try {
      await setDoc(TUNING_DOC, { ...DEFAULT_TUNING });
    } finally {
      set({ saving: false });
    }
  },
}));

/** Shortcut to get a tuning value — use in game systems */
export function getTuning(): GameTuning {
  return useTuningStore.getState().tuning;
}
