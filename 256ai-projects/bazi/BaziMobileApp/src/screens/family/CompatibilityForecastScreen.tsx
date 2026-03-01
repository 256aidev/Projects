/**
 * Compatibility Forecast Screen
 * Shows time-based compatibility forecasts for family members
 * Tied to the same purchases as personal readings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../auth';
import { usePurchases } from '../../purchases';
import { useRewards } from '../../rewards';
import { PRODUCT_IDS } from '../../types/purchases';
import { RewardType } from '../../types/rewards';
import { FamilyMember } from '../../types';
import { getCompatibilityForecast, CompatibilityForecast } from '../../api/family';

type ForecastPeriod = 'weekly' | 'monthly' | 'yearly';

interface CompatibilityForecastScreenProps {
  navigation: any;
  route: {
    params: {
      member: FamilyMember;
      period: ForecastPeriod;
    };
  };
}

const PERIOD_TITLES: Record<ForecastPeriod, string> = {
  weekly: 'Weekly Compatibility',
  monthly: 'Monthly Compatibility',
  yearly: 'Yearly Compatibility',
};

export default function CompatibilityForecastScreen({
  navigation,
  route
}: CompatibilityForecastScreenProps) {
  const { user } = useAuth();
  const { member, period } = route.params;
  const {
    hasWeeklyForecast,
    hasMonthlyForecast,
    hasYearlyForecast,
    hasPremiumAnnual,
    purchaseProduct,
    getProduct,
    isLoading: purchaseLoading,
  } = usePurchases();
  const { credits, hasCredit, useCredit } = useRewards();

  const [forecast, setForecast] = useState<CompatibilityForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedCredit, setUsedCredit] = useState(false);

  // Get the reward type for compatibility forecasts
  const getCompatibilityRewardType = (): RewardType | null => {
    if (period === 'weekly') return 'compatibilityWeekly';
    if (period === 'monthly') return 'compatibilityMonthly';
    return null; // No yearly compatibility reward
  };

  const compatRewardType = getCompatibilityRewardType();
  const hasCompatCredit = compatRewardType ? hasCredit(compatRewardType) : false;

  // Check if this forecast period is unlocked via purchase
  const isPurchaseUnlocked = hasPremiumAnnual || (
    (period === 'weekly' && hasWeeklyForecast) ||
    (period === 'monthly' && hasMonthlyForecast) ||
    (period === 'yearly' && hasYearlyForecast)
  );

  // Full unlock check includes credits
  const isUnlocked = isPurchaseUnlocked || hasCompatCredit || usedCredit;

  // Get product ID for this period
  const getProductId = () => {
    switch (period) {
      case 'weekly': return PRODUCT_IDS.WEEKLY_FORECAST;
      case 'monthly': return PRODUCT_IDS.MONTHLY_FORECAST;
      case 'yearly': return PRODUCT_IDS.YEARLY_FORECAST;
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: `${member.name} - ${PERIOD_TITLES[period]}` });
  }, [member.name, period]);

  useEffect(() => {
    if (isUnlocked) {
      loadForecast();
    } else {
      setIsLoading(false);
    }
  }, [isUnlocked]);

  const loadForecast = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getCompatibilityForecast(
        user.id,
        member.id,
        period,
        {
          day_master: user.day_master,
          day_master_element: user.day_master_element,
          year_pillar: user.year_pillar,
          day_pillar: user.day_pillar,
        }
      );
      setForecast(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forecast');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    const productId = getProductId();
    const success = await purchaseProduct(productId);
    if (success) {
      loadForecast();
    }
  };

  const handleUseCredit = () => {
    if (!compatRewardType) return;

    const creditCount = compatRewardType === 'compatibilityWeekly'
      ? credits.compatibilityWeekly
      : credits.compatibilityMonthly;

    Alert.alert(
      'Use Free Credit?',
      `You have ${creditCount} free compatibility ${period} credit available.\n\nUse it to view this forecast?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Credit',
          onPress: async () => {
            const success = await useCredit(compatRewardType);
            if (success) {
              setUsedCredit(true);
              loadForecast();
            }
          },
        },
      ]
    );
  };

  const product = getProduct(getProductId());

  // Locked state - show purchase prompt or credit option
  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          {hasCompatCredit ? (
            // Has credit available
            <>
              <Text style={styles.lockedIcon}>🎁</Text>
              <Text style={styles.lockedTitle}>{PERIOD_TITLES[period]}</Text>
              <Text style={styles.lockedDescription}>
                You have a free {period} compatibility credit available!
              </Text>

              <TouchableOpacity
                style={[styles.purchaseButton, styles.creditButton]}
                onPress={handleUseCredit}
              >
                <Text style={styles.purchaseButtonText}>
                  Use Free Credit
                </Text>
              </TouchableOpacity>

              <Text style={styles.premiumHint}>
                Or purchase to unlock permanently
              </Text>
            </>
          ) : (
            // No credit - show purchase option
            <>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>{PERIOD_TITLES[period]}</Text>
              <Text style={styles.lockedDescription}>
                Unlock {period} forecasts to see how your compatibility with {member.name} changes over time.
              </Text>
              <Text style={styles.lockedBenefit}>
                This purchase also unlocks {period} forecasts for your own readings!
              </Text>

              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
                disabled={purchaseLoading}
              >
                {purchaseLoading ? (
                  <ActivityIndicator color="#FDF5E6" />
                ) : (
                  <Text style={styles.purchaseButtonText}>
                    Unlock for {product?.priceString || `$0.99/${period === 'weekly' ? 'wk' : period === 'monthly' ? 'mo' : 'yr'}`}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.premiumHint}>
                Or get Premium ($9.99/yr) to unlock everything
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Analyzing {period} energies...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadForecast}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!forecast) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No forecast available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.periodLabel}>{forecast.periodLabel}</Text>
        <Text style={styles.memberName}>Compatibility with {member.name}</Text>
      </View>

      {/* Score Trend */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Current Score</Text>
          <Text style={styles.scoreValue}>{forecast.currentScore}%</Text>
        </View>
        <View style={styles.trendCard}>
          <Text style={styles.trendLabel}>Trend</Text>
          <Text style={[
            styles.trendValue,
            { color: forecast.trend === 'improving' ? '#228B22' : forecast.trend === 'declining' ? '#DC143C' : '#8B7355' }
          ]}>
            {forecast.trend === 'improving' ? '↑ Improving' :
             forecast.trend === 'declining' ? '↓ Declining' : '→ Stable'}
          </Text>
        </View>
      </View>

      {/* Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.card}>
          <Text style={styles.overviewText}>{forecast.overview}</Text>
        </View>
      </View>

      {/* Key Dates */}
      {forecast.keyDates && forecast.keyDates.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Dates</Text>
          {forecast.keyDates.map((item, index) => (
            <View key={index} style={styles.keyDateCard}>
              <View style={styles.keyDateHeader}>
                <Text style={styles.keyDate}>{item.date}</Text>
                <Text style={[
                  styles.keyDateType,
                  { color: item.type === 'favorable' ? '#228B22' : '#DC143C' }
                ]}>
                  {item.type === 'favorable' ? '★ Favorable' : '⚡ Challenging'}
                </Text>
              </View>
              <Text style={styles.keyDateDesc}>{item.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Guidance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guidance</Text>
        <View style={styles.card}>
          <Text style={styles.guidanceText}>{forecast.guidance}</Text>
        </View>
      </View>

      {/* Generated timestamp */}
      <Text style={styles.generatedAt}>
        Generated: {new Date(forecast.generatedAt).toLocaleDateString()}
      </Text>
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
    padding: 20,
    backgroundColor: '#FDF5E6',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B7355',
    fontSize: 16,
  },
  errorText: {
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FDF5E6',
    fontWeight: '600',
  },
  // Locked state
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  lockedBenefit: {
    fontSize: 14,
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  purchaseButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  creditButton: {
    backgroundColor: '#22c55e',
  },
  purchaseButtonText: {
    color: '#FDF5E6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumHint: {
    marginTop: 16,
    fontSize: 13,
    color: '#A0A0A0',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  periodLabel: {
    fontSize: 14,
    color: '#8B7355',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  // Score section
  scoreSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  trendCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  trendLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  overviewText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
  guidanceText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
  // Key dates
  keyDateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 8,
  },
  keyDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  keyDateType: {
    fontSize: 12,
    fontWeight: '600',
  },
  keyDateDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  generatedAt: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
