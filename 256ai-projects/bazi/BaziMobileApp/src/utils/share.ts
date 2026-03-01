/**
 * Share Utilities
 * Helper functions for sharing content to social media
 */

import { Share, Platform } from 'react-native';
import { Achievement } from '../types/achievements';
import { DailyReading, User, CompatibilityReading } from '../types';

const APP_STORE_LINK = 'https://apps.apple.com/app/bazi-astrology';

/**
 * Share an achievement
 */
export async function shareAchievement(achievement: Achievement): Promise<boolean> {
  try {
    const message = `${achievement.icon} I just unlocked "${achievement.name}" on BaZi Astrology!\n\n${achievement.description}\n\nGet your daily readings: ${APP_STORE_LINK}`;

    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share achievement:', error);
    return false;
  }
}

/**
 * Share streak achievement with count
 */
export async function shareStreak(streakDays: number): Promise<boolean> {
  try {
    const message = `🔥 ${streakDays}-day streak on BaZi Astrology!\n\nI've been checking my BaZi readings every day. What's your streak?\n\n${APP_STORE_LINK}`;

    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share streak:', error);
    return false;
  }
}

/**
 * Share daily reading (teaser only)
 */
export async function shareDailyReading(reading: DailyReading): Promise<boolean> {
  try {
    // Get first 100 characters of content as teaser
    const teaser = reading.content.slice(0, 100).trim();
    const ellipsis = reading.content.length > 100 ? '...' : '';

    const message = `Today's BaZi energy: ${reading.daily_element || 'Nature'} day!\n\n"${teaser}${ellipsis}"\n\nGet your daily reading: ${APP_STORE_LINK}`;

    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share daily reading:', error);
    return false;
  }
}

/**
 * Share BaZi identity (element + animal)
 */
export async function shareBaZiIdentity(user: User): Promise<boolean> {
  try {
    const element = user.day_master_element || 'Unknown';
    const polarity = user.day_master_polarity || '';
    const dayPillar = user.day_pillar || '';

    // Extract animal from day pillar branch
    const branchAnimals: Record<string, string> = {
      '子': 'Rat 🐀',
      '丑': 'Ox 🐂',
      '寅': 'Tiger 🐅',
      '卯': 'Rabbit 🐇',
      '辰': 'Dragon 🐉',
      '巳': 'Snake 🐍',
      '午': 'Horse 🐴',
      '未': 'Goat 🐐',
      '申': 'Monkey 🐵',
      '酉': 'Rooster 🐓',
      '戌': 'Dog 🐕',
      '亥': 'Pig 🐖',
    };

    const branch = dayPillar.charAt(1);
    const animal = branchAnimals[branch] || '';

    const elementEmoji: Record<string, string> = {
      Wood: '🌳',
      Fire: '🔥',
      Earth: '🏔️',
      Metal: '⚔️',
      Water: '🌊',
    };

    const emoji = elementEmoji[element] || '';

    const message = `I'm a ${polarity} ${element} ${emoji}${animal ? ` ${animal}` : ''} in BaZi!\n\nWhat's your Chinese astrological identity?\n\n${APP_STORE_LINK}`;

    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share BaZi identity:', error);
    return false;
  }
}

/**
 * Share compatibility score (no personal details)
 */
export async function shareCompatibility(
  partnerName: string,
  score: number | undefined
): Promise<boolean> {
  try {
    let message: string;

    if (score !== undefined) {
      message = `My compatibility with ${partnerName}: ${score}%! 💕\n\nDiscover your compatibility on BaZi Astrology: ${APP_STORE_LINK}`;
    } else {
      message = `Just checked my compatibility with ${partnerName} on BaZi Astrology! 💕\n\nDiscover your compatibility: ${APP_STORE_LINK}`;
    }

    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share compatibility:', error);
    return false;
  }
}

/**
 * Generic share function
 */
export async function shareContent(message: string): Promise<boolean> {
  try {
    const result = await Share.share({
      message,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share content:', error);
    return false;
  }
}
