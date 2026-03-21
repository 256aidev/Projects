import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_TUNING, type GameTuning } from '../data/tuning';

interface TuningState {
  tuning: GameTuning;
  saving: boolean;
  error: string | null;
  /** Try to sync with Firestore (best-effort) */
  subscribe: () => () => void;
  /** Update a single tuning value */
  set: (key: keyof GameTuning, value: number) => void;
  /** Reset all tuning to defaults */
  resetAll: () => void;
}

export const useTuningStore = create<TuningState>()(
  persist(
    (set, get) => ({
      tuning: { ...DEFAULT_TUNING },
      saving: false,
      error: null,

      subscribe: () => {
        // Try Firestore sync — best effort, falls back to localStorage
        let unsub = () => {};
        (async () => {
          try {
            const { doc, onSnapshot, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            const tuningDoc = doc(db, 'gameConfig', 'tuning');
            unsub = onSnapshot(
              tuningDoc,
              (snap) => {
                if (snap.exists()) {
                  const data = snap.data() as Partial<GameTuning>;
                  set({ tuning: { ...DEFAULT_TUNING, ...data }, error: null });
                }
              },
              (err) => {
                console.warn('[Tuning] Firestore sync unavailable:', err.message);
                set({ error: `Firestore: ${err.message}` });
              },
            );
          } catch (err: any) {
            console.warn('[Tuning] Firestore not available:', err.message);
            set({ error: `Firestore: ${err.message}` });
          }
        })();
        return () => unsub();
      },

      set: (key, value) => {
        const updated = { ...get().tuning, [key]: value };
        set({ tuning: updated });
        // Fire-and-forget Firestore save
        (async () => {
          try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await setDoc(doc(db, 'gameConfig', 'tuning'), updated, { merge: true });
          } catch {}
        })();
      },

      resetAll: () => {
        set({ tuning: { ...DEFAULT_TUNING } });
        (async () => {
          try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await setDoc(doc(db, 'gameConfig', 'tuning'), { ...DEFAULT_TUNING });
          } catch {}
        })();
      },
    }),
    {
      name: 'myempire-tuning',
      // Only persist the tuning object
      partialize: (state) => ({ tuning: state.tuning }),
    },
  ),
);

/** Shortcut to get a tuning value — use in game systems */
export function getTuning(): GameTuning {
  return useTuningStore.getState().tuning;
}
