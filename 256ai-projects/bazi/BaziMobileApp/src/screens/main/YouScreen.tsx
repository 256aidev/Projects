/**
 * You Screen
 * Individual-centered tab: readings, chart, BaZi Intelligence, forecasts
 * Goal: "This tab explains me."
 *
 * Combines content from former Readings + Profile tabs
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
import ElementBalanceChart from '../../components/ElementBalanceChart';
// BaZiIntelligenceCard removed - replaced with PersonalDailyIntelligence navigation
import { shareBaZiIdentity } from '../../utils/share';
import { YouStackParamList } from '../../navigation/YouStack';

type NavigationProp = NativeStackNavigationProp<YouStackParamList>;

// Element colors for styling
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

// Heavenly Stems (天干)
const STEMS: Record<string, { pinyin: string; element: string; polarity: string }> = {
  '甲': { pinyin: 'Jiǎ', element: 'Wood', polarity: 'Yang' },
  '乙': { pinyin: 'Yǐ', element: 'Wood', polarity: 'Yin' },
  '丙': { pinyin: 'Bǐng', element: 'Fire', polarity: 'Yang' },
  '丁': { pinyin: 'Dīng', element: 'Fire', polarity: 'Yin' },
  '戊': { pinyin: 'Wù', element: 'Earth', polarity: 'Yang' },
  '己': { pinyin: 'Jǐ', element: 'Earth', polarity: 'Yin' },
  '庚': { pinyin: 'Gēng', element: 'Metal', polarity: 'Yang' },
  '辛': { pinyin: 'Xīn', element: 'Metal', polarity: 'Yin' },
  '壬': { pinyin: 'Rén', element: 'Water', polarity: 'Yang' },
  '癸': { pinyin: 'Guǐ', element: 'Water', polarity: 'Yin' },
};

// Earthly Branches (地支)
const BRANCHES: Record<string, { pinyin: string; animal: string; element: string }> = {
  '子': { pinyin: 'Zǐ', animal: 'Rat', element: 'Water' },
  '丑': { pinyin: 'Chǒu', animal: 'Ox', element: 'Earth' },
  '寅': { pinyin: 'Yín', animal: 'Tiger', element: 'Wood' },
  '卯': { pinyin: 'Mǎo', animal: 'Rabbit', element: 'Wood' },
  '辰': { pinyin: 'Chén', animal: 'Dragon', element: 'Earth' },
  '巳': { pinyin: 'Sì', animal: 'Snake', element: 'Fire' },
  '午': { pinyin: 'Wǔ', animal: 'Horse', element: 'Fire' },
  '未': { pinyin: 'Wèi', animal: 'Goat', element: 'Earth' },
  '申': { pinyin: 'Shēn', animal: 'Monkey', element: 'Metal' },
  '酉': { pinyin: 'Yǒu', animal: 'Rooster', element: 'Metal' },
  '戌': { pinyin: 'Xū', animal: 'Dog', element: 'Earth' },
  '亥': { pinyin: 'Hài', animal: 'Pig', element: 'Water' },
};

interface PillarCardProps {
  label: string;
  pillar: string;
  description: string;
}

function PillarCard({ label, pillar, description }: PillarCardProps) {
  const [stem, branch] = pillar ? pillar.split('') : ['—', '—'];
  const stemInfo = STEMS[stem];
  const branchInfo = BRANCHES[branch];
  const stemElement = stemInfo?.element || 'Earth';
  const color = ELEMENT_COLORS[stemElement] || '#8B4513';

  return (
    <View style={styles.pillarCard}>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Text style={styles.pillarTranslation}>{translatePillar(pillar || null)}</Text>
      <View style={[styles.pillarContent, { borderColor: color }]}>
        <Text style={[styles.stem, { color }]}>{stem}</Text>
        {stemInfo && (
          <Text style={styles.translationText}>
            {stemInfo.polarity} {stemInfo.element}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={[styles.branch, { color: ELEMENT_COLORS[branchInfo?.element || 'Earth'] }]}>
          {branch}
        </Text>
        {branchInfo && <Text style={styles.translationText}>{branchInfo.animal}</Text>}
      </View>
      <Text style={styles.pillarDescription}>{description}</Text>
    </View>
  );
}

export default function YouScreen() {
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

  const handleForecastPress = async (
    contentType: 'weekly' | 'monthly' | 'yearly',
    screenName: 'WeeklyForecast' | 'MonthlyForecast' | 'YearlyForecast'
  ) => {
    if (hasRemoveAds || adGatedAccessManager.isUnlocked(contentType)) {
      navigation.navigate(screenName);
      return;
    }
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        adGatedAccessManager.unlockContent(contentType);
      }
      navigation.navigate(screenName);
    } finally {
      setIsShowingAd(false);
    }
  };

  const handleShareBaZi = () => {
    if (user) shareBaZiIdentity(user);
  };

  const handlePersonalIntelligencePress = async () => {
    if (hasRemoveAds || adGatedAccessManager.isUnlocked('personalDailyIntelligence')) {
      navigation.navigate('PersonalDailyIntelligence');
      return;
    }
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        adGatedAccessManager.unlockContent('personalDailyIntelligence');
      }
      navigation.navigate('PersonalDailyIntelligence');
    } finally {
      setIsShowingAd(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading...</Text>
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
        {/* User Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.birthInfo}>
            Born: {user.birth_date} at {user.birth_time?.slice(0, 5) || '12:00'}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Birth Info</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Reading */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Reading</Text>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#8B4513" />
              <Text style={styles.loadingCardText}>Loading your reading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : reading ? (
            <>
              <View style={styles.pillarHighlight}>
                <Text style={styles.pillarHighlightLabel}>Today's Pillar</Text>
                <Text style={styles.pillarHighlightText}>{reading.daily_pillar || '—'}</Text>
                <Text style={styles.pillarHighlightSub}>
                  {translatePillar(reading.daily_pillar || null)}
                </Text>
              </View>
              <View style={styles.readingCard}>
                <Text style={styles.readingContent}>
                  {translateReadingContent(reading.content, user.language || 'en')}
                </Text>
                {reading.content && <LuckyHoursChart content={reading.content} />}
              </View>
            </>
          ) : null}
        </View>

        {/* My Four Pillars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Four Pillars</Text>
          <Text style={styles.pillarsSubtitle}>
            Each pillar shows Heavenly Stem above, Earthly Branch below
          </Text>
          <View style={styles.pillarsRow}>
            <PillarCard label="Year" pillar={user.year_pillar || ''} description="Ancestors" />
            <PillarCard label="Month" pillar={user.month_pillar || ''} description="Career" />
            <PillarCard label="Day" pillar={user.day_pillar || ''} description="Self" />
            <PillarCard label="Hour" pillar={user.hour_pillar || ''} description="Legacy" />
          </View>
        </View>

        {/* Day Master */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Day Master</Text>
          <View style={styles.dayMasterCard}>
            <Text style={styles.dayMasterChar}>{user.day_master}</Text>
            <Text style={styles.dayMasterInfo}>{translateStem(user.day_master || null)}</Text>
          </View>
          <Text style={styles.dayMasterDesc}>
            Your Day Master represents your core self and inner nature.
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareBaZi}>
            <Text style={styles.shareButtonText}>Share My BaZi</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Daily Intelligence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Daily Intelligence</Text>
          <Text style={styles.intelligenceSubtitle}>
            Your daily cognitive guidance based on today's energy.
          </Text>
          <TouchableOpacity
            style={styles.intelligenceCard}
            onPress={handlePersonalIntelligencePress}
            disabled={isShowingAd}
          >
            <View style={styles.intelligenceCardContent}>
              <Text style={styles.intelligenceCardTitle}>View Today's Intelligence</Text>
              <Text style={styles.intelligenceCardDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('personalDailyIntelligence')
                  ? '8 personalized sections for today'
                  : 'Watch a short ad to unlock'}
              </Text>
            </View>
            {!hasRemoveAds && !adGatedAccessManager.isUnlocked('personalDailyIntelligence') && (
              <Text style={styles.adLabel}>AD</Text>
            )}
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Element Balance */}
        <ElementBalanceChart user={user} />

        {/* Forecasts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forecasts</Text>
          <TouchableOpacity
            style={styles.forecastCard}
            onPress={() => handleForecastPress('weekly', 'WeeklyForecast')}
            disabled={isShowingAd}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Weekly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('weekly')
                  ? 'View your weekly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            {!hasRemoveAds && !adGatedAccessManager.isUnlocked('weekly') && (
              <Text style={styles.adLabel}>AD</Text>
            )}
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forecastCard}
            onPress={() => handleForecastPress('monthly', 'MonthlyForecast')}
            disabled={isShowingAd}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Monthly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('monthly')
                  ? 'View your monthly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            {!hasRemoveAds && !adGatedAccessManager.isUnlocked('monthly') && (
              <Text style={styles.adLabel}>AD</Text>
            )}
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forecastCard}
            onPress={() => handleForecastPress('yearly', 'YearlyForecast')}
            disabled={isShowingAd}
          >
            <View style={styles.forecastContent}>
              <Text style={styles.forecastTitle}>Yearly Forecast</Text>
              <Text style={styles.forecastDescription}>
                {hasRemoveAds || adGatedAccessManager.isUnlocked('yearly')
                  ? 'View your yearly outlook'
                  : 'Watch a short ad to view'}
              </Text>
            </View>
            {!hasRemoveAds && !adGatedAccessManager.isUnlocked('yearly') && (
              <Text style={styles.adLabel}>AD</Text>
            )}
            <Text style={styles.forecastArrow}>&gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Reading History */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ReadingHistory')}
        >
          <Text style={styles.historyButtonText}>Reading History</Text>
          <Text style={styles.historyButtonSub}>Browse past and future readings</Text>
        </TouchableOpacity>

        {/* Achievements */}
        <TouchableOpacity
          style={styles.achievementsButton}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Text style={styles.achievementsButtonText}>View Achievements</Text>
        </TouchableOpacity>
      </ScrollView>

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
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B7355',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  birthInfo: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  editButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  editButtonText: {
    fontSize: 14,
    color: '#8B4513',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  loadingCardText: {
    marginTop: 8,
    color: '#8B7355',
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#B22222',
    textAlign: 'center',
  },
  pillarHighlight: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  pillarHighlightLabel: {
    fontSize: 12,
    color: '#D4A574',
    marginBottom: 4,
  },
  pillarHighlightText: {
    fontSize: 48,
    color: '#FDF5E6',
    fontWeight: 'bold',
  },
  pillarHighlightSub: {
    fontSize: 14,
    color: '#D4A574',
    marginTop: 4,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  readingContent: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  pillarsSubtitle: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillarCard: {
    alignItems: 'center',
    flex: 1,
  },
  pillarLabel: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '600',
  },
  pillarTranslation: {
    fontSize: 8,
    color: '#8B7355',
    marginBottom: 4,
  },
  pillarContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    width: 72,
    minHeight: 120,
  },
  stem: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  branch: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  translationText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: '#D4A574',
    marginVertical: 4,
  },
  pillarDescription: {
    fontSize: 9,
    color: '#8B7355',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dayMasterCard: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    alignSelf: 'center',
    width: 120,
  },
  dayMasterChar: {
    fontSize: 48,
    color: '#FDF5E6',
    fontWeight: 'bold',
  },
  dayMasterInfo: {
    fontSize: 14,
    color: '#D4A574',
    marginTop: 8,
  },
  dayMasterDesc: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 12,
  },
  shareButton: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  shareButtonText: {
    color: '#8B4513',
    fontSize: 14,
  },
  intelligenceSubtitle: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  intelligenceCard: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intelligenceCardContent: {
    flex: 1,
  },
  intelligenceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FDF5E6',
    marginBottom: 2,
  },
  intelligenceCardDescription: {
    fontSize: 13,
    color: '#D4A574',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
    marginBottom: 2,
  },
  forecastDescription: {
    fontSize: 13,
    color: '#8B7355',
  },
  forecastArrow: {
    fontSize: 18,
    color: '#8B7355',
    marginLeft: 8,
  },
  adLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B7355',
    backgroundColor: '#F0E0C8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    overflow: 'hidden',
  },
  historyButton: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  historyButtonSub: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  achievementsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  achievementsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
});
