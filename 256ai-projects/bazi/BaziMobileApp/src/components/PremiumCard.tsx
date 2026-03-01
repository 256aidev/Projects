/**
 * Premium Card Component
 * Card for displaying premium content (locked/unlocked state)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

interface PremiumCardProps {
  title: string;
  description: string;
  isUnlocked: boolean;
  price?: string;
  billingPeriod?: string; // e.g., '/wk', '/mo', '/yr'
  onPress: () => void;
  isLoading?: boolean;
  icon?: 'week' | 'month' | 'year' | string;
}

function getIconText(icon: string | undefined, isUnlocked: boolean): string {
  const iconMap: Record<string, string> = {
    week: '週',    // Chinese for "week"
    month: '月',   // Chinese for "month"
    year: '年',    // Chinese for "year"
  };

  if (icon && iconMap[icon]) {
    return iconMap[icon];
  }

  return isUnlocked ? '✓' : '🔒';
}

export default function PremiumCard({
  title,
  description,
  isUnlocked,
  price,
  billingPeriod,
  onPress,
  isLoading = false,
  icon,
}: PremiumCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isUnlocked && styles.containerUnlocked]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, isUnlocked && styles.iconContainerUnlocked]}>
          <Text style={styles.icon}>{getIconText(icon, isUnlocked)}</Text>
        </View>
        <View style={styles.textContent}>
          <Text style={[styles.title, isUnlocked && styles.titleUnlocked]}>
            {title}
          </Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.actionContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#8B4513" />
          ) : isUnlocked ? (
            <Text style={styles.chevron}>›</Text>
          ) : (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                {price || '$0.99'}{billingPeriod || ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    padding: 16,
    marginBottom: 12,
  },
  containerUnlocked: {
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerUnlocked: {
    backgroundColor: '#dcfce7',
  },
  icon: {
    fontSize: 20,
    color: '#8B4513',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 2,
  },
  titleUnlocked: {
    color: '#22c55e',
  },
  description: {
    fontSize: 13,
    color: '#8B7355',
  },
  actionContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTag: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: '#D4A574',
  },
});
