/**
 * Relationship Patterns Screen
 * Comprehensive educational content about BaZi relationship patterns
 * Encyclopedia-style verbose content covering combinations, clashes, and more
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

interface PatternCategory {
  name: string;
  chinese: string;
  icon: string;
  color: string;
  nature: string;
  summary: string;
  description: string;
  examples: string[];
  howItWorks: string;
  inRelationships: string;
  practicalInsight: string;
  notMean: string[];
}

const PATTERN_CATEGORIES: PatternCategory[] = [
  {
    name: 'Combinations',
    chinese: '合',
    icon: '🤝',
    color: '#228B22',
    nature: 'Harmony & Fusion',
    summary: 'Elements that naturally attract and merge',
    description: 'Combinations (合, Hé) occur when certain Earthly Branches or Heavenly Stems are naturally drawn to each other, creating a bond that can transform their energy. Like magnets of opposite polarity, these elements attract and often merge into something new. Combinations generally indicate natural affinity, ease of connection, and the potential for deep bonding.',
    examples: [
      'Rat (子) + Ox (丑) = Earth combination — practicality meets diligence',
      'Tiger (寅) + Pig (亥) = Wood combination — growth meets wisdom',
      'Rabbit (卯) + Dog (戌) = Fire combination — gentleness meets loyalty',
      'Dragon (辰) + Rooster (酉) = Metal combination — ambition meets precision',
      'Snake (巳) + Monkey (申) = Water combination — depth meets adaptability',
      'Horse (午) + Goat (未) = Fire/Earth combination — passion meets nurturing',
    ],
    howItWorks: 'When two combining branches appear in a chart (or between two people\'s charts), they create a magnetic pull toward each other. The combination may "transform" into a new element, depending on other chart factors. Even without transformation, the combination indicates natural compatibility and mutual attraction. People with combining branches often feel an immediate sense of familiarity.',
    inRelationships: 'Combinations between two people\'s charts suggest natural affinity — you may feel comfortable together quickly, understand each other intuitively, and find collaboration easy. However, combinations don\'t guarantee relationship success; they simply indicate that the initial connection flows easily. A strong combination means less friction in the early stages, not that no effort is ever required.',
    practicalInsight: 'If you have combining branches with someone, you likely feel drawn to them without fully understanding why. This attraction isn\'t about physical appearance alone — it\'s an energetic resonance. Use this natural affinity as a foundation, but remember that all relationships need conscious cultivation.',
    notMean: [
      'Perfect compatibility with no problems',
      'That you must be in a relationship with that person',
      'Success is guaranteed',
      'Other patterns don\'t matter',
    ],
  },
  {
    name: 'Clashes',
    chinese: '沖',
    icon: '⚡',
    color: '#DC143C',
    nature: 'Tension & Movement',
    summary: 'Elements in direct opposition that create dynamic tension',
    description: 'Clashes (沖, Chōng) occur when Earthly Branches sit directly opposite each other on the zodiac wheel, creating tension and instability. Rather than merging like combinations, clashing branches push against each other. While this sounds negative, clashes are not inherently "bad" — they bring movement, change, and the energy to break through stagnation. Many successful people have clashes in their charts that drive them forward.',
    examples: [
      'Rat (子) ↔ Horse (午) — Water vs Fire: emotion vs action tension',
      'Ox (丑) ↔ Goat (未) — Earth vs Earth: stubbornness meets stubbornness',
      'Tiger (寅) ↔ Monkey (申) — Wood vs Metal: growth vs restraint',
      'Rabbit (卯) ↔ Rooster (酉) — Wood vs Metal: gentleness vs sharpness',
      'Dragon (辰) ↔ Dog (戌) — Earth vs Earth: ambition vs loyalty',
      'Snake (巳) ↔ Pig (亥) — Fire vs Water: intensity vs depth',
    ],
    howItWorks: 'Clashing branches represent opposing energies that don\'t naturally harmonize. When present in a single chart, clashes often indicate internal tension, restlessness, or a drive for change. They can manifest as periodic upheaval or as constant motivation to improve. The key is whether the person channels this energy constructively. Between two charts, clashes indicate that the relationship will require more conscious navigation.',
    inRelationships: 'Clashes between two people\'s charts don\'t mean the relationship is doomed — they mean it will require more awareness and effort. Clashing energy can actually create passion and intensity that some couples thrive on. The danger lies in unconscious reactions: without awareness, clashing partners may trigger each other\'s defensive responses. With awareness, clashes become opportunities for growth as each person expands beyond their comfort zone.',
    practicalInsight: 'If you clash with someone, you\'re likely to find them simultaneously irritating and fascinating. They challenge your assumptions and push you to grow — which can be uncomfortable but ultimately beneficial. The question isn\'t whether clashes exist, but how consciously you navigate them.',
    notMean: [
      'The relationship will fail',
      'You are incompatible',
      'One person is "wrong"',
      'You should avoid each other',
    ],
  },
  {
    name: 'Harms',
    chinese: '害',
    icon: '💔',
    color: '#8B4513',
    nature: 'Subtle Friction',
    summary: 'Elements that create hidden or gradual tension',
    description: 'Harms (害, Hài) represent a subtler form of dissonance than clashes. Where clashes are obvious and explosive, harms are insidious and cumulative. They occur when one branch "harms" another by blocking its natural combination partner. Think of it like jealousy or interference — the harming branch prevents a natural union from occurring. Over time, this creates friction that may not be immediately apparent but gradually erodes harmony.',
    examples: [
      'Rat (子) harms Goat (未) — blocking the Ox-Goat relationship',
      'Ox (丑) harms Horse (午) — blocking the Horse-Goat combination',
      'Tiger (寅) harms Snake (巳) — blocking the Snake-Monkey combination',
      'Rabbit (卯) harms Dragon (辰) — blocking the Dragon-Rooster combination',
      'Monkey (申) harms Pig (亥) — blocking the Tiger-Pig combination',
      'Rooster (酉) harms Dog (戌) — blocking the Rabbit-Dog combination',
    ],
    howItWorks: 'Harms work through interference and misunderstanding rather than direct conflict. People in harming relationships may find that their communication is frequently misinterpreted, or that small issues accumulate into larger resentments. The energy isn\'t dramatic like a clash — it\'s more like a slow leak that gradually depletes the relationship\'s reserves. Awareness is especially important because the damage isn\'t obvious until it accumulates.',
    inRelationships: 'Harming patterns between charts suggest a relationship where misunderstandings come easily and build up over time. Partners may feel like they\'re speaking different languages or that their good intentions are constantly misconstrued. The antidote is proactive communication — don\'t assume you\'ve been understood, and don\'t assume you understand. Regular check-ins and explicit conversation prevent the slow accumulation of friction.',
    practicalInsight: 'If you\'re in a harming relationship, pay attention to the small things. That minor irritation you brushed off may be part of a pattern that needs addressing. The good news is that once you\'re aware of the dynamic, you can consciously counteract it through clear, explicit communication.',
    notMean: [
      'The relationship is toxic',
      'One person is harming the other intentionally',
      'The relationship cannot work',
      'You should feel guilty or blamed',
    ],
  },
  {
    name: 'Punishments',
    chinese: '刑',
    icon: '⚖️',
    color: '#4169E1',
    nature: 'Challenge & Testing',
    summary: 'Elements that create testing dynamics requiring conscious navigation',
    description: 'Punishments (刑, Xíng) are perhaps the most misunderstood of all BaZi patterns. The Chinese character suggests legal penalty, but in BaZi context, it\'s better understood as "testing" or "challenging." Punishments occur between certain branches that, when together, create friction that tests both parties. They\'re grouped into three types: Ungrateful Punishments, Bullying Punishments, and Self-Punishments. Each works differently but all require awareness.',
    examples: [
      'Ungrateful: Tiger (寅) ↔ Snake (巳) ↔ Monkey (申) — testing loyalty and gratitude',
      'Bullying: Ox (丑) ↔ Goat (未) ↔ Dog (戌) — power dynamics and stubbornness',
      'Self: Dragon (辰) punishes Dragon — internal conflict with one\'s own ambition',
      'Self: Horse (午) punishes Horse — restless energy turned inward',
      'Self: Rooster (酉) punishes Rooster — perfectionism and self-criticism',
      'Self: Pig (亥) punishes Pig — excess and overindulgence',
    ],
    howItWorks: 'Punishments create scenarios where good intentions go wrong or where helping leads to being blamed. In the "Ungrateful" triangle (Tiger-Snake-Monkey), one party may feel they\'ve sacrificed only to be unappreciated. In "Bullying" combinations, power imbalances and stubbornness create conflict. Self-punishments represent internal struggles where one\'s nature works against oneself — like perfectionism that prevents completion, or ambition that creates isolation.',
    inRelationships: 'Punishment patterns between charts indicate dynamics that easily become entangled in blame, resentment, or power struggles. This doesn\'t mean the relationship is bad — it means both parties must be especially conscious of these tendencies. The testing nature of punishments can actually forge very strong bonds when navigated well; it\'s like metal refined by fire. The key is recognizing when you\'re falling into the pattern and choosing to respond differently.',
    practicalInsight: 'If you\'re in a punishing pattern, ask yourself: "What lesson is this teaching me?" Punishments often reveal where we need to grow — in gratitude, in releasing control, or in self-acceptance. The pattern isn\'t punishing you; it\'s inviting you to evolve.',
    notMean: [
      'Someone is being punished for wrongdoing',
      'The universe is against you',
      'The relationship is karmic debt',
      'You deserve suffering',
    ],
  },
];

export default function RelationshipPatternsScreen() {
  const [selectedPattern, setSelectedPattern] = useState<string>('Combinations');

  const currentPattern = PATTERN_CATEGORIES.find(p => p.name === selectedPattern) || PATTERN_CATEGORIES[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relationship Patterns</Text>
          <Text style={styles.headerSubtitle}>
            Understanding how Earthly Branches interact — combinations, clashes,
            harms, and punishments that shape relationship dynamics.
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>About Relationship Patterns</Text>
          <Text style={styles.introText}>
            In BaZi, the Earthly Branches (the twelve animals) interact with each other in
            predictable patterns. These interactions create dynamics that influence everything
            from personal tendencies to relationship compatibility.
          </Text>
          <Text style={styles.introText}>
            There are four main types of patterns: Combinations (natural affinity), Clashes
            (direct tension), Harms (subtle friction), and Punishments (testing dynamics).
            Each pattern offers insights — none are inherently "good" or "bad."
          </Text>
          <Text style={styles.introHighlight}>
            Remember: Patterns describe energy dynamics, not relationship outcomes. Every
            relationship can thrive with awareness and intention.
          </Text>
        </View>

        {/* Pattern Selector */}
        <View style={styles.selector}>
          {PATTERN_CATEGORIES.map((pattern) => (
            <TouchableOpacity
              key={pattern.name}
              style={[
                styles.selectorButton,
                selectedPattern === pattern.name && styles.selectorButtonActive,
                { borderColor: pattern.color },
              ]}
              onPress={() => setSelectedPattern(pattern.name)}
            >
              <Text style={styles.selectorIcon}>{pattern.icon}</Text>
              <Text style={[
                styles.selectorName,
                selectedPattern === pattern.name && styles.selectorNameActive,
              ]}>
                {pattern.name}
              </Text>
              <Text style={[styles.selectorChinese, { color: pattern.color }]}>
                {pattern.chinese}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pattern Detail */}
        <View style={[styles.detailCard, { borderColor: currentPattern.color }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailIcon}>{currentPattern.icon}</Text>
            <View style={styles.detailHeaderText}>
              <Text style={styles.detailName}>{currentPattern.name}</Text>
              <Text style={[styles.detailChinese, { color: currentPattern.color }]}>
                {currentPattern.chinese} — {currentPattern.nature}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBadge}>
            <Text style={styles.summaryText}>{currentPattern.summary}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>What It Means</Text>
            <Text style={styles.detailText}>{currentPattern.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Examples</Text>
            {currentPattern.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleBullet}>•</Text>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Extended Content */}
        <View style={styles.extendedCard}>
          <Text style={styles.extendedTitle}>Understanding {currentPattern.name}</Text>

          <Text style={styles.extendedSectionTitle}>How It Works</Text>
          <Text style={styles.extendedText}>{currentPattern.howItWorks}</Text>

          <Text style={styles.extendedSectionTitle}>In Relationships</Text>
          <Text style={styles.extendedText}>{currentPattern.inRelationships}</Text>

          <Text style={styles.extendedSectionTitle}>Practical Insight</Text>
          <Text style={styles.extendedText}>{currentPattern.practicalInsight}</Text>
        </View>

        {/* What It Doesn't Mean */}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>{currentPattern.name} Does NOT Mean</Text>
          {currentPattern.notMean.map((item, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningBullet}>✕</Text>
              <Text style={styles.warningText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* How App Uses Patterns */}
        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>How This App Uses Relationship Patterns</Text>
          <Text style={styles.usageText}>
            When you add a family member or partner to this app, we analyze the relationship
            patterns between your charts. Rather than labeling relationships as "compatible"
            or "incompatible," we identify:
          </Text>
          <View style={styles.usageList}>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>🌊</Text>
              <View style={styles.usageItemContent}>
                <Text style={styles.usageItemTitle}>Ease Score</Text>
                <Text style={styles.usageItemText}>
                  How naturally your energies flow together — are there combinations that
                  create instant harmony, or clashes that require navigation?
                </Text>
              </View>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>🏔️</Text>
              <View style={styles.usageItemContent}>
                <Text style={styles.usageItemTitle}>Durability Score</Text>
                <Text style={styles.usageItemText}>
                  The long-term stability of the connection — do the patterns support
                  sustained bonding, or require ongoing conscious effort?
                </Text>
              </View>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>💡</Text>
              <View style={styles.usageItemContent}>
                <Text style={styles.usageItemTitle}>Effort Framing</Text>
                <Text style={styles.usageItemText}>
                  We translate patterns into practical guidance — not "you're incompatible"
                  but "here's where to focus your awareness."
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Key Insight */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>The Key Insight</Text>
          <Text style={styles.insightText}>
            No relationship pattern determines outcome. Combinations don't guarantee success;
            clashes don't guarantee failure. What matters is awareness: knowing where
            connection flows easily and where it requires effort.
          </Text>
          <Text style={styles.insightText}>
            The most successful relationships aren't necessarily the easiest ones — they're
            the ones where both people understand their patterns and choose to grow together.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            BaZi describes patterns and effort. Outcomes depend on personal choices.
            Every relationship can thrive with awareness and intention.
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
  introHighlight: {
    fontSize: 14,
    color: '#5D3A1A',
    lineHeight: 21,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectorButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 2,
  },
  selectorButtonActive: {
    backgroundColor: '#F5E6D3',
  },
  selectorIcon: {
    fontSize: 20,
  },
  selectorName: {
    fontSize: 9,
    color: '#8B7355',
    marginTop: 2,
    textAlign: 'center',
  },
  selectorNameActive: {
    fontWeight: '600',
    color: '#5D3A1A',
  },
  selectorChinese: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  detailChinese: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 13,
    color: '#5D3A1A',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  exampleBullet: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 8,
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
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
  usageCard: {
    backgroundColor: '#F0EDE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4C9B8',
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  usageText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 21,
    marginBottom: 12,
  },
  usageList: {
    marginTop: 8,
  },
  usageItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  usageIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  usageItemContent: {
    flex: 1,
  },
  usageItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 2,
  },
  usageItemText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 10,
  },
  insightText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 8,
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
