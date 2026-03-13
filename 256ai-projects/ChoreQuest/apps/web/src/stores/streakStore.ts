import { create } from 'zustand';
import * as dashboardApi from '../api/dashboard';
import type { ChildSummary } from '../api/dashboard';

interface StreakState {
  streaks: Map<string, number>;
  loading: boolean;
  error: string | null;

  // Derived
  getUserStreak: (userId: string) => number;

  // Actions
  calculateStreaks: () => Promise<void>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  streaks: new Map(),
  loading: false,
  error: null,

  getUserStreak: (userId) => get().streaks.get(userId) ?? 0,

  calculateStreaks: async () => {
    set({ loading: true, error: null });
    try {
      const data = await dashboardApi.getParentDashboard();
      const streaks = new Map<string, number>();
      data.children.forEach((child: ChildSummary) => {
        streaks.set(child.child_id, child.streak);
      });
      set({ streaks, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate streaks';
      console.error('Calculate streaks error:', err);
      set({ loading: false, error: message });
    }
  },
}));
