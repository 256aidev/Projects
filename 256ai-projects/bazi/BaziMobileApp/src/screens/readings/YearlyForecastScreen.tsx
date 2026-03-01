/**
 * Yearly Forecast Screen
 * Displays the user's yearly forecast
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
import { getYearlyForecast, YearlyForecast } from '../../api/forecasts';
import { AdBanner } from '../../components/ads';

function getRatingStars(rating: number): string {
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return filled + empty;
}

export default function YearlyForecastScreen() {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<YearlyForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!user) return;

      try {
        setError(null);
        const data = await getYearlyForecast(user.id);
        setForecast(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load forecast. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your forecast...</Text>
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.yearText}>{forecast.year}</Text>
          <Text style={styles.yearLabel}>Yearly Forecast</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year Overview</Text>
          <View style={styles.card}>
            <Text style={styles.overviewText}>{forecast.overview}</Text>
          </View>
        </View>

        {/* Yearly Themes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yearly Themes</Text>
          <View style={styles.card}>
            {forecast.yearlyThemes.map((theme, index) => (
              <View key={index} style={styles.themeRow}>
                <Text style={styles.themeBullet}>•</Text>
                <Text style={styles.themeText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Outlook */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Outlook</Text>
          <View style={styles.monthsGrid}>
            {forecast.monthlyOutlook.map((month) => (
              <View key={month.monthNumber} style={styles.monthCard}>
                <Text style={styles.monthName}>{month.month.substring(0, 3)}</Text>
                <Text style={styles.monthRating}>{getRatingStars(month.rating)}</Text>
                <Text style={styles.monthTheme}>{month.theme}</Text>
                <Text style={styles.monthFocus}>{month.keyFocus}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Opportunities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opportunities</Text>
          <View style={[styles.card, styles.opportunitiesCard]}>
            {forecast.opportunities.map((opportunity, index) => (
              <View key={index} style={styles.listRow}>
                <Text style={styles.listIcon}>✓</Text>
                <Text style={styles.listText}>{opportunity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges to Navigate</Text>
          <View style={[styles.card, styles.challengesCard]}>
            {forecast.challenges.map((challenge, index) => (
              <View key={index} style={styles.listRow}>
                <Text style={styles.listIconWarning}>!</Text>
                <Text style={styles.listText}>{challenge}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yearly Advice</Text>
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
  yearText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FDF5E6',
  },
  yearLabel: {
    fontSize: 16,
    color: '#D4A574',
    marginTop: 4,
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
  themeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  themeBullet: {
    fontSize: 16,
    color: '#8B4513',
    marginRight: 8,
  },
  themeText: {
    fontSize: 15,
    color: '#5D3A1A',
    flex: 1,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    alignItems: 'center',
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 4,
  },
  monthRating: {
    fontSize: 10,
    color: '#f59e0b',
    marginBottom: 4,
  },
  monthTheme: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5D3A1A',
    textAlign: 'center',
    marginBottom: 2,
  },
  monthFocus: {
    fontSize: 9,
    color: '#8B7355',
    textAlign: 'center',
  },
  opportunitiesCard: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  challengesCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listIcon: {
    fontSize: 14,
    color: '#22c55e',
    marginRight: 8,
    fontWeight: 'bold',
  },
  listIconWarning: {
    fontSize: 14,
    color: '#f59e0b',
    marginRight: 8,
    fontWeight: 'bold',
  },
  listText: {
    fontSize: 14,
    color: '#5D3A1A',
    flex: 1,
    lineHeight: 20,
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
