/**
 * Achievement Service
 * Handles AsyncStorage operations for achievements and streaks
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Achievement,
  StreakData,
  AchievementProgress,
  ACHIEVEMENTS,
  ACHIEVEMENT_STORAGE_KEYS,
  initialAchievementProgress,
} from '../types/achievements';

// Get storage key with user ID
const getKey = (baseKey: string, userId: number) => `${baseKey}_${userId}`;

// ============== Achievement Storage ==============

export async function getUnlockedAchievements(userId: number): Promise<Record<string, string>> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.ACHIEVEMENTS, userId);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get achievements:', error);
    return {};
  }
}

export async function unlockAchievement(userId: number, achievementId: string): Promise<void> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.ACHIEVEMENTS, userId);
    const unlocked = await getUnlockedAchievements(userId);

    if (!unlocked[achievementId]) {
      unlocked[achievementId] = new Date().toISOString();
      await AsyncStorage.setItem(key, JSON.stringify(unlocked));
    }
  } catch (error) {
    console.error('Failed to unlock achievement:', error);
  }
}

export function buildAchievementsList(
  unlocked: Record<string, string>,
  progress: AchievementProgress,
  currentStreak: number
): Achievement[] {
  return ACHIEVEMENTS.map((def) => {
    const isUnlocked = !!unlocked[def.id];
    const unlockedAt = unlocked[def.id];

    // Calculate progress for specific achievements
    let achievementProgress: number | undefined;
    let goal: number | undefined = def.goal;

    if (def.category === 'streak' && def.goal) {
      achievementProgress = Math.min(currentStreak, def.goal);
    } else if (def.id === 'compatibility_explorer') {
      achievementProgress = Math.min(progress.compatibility_views, def.goal || 3);
    }

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      isUnlocked,
      unlockedAt,
      progress: achievementProgress,
      goal,
    };
  });
}

// ============== Streak Storage ==============

export async function getStreakData(userId: number): Promise<StreakData> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.STREAK, userId);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : { currentStreak: 0, longestStreak: 0, lastOpenDate: null };
  } catch (error) {
    console.error('Failed to get streak data:', error);
    return { currentStreak: 0, longestStreak: 0, lastOpenDate: null };
  }
}

export async function updateStreak(userId: number): Promise<{ streak: StreakData; isNewDay: boolean }> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.STREAK, userId);
    const streakData = await getStreakData(userId);

    const today = new Date().toISOString().split('T')[0];
    const lastOpen = streakData.lastOpenDate;

    // If already opened today, return current data
    if (lastOpen === today) {
      return { streak: streakData, isNewDay: false };
    }

    // Calculate if yesterday
    let newStreak = 1;
    if (lastOpen) {
      const lastDate = new Date(lastOpen);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = streakData.currentStreak + 1;
      }
      // If diffDays > 1, streak resets to 1
    }

    const longestStreak = Math.max(streakData.longestStreak, newStreak);

    const newStreakData: StreakData = {
      currentStreak: newStreak,
      longestStreak,
      lastOpenDate: today,
    };

    await AsyncStorage.setItem(key, JSON.stringify(newStreakData));
    return { streak: newStreakData, isNewDay: true };
  } catch (error) {
    console.error('Failed to update streak:', error);
    return {
      streak: { currentStreak: 1, longestStreak: 1, lastOpenDate: new Date().toISOString().split('T')[0] },
      isNewDay: true
    };
  }
}

// ============== Progress Storage ==============

export async function getAchievementProgress(userId: number): Promise<AchievementProgress> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.PROGRESS, userId);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : initialAchievementProgress;
  } catch (error) {
    console.error('Failed to get achievement progress:', error);
    return initialAchievementProgress;
  }
}

export async function updateAchievementProgress(
  userId: number,
  updates: Partial<AchievementProgress>
): Promise<AchievementProgress> {
  try {
    const key = getKey(ACHIEVEMENT_STORAGE_KEYS.PROGRESS, userId);
    const current = await getAchievementProgress(userId);
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update achievement progress:', error);
    return initialAchievementProgress;
  }
}

export async function incrementCompatibilityViews(userId: number): Promise<number> {
  const progress = await getAchievementProgress(userId);
  const newCount = progress.compatibility_views + 1;
  await updateAchievementProgress(userId, { compatibility_views: newCount });
  return newCount;
}

// ============== Achievement Checking ==============

export function checkTimeAchievements(): { earlyRiser: boolean; nightOwl: boolean } {
  const hour = new Date().getHours();
  return {
    earlyRiser: hour < 7,
    nightOwl: hour >= 22,
  };
}

export function checkStreakAchievements(streak: number): string[] {
  const achievements: string[] = [];

  if (streak >= 7) achievements.push('streak_7');
  if (streak >= 14) achievements.push('streak_14');
  if (streak >= 30) achievements.push('streak_30');
  if (streak >= 100) achievements.push('streak_100');

  return achievements;
}
