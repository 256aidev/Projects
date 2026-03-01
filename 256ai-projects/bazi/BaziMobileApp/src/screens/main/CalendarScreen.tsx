/**
 * Calendar Screen
 * Browse readings by date - single scrollable bar with past, today, and future dates
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../auth';
import { usePurchases } from '../../purchases';
import { getDailyReading } from '../../api/readings';
import { DailyReading } from '../../types';
import { ApiError } from '../../api';
import { AdBanner, interstitialManager } from '../../components/ads';
import { adGatedAccessManager } from '../../ads';
import { translatePillar, translateReadingContent } from '../../utils/translateChinese';
import { LuckyHoursChart } from '../../components/LuckyHoursChart';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { hasRemoveAds } = usePurchases();

  const dateScrollRef = useRef<ScrollView>(null);
  // Use local date (not UTC) to avoid timezone shift
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShowingAd, setIsShowingAd] = useState(false);
  // Track unlocked dates in component state to trigger re-renders
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set());

  // Load today's reading on mount
  useEffect(() => {
    if (user) {
      loadReading(today);
    }
  }, [user]);

  // Generate all dates: 14 days prior + today + 7 days future = 22 days total
  const generateAllDates = useCallback(() => {
    const now = new Date();
    const dates: { date: Date; isFuture: boolean }[] = [];

    // 14 days prior through 7 days future (-14 to +7)
    for (let i = -14; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      dates.push({
        date,
        isFuture: i > 0, // Future if day offset > 0
      });
    }

    return dates;
  }, []);

  const formatDate = (date: Date) => {
    return getLocalDateString(date);
  };

  const formatDisplayDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  const loadReading = async (dateStr: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const isToday = dateStr === today;
      const data = await getDailyReading(user.id, isToday ? undefined : dateStr);
      setReading(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to load reading for this date.';
      setError(message);
      setReading(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a future date is accessible (premium user or already unlocked this session)
  const isFutureDateAccessible = (dateStr: string): boolean => {
    return hasRemoveAds || adGatedAccessManager.isFutureDateUnlocked(dateStr) || unlockedDates.has(dateStr);
  };

  const handleDateSelect = async (date: Date, isFuture: boolean) => {
    const dateStr = formatDate(date);

    // Past/today dates - always accessible
    if (!isFuture) {
      setSelectedDate(dateStr);
      loadReading(dateStr);
      return;
    }

    // Future date - check if already accessible
    if (isFutureDateAccessible(dateStr)) {
      setSelectedDate(dateStr);
      loadReading(dateStr);
      return;
    }

    // Need to show an ad to unlock this specific future date
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        // Unlock this specific date
        adGatedAccessManager.unlockFutureDate(dateStr);
        setUnlockedDates(prev => new Set(prev).add(dateStr));
        setSelectedDate(dateStr);
        loadReading(dateStr);
      } else {
        // Ad not available - show premium prompt
        Alert.alert(
          'Future Readings',
          'Watch a short ad to unlock this date, or upgrade to Premium for unlimited access.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsShowingAd(false);
    }
  };

  const allDates = generateAllDates();

  // Scroll to today's date on mount (index 14 = today)
  useEffect(() => {
    setTimeout(() => {
      dateScrollRef.current?.scrollTo({ x: 14 * 62, animated: false }); // ~62px per date card
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      {/* Date Selector Bar */}
      <View style={styles.dateBarContainer}>
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollerContent}
        >
          {allDates.map(({ date, isFuture }) => {
            const dateStr = formatDate(date);
            const { day, date: dayNum, month } = formatDisplayDate(date);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === today;
            // Future dates show ad icon if not yet unlocked (unless premium)
            const needsAd = isFuture && !hasRemoveAds && !isFutureDateAccessible(dateStr);

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                  isToday && !isSelected && styles.dateCardToday,
                  needsAd && styles.dateCardNeedsAd,
                ]}
                onPress={() => handleDateSelect(date, isFuture)}
                disabled={isShowingAd}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  needsAd && styles.dayTextNeedsAd,
                ]}>
                  {day}
                </Text>
                <Text style={[
                  styles.dateText,
                  isSelected && styles.dateTextSelected,
                  needsAd && styles.dateTextNeedsAd,
                ]}>
                  {dayNum}
                </Text>
                <Text style={[
                  styles.monthText,
                  isSelected && styles.monthTextSelected,
                  needsAd && styles.monthTextNeedsAd,
                ]}>
                  {month}
                </Text>
                {isToday && (
                  <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                )}
                {needsAd && (
                  <Text style={styles.adIcon}>AD</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Banner Ad */}
      <AdBanner />

      {/* Reading content */}
      <ScrollView style={styles.readingContainer}>
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#8B4513" />
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {reading && !isLoading && (
          <View style={styles.readingCard} key={selectedDate}>
            <Text style={styles.readingDate}>{reading.date}</Text>

            <View style={styles.pillarInfo}>
              <Text style={styles.pillarText}>{reading.daily_pillar}</Text>
              <Text style={styles.pillarTranslation}>
                {translatePillar(reading.daily_pillar || null)}
              </Text>
              <Text style={styles.elementText}>{reading.daily_element}</Text>
            </View>

            <Text style={styles.readingContent}>
              {translateReadingContent(reading.content, user?.language || 'en')}
            </Text>
            <LuckyHoursChart content={reading.content} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  dateBarContainer: {
    backgroundColor: '#F5E6D3',
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A574',
  },
  dateScrollerContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
    minWidth: 54,
    position: 'relative',
  },
  dateCardSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  dateCardToday: {
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  dateCardNeedsAd: {
    backgroundColor: '#FFF8F0',
    borderColor: '#E8C9A8',
  },
  dayText: {
    fontSize: 10,
    color: '#8B7355',
    textTransform: 'uppercase',
  },
  dayTextSelected: {
    color: '#D4A574',
  },
  dayTextNeedsAd: {
    color: '#B8956A',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginTop: 2,
  },
  dateTextSelected: {
    color: '#FDF5E6',
  },
  dateTextNeedsAd: {
    color: '#8B7355',
  },
  monthText: {
    fontSize: 9,
    color: '#8B7355',
    marginTop: 2,
  },
  monthTextSelected: {
    color: '#D4A574',
  },
  monthTextNeedsAd: {
    color: '#B8956A',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B4513',
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: '#FDF5E6',
  },
  adIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    fontWeight: '700',
    color: '#8B7355',
    backgroundColor: '#F0E0C8',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  readingContainer: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  errorText: {
    color: '#B22222',
    fontSize: 16,
    textAlign: 'center',
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  readingDate: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 12,
  },
  pillarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pillarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 12,
  },
  pillarTranslation: {
    fontSize: 14,
    color: '#8B7355',
    marginRight: 12,
  },
  elementText: {
    fontSize: 16,
    color: '#8B7355',
  },
  readingContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});
