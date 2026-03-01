/**
 * Reward Service
 * Handles AsyncStorage operations for reward credits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RewardCredits,
  RewardGrant,
  RewardType,
  REWARD_STORAGE_KEYS,
  CREDIT_LIMITS,
  initialRewardCredits,
} from '../types/rewards';

// Get storage key with user ID
const getKey = (baseKey: string, userId: number) => `${baseKey}_${userId}`;

// ============== Credit Storage ==============

/**
 * Get current reward credits for a user
 */
export async function getRewardCredits(userId: number): Promise<RewardCredits> {
  try {
    const key = getKey(REWARD_STORAGE_KEYS.CREDITS, userId);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : { ...initialRewardCredits };
  } catch (error) {
    console.error('Failed to get reward credits:', error);
    return { ...initialRewardCredits };
  }
}

/**
 * Save reward credits for a user
 */
export async function saveRewardCredits(userId: number, credits: RewardCredits): Promise<void> {
  try {
    const key = getKey(REWARD_STORAGE_KEYS.CREDITS, userId);
    await AsyncStorage.setItem(key, JSON.stringify(credits));
  } catch (error) {
    console.error('Failed to save reward credits:', error);
  }
}

/**
 * Add credits of a specific type, respecting limits
 * Returns the new credit count for that type
 */
export async function addCredits(
  userId: number,
  rewardType: RewardType,
  amount: number
): Promise<number> {
  const credits = await getRewardCredits(userId);
  const limit = CREDIT_LIMITS[rewardType];

  let newValue = credits[rewardType] + amount;

  // Apply limit if exists
  if (limit !== null) {
    newValue = Math.min(newValue, limit);
  }

  credits[rewardType] = newValue;
  await saveRewardCredits(userId, credits);

  return newValue;
}

/**
 * Use (deduct) a credit of a specific type
 * Returns true if credit was available and used, false otherwise
 */
export async function useCredit(
  userId: number,
  rewardType: RewardType
): Promise<boolean> {
  const credits = await getRewardCredits(userId);

  if (credits[rewardType] > 0) {
    credits[rewardType] -= 1;
    await saveRewardCredits(userId, credits);
    return true;
  }

  return false;
}

/**
 * Check if user has available credits of a specific type
 */
export async function hasCredits(
  userId: number,
  rewardType: RewardType
): Promise<boolean> {
  const credits = await getRewardCredits(userId);
  return credits[rewardType] > 0;
}

/**
 * Check if credits can be added (not at limit)
 */
export function canAddCredits(credits: RewardCredits, rewardType: RewardType): boolean {
  const limit = CREDIT_LIMITS[rewardType];
  if (limit === null) return true; // No limit
  return credits[rewardType] < limit;
}

// ============== History Storage ==============

/**
 * Get reward history for a user
 */
export async function getRewardHistory(userId: number): Promise<RewardGrant[]> {
  try {
    const key = getKey(REWARD_STORAGE_KEYS.HISTORY, userId);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get reward history:', error);
    return [];
  }
}

/**
 * Add a reward grant to history
 */
export async function addRewardToHistory(
  userId: number,
  grant: RewardGrant
): Promise<void> {
  try {
    const key = getKey(REWARD_STORAGE_KEYS.HISTORY, userId);
    const history = await getRewardHistory(userId);
    history.push(grant);
    await AsyncStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to add reward to history:', error);
  }
}

/**
 * Check if a reward has already been granted for a specific achievement
 */
export async function hasRewardBeenGranted(
  userId: number,
  achievementId: string
): Promise<boolean> {
  const history = await getRewardHistory(userId);
  return history.some((grant) => grant.achievementId === achievementId);
}

// ============== Combined Operations ==============

/**
 * Grant a reward for an achievement
 * Returns the new credit count if granted, null if already granted or at limit
 */
export async function grantAchievementReward(
  userId: number,
  achievementId: string,
  rewardType: RewardType,
  amount: number
): Promise<number | null> {
  // Check if already granted
  const alreadyGranted = await hasRewardBeenGranted(userId, achievementId);
  if (alreadyGranted) {
    return null;
  }

  // Check if at limit
  const credits = await getRewardCredits(userId);
  if (!canAddCredits(credits, rewardType)) {
    return null;
  }

  // Add credits
  const newCount = await addCredits(userId, rewardType, amount);

  // Record in history
  await addRewardToHistory(userId, {
    achievementId,
    rewardType,
    amount,
    grantedAt: new Date().toISOString(),
  });

  return newCount;
}

/**
 * Grant a daily streak reward
 * Uses 'daily_streak_X' as the achievement ID where X is the streak day
 */
export async function grantDailyStreakReward(
  userId: number,
  streakDay: number,
  rewardType: RewardType,
  amount: number
): Promise<number | null> {
  const achievementId = `daily_streak_${streakDay}`;
  return grantAchievementReward(userId, achievementId, rewardType, amount);
}

/**
 * Clear all reward data for a user (for testing or account reset)
 */
export async function clearRewardData(userId: number): Promise<void> {
  try {
    const creditsKey = getKey(REWARD_STORAGE_KEYS.CREDITS, userId);
    const historyKey = getKey(REWARD_STORAGE_KEYS.HISTORY, userId);
    await AsyncStorage.multiRemove([creditsKey, historyKey]);
  } catch (error) {
    console.error('Failed to clear reward data:', error);
  }
}
