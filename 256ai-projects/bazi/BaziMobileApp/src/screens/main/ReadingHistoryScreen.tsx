/**
 * Reading History Screen
 * Browse readings by date - past and future readings
 * Renamed from CalendarScreen, accessed as sub-screen from You tab
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

export default function ReadingHistoryScreen() {
  const { user } = useAuth();
  const { hasRemoveAds } = usePurchases();

  const dateScrollRef = useRef<ScrollView>(null);

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
  const [unlockedDates, setUnlockedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadReading(today);
    }
  }, [user]);

  const generateAllDates = useCallback(() => {
    const now = new Date();
    const dates: { date: Date; isFuture: boolean }[] = [];
    for (let i = -14; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      dates.push({ date, isFuture: i > 0 });
    }
    return dates;
  }, []);

  const formatDate = (date: Date) => getLocalDateString(date);

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
        err instanceof ApiError ? err.message : 'Failed to load reading for this date.';
      setError(message);
      setReading(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isFutureDateAccessible = (dateStr: string): boolean => {
    return hasRemoveAds || adGatedAccessManager.isFutureDateUnlocked(dateStr) || unlockedDates.has(dateStr);
  };

  const handleDateSelect = async (date: Date, isFuture: boolean) => {
    const dateStr = formatDate(date);
    if (!isFuture) {
      setSelectedDate(dateStr);
      loadReading(dateStr);
      return;
    }
    if (isFutureDateAccessible(dateStr)) {
      setSelectedDate(dateStr);
      loadReading(dateStr);
      return;
    }
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        adGatedAccessManager.unlockFutureDate(dateStr);
        setUnlockedDates(prev => new Set(prev).add(dateStr));
        setSelectedDate(dateStr);
        loadReading(dateStr);
      } else {
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

  useEffect(() => {
    setTimeout(() => {
      dateScrollRef.current?.scrollTo({ x: 14 * 62, animated: false });
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
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
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{dayNum}</Text>
                <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>{month}</Text>
                {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
                {needsAd && <Text style={styles.adIcon}>AD</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <AdBanner />

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
          <View style={styles.readingCard}>
            <Text style={styles.readingDate}>{reading.date}</Text>
            <View style={styles.pillarInfo}>
              <Text style={styles.pillarText}>{reading.daily_pillar}</Text>
              <Text style={styles.pillarTranslation}>{translatePillar(reading.daily_pillar || null)}</Text>
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
  container: { flex: 1, backgroundColor: '#FDF5E6' },
  dateBarContainer: {
    backgroundColor: '#F5E6D3',
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D4A574',
  },
  dateScrollerContent: { paddingHorizontal: 12, paddingTop: 4 },
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
  dateCardSelected: { backgroundColor: '#8B4513', borderColor: '#8B4513' },
  dateCardToday: { borderWidth: 2, borderColor: '#8B4513' },
  dateCardNeedsAd: { backgroundColor: '#FFF8F0', borderColor: '#E8C9A8' },
  dayText: { fontSize: 10, color: '#8B7355', textTransform: 'uppercase' },
  dayTextSelected: { color: '#D4A574' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#5D3A1A', marginTop: 2 },
  dateTextSelected: { color: '#FDF5E6' },
  monthText: { fontSize: 9, color: '#8B7355', marginTop: 2 },
  monthTextSelected: { color: '#D4A574' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B4513', marginTop: 4 },
  todayDotSelected: { backgroundColor: '#FDF5E6' },
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
  },
  readingContainer: { flex: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  errorText: { color: '#B22222', fontSize: 16, textAlign: 'center' },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  readingDate: { fontSize: 14, color: '#8B7355', marginBottom: 12 },
  pillarInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pillarText: { fontSize: 32, fontWeight: 'bold', color: '#8B4513', marginRight: 12 },
  pillarTranslation: { fontSize: 14, color: '#8B7355', marginRight: 12 },
  elementText: { fontSize: 16, color: '#8B7355' },
  readingContent: { fontSize: 16, color: '#333333', lineHeight: 24 },
});
