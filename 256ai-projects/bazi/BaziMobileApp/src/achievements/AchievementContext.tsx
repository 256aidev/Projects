/**
 * Achievement Context
 * React context for managing achievement state and popup triggers
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
  Achievement,
  StreakData,
  AchievementProgress,
  ACHIEVEMENTS,
  initialAchievementProgress,
} from '../types/achievements';
import { RewardType } from '../types/rewards';
import {
  getUnlockedAchievements,
  unlockAchievement,
  buildAchievementsList,
  getStreakData,
  updateStreak,
  getAchievementProgress,
  incrementCompatibilityViews,
  checkTimeAchievements,
  checkStreakAchievements,
} from './achievementService';
import { useAuth } from '../auth';
import { usePurchases } from '../purchases';
import { useRewards } from '../rewards';

// Extended achievement with reward info for popup display
export interface AchievementWithReward extends Achievement {
  reward?: { type: RewardType; amount: number } | null;
}

interface AchievementContextType {
  achievements: Achievement[];
  streak: StreakData;
  isLoading: boolean;
  pendingPopup: AchievementWithReward | null;
  dismissPopup: () => void;
  trackCompatibilityView: () => Promise<void>;
  trackFamilyMemberAdded: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { hasPremiumAnnual } = usePurchases();
  const { grantRewardForAchievement, grantDailyStreakReward, getRewardForAchievement } = useRewards();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastOpenDate: null,
  });
  const [progress, setProgress] = useState<AchievementProgress>(initialAchievementProgress);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPopup, setPendingPopup] = useState<AchievementWithReward | null>(null);
  const [popupQueue, setPopupQueue] = useState<AchievementWithReward[]>([]);

  const hasInitialized = useRef(false);

  // Show next popup from queue
  useEffect(() => {
    if (!pendingPopup && popupQueue.length > 0) {
      const [next, ...rest] = popupQueue;
      setPendingPopup(next);
      setPopupQueue(rest);
    }
  }, [pendingPopup, popupQueue]);

  // Dismiss current popup
  const dismissPopup = useCallback(() => {
    setPendingPopup(null);
  }, []);

  // Queue achievement popup
  const queuePopup = useCallback((achievement: AchievementWithReward) => {
    setPopupQueue((prev) => [...prev, achievement]);
  }, []);

  // Unlock achievement and queue popup (with reward if applicable)
  const tryUnlockAchievement = useCallback(
    async (achievementId: string) => {
      if (!user || unlockedMap[achievementId]) return false;

      await unlockAchievement(user.id, achievementId);
      const now = new Date().toISOString();

      setUnlockedMap((prev) => ({ ...prev, [achievementId]: now }));

      // Try to grant reward for this achievement
      const rewardResult = await grantRewardForAchievement(achievementId);

      const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (def) {
        const achievement: AchievementWithReward = {
          ...def,
          isUnlocked: true,
          unlockedAt: now,
          reward: rewardResult ? { type: rewardResult.type, amount: rewardResult.amount } : null,
        };
        queuePopup(achievement);
      }

      return true;
    },
    [user, unlockedMap, queuePopup, grantRewardForAchievement]
  );

  // Load all achievement data
  const loadAchievements = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [unlocked, streakData, progressData] = await Promise.all([
        getUnlockedAchievements(user.id),
        getStreakData(user.id),
        getAchievementProgress(user.id),
      ]);

      setUnlockedMap(unlocked);
      setStreak(streakData);
      setProgress(progressData);

      const list = buildAchievementsList(unlocked, progressData, streakData.currentStreak);
      setAchievements(list);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Refresh achievements list
  const refreshAchievements = useCallback(async () => {
    await loadAchievements();
  }, [loadAchievements]);

  // Initialize on app open
  useEffect(() => {
    if (!isAuthenticated || !user || hasInitialized.current) return;

    const initialize = async () => {
      hasInitialized.current = true;

      // Load existing data first
      const [unlocked, progressData] = await Promise.all([
        getUnlockedAchievements(user.id),
        getAchievementProgress(user.id),
      ]);

      setUnlockedMap(unlocked);
      setProgress(progressData);

      // Update streak and check for new achievements
      const { streak: newStreak, isNewDay } = await updateStreak(user.id);
      setStreak(newStreak);

      const newlyUnlocked: string[] = [];

      // First Steps achievement (first time opening)
      if (!unlocked['first_steps']) {
        await unlockAchievement(user.id, 'first_steps');
        newlyUnlocked.push('first_steps');
      }

      // Time-based achievements (only on new day)
      if (isNewDay) {
        const timeAchievements = checkTimeAchievements();

        if (timeAchievements.earlyRiser && !unlocked['early_riser']) {
          await unlockAchievement(user.id, 'early_riser');
          newlyUnlocked.push('early_riser');
        }

        if (timeAchievements.nightOwl && !unlocked['night_owl']) {
          await unlockAchievement(user.id, 'night_owl');
          newlyUnlocked.push('night_owl');
        }

        // Grant daily streak reward (days 2-7)
        if (newStreak.currentStreak >= 2 && newStreak.currentStreak <= 7) {
          await grantDailyStreakReward(newStreak.currentStreak);
        }
      }

      // Streak achievements
      const streakAchievements = checkStreakAchievements(newStreak.currentStreak);
      for (const achievementId of streakAchievements) {
        if (!unlocked[achievementId]) {
          await unlockAchievement(user.id, achievementId);
          newlyUnlocked.push(achievementId);
        }
      }

      // Update unlocked map with new achievements
      const newUnlockedMap = { ...unlocked };
      const now = new Date().toISOString();
      for (const id of newlyUnlocked) {
        newUnlockedMap[id] = now;
      }

      setUnlockedMap(newUnlockedMap);

      // Build achievements list
      const list = buildAchievementsList(newUnlockedMap, progressData, newStreak.currentStreak);
      setAchievements(list);

      // Queue popups for newly unlocked achievements (with rewards)
      for (const id of newlyUnlocked) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          // Grant reward for this achievement
          const rewardResult = await grantRewardForAchievement(id);

          queuePopup({
            ...def,
            isUnlocked: true,
            unlockedAt: now,
            reward: rewardResult ? { type: rewardResult.type, amount: rewardResult.amount } : null,
          });
        }
      }

      setIsLoading(false);
    };

    initialize();
  }, [isAuthenticated, user, queuePopup, grantRewardForAchievement, grantDailyStreakReward]);

  // Check for premium achievement when purchase state changes
  useEffect(() => {
    if (!user || !hasPremiumAnnual || unlockedMap['premium_member']) return;

    tryUnlockAchievement('premium_member');
  }, [user, hasPremiumAnnual, unlockedMap, tryUnlockAchievement]);

  // Track compatibility view
  const trackCompatibilityView = useCallback(async () => {
    if (!user) return;

    const newCount = await incrementCompatibilityViews(user.id);
    setProgress((prev) => ({ ...prev, compatibility_views: newCount }));

    // Check for compatibility explorer achievement
    if (newCount >= 3 && !unlockedMap['compatibility_explorer']) {
      await tryUnlockAchievement('compatibility_explorer');
    }

    // Refresh achievements list
    const list = buildAchievementsList(unlockedMap, { compatibility_views: newCount }, streak.currentStreak);
    setAchievements(list);
  }, [user, unlockedMap, streak.currentStreak, tryUnlockAchievement]);

  // Track family member added
  const trackFamilyMemberAdded = useCallback(async () => {
    if (!user || unlockedMap['family_bond']) return;
    await tryUnlockAchievement('family_bond');
  }, [user, unlockedMap, tryUnlockAchievement]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasInitialized.current = false;
      setAchievements([]);
      setStreak({ currentStreak: 0, longestStreak: 0, lastOpenDate: null });
      setProgress(initialAchievementProgress);
      setUnlockedMap({});
      setPendingPopup(null);
      setPopupQueue([]);
    }
  }, [isAuthenticated]);

  const value: AchievementContextType = {
    achievements,
    streak,
    isLoading,
    pendingPopup,
    dismissPopup,
    trackCompatibilityView,
    trackFamilyMemberAdded,
    refreshAchievements,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements(): AchievementContextType {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}
