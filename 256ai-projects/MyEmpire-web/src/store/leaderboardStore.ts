import { create } from 'zustand';
import { collection, doc, getDoc, setDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  score: number;
  totalDirtyEarned: number;
  totalCleanEarned: number;
  prestigeCount: number;
  businessCount: number;
  tickCount: number;
  updatedAt: number;
}

export type LeaderboardMetric = 'score' | 'totalEarned' | 'prestigeCount';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  playerEntry: LeaderboardEntry | null;
  activeMetric: LeaderboardMetric;
  loading: boolean;
  lastFetchedAt: number;
}

interface LeaderboardActions {
  setMetric: (metric: LeaderboardMetric) => void;
  fetchLeaderboard: (metric?: LeaderboardMetric) => Promise<void>;
  fetchPlayerEntry: (uid: string) => Promise<void>;
}

const CACHE_TTL = 60_000; // 60 seconds

function getOrderField(metric: LeaderboardMetric): string {
  switch (metric) {
    case 'score': return 'score';
    case 'totalEarned': return 'score'; // score includes total earned
    case 'prestigeCount': return 'prestigeCount';
  }
}

export const useLeaderboardStore = create<LeaderboardState & LeaderboardActions>((set, get) => ({
  entries: [],
  playerEntry: null,
  activeMetric: 'score',
  loading: false,
  lastFetchedAt: 0,

  setMetric: (metric) => {
    set({ activeMetric: metric });
    get().fetchLeaderboard(metric);
  },

  fetchLeaderboard: async (metric?: LeaderboardMetric) => {
    const state = get();
    const m = metric ?? state.activeMetric;

    // Cache check
    if (Date.now() - state.lastFetchedAt < CACHE_TTL && state.entries.length > 0 && !metric) return;

    set({ loading: true });
    try {
      const q = query(
        collection(db, 'leaderboard'),
        orderBy(getOrderField(m), 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      const entries: LeaderboardEntry[] = snap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as LeaderboardEntry[];

      set({ entries, loading: false, lastFetchedAt: Date.now() });
    } catch (e) {
      console.error('[Leaderboard] fetch error:', e);
      set({ loading: false });
    }
  },

  fetchPlayerEntry: async (uid: string) => {
    try {
      const ref = doc(db, 'leaderboard', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        set({ playerEntry: { uid, ...snap.data() } as LeaderboardEntry });
      }
    } catch (e) {
      console.error('[Leaderboard] player entry fetch error:', e);
    }
  },
}));
