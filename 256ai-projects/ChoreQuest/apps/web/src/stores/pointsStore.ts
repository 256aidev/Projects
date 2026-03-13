import { create } from 'zustand';
import * as dashboardApi from '../api/dashboard';
import type { LeaderboardEntry, ChildSummary, ParentDashboardData } from '../api/dashboard';

interface PointsState {
  childSummaries: ChildSummary[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;

  // Derived
  weeklyPoints: (userId: string) => number;
  lifetimePoints: (userId: string) => number;

  // Actions
  loadPoints: () => Promise<void>;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  childSummaries: [],
  leaderboard: [],
  loading: false,
  error: null,

  weeklyPoints: (userId) => {
    const entry = get().leaderboard.find((e) => e.child_id === userId);
    return entry?.weekly_points ?? 0;
  },

  lifetimePoints: (userId) => {
    const entry = get().leaderboard.find((e) => e.child_id === userId);
    return entry?.lifetime_points ?? 0;
  },

  loadPoints: async () => {
    set({ loading: true, error: null });
    try {
      const data: ParentDashboardData = await dashboardApi.getParentDashboard();
      set({
        childSummaries: data.children,
        leaderboard: data.leaderboard,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load points';
      console.error('Load points error:', err);
      set({ loading: false, error: message });
    }
  },
}));
