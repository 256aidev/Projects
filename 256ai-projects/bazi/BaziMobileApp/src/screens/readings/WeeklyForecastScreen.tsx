/**
 * Weekly Forecast Screen
 * Displays the user's weekly forecast with optional Four Pillars analysis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../auth';
import { usePurchases } from '../../purchases';
import { getWeeklyForecast, WeeklyForecast } from '../../api/forecasts';
import { AdBanner } from '../../components/ads';

function getRatingStars(rating: number): string {
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return filled + empty;
}

export default function WeeklyForecastScreen() {
  const { user } = useAuth();
  const { hasPremiumAnnual } = usePurchases();
  const [forecast, setForecast] = useState<WeeklyForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!user) return;

      try {
        setError(null);
        // Premium users get Four Pillars analysis
        const data = await getWeeklyForecast(user.id, hasPremiumAnnual);
        setForecast(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load forecast. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [user, hasPremiumAnnual]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your weekly forecast...</Text>
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

  if (!forecast) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No forecast available.</Text>
      </View>
    );
  }

  const formatDateRange = () => {
    const start = new Date(forecast.weekStartDate);
    const end = new Date(forecast.weekEndDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.weekTheme}>{forecast.weeklyTheme}</Text>
          <Text style={styles.dateRange}>{formatDateRange()}</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Week Overview</Text>
          <View style={styles.card}>
            <Text style={styles.overviewText}>{forecast.overview}</Text>
          </View>
        </View>

        {/* Lucky & Challenging Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Days</Text>
          <View style={styles.daysRow}>
            <View style={[styles.dayCard, styles.luckyCard]}>
              <Text style={styles.dayCardLabel}>Lucky Days</Text>
              <Text style={styles.dayCardValue}>
                {forecast.luckyDays.join(', ')}
              </Text>
            </View>
            <View style={[styles.dayCard, styles.challengingCard]}>
              <Text style={styles.dayCardLabel}>Be Mindful</Text>
              <Text style={styles.dayCardValue}>
                {forecast.challengingDays.join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Highlights</Text>
          {forecast.dailyHighlights.map((day) => (
            <View key={day.date} style={styles.dayHighlight}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.dayDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.dayPillar}>
                  <Text style={styles.pillarText}>{day.pillar}</Text>
                  <Text style={styles.elementText}>{day.element}</Text>
                </View>
              </View>
              <View style={styles.dayContent}>
                <View style={styles.themeRow}>
                  <Text style={styles.dayTheme}>{day.theme}</Text>
                  <Text style={styles.dayRating}>{getRatingStars(day.rating)}</Text>
                </View>
                <Text style={styles.dayTip}>{day.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Four Pillars Analysis (Premium) */}
        {forecast.fourPillarsAnalysis && (
          <View style={styles.section}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
            <Text style={styles.sectionTitle}>Four Pillars Weekly Analysis</Text>

            {Object.entries(forecast.fourPillarsAnalysis).map(([key, pillar]) => (
              <View key={key} style={styles.pillarCard}>
                <Text style={styles.pillarName}>{pillar.pillarName}</Text>
                <Text style={styles.pillarInfluence}>{pillar.influence}</Text>
                <View style={styles.pillarDetails}>
                  <Text style={styles.pillarSupport}>
                    Best days: {pillar.supportiveDays.join(', ')}
                  </Text>
                  <Text style={styles.pillarAdvice}>{pillar.advice}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weekly Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Advice</Text>
          <View style={styles.adviceCard}>
            <Text style={styles.adviceText}>{forecast.advice}</Text>
          </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 24,
  },
  weekTheme: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FDF5E6',
  },
  dateRange: {
    fontSize: 16,
    color: '#D4A574',
    marginTop: 8,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  overviewText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  luckyCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  challengingCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  dayCardLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dayCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    textAlign: 'center',
  },
  dayHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5E6D3',
    padding: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  dayDate: {
    fontSize: 12,
    color: '#8B7355',
  },
  dayPillar: {
    alignItems: 'center',
  },
  pillarText: {
    fontSize: 20,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  elementText: {
    fontSize: 10,
    color: '#8B7355',
  },
  dayContent: {
    padding: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayTheme: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  dayRating: {
    fontSize: 12,
    color: '#f59e0b',
  },
  dayTip: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  premiumBadge: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  premiumBadgeText: {
    color: '#FDF5E6',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pillarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  pillarName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  pillarInfluence: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  pillarDetails: {
    backgroundColor: '#FDF5E6',
    borderRadius: 8,
    padding: 12,
  },
  pillarSupport: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 4,
  },
  pillarAdvice: {
    fontSize: 13,
    color: '#5D3A1A',
    fontStyle: 'italic',
  },
  adviceCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
  },
  adviceText: {
    fontSize: 15,
    color: '#5D3A1A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
