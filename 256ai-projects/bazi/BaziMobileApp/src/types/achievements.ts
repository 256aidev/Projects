/**
 * Achievement Types
 * Type definitions for achievements and streak tracking
 */

export type AchievementCategory = 'streak' | 'milestone' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  goal?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastOpenDate: string | null;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  goal?: number;
}

// Achievement definitions
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Open the app for the first time',
    icon: '🌱',
    category: 'milestone',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Open the app 7 days in a row',
    icon: '🔥',
    category: 'streak',
    goal: 7,
  },
  {
    id: 'streak_14',
    name: '14-Day Streak',
    description: 'Open the app 14 days in a row',
    icon: '⚡',
    category: 'streak',
    goal: 14,
  },
  {
    id: 'streak_30',
    name: '30-Day Streak',
    description: 'Open the app 30 days in a row',
    icon: '🌟',
    category: 'streak',
    goal: 30,
  },
  {
    id: 'streak_100',
    name: '100-Day Streak',
    description: 'Open the app 100 days in a row',
    icon: '💎',
    category: 'streak',
    goal: 100,
  },
  {
    id: 'family_bond',
    name: 'Family Bond',
    description: 'Add your first family member',
    icon: '👨‍👩‍👧',
    category: 'milestone',
  },
  {
    id: 'compatibility_explorer',
    name: 'Compatibility Explorer',
    description: 'View 3 compatibility readings',
    icon: '🔮',
    category: 'milestone',
    goal: 3,
  },
  {
    id: 'early_riser',
    name: 'Early Riser',
    description: 'Open the app before 7am',
    icon: '🌅',
    category: 'special',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Open the app after 10pm',
    icon: '🦉',
    category: 'special',
  },
  {
    id: 'premium_member',
    name: 'Premium Member',
    description: 'Subscribe to Premium',
    icon: '👑',
    category: 'special',
  },
];

// Storage keys
export const ACHIEVEMENT_STORAGE_KEYS = {
  ACHIEVEMENTS: '@bazi_achievements',
  STREAK: '@bazi_streak',
  PROGRESS: '@bazi_achievement_progress',
};

// Progress tracking for multi-step achievements
export interface AchievementProgress {
  compatibility_views: number;
}

export const initialAchievementProgress: AchievementProgress = {
  compatibility_views: 0,
};
