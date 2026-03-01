/**
 * Profile Screen
 * Shows user's full BaZi Four Pillars chart
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../auth';
import { AdBanner } from '../../components/ads';
import { translatePillar, translateStem } from '../../utils/translateChinese';
import FamilySection from '../../components/FamilySection';
import ElementBalanceChart from '../../components/ElementBalanceChart';
import { shareBaZiIdentity } from '../../utils/share';

// Element colors for styling
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

// Heavenly Stems (天干) - 10 stems
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

// Earthly Branches (地支) - 12 branches with zodiac animals
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

interface PillarProps {
  label: string;
  pillar: string;
  description: string;
}

function PillarCard({ label, pillar, description }: PillarProps) {
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
        {/* Stem */}
        <Text style={[styles.stem, { color }]}>{stem}</Text>
        {stemInfo && (
          <Text style={styles.translationText}>
            {stemInfo.polarity} {stemInfo.element}
          </Text>
        )}

        <View style={styles.divider} />

        {/* Branch */}
        <Text style={[styles.branch, { color: ELEMENT_COLORS[branchInfo?.element || 'Earth'] }]}>
          {branch}
        </Text>
        {branchInfo && (
          <Text style={styles.translationText}>
            {branchInfo.animal}
          </Text>
        )}
      </View>
      <Text style={styles.pillarDescription}>{description}</Text>
    </View>
  );
}

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user } = useAuth();

  const handleShareBaZi = () => {
    if (user) {
      shareBaZiIdentity(user);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* User Info */}
        <View style={styles.header}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.birthInfo}>
            Born: {user.birth_date} at {user.birth_time?.slice(0, 5) || '12:00'}
          </Text>
          {user.birth_location && (
            <Text style={styles.location}>{user.birth_location}</Text>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Birth Info</Text>
          </TouchableOpacity>
        </View>

        {/* Day Master Highlight */}
        <View style={styles.dayMasterSection}>
          <Text style={styles.sectionTitle}>Day Master</Text>
          <View style={styles.dayMasterCard}>
            <Text style={styles.dayMasterChar}>{user.day_master}</Text>
            <Text style={styles.dayMasterInfo}>
              {translateStem(user.day_master || null)}
            </Text>
          </View>
          <Text style={styles.dayMasterDesc}>
            Your Day Master is the Heavenly Stem of your Day Pillar — it represents your core self and inner nature.
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareBaZi}>
            <Text style={styles.shareButtonIcon}>📤</Text>
            <Text style={styles.shareButtonText}>Share My BaZi</Text>
          </TouchableOpacity>
        </View>

        {/* Four Pillars */}
        <View style={styles.pillarsSection}>
          <Text style={styles.sectionTitle}>Your Four Pillars</Text>
          <Text style={styles.pillarsSubtitle}>
            Each pillar shows Heavenly Stem (element) above, Earthly Branch (animal) below
          </Text>
          <View style={styles.pillarsRow}>
            <PillarCard
              label="Year"
              pillar={user.year_pillar || ''}
              description="Ancestors & early life"
            />
            <PillarCard
              label="Month"
              pillar={user.month_pillar || ''}
              description="Career & parents"
            />
            <PillarCard
              label="Day"
              pillar={user.day_pillar || ''}
              description="Self & spouse"
            />
            <PillarCard
              label="Hour"
              pillar={user.hour_pillar || ''}
              description="Children & legacy"
            />
          </View>
        </View>

        {/* Element Balance Chart */}
        <ElementBalanceChart user={user} />

        {/* Family Section */}
        <FamilySection navigation={navigation} />
      </ScrollView>

      {/* Banner Ad - Fixed at bottom */}
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
    fontSize: 16,
    color: '#8B7355',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
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
    fontWeight: '500',
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
  dayMasterDesc: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  shareButtonIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
  pillarsSection: {
    marginBottom: 24,
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
    marginBottom: 2,
    fontWeight: '600',
  },
  pillarTranslation: {
    fontSize: 8,
    color: '#8B7355',
    marginBottom: 6,
    textAlign: 'center',
  },
  pillarDescription: {
    fontSize: 9,
    color: '#8B7355',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pillarContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    width: 78,
    minHeight: 140,
  },
  stem: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  branch: {
    fontSize: 26,
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
});
