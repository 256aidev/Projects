/**
 * Reward Context
 * React context for managing reward credits and popups
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  RewardCredits,
  RewardType,
  PendingRewardPopup,
  initialRewardCredits,
  ACHIEVEMENT_REWARDS,
  DAILY_STREAK_REWARDS,
  CREDIT_LIMITS,
} from '../types/rewards';
import {
  getRewardCredits,
  grantAchievementReward,
  grantDailyStreakReward,
  useCredit as useCreditService,
  hasRewardBeenGranted,
  canAddCredits,
} from './rewardService';
import { useAuth } from '../auth';

interface RewardContextType {
  // Current credits
  credits: RewardCredits;
  isLoading: boolean;

  // Credit operations
  hasCredit: (rewardType: RewardType) => boolean;
  useCredit: (rewardType: RewardType) => Promise<boolean>;
  getCreditDisplay: (rewardType: RewardType) => string;

  // Reward granting (called by AchievementContext)
  grantRewardForAchievement: (achievementId: string) => Promise<{ type: RewardType; amount: number; newTotal: number } | null>;
  grantDailyStreakReward: (streakDay: number) => Promise<PendingRewardPopup | null>;

  // Get reward info for an achievement
  getRewardForAchievement: (achievementId: string) => { type: RewardType; amount: number } | null;

  // Popup management
  pendingRewardPopup: PendingRewardPopup | null;
  dismissRewardPopup: () => void;

  // Refresh
  refreshCredits: () => Promise<void>;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [credits, setCredits] = useState<RewardCredits>(initialRewardCredits);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRewardPopup, setPendingRewardPopup] = useState<PendingRewardPopup | null>(null);
  const [popupQueue, setPopupQueue] = useState<PendingRewardPopup[]>([]);

  const hasInitialized = useRef(false);

  // Show next popup from queue
  useEffect(() => {
    if (!pendingRewardPopup && popupQueue.length > 0) {
      const [next, ...rest] = popupQueue;
      setPendingRewardPopup(next);
      setPopupQueue(rest);
    }
  }, [pendingRewardPopup, popupQueue]);

  // Dismiss current popup
  const dismissRewardPopup = useCallback(() => {
    setPendingRewardPopup(null);
  }, []);

  // Queue a reward popup
  const queueRewardPopup = useCallback((popup: PendingRewardPopup) => {
    setPopupQueue((prev) => [...prev, popup]);
  }, []);

  // Load credits
  const loadCredits = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await getRewardCredits(user.id);
      setCredits(data);
    } catch (error) {
      console.error('Failed to load reward credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh credits
  const refreshCredits = useCallback(async () => {
    await loadCredits();
  }, [loadCredits]);

  // Initialize on mount
  useEffect(() => {
    if (!isAuthenticated || !user || hasInitialized.current) return;

    hasInitialized.current = true;
    loadCredits();
  }, [isAuthenticated, user, loadCredits]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasInitialized.current = false;
      setCredits(initialRewardCredits);
      setPendingRewardPopup(null);
      setPopupQueue([]);
    }
  }, [isAuthenticated]);

  // Check if user has credits
  const hasCredit = useCallback(
    (rewardType: RewardType): boolean => {
      return credits[rewardType] > 0;
    },
    [credits]
  );

  // Use a credit
  const useCredit = useCallback(
    async (rewardType: RewardType): Promise<boolean> => {
      if (!user) return false;

      const success = await useCreditService(user.id, rewardType);
      if (success) {
        setCredits((prev) => ({
          ...prev,
          [rewardType]: prev[rewardType] - 1,
        }));
      }
      return success;
    },
    [user]
  );

  // Get display string for credits (e.g., "1/2" or "4")
  const getCreditDisplay = useCallback(
    (rewardType: RewardType): string => {
      const count = credits[rewardType];
      const limit = CREDIT_LIMITS[rewardType];

      if (limit === null) {
        return String(count);
      }
      return `${count}/${limit}`;
    },
    [credits]
  );

  // Get reward info for an achievement
  const getRewardForAchievement = useCallback(
    (achievementId: string): { type: RewardType; amount: number } | null => {
      const reward = ACHIEVEMENT_REWARDS[achievementId];
      return reward || null;
    },
    []
  );

  // Grant reward for an achievement
  const grantRewardForAchievement = useCallback(
    async (achievementId: string): Promise<{ type: RewardType; amount: number; newTotal: number } | null> => {
      if (!user) return null;

      const reward = ACHIEVEMENT_REWARDS[achievementId];
      if (!reward) return null;

      // Check if we can add (not at limit)
      if (!canAddCredits(credits, reward.type)) {
        return null;
      }

      const newTotal = await grantAchievementReward(
        user.id,
        achievementId,
        reward.type,
        reward.amount
      );

      if (newTotal !== null) {
        setCredits((prev) => ({
          ...prev,
          [reward.type]: newTotal,
        }));
        return { type: reward.type, amount: reward.amount, newTotal };
      }

      return null;
    },
    [user, credits]
  );

  // Grant daily streak reward
  const grantDailyStreakRewardHandler = useCallback(
    async (streakDay: number): Promise<PendingRewardPopup | null> => {
      if (!user) return null;

      const reward = DAILY_STREAK_REWARDS[streakDay];
      if (!reward) return null;

      const newTotal = await grantDailyStreakReward(
        user.id,
        streakDay,
        reward.type,
        reward.amount
      );

      if (newTotal !== null) {
        setCredits((prev) => ({
          ...prev,
          [reward.type]: newTotal,
        }));

        const popup: PendingRewardPopup = {
          streakDay,
          rewardType: reward.type,
          amount: reward.amount,
          totalCredits: newTotal,
        };

        queueRewardPopup(popup);
        return popup;
      }

      return null;
    },
    [user, queueRewardPopup]
  );

  const value: RewardContextType = {
    credits,
    isLoading,
    hasCredit,
    useCredit,
    getCreditDisplay,
    grantRewardForAchievement,
    grantDailyStreakReward: grantDailyStreakRewardHandler,
    getRewardForAchievement,
    pendingRewardPopup,
    dismissRewardPopup,
    refreshCredits,
  };

  return (
    <RewardContext.Provider value={value}>
      {children}
    </RewardContext.Provider>
  );
}

export function useRewards(): RewardContextType {
  const context = useContext(RewardContext);
  if (context === undefined) {
    throw new Error('useRewards must be used within a RewardProvider');
  }
  return context;
}
