/**
 * Achievement Badge Component
 * Displays an achievement badge with locked/unlocked states
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '../types/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export default function AchievementBadge({
  achievement,
  onPress,
  size = 'medium',
  showProgress = true,
}: AchievementBadgeProps) {
  const sizeStyles = {
    small: { badge: styles.badgeSmall, icon: styles.iconSmall, name: styles.nameSmall },
    medium: { badge: styles.badgeMedium, icon: styles.iconMedium, name: styles.nameMedium },
    large: { badge: styles.badgeLarge, icon: styles.iconLarge, name: styles.nameLarge },
  };

  const currentSize = sizeStyles[size];

  const hasProgress = achievement.progress !== undefined && achievement.goal !== undefined;
  const progressPercent = hasProgress
    ? Math.min((achievement.progress! / achievement.goal!) * 100, 100)
    : 0;

  const content = (
    <View
      style={[
        styles.badge,
        currentSize.badge,
        achievement.isUnlocked ? styles.badgeUnlocked : styles.badgeLocked,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, currentSize.icon, !achievement.isUnlocked && styles.iconLocked]}>
          {achievement.icon}
        </Text>
        {!achievement.isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.name, currentSize.name, !achievement.isUnlocked && styles.nameLocked]}
        numberOfLines={2}
      >
        {achievement.name}
      </Text>

      {showProgress && hasProgress && !achievement.isUnlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.goal}
          </Text>
        </View>
      )}

      {achievement.isUnlocked && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
  },
  badgeSmall: {
    width: 80,
    padding: 8,
  },
  badgeMedium: {
    width: 100,
    padding: 12,
  },
  badgeLarge: {
    width: 120,
    padding: 16,
  },
  badgeUnlocked: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  badgeLocked: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    textAlign: 'center',
  },
  iconSmall: {
    fontSize: 28,
  },
  iconMedium: {
    fontSize: 36,
  },
  iconLarge: {
    fontSize: 48,
  },
  iconLocked: {
    opacity: 0.5,
  },
  lockOverlay: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  lockIcon: {
    fontSize: 14,
  },
  name: {
    fontWeight: '600',
    color: '#5D3A1A',
    textAlign: 'center',
    marginTop: 8,
  },
  nameSmall: {
    fontSize: 10,
  },
  nameMedium: {
    fontSize: 12,
  },
  nameLarge: {
    fontSize: 14,
  },
  nameLocked: {
    color: '#8B7355',
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#D4D4D4',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A574',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 4,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
