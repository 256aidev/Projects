/**
 * Future Reading Screen
 * Shows reading for a specific future date
 */

import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../auth';
import { getDailyReading } from '../../api/readings';
import { DailyReading } from '../../types';
import { ApiError } from '../../api';
import { AdBanner } from '../../components/ads';
import { translatePillar, translateReadingContent, translateStem } from '../../utils/translateChinese';
import { LuckyHoursChart } from '../../components/LuckyHoursChart';
import { ShareButton } from '../../components/ShareButton';
import { shareDailyReading } from '../../utils/share';
import { ReadingsStackParamList } from '../../navigation/ReadingsStack';

type RouteProps = RouteProp<ReadingsStackParamList, 'FutureReading'>;
type NavigationProps = NativeStackNavigationProp<ReadingsStackParamList, 'FutureReading'>;

export default function FutureReadingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const { user } = useAuth();
  const { date } = route.params;

  const [reading, setReading] = useState<DailyReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Set header title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: formattedDate,
    });
  }, [navigation, formattedDate]);

  useEffect(() => {
    const fetchReading = async () => {
      if (!user) return;

      try {
        setError(null);
        const data = await getDailyReading(user.id, date);
        setReading(data);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to load reading. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReading();
  }, [user, date]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading reading...</Text>
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>Reading for</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Day's Pillar */}
        <View style={styles.pillarCard}>
          <Text style={styles.pillarLabel}>Day's Pillar</Text>
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
              : 'No reading available for this date.'}
          </Text>
          {reading?.content && <LuckyHoursChart content={reading.content} />}
        </View>

        {/* Day Master reminder */}
        <View style={styles.dayMasterCard}>
          <Text style={styles.dayMasterLabel}>Your Day Master</Text>
          <Text style={styles.dayMasterText}>
            {translateStem(user?.day_master || null)}
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
  dateHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8B7355',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3A1A',
    marginTop: 4,
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
});
