/**
 * Four Pillars Screen
 * Comprehensive educational content about the Four Pillars (Year, Month, Day, Hour)
 * Encyclopedia-style verbose content - loads with app, no API needed
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AdBanner } from '../../components/ads';

interface PillarData {
  name: string;
  chinese: string;
  icon: string;
  color: string;
  represents: string;
  timeframe: string;
  relationships: string;
  influences: string[];
  characteristics: string;
  heavenlyAspects: string;
  earthlyAspects: string;
  practicalMeaning: string;
  notAbout: string[];
}

const PILLARS: PillarData[] = [
  {
    name: 'Year Pillar',
    chinese: '年柱',
    icon: '🌳',
    color: '#228B22',
    represents: 'Your ancestry, social self, and early life environment',
    timeframe: 'Ages 0-16 and your connection to family lineage',
    relationships: 'Grandparents, extended family, ancestral influences',
    influences: [
      'How others perceive you in social and professional settings',
      'Your inherited traits and family patterns',
      'Your relationship with society and community',
      'The environment you were born into',
      'Cultural and generational influences on your character',
    ],
    characteristics: 'The Year Pillar represents the outermost layer of your being — how you appear to the world at first glance, and the foundation laid by your family and ancestors. It reflects the energy of your birth year and carries the imprint of your generation. People born in the same year share certain collective traits and challenges, though individual charts vary significantly.',
    heavenlyAspects: 'The Heavenly Stem of your Year Pillar shows your inherited nature — qualities passed down through your lineage that influence how you naturally present yourself to strangers and in public settings. This is often what people notice about you before they know you well.',
    earthlyAspects: 'The Earthly Branch (your zodiac animal) of the Year Pillar reflects the environmental and societal conditions of your birth year. It also indicates your relationship dynamics with grandparents and your place within the broader family structure.',
    practicalMeaning: 'When reading your Year Pillar, consider: What energy did you inherit? How do you naturally appear to new acquaintances? What generational themes might influence your life path? The Year Pillar doesn\'t determine your core identity, but it provides the backdrop against which your story unfolds.',
    notAbout: [
      'Your true inner self (that\'s the Day Pillar)',
      'Your daily personality (that\'s the Day Master)',
      'Your career success or failure',
      'Fixed destiny or unchangeable fate',
    ],
  },
  {
    name: 'Month Pillar',
    chinese: '月柱',
    icon: '🌙',
    color: '#4169E1',
    represents: 'Your career path, parents, and growth period',
    timeframe: 'Ages 17-32, your formative adult years',
    relationships: 'Parents, mentors, authority figures, employers',
    influences: [
      'Your natural approach to work and career',
      'Relationship dynamics with parents',
      'How you develop skills and build expertise',
      'Your response to authority and structure',
      'The seasonal energy at your birth',
    ],
    characteristics: 'The Month Pillar is considered one of the most influential pillars because it determines the seasonal strength of your Day Master. Just as plants grow differently depending on the season they\'re planted in, your Day Master\'s characteristics are profoundly shaped by the month of your birth. This pillar reveals the environmental conditions that nurtured (or challenged) your early development.',
    heavenlyAspects: 'The Heavenly Stem of your Month Pillar indicates your relationship with authority figures, particularly parents. It shows how you naturally approach career matters and what kind of support (or obstacles) you may encounter in professional development. This stem often reflects the dominant energy in your household during childhood.',
    earthlyAspects: 'The Earthly Branch of the Month Pillar reveals the seasonal influence on your chart. A Day Master born in a season that supports its element will express differently than one born in a challenging season. This branch also indicates hidden resources and the nature of your relationship with your mother\'s side of the family.',
    practicalMeaning: 'The Month Pillar answers questions like: What work environments suit you? How do you naturally approach building a career? What was the energy dynamic with your parents? Understanding this pillar helps you align your professional path with your natural inclinations rather than fighting against your inherent tendencies.',
    notAbout: [
      'Your guaranteed career success',
      'Whether you will be wealthy',
      'Judging your parents',
      'Predicting specific job outcomes',
    ],
  },
  {
    name: 'Day Pillar',
    chinese: '日柱',
    icon: '☀️',
    color: '#DAA520',
    represents: 'Your core self, spouse, and true identity',
    timeframe: 'Ages 33-48, your prime years',
    relationships: 'Self, spouse, life partner, closest relationships',
    influences: [
      'Your fundamental personality and inner nature',
      'How you approach intimate relationships',
      'Your core values and decision-making style',
      'Your true self when no one is watching',
      'Compatibility with life partners',
    ],
    characteristics: 'The Day Pillar is the heart of your BaZi chart. While the Year Pillar shows how others see you and the Month Pillar shows your career approach, the Day Pillar reveals who you truly are at your core. The Heavenly Stem of this pillar is called your "Day Master" and represents your fundamental nature — the lens through which you experience and interact with all of life.',
    heavenlyAspects: 'Your Day Master (the Heavenly Stem of the Day Pillar) is the single most important element in your entire chart. It defines your core elemental nature: Wood, Fire, Earth, Metal, or Water, in either Yang or Yin polarity. Understanding your Day Master is essential because every other element in your chart is interpreted in relation to it. Your Day Master isn\'t just a description — it\'s the center of your personal universe in BaZi.',
    earthlyAspects: 'The Earthly Branch of your Day Pillar represents your spouse palace — the energy space for intimate partnerships. This doesn\'t predict who you\'ll marry, but it reveals the type of energy dynamics you naturally attract and create in close relationships. It also contains hidden stems that add layers to your personality.',
    practicalMeaning: 'When someone asks "What is your BaZi?", they\'re really asking about your Day Master. This is where you discover your thinking style, emotional patterns, natural strengths, and areas that require more conscious effort. Understanding your Day Master helps you work with your nature rather than against it.',
    notAbout: [
      'Predicting who you will marry',
      'Determining relationship success or failure',
      'Judging compatibility as "good" or "bad"',
      'Fixed personality that cannot grow',
    ],
  },
  {
    name: 'Hour Pillar',
    chinese: '時柱',
    icon: '⭐',
    color: '#9370DB',
    represents: 'Your children, legacy, inner self, and later life',
    timeframe: 'Ages 49+, your wisdom years and lasting impact',
    relationships: 'Children, students, subordinates, legacy',
    influences: [
      'Your relationship with children and younger generations',
      'Your private inner world and secret desires',
      'What you create and leave behind',
      'Your approach to mentoring others',
      'Hidden aspects of your personality',
    ],
    characteristics: 'The Hour Pillar represents the most private layer of your being — the part of yourself that only you truly know. It also indicates your relationship with the future through children, students, and legacy. While the Year Pillar shows your public face, the Hour Pillar reveals your private heart and the mark you wish to leave on the world.',
    heavenlyAspects: 'The Heavenly Stem of your Hour Pillar indicates your deepest aspirations and the energy you bring to nurturing the next generation. This can manifest as children, creative projects, students, or any legacy you build. It shows what you secretly hope to achieve or become, even if you rarely speak of it.',
    earthlyAspects: 'The Earthly Branch of the Hour Pillar relates to your children palace — not predicting whether you\'ll have children, but describing the energy dynamic in that area of life. It also reveals hidden depths of your personality that emerge later in life, or in moments of complete privacy and authenticity.',
    practicalMeaning: 'The Hour Pillar answers questions about your inner life: What do you dream about when no one is looking? How do you naturally relate to those younger than you? What kind of legacy matters to you? As you age, this pillar\'s influence often becomes more apparent as people grow into their authentic selves.',
    notAbout: [
      'Predicting if you will have children',
      'Guaranteeing success in later life',
      'Determining your final years',
      'Fixed predictions about legacy',
    ],
  },
];

export default function FourPillarsScreen() {
  const [selectedPillar, setSelectedPillar] = useState<string>('Year Pillar');

  const currentPillar = PILLARS.find(p => p.name === selectedPillar) || PILLARS[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>The Four Pillars</Text>
          <Text style={styles.headerSubtitle}>
            Si Zhu (四柱) — the four columns that form the foundation of your BaZi chart,
            each representing different aspects of your life and relationships.
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Understanding the Pillars</Text>
          <Text style={styles.introText}>
            A complete BaZi chart consists of four pillars, each derived from the year,
            month, day, and hour of your birth. Each pillar contains two characters:
            a Heavenly Stem on top (天干) and an Earthly Branch below (地支), creating
            eight characters total — hence the name "BaZi" (八字, meaning "Eight Characters").
          </Text>
          <Text style={styles.introText}>
            While all four pillars are important, they represent different layers of your
            being and different time periods in your life. Together, they form a complete
            picture of your energetic blueprint.
          </Text>
        </View>

        {/* Pillar Selector */}
        <View style={styles.selector}>
          {PILLARS.map((pillar) => (
            <TouchableOpacity
              key={pillar.name}
              style={[
                styles.selectorButton,
                selectedPillar === pillar.name && styles.selectorButtonActive,
                { borderColor: pillar.color },
              ]}
              onPress={() => setSelectedPillar(pillar.name)}
            >
              <Text style={styles.selectorIcon}>{pillar.icon}</Text>
              <Text style={[
                styles.selectorName,
                selectedPillar === pillar.name && styles.selectorNameActive,
              ]}>
                {pillar.name.split(' ')[0]}
              </Text>
              <Text style={[styles.selectorChinese, { color: pillar.color }]}>
                {pillar.chinese}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pillar Detail */}
        <View style={[styles.detailCard, { borderColor: currentPillar.color }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailIcon}>{currentPillar.icon}</Text>
            <View>
              <Text style={styles.detailName}>{currentPillar.name}</Text>
              <Text style={[styles.detailChinese, { color: currentPillar.color }]}>
                {currentPillar.chinese}
              </Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>What It Represents</Text>
            <Text style={styles.detailText}>{currentPillar.represents}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailRowItem}>
              <Text style={styles.detailLabel}>Timeframe</Text>
              <Text style={styles.detailValue}>{currentPillar.timeframe}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Key Relationships</Text>
            <Text style={styles.detailText}>{currentPillar.relationships}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Areas of Influence</Text>
            {currentPillar.influences.map((influence, index) => (
              <View key={index} style={styles.influenceItem}>
                <Text style={styles.influenceBullet}>•</Text>
                <Text style={styles.influenceText}>{influence}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Extended Content */}
        <View style={styles.extendedCard}>
          <Text style={styles.extendedTitle}>Deep Dive: {currentPillar.name}</Text>

          <Text style={styles.extendedSectionTitle}>Characteristics</Text>
          <Text style={styles.extendedText}>{currentPillar.characteristics}</Text>

          <Text style={styles.extendedSectionTitle}>The Heavenly Stem</Text>
          <Text style={styles.extendedText}>{currentPillar.heavenlyAspects}</Text>

          <Text style={styles.extendedSectionTitle}>The Earthly Branch</Text>
          <Text style={styles.extendedText}>{currentPillar.earthlyAspects}</Text>

          <Text style={styles.extendedSectionTitle}>Practical Meaning</Text>
          <Text style={styles.extendedText}>{currentPillar.practicalMeaning}</Text>
        </View>

        {/* What It's NOT */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>What the {currentPillar.name} is NOT About</Text>
          {currentPillar.notAbout.map((item, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningBullet}>✕</Text>
              <Text style={styles.warningText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Pillar Interaction */}
        <View style={styles.interactionCard}>
          <Text style={styles.interactionTitle}>How the Pillars Work Together</Text>
          <Text style={styles.interactionText}>
            No pillar exists in isolation. Your Year, Month, Day, and Hour pillars constantly
            interact with each other, creating combinations, tensions, and transformations.
            A chart reading considers all four pillars together, examining how their elements
            support or challenge each other.
          </Text>
          <Text style={styles.interactionText}>
            The relationship between pillars also matters: harmony between Year and Month
            often indicates supportive family and career conditions, while the Day and Hour
            pillars together reveal the integration between your outer and inner self.
          </Text>
          <View style={styles.pillarsFlow}>
            <Text style={styles.pillarsFlowItem}>🌳 Year{'\n'}(Outer)</Text>
            <Text style={styles.pillarsFlowArrow}>↔</Text>
            <Text style={styles.pillarsFlowItem}>🌙 Month{'\n'}(Growth)</Text>
            <Text style={styles.pillarsFlowArrow}>↔</Text>
            <Text style={styles.pillarsFlowItem}>☀️ Day{'\n'}(Core)</Text>
            <Text style={styles.pillarsFlowArrow}>↔</Text>
            <Text style={styles.pillarsFlowItem}>⭐ Hour{'\n'}(Inner)</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            BaZi describes patterns and effort. Outcomes depend on personal choices.
            The Four Pillars reveal tendencies, not certainties.
          </Text>
        </View>
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
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 21,
    marginBottom: 10,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectorButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 3,
  },
  selectorButtonActive: {
    backgroundColor: '#F5E6D3',
  },
  selectorIcon: {
    fontSize: 22,
  },
  selectorName: {
    fontSize: 10,
    color: '#8B7355',
    marginTop: 2,
  },
  selectorNameActive: {
    fontWeight: '600',
    color: '#5D3A1A',
  },
  selectorChinese: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  detailChinese: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailRowItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 21,
  },
  detailValue: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  influenceItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  influenceBullet: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 8,
  },
  influenceText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  extendedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  extendedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  extendedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 12,
    marginBottom: 6,
  },
  extendedText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5C9A8',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 12,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  warningBullet: {
    fontSize: 12,
    color: '#B8860B',
    marginRight: 8,
    fontWeight: 'bold',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
  interactionCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  interactionText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 21,
    marginBottom: 10,
  },
  pillarsFlow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  pillarsFlowItem: {
    fontSize: 11,
    color: '#5D3A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  pillarsFlowArrow: {
    fontSize: 14,
    color: '#8B7355',
    marginHorizontal: 6,
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
