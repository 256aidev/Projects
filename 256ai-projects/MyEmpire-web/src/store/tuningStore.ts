import { create } from 'zustand';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_TUNING, type GameTuning } from '../data/tuning';

interface TuningState {
  tuning: GameTuning;
  loaded: boolean;
  saving: boolean;
  error: string | null;
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
  loaded: true,  // start as loaded with defaults — Firestore is optional overlay
  saving: false,
  error: null,

  subscribe: () => {
    try {
      const unsub = onSnapshot(
        TUNING_DOC,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<GameTuning>;
            set({ tuning: { ...DEFAULT_TUNING, ...data }, loaded: true, error: null });
          } else {
            set({ tuning: { ...DEFAULT_TUNING }, loaded: true, error: null });
          }
        },
        (err) => {
          console.warn('[Tuning] Firestore listen failed, using defaults:', err.message);
          set({ loaded: true, error: err.message });
        },
      );
      return unsub;
    } catch (err) {
      console.warn('[Tuning] Subscribe failed:', err);
      set({ loaded: true, error: String(err) });
      return () => {};
    }
  },

  set: async (key, value) => {
    const current = get().tuning;
    const updated = { ...current, [key]: value };
    set({ tuning: updated, saving: true });
    try {
      await setDoc(TUNING_DOC, updated, { merge: true });
      set({ saving: false, error: null });
    } catch (err: any) {
      console.error('[Tuning] Save failed:', err);
      set({ saving: false, error: err.message ?? String(err) });
    }
  },

  resetAll: async () => {
    set({ tuning: { ...DEFAULT_TUNING }, saving: true });
    try {
      await setDoc(TUNING_DOC, { ...DEFAULT_TUNING });
      set({ saving: false, error: null });
    } catch (err: any) {
      console.error('[Tuning] Reset failed:', err);
      set({ saving: false, error: err.message ?? String(err) });
    }
  },
}));

/** Shortcut to get a tuning value — use in game systems */
export function getTuning(): GameTuning {
  return useTuningStore.getState().tuning;
}
