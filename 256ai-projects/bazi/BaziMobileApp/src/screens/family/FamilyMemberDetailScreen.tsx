/**
 * Family Member Detail Screen
 * Shows family member's chart and compatibility reading
 */

import React, { useState, useEffect } from 'react';
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
import { useAchievements } from '../../achievements';
import { getCompatibilityReading, deleteFamilyMember, ApiError } from '../../api';
import { FamilyMember, CompatibilityReading, DailyRelationshipReading } from '../../types';
import { translatePillar, translateStem } from '../../utils/translateChinese';
import { shareCompatibility } from '../../utils/share';
import ShareButton from '../../components/ShareButton';
import { interstitialManager } from '../../components/ads';
import { adGatedAccessManager } from '../../ads';
import RelationshipGridChart from '../../components/RelationshipGridChart';

// Standard disclaimer for all relationship readings
const RELATIONSHIP_DISCLAIMER = "This describes relationship dynamics and daily influences. Long-term outcomes depend on personal choices.";

// Element colors for styling
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

// Heavenly Stems
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

// Earthly Branches
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

interface FamilyMemberDetailScreenProps {
  navigation: any;
  route: {
    params: {
      member: FamilyMember;
    };
  };
}

interface PillarProps {
  label: string;
  pillar: string;
}

