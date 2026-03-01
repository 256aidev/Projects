/**
 * Monthly Forecast Screen
 * Displays the user's monthly forecast
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
import { getMonthlyForecast, MonthlyForecast } from '../../api/forecasts';
import { AdBanner } from '../../components/ads';

export default function MonthlyForecastScreen() {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<MonthlyForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!user) return;

      try {
        setError(null);
        const data = await getMonthlyForecast(user.id);
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
          <Text style={styles.monthText}>{forecast.month}</Text>
          <Text style={styles.yearText}>{forecast.year}</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.card}>
            <Text style={styles.overviewText}>{forecast.overview}</Text>
          </View>
        </View>

        {/* Weekly Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Highlights</Text>
          {forecast.weeklyHighlights.map((week) => (
            <View key={week.weekNumber} style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
                <Text style={styles.weekDates}>{week.dateRange}</Text>
              </View>
              <Text style={styles.weekTheme}>{week.theme}</Text>
              <Text style={styles.weekDescription}>{week.description}</Text>
            </View>
          ))}
        </View>

        {/* Key Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Dates</Text>
          <View style={styles.card}>
            {forecast.keyDates.map((keyDate, index) => (
              <View
                key={index}
                style={[
                  styles.keyDateRow,
                  index < forecast.keyDates.length - 1 && styles.keyDateBorder,
                ]}
              >
                <View style={styles.keyDateInfo}>
                  <Text style={styles.keyDateDate}>{keyDate.date}</Text>
                  <Text style={styles.keyDateSignificance}>{keyDate.significance}</Text>
                </View>
                <Text style={styles.keyDateRecommendation}>{keyDate.recommendation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Elements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elemental Influences</Text>
          <View style={styles.elementsRow}>
            <View style={[styles.elementCard, styles.luckyCard]}>
              <Text style={styles.elementLabel}>Lucky Elements</Text>
              <Text style={styles.elementValue}>
                {forecast.luckyElements.join(', ')}
              </Text>
            </View>
            <View style={[styles.elementCard, styles.challengingCard]}>
              <Text style={styles.elementLabel}>Challenging</Text>
              <Text style={styles.elementValue}>
                {forecast.challengingElements.join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Advice</Text>
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
  monthText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FDF5E6',
  },
  yearText: {
    fontSize: 18,
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
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  weekDates: {
    fontSize: 12,
    color: '#8B7355',
  },
  weekTheme: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 4,
  },
  weekDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  keyDateRow: {
    paddingVertical: 12,
  },
  keyDateBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D3',
  },
  keyDateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  keyDateDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  keyDateSignificance: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  keyDateRecommendation: {
    fontSize: 13,
    color: '#8B7355',
  },
  elementsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  elementCard: {
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
  elementLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  elementValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
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
