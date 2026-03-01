/**
 * Reward Types
 * Type definitions for the achievement rewards system
 */

// Credit types that can be earned
export type RewardType =
  | 'futureDayReadings'
  | 'weeklyForecasts'
  | 'monthlyForecasts'
  | 'yearlyForecasts'
  | 'compatibilityWeekly'
  | 'compatibilityMonthly';

// Current credit balances for a user
export interface RewardCredits {
  futureDayReadings: number;      // Count of free readings available (unlimited stacking)
  weeklyForecasts: number;        // Count of free weekly forecasts (max 2)
  monthlyForecasts: number;       // Count of free monthly forecasts (max 1)
  yearlyForecasts: number;        // Count of free yearly forecasts (max 1)
  compatibilityWeekly: number;    // Count of free compatibility weekly (max 1)
  compatibilityMonthly: number;   // Count of free compatibility monthly (max 1)
}

// Record of a reward being granted
export interface RewardGrant {
  achievementId: string;          // Which achievement granted this (or 'daily_streak_X' for daily rewards)
  rewardType: RewardType;
  amount: number;
  grantedAt: string;              // ISO date string
}

// Storage keys for rewards
export const REWARD_STORAGE_KEYS = {
  CREDITS: '@bazi_rewards',
  HISTORY: '@bazi_reward_history',
};

// Credit limits per type
export const CREDIT_LIMITS: Record<RewardType, number | null> = {
  futureDayReadings: null,        // Unlimited stacking
  weeklyForecasts: 2,             // Max 2
  monthlyForecasts: 1,            // Max 1
  yearlyForecasts: 1,             // Max 1
  compatibilityWeekly: 1,         // Max 1
  compatibilityMonthly: 1,        // Max 1
};

// Initial empty credits state
export const initialRewardCredits: RewardCredits = {
  futureDayReadings: 0,
  weeklyForecasts: 0,
  monthlyForecasts: 0,
  yearlyForecasts: 0,
  compatibilityWeekly: 0,
  compatibilityMonthly: 0,
};

// Mapping of achievement IDs to rewards
export const ACHIEVEMENT_REWARDS: Record<string, { type: RewardType; amount: number }> = {
  // Milestone achievement rewards
  streak_7: { type: 'weeklyForecasts', amount: 1 },
  streak_14: { type: 'weeklyForecasts', amount: 1 },
  streak_30: { type: 'monthlyForecasts', amount: 1 },
  streak_100: { type: 'yearlyForecasts', amount: 1 },
  family_bond: { type: 'compatibilityWeekly', amount: 1 },
  compatibility_explorer: { type: 'compatibilityMonthly', amount: 1 },
};

// Daily streak rewards (days 2-7 grant future readings)
export const DAILY_STREAK_REWARDS: Record<number, { type: RewardType; amount: number }> = {
  2: { type: 'futureDayReadings', amount: 1 },
  3: { type: 'futureDayReadings', amount: 1 },
  4: { type: 'futureDayReadings', amount: 1 },
  5: { type: 'futureDayReadings', amount: 1 },
  6: { type: 'futureDayReadings', amount: 1 },
  7: { type: 'futureDayReadings', amount: 1 },
};

// Display names for reward types
export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  futureDayReadings: 'Future Readings',
  weeklyForecasts: 'Weekly Forecasts',
  monthlyForecasts: 'Monthly Forecasts',
  yearlyForecasts: 'Yearly Forecasts',
  compatibilityWeekly: 'Compat Weekly',
  compatibilityMonthly: 'Compat Monthly',
};

// Icons for reward types
export const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  futureDayReadings: '📅',
  weeklyForecasts: '📊',
  monthlyForecasts: '📈',
  yearlyForecasts: '🎯',
  compatibilityWeekly: '💕',
  compatibilityMonthly: '💑',
};

// Pending reward popup info
export interface PendingRewardPopup {
  streakDay: number;
  rewardType: RewardType;
  amount: number;
  totalCredits: number;
}