function PillarCard({ label, pillar }: PillarProps) {
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
        {branchInfo && (
          <Text style={styles.translationText}>
            {branchInfo.animal}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function FamilyMemberDetailScreen({ navigation, route }: FamilyMemberDetailScreenProps) {
  const { user } = useAuth();
  const { member } = route.params;
  const { hasRemoveAds } = usePurchases();
  const { trackCompatibilityView } = useAchievements();
  const [compatibility, setCompatibility] = useState<CompatibilityReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShowingAd, setIsShowingAd] = useState(false);
  // Daily relationship reading state
  const [dailyReading, setDailyReading] = useState<DailyRelationshipReading | null>(null);
  const [isDailyUnlocked, setIsDailyUnlocked] = useState(false);
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);

  // Check if forecasts are unlocked (via ad-gating or premium)
  const isWeeklyUnlocked = hasRemoveAds || adGatedAccessManager.isUnlocked('weekly');
  const isMonthlyUnlocked = hasRemoveAds || adGatedAccessManager.isUnlocked('monthly');
  const isYearlyUnlocked = hasRemoveAds || adGatedAccessManager.isUnlocked('yearly');

  useEffect(() => {
    loadCompatibility();
  }, []);

  const loadCompatibility = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getCompatibilityReading(user.id, member.id, {
        day_master: user.day_master,
        day_master_element: user.day_master_element,
        year_pillar: user.year_pillar,
        day_pillar: user.day_pillar,
      });
      setCompatibility(data);
      // Track compatibility view for achievements
      trackCompatibilityView();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load compatibility reading');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareCompatibility = () => {
    shareCompatibility(member.name, compatibility?.compatibility_score);
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteFamilyMember(user.id, member.id);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove family member');
            }
          },
        },
      ]
    );
  };

  const getRelationshipLabel = () => {
    switch (member.relationship) {
      case 'spouse':
        return 'Your Spouse';
      case 'child':
        return 'Your Child';
      case 'parent':
        return 'Your Parent';
      default:
        return 'Family Member';
    }
  };

  // Unlock and load daily relationship reading
  const unlockDailyReading = async () => {
    if (isDailyUnlocked || hasRemoveAds) {
      // Already unlocked, just show
      setIsDailyUnlocked(true);
      return;
    }

    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        setIsDailyUnlocked(true);
        // Generate a contextual daily reading based on compatibility
        if (compatibility) {
          const todayReading: DailyRelationshipReading = {
            user_id: user?.id || 0,
            partner_id: member.id,
            date: new Date().toISOString().split('T')[0],
            content: generateDailyRelationshipContent(compatibility),
            generated_at: new Date().toISOString(),
          };
          setDailyReading(todayReading);
        }
      }
    } finally {
      setIsShowingAd(false);
    }
  };

  // Generate contextual daily relationship guidance
  const generateDailyRelationshipContent = (compat: CompatibilityReading): string => {
    const dayOfWeek = new Date().getDay();
    const tips = [
      "Today favors patience and clarity. Listening before responding will reduce friction.",
      "A good day for appreciation and small gestures. Express gratitude for what works.",
      "Focus on shared goals today. Collaboration brings you closer.",
      "Give each other space when needed. Independence strengthens connection.",
      "Today supports open communication. Address small concerns before they grow.",
      "A day for nurturing. Small acts of care have big impact.",
      "Reflect on your shared journey. Acknowledge growth and progress together.",
    ];
    return tips[dayOfWeek];
  };

  const navigateToForecast = async (period: 'weekly' | 'monthly' | 'yearly') => {
    // Check if already unlocked
    if (hasRemoveAds || adGatedAccessManager.isUnlocked(period)) {
      navigation.navigate('CompatibilityForecast', { member, period });
      return;
    }

    // Show ad to unlock
    setIsShowingAd(true);
    try {
      const adShown = await interstitialManager.show();
      if (adShown) {
        adGatedAccessManager.unlockContent(period);
      }
      // Navigate regardless (ad might not be loaded yet)
      navigation.navigate('CompatibilityForecast', { member, period });
    } finally {
      setIsShowingAd(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Member Info */}
      <View style={styles.header}>
        <Text style={styles.relationLabel}>{getRelationshipLabel()}</Text>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.birthInfo}>
          Born: {member.birth_date} at {member.birth_time?.slice(0, 5) || '12:00'}
        </Text>
        {member.birth_location && (
          <Text style={styles.location}>{member.birth_location}</Text>
        )}
      </View>

      {/* Day Master */}
      {member.day_master && (
        <View style={styles.dayMasterSection}>
          <Text style={styles.sectionTitle}>Day Master</Text>
          <View style={styles.dayMasterCard}>
            <Text style={styles.dayMasterChar}>{member.day_master}</Text>
            <Text style={styles.dayMasterInfo}>
              {translateStem(member.day_master || null)}
            </Text>
          </View>
        </View>
      )}

      {/* Four Pillars */}
      {member.year_pillar && (
        <View style={styles.pillarsSection}>
          <Text style={styles.sectionTitle}>Four Pillars</Text>
          <View style={styles.pillarsRow}>
            <PillarCard label="Year" pillar={member.year_pillar || ''} />
            <PillarCard label="Month" pillar={member.month_pillar || ''} />
            <PillarCard label="Day" pillar={member.day_pillar || ''} />
            <PillarCard label="Hour" pillar={member.hour_pillar || ''} />
          </View>
        </View>
      )}

      {/* Section 1: Relationship Chart (Primary) */}
      <View style={styles.compatibilitySection}>
        <View style={styles.compatibilityHeader}>
          <Text style={styles.sectionTitle}>Your Relationship Dynamic</Text>
          {compatibility && (
            <ShareButton onPress={handleShareCompatibility} variant="icon" />
          )}
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B4513" />
            <Text style={styles.loadingText}>Analyzing relationship dynamics...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCompatibility}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : compatibility ? (
          <RelationshipGridChart
            easeScore={compatibility.ease_score ?? compatibility.compatibility_score ?? 50}
            durabilityScore={compatibility.durability_score ?? compatibility.compatibility_score ?? 50}
            displayEase={compatibility.display_ease}
            displayDurability={compatibility.display_durability}
            effortLabel={compatibility.effort_label ?? 'Workable with Intention'}
            quadrantInterpretation={compatibility.quadrant_interpretation}
            effortFraming={compatibility.effort_framing}
          />
        ) : (
          <Text style={styles.placeholderText}>
            Relationship analysis will appear here.
          </Text>
        )}
      </View>

      {/* Section 2: Relationship Forecasts with Segmented Control */}
      <View style={styles.forecastSection}>
        <Text style={styles.sectionTitle}>Relationship Forecasts</Text>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, styles.segmentButtonActive]}
            onPress={unlockDailyReading}
            disabled={isShowingAd}
          >
            <Text style={[styles.segmentText, styles.segmentTextActive]}>Today</Text>
            {!isDailyUnlocked && !hasRemoveAds && <Text style={styles.segmentAdBadge}>Ad</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, isWeeklyUnlocked && styles.segmentButtonUnlocked]}
            onPress={() => navigateToForecast('weekly')}
            disabled={isShowingAd}
          >
            <Text style={styles.segmentText}>Weekly</Text>
            {!isWeeklyUnlocked && <Text style={styles.segmentAdBadge}>Ad</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, isMonthlyUnlocked && styles.segmentButtonUnlocked]}
            onPress={() => navigateToForecast('monthly')}
            disabled={isShowingAd}
          >
            <Text style={styles.segmentText}>Monthly</Text>
            {!isMonthlyUnlocked && <Text style={styles.segmentAdBadge}>Ad</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, isYearlyUnlocked && styles.segmentButtonUnlocked]}
            onPress={() => navigateToForecast('yearly')}
            disabled={isShowingAd}
          >
            <Text style={styles.segmentText}>Yearly</Text>
            {!isYearlyUnlocked && <Text style={styles.segmentAdBadge}>Ad</Text>}
          </TouchableOpacity>
        </View>

        {/* Today's Reading Content (shown when unlocked) */}
        {(isDailyUnlocked || hasRemoveAds) ? (
          <View style={styles.forecastContent}>
            <Text style={styles.forecastContentTitle}>Today's Focus</Text>
            <Text style={styles.forecastContentText}>
              {dailyReading?.content || generateDailyRelationshipContent(compatibility || {} as CompatibilityReading)}
            </Text>
          </View>
        ) : (
          <View style={styles.forecastLockedContent}>
            <Text style={styles.forecastLockedIcon}>🔒</Text>
            <Text style={styles.forecastLockedText}>
              Tap "Today" above to watch an ad and unlock daily guidance
            </Text>
          </View>
        )}
      </View>

      {/* Section 3: Strengths & Growth Areas */}
      {compatibility && (compatibility.strengths?.length || compatibility.watchouts?.length) ? (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Relationship Insights</Text>
          {compatibility.strengths && compatibility.strengths.length > 0 && (
            <View style={styles.insightBlock}>
              <Text style={styles.insightLabel}>Strengths</Text>
              {compatibility.strengths.map((strength, idx) => (
                <Text key={idx} style={styles.insightItem}>• {strength}</Text>
              ))}
            </View>
          )}
          {compatibility.watchouts && compatibility.watchouts.length > 0 && (
            <View style={styles.insightBlock}>
              <Text style={styles.insightLabel}>Areas for Awareness</Text>
              {compatibility.watchouts.map((watchout, idx) => (
                <Text key={idx} style={styles.insightItem}>• {watchout}</Text>
              ))}
            </View>
          )}
        </View>
      ) : null}


      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>{RELATIONSHIP_DISCLAIMER}</Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Remove {member.name}</Text>
      </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  relationLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  birthInfo: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  dayMasterSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  dayMasterCard: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
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
  pillarsSection: {
    marginBottom: 24,
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
    marginBottom: 2,
    fontWeight: '600',
  },
  pillarTranslation: {
    fontSize: 8,
    color: '#8B7355',
    marginBottom: 6,
    textAlign: 'center',
  },
  pillarContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    width: 78,
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
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: 50,
    backgroundColor: '#D4A574',
    marginVertical: 6,
  },
  compatibilitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 24,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  readingContent: {
    marginTop: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 24,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  readingText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
  generatedAt: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 12,
    fontStyle: 'italic',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 12,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC143C',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: '500',
  },
  // Forecast section styles (with segmented control)
  forecastSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
    position: 'relative',
  },
  segmentButtonActive: {
    backgroundColor: '#8B4513',
  },
  segmentButtonUnlocked: {
    backgroundColor: '#E8F5E9',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentAdBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 8,
    color: '#8B7355',
  },
  forecastContent: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
  },
  forecastContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 8,
  },
  forecastContentText: {
    fontSize: 15,
    color: '#5D3A1A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  forecastLockedContent: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderStyle: 'dashed',
  },
  forecastLockedIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  forecastLockedText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  // Insights section styles
  insightsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 24,
  },
  insightBlock: {
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 6,
  },
  insightItem: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginLeft: 4,
    marginBottom: 4,
  },
  // Disclaimer styles
  disclaimerContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
