import { create } from 'zustand';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';
import { loadCloudSave, saveToCloud, updateLeaderboardEntry } from './cloudSave';
import { useGameStore } from './gameStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  syncToCloud: () => Promise<void>;
}

function getGameSnapshot(): Record<string, unknown> {
  return useGameStore.getState() as unknown as Record<string, unknown>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  loading: true,
  syncing: false,
  error: null,

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const result = await signInWithPopup(auth, googleProvider);
      const cloudState = await loadCloudSave(result.user.uid);
      if (cloudState) {
        useGameStore.setState(cloudState);
      } else {
        await saveToCloud(result.user.uid, getGameSnapshot());
      }
    } catch (e: unknown) {
      set({ error: (e as Error).message });
    }
  },

  signInWithApple: async () => {
    try {
      set({ error: null });
      const result = await signInWithPopup(auth, appleProvider);
      const cloudState = await loadCloudSave(result.user.uid);
      if (cloudState) {
        useGameStore.setState(cloudState);
      } else {
        await saveToCloud(result.user.uid, getGameSnapshot());
      }
    } catch (e: unknown) {
      set({ error: (e as Error).message });
    }
  },

  signOut: async () => {
    const { user } = get();
    const isGuest = !user || (user as { uid: string }).uid === 'guest';
    if (!isGuest) {
      await saveToCloud(user!.uid, getGameSnapshot());
      await firebaseSignOut(auth);
    }
    set({ user: null });
  },

  clearError: () => set({ error: null }),

  syncToCloud: async () => {
    const { user, syncing } = get();
    if (!user || syncing) return;
    set({ syncing: true });
    try {
      const snapshot = getGameSnapshot();
      await saveToCloud(user.uid, snapshot);
      try {
        await updateLeaderboardEntry(user.uid, user.displayName ?? 'Anonymous', snapshot);
      } catch (lbErr) {
        console.error('[CloudSync] Leaderboard update failed:', lbErr);
      }
    } catch (err) {
      console.error('[CloudSync] Save failed:', err);
    } finally {
      set({ syncing: false });
    }
  },
}));

// Listen for auth state changes (handles page refresh, token expiry, etc.)
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, loading: false });
  if (user) {
    const cloudState = await loadCloudSave(user.uid);
    if (cloudState) {
      useGameStore.setState(cloudState);
    }
  }
});
