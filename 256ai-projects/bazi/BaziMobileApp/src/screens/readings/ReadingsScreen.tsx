/**
 * Readings Screen
 * Main hub for today's reading and forecasts
 * Future day readings moved to Calendar tab
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../auth';
import { usePurchases } from '../../purchases';
import { getDailyReading } from '../../api/readings';
import { DailyReading } from '../../types';
import { ApiError } from '../../api';
import { AdBanner, interstitialManager } from '../../components/ads';
import { adGatedAccessManager } from '../../ads';
import { translatePillar, translateReadingContent, translateStem } from '../../utils/translateChinese';
import { LuckyHoursChart } from '../../components/LuckyHoursChart';
import { ShareButton } from '../../components/ShareButton';
import { shareDailyReading } from '../../utils/share';
import { ReadingsStackParamList } from '../../navigation/ReadingsStack';

type NavigationProp = NativeStackNavigationProp<ReadingsStackParamList>;

export default function ReadingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { hasRemoveAds } = usePurchases();

  const [reading, setReading] = useState<DailyReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingAd, setIsShowingAd] = useState(false);

  const fetchReading = async () => {
    if (!user) return;

    try {
      setError(null);
      const data = await getDailyReading(user.id);
      setReading(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to load reading. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReading();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReading();
  };

  // Ad-gated forecast handler
  const handleForecastPress = async (
    contentType: 'weekly' | 'monthly' | 'yearly',
    screenName: 'WeeklyForecast' | 'MonthlyForecast' | 'YearlyForecast'
  ) => {
    // Skip ad if user has remove ads entitlement or already unlocked this session
    if (hasRemoveAds || adGatedAccessManager.isUnlocked(contentType)) {
      navigation.navigate(screenName);
      return;
    }

    // Show interstitial ad
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        adGatedAccessManager.unlockContent(contentType);
      }
      // Navigate regardless of whether ad was shown (ad might not be loaded yet)
      navigation.navigate(screenName);
    } finally {
      setIsShowingAd(false);
    }
  };

  const handleWeeklyForecast = () => handleForecastPress('weekly', 'WeeklyForecast');
  const handleMonthlyForecast = () => handleForecastPress('monthly', 'MonthlyForecast');
  const handleYearlyForecast = () => handleForecastPress('yearly', 'YearlyForecast');

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your reading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Reading Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Reading</Text>

          {/* Today's Pillar */}
          <View style={styles.pillarCard}>
            <Text style={styles.pillarLabel}>Today's Pillar</Text>
            <Text style={styles.pillarText}>{reading?.daily_pillar || '—'}</Text>
            <Text style={styles.pillarTranslation}>
              {translatePillar(reading?.daily_pillar || null)}
            </Text>
            <Text style={styles.elementText}>{reading?.daily_element || ''}</Text>
          </View>

          {/* Reading Content */}
          <View style={styles.readingCard}>
            <View style={styles.readingHeader}>
              <Text style={styles.readingTitle}>Your Reading</Text>
              {reading && (
                <ShareButton
                  variant="icon"
                  onPress={() => shareDailyReading(reading)}
                />
              )}
            </View>
            <Text style={styles.readingContent}>
              {reading?.content
                ? translateReadingContent(reading.content, user?.language || 'en')
                : 'No reading available for today.'}
            </Text>
            {reading?.content && <LuckyHoursChart content={reading.content} />}
          </View>

          {/* Day Master */}
          <View style={styles.dayMasterCard}>
            <Text style={styles.dayMasterLabel}>Your Day Master</Text>
            <Text style={styles.dayMasterText}>
              {translateStem(user?.day_master || null)}
            </Text>
          </View>
        </View>

        {/* Forecasts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forecasts</Text>

          <TouchableOpacity
            style={styles.forecastCard}
            onPress={handleWeeklyForecast}
            disabled={isShowingAd}
            activeOpacity={0.7}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Weekly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('weekly')
                  ? 'View your weekly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forecastCard}
            onPress={handleMonthlyForecast}
            disabled={isShowingAd}
            activeOpacity={0.7}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Monthly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('monthly')
                  ? 'View your monthly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forecastCard}
            onPress={handleYearlyForecast}
            disabled={isShowingAd}
            activeOpacity={0.7}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Yearly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('yearly')
                  ? 'View your yearly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Tip about Calendar */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Tip: Check the Calendar tab for future day readings!
          </Text>
        </View>
      </ScrollView>

      {/* Banner Ad */}
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
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
  errorText: {
    color: '#B22222',
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  pillarCard: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  pillarLabel: {
    fontSize: 14,
    color: '#D4A574',
    marginBottom: 8,
  },
  pillarText: {
    fontSize: 48,
    color: '#FDF5E6',
    fontWeight: 'bold',
  },
  pillarTranslation: {
    fontSize: 14,
    color: '#D4A574',
    marginTop: 4,
  },
  elementText: {
    fontSize: 18,
    color: '#D4A574',
    marginTop: 8,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  readingContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  dayMasterCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dayMasterLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
  },
  dayMasterText: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#F0E6D3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 13,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forecastContent: {
    flex: 1,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 4,
  },
  forecastDescription: {
    fontSize: 13,
    color: '#8B7355',
  },
  forecastArrow: {
    fontSize: 18,
    color: '#8B7355',
    marginLeft: 12,
  },
});
