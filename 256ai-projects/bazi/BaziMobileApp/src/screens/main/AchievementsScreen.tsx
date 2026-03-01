/**
 * Achievements Screen
 * Displays all achievements, rewards, and current streak
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAchievements } from '../../achievements';
import { useRewards } from '../../rewards';
import AchievementBadge from '../../components/AchievementBadge';
import ShareButton from '../../components/ShareButton';
import { shareAchievement, shareStreak } from '../../utils/share';
import { Achievement } from '../../types/achievements';
import {
  RewardType,
  REWARD_TYPE_LABELS,
  REWARD_TYPE_ICONS,
  CREDIT_LIMITS,
} from '../../types/rewards';

export default function AchievementsScreen() {
  const { achievements, streak, isLoading } = useAchievements();
  const { credits, getCreditDisplay } = useRewards();

  // Define reward types to display
  const rewardTypes: RewardType[] = [
    'futureDayReadings',
    'weeklyForecasts',
    'monthlyForecasts',
    'yearlyForecasts',
    'compatibilityWeekly',
    'compatibilityMonthly',
  ];

  // Check if user has any credits
  const hasAnyCredits = rewardTypes.some((type) => credits[type] > 0);

  const handleShareStreak = () => {
    if (streak.currentStreak > 0) {
      shareStreak(streak.currentStreak);
    }
  };

  const handleShareAchievement = (achievement: Achievement) => {
    if (achievement.isUnlocked) {
      shareAchievement(achievement);
    }
  };

  // Group achievements by category
  const streakAchievements = achievements.filter((a) => a.category === 'streak');
  const milestoneAchievements = achievements.filter((a) => a.category === 'milestone');
  const specialAchievements = achievements.filter((a) => a.category === 'special');

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Streak Header */}
      <View style={styles.streakCard}>
        <View style={styles.streakContent}>
          <Text style={styles.streakIcon}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          {streak.currentStreak > 0 && (
            <ShareButton onPress={handleShareStreak} variant="icon" />
          )}
        </View>
        {streak.longestStreak > streak.currentStreak && (
          <Text style={styles.longestStreak}>
            Longest streak: {streak.longestStreak} days
          </Text>
        )}
      </View>

      {/* Your Rewards Section */}
      <View style={styles.rewardsCard}>
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsIcon}>🎁</Text>
          <Text style={styles.rewardsTitle}>YOUR REWARDS</Text>
        </View>
        <View style={styles.rewardsGrid}>
          {rewardTypes.map((type) => {
            const count = credits[type];
            const limit = CREDIT_LIMITS[type];
            const display = limit !== null ? `${count}/${limit}` : String(count);
            const hasCredits = count > 0;

            return (
              <View
                key={type}
                style={[styles.rewardItem, hasCredits && styles.rewardItemActive]}
              >
                <Text style={styles.rewardItemIcon}>{REWARD_TYPE_ICONS[type]}</Text>
                <Text
                  style={[styles.rewardItemLabel, hasCredits && styles.rewardItemLabelActive]}
                  numberOfLines={1}
                >
                  {REWARD_TYPE_LABELS[type]}
                </Text>
                <Text
                  style={[styles.rewardItemCount, hasCredits && styles.rewardItemCountActive]}
                >
                  {display}
                </Text>
              </View>
            );
          })}
        </View>
        {!hasAnyCredits && (
          <Text style={styles.noRewardsHint}>
            Complete achievements to earn rewards!
          </Text>
        )}
      </View>

      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {unlockedCount} of {totalCount} Achievements Unlocked
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Streak Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak Achievements</Text>
        <View style={styles.badgeGrid}>
          {streakAchievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              onPress={() => handleShareAchievement(achievement)}
              disabled={!achievement.isUnlocked}
              activeOpacity={achievement.isUnlocked ? 0.7 : 1}
            >
              <AchievementBadge achievement={achievement} size="medium" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Milestone Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        <View style={styles.badgeGrid}>
          {milestoneAchievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              onPress={() => handleShareAchievement(achievement)}
              disabled={!achievement.isUnlocked}
              activeOpacity={achievement.isUnlocked ? 0.7 : 1}
            >
              <AchievementBadge achievement={achievement} size="medium" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Special Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special</Text>
        <View style={styles.badgeGrid}>
          {specialAchievements.map((achievement) => (
            <TouchableOpacity
              key={achievement.id}
              onPress={() => handleShareAchievement(achievement)}
              disabled={!achievement.isUnlocked}
              activeOpacity={achievement.isUnlocked ? 0.7 : 1}
            >
              <AchievementBadge achievement={achievement} size="medium" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Tap any unlocked achievement to share it with friends!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#8B7355',
    fontSize: 16,
  },
  streakCard: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FDF5E6',
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 16,
    color: '#D4A574',
    marginTop: -4,
  },
  longestStreak: {
    fontSize: 12,
    color: '#D4A574',
    marginTop: 12,
    textAlign: 'center',
  },
  rewardsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  rewardsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    letterSpacing: 1,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '48%',
    flex: 1,
  },
  rewardItemActive: {
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  rewardItemIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rewardItemLabel: {
    fontSize: 12,
    color: '#999999',
    flex: 1,
  },
  rewardItemLabelActive: {
    color: '#5D3A1A',
  },
  rewardItemCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999999',
  },
  rewardItemCountActive: {
    color: '#8B4513',
  },
  noRewardsHint: {
    fontSize: 12,
    color: '#8B7355',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#8B7355',
    fontStyle: 'italic',
  },
});
