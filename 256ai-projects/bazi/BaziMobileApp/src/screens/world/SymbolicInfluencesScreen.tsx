/**
 * Symbolic Influences Screen
 * Comprehensive educational content about special stars and symbolic patterns in BaZi
 * Encyclopedia-style verbose content - educational overview, not calculation feature
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

interface InfluenceCategory {
  name: string;
  chinese: string;
  icon: string;
  color: string;
  nature: string;
  summary: string;
  description: string;
  examples: { name: string; chinese: string; meaning: string }[];
  howToUnderstand: string;
  inPractice: string;
  cautions: string[];
}

const INFLUENCE_CATEGORIES: InfluenceCategory[] = [
  {
    name: 'Nobleman Stars',
    chinese: '貴人',
    icon: '👑',
    color: '#DAA520',
    nature: 'Helpful Influences & Support',
    summary: 'Patterns indicating natural sources of help and support',
    description: 'Nobleman Stars (貴人, Guìrén) are among the most welcomed influences in BaZi. They represent the potential for receiving help from others — mentors, benefactors, or timely assistance when needed. Having Nobleman Stars in your chart suggests that you naturally attract supportive people or find help available during challenging times. However, these are tendencies, not guarantees. The Nobleman influence works best when you also put in genuine effort and maintain good character.',
    examples: [
      { name: 'Heavenly Nobleman', chinese: '天乙貴人', meaning: 'The primary nobleman — indicates ability to attract powerful support and guidance when needed. People with this star often find doors opening through connections.' },
      { name: 'Moon Virtue', chinese: '月德貴人', meaning: 'Associated with maternal energy and emotional support. Suggests receiving help through nurturing relationships and emotional intelligence.' },
      { name: 'Heaven Virtue', chinese: '天德貴人', meaning: 'Connected to moral character and ethical standing. Indicates that help comes through maintaining integrity and good reputation.' },
      { name: 'Literary Star', chinese: '文昌', meaning: 'Associated with academic and creative pursuits. Suggests talent and support in learning, writing, or artistic endeavors.' },
    ],
    howToUnderstand: 'Nobleman Stars should be understood as latent potential rather than automatic benefits. Think of them like having good soil for a garden — the potential for growth is enhanced, but you still need to plant seeds and tend to them. Someone with strong Nobleman influences may find that opportunities appear more readily, but they must still recognize and act on those opportunities. The presence of these stars suggests where to look for support, not that support will arrive without effort.',
    inPractice: 'When Nobleman Stars are activated (by annual or luck period timing), people often report serendipitous meetings, unexpected assistance, or finding the right mentor at the right time. This doesn\'t mean sitting back and waiting — it means being open to help when it appears and being willing to ask for assistance. People with these influences often benefit from networking and relationship-building more than the average person.',
    cautions: [
      'Nobleman Stars don\'t guarantee success or eliminate all obstacles',
      'They indicate potential support, not entitlement to help',
      'Over-reliance on "luck" can lead to passivity',
      'These stars work through genuine human connection, not magic',
      'Having these stars doesn\'t make you superior to those without them',
    ],
  },
  {
    name: 'Peach Blossom',
    chinese: '桃花',
    icon: '🌸',
    color: '#FF69B4',
    nature: 'Charm & Attraction',
    summary: 'Patterns relating to personal charm, attraction, and social appeal',
    description: 'The Peach Blossom (桃花, Táohuā) is perhaps the most sensationalized star in popular BaZi culture. It relates to personal attractiveness, charisma, and romantic appeal. However, its meaning is far more nuanced than simply "love life." Peach Blossom indicates a magnetic quality that draws others — this can manifest romantically, but also socially and professionally. The energy can be used for building relationships, networking, sales, public relations, or any field requiring personal appeal.',
    examples: [
      { name: 'Inner Peach Blossom', chinese: '日支桃花', meaning: 'Found in the Day Branch — relates to the spouse position. Indicates attractiveness and charm in intimate relationships, both giving and receiving.' },
      { name: 'Outer Peach Blossom', chinese: '年支桃花', meaning: 'Found in the Year Branch — relates to external/social appeal. Indicates charisma in public settings and ability to attract social attention.' },
      { name: 'Rolling Peach Blossom', chinese: '滾桃花', meaning: 'Multiple peach blossom formations — intensifies the attractive quality. Requires more awareness to channel constructively.' },
      { name: 'Wall Peach Blossom', chinese: '牆外桃花', meaning: 'Peach blossom appearing outside one\'s chart (in luck periods) — suggests attractions that appear externally rather than emanating from self.' },
    ],
    howToUnderstand: 'Peach Blossom is essentially charisma and attractiveness as an energetic quality. It\'s neither good nor bad — it\'s a tool that can be used constructively or destructively. Someone with strong Peach Blossom might become a successful entertainer, a beloved public figure, an effective salesperson, or... someone who attracts complications through romantic entanglements. The star itself is neutral; the outcome depends on awareness and choices.',
    inPractice: 'Those with Peach Blossom influences often find social situations easier to navigate. They may naturally draw attention in groups or find others seeking their company. The key is channeling this energy intentionally. In careers, this star supports roles requiring public appeal: entertainment, marketing, hospitality, counseling, or any people-facing profession. In relationships, it suggests natural attractiveness but also the responsibility to set clear boundaries.',
    cautions: [
      'Peach Blossom is not a judgment on morality or fidelity',
      'It doesn\'t predict affairs or relationship problems',
      'The "romantic" interpretation is often overblown in popular astrology',
      'This energy can serve professional success as much as personal life',
      'Having this star doesn\'t mean you can\'t have stable relationships',
    ],
  },
  {
    name: 'Academic Stars',
    chinese: '文星',
    icon: '📚',
    color: '#4169E1',
    nature: 'Intelligence & Learning',
    summary: 'Patterns relating to intellectual capacity, learning, and wisdom',
    description: 'Academic Stars (文星, Wén Xīng) represent intellectual gifts, learning ability, and the capacity for deep thought. These influences are particularly valued in traditional Chinese culture, which emphasizes scholarly achievement. However, modern interpretation should understand these as indicating thinking style rather than fixed IQ. Someone with strong Academic Stars may excel in formal education, but might also express this energy through self-study, creative thinking, strategic planning, or any field requiring deep analysis.',
    examples: [
      { name: 'Literary Star', chinese: '文昌', meaning: 'The primary academic star — indicates natural affinity for learning, especially written and verbal expression. Supports academic pursuits and creative writing.' },
      { name: 'Academic Hall', chinese: '學堂', meaning: 'Suggests love of learning environments and formal education. Those with this star often thrive in structured learning settings.' },
      { name: 'Elegant Seal', chinese: '華蓋', meaning: 'Indicates introspective, philosophical thinking. Often found in charts of researchers, philosophers, and those who work with complex ideas.' },
      { name: 'Word Star', chinese: '詞館', meaning: 'Specifically relates to literary and poetic talent. Indicates ability with language, rhetoric, and eloquent expression.' },
    ],
    howToUnderstand: 'Academic Stars indicate how someone naturally approaches learning and thinking, not their predetermined intelligence level. A person with strong Academic Stars might find traditional education comes easily, but someone without them might excel through practical application or creative approaches instead. These stars suggest natural aptitude, but knowledge still requires effort to acquire. Think of it as having good "hardware" for intellectual tasks — the "software" (actual knowledge) still needs to be loaded.',
    inPractice: 'Those with Academic Stars often benefit from formal education, structured learning, and intellectual environments. They may find themselves naturally drawn to books, research, or academic discussions. In careers, this supports roles requiring analytical thinking, writing, teaching, research, or strategic planning. These stars are especially relevant during educational years but continue to influence how one approaches problem-solving throughout life.',
    cautions: [
      'Academic Stars don\'t guarantee academic success — effort is still required',
      'Absence of these stars doesn\'t indicate low intelligence',
      'Many forms of intelligence exist beyond what these stars measure',
      'Practical wisdom and emotional intelligence are equally valuable',
      'Over-identifying with intellectual ability can create imbalance',
    ],
  },
  {
    name: 'Authority Stars',
    chinese: '權星',
    icon: '⚔️',
    color: '#8B0000',
    nature: 'Power & Leadership',
    summary: 'Patterns relating to authority, decisiveness, and commanding presence',
    description: 'Authority Stars (權星, Quán Xīng) represent leadership qualities, decisiveness, and the capacity to command respect. These influences indicate a natural tendency toward positions of power or responsibility. However, "authority" in BaZi isn\'t about domination — it\'s about the ability to make decisions, take responsibility, and influence outcomes. These stars can manifest as executive leadership, military service, law enforcement, management, or simply being the person others turn to when decisions need to be made.',
    examples: [
      { name: 'General Star', chinese: '將星', meaning: 'The primary leadership star — indicates natural command presence and ability to lead others. Often found in charts of leaders, managers, and those in positions of authority.' },
      { name: 'Military Command', chinese: '天將', meaning: 'Relates to decisive action and courage under pressure. Suggests ability to handle crisis situations and make difficult decisions.' },
      { name: 'Power Seal', chinese: '正印', meaning: 'Authority through legitimacy and proper channels. Indicates respect for structure and ability to work within hierarchies while advancing.' },
      { name: 'Aggressive Authority', chinese: '七殺', meaning: 'A more aggressive form of authority. Indicates reformer energy — the ability to break old structures and create new ones.' },
    ],
    howToUnderstand: 'Authority Stars indicate natural inclination toward taking charge, but they don\'t guarantee leadership positions. Someone with these influences may feel frustrated in roles without autonomy, or may naturally find themselves taking responsibility even when not officially in charge. The key is understanding that authority comes with responsibility — these stars are about serving through leadership, not ruling over others.',
    inPractice: 'Those with Authority Stars often gravitate toward careers with clear hierarchies or positions of responsibility: military, law enforcement, executive management, politics, or entrepreneurship. Even in flatter organizational structures, they may naturally become team leaders or decision-makers. The challenge is learning to use authority wisely — heavy-handed application alienates others, while too little assertion fails to leverage natural strengths.',
    cautions: [
      'Authority Stars don\'t entitle anyone to power or respect',
      'Leadership must be earned through character and competence',
      'These stars can manifest as stubbornness if not balanced',
      'True authority includes listening and empowering others',
      'Having these stars without self-awareness can create conflict',
    ],
  },
];

export default function SymbolicInfluencesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Nobleman Stars');

  const currentCategory = INFLUENCE_CATEGORIES.find(c => c.name === selectedCategory) || INFLUENCE_CATEGORIES[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Symbolic Influences</Text>
          <Text style={styles.headerSubtitle}>
            Special stars and patterns in BaZi that color your chart with
            additional nuances, tendencies, and potentials.
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>About Symbolic Influences</Text>
          <Text style={styles.introText}>
            Beyond the basic elements and branches, BaZi charts contain what are called
            "symbolic stars" (神煞, Shén Shà) — special patterns that add layers of meaning.
            These influences have accumulated through centuries of observation and serve as
            interpretive shortcuts for understanding chart nuances.
          </Text>
          <Text style={styles.introText}>
            In this app, we refer to these as "Symbolic Influences" rather than using the
            traditional term, which can carry superstitious connotations. These patterns
            describe tendencies and potentials — they are not fixed predictions or moral
            judgments.
          </Text>
          <Text style={styles.introHighlight}>
            Important: These influences require nuanced interpretation. A single star never
            tells the whole story — context from the full chart always matters.
          </Text>
        </View>

        {/* Category Selector */}
        <View style={styles.selector}>
          {INFLUENCE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.selectorButton,
                selectedCategory === category.name && styles.selectorButtonActive,
                { borderColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={styles.selectorIcon}>{category.icon}</Text>
              <Text style={[
                styles.selectorName,
                selectedCategory === category.name && styles.selectorNameActive,
              ]}>
                {category.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Detail */}
        <View style={[styles.detailCard, { borderColor: currentCategory.color }]}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailIcon}>{currentCategory.icon}</Text>
            <View style={styles.detailHeaderText}>
              <Text style={styles.detailName}>{currentCategory.name}</Text>
              <Text style={[styles.detailChinese, { color: currentCategory.color }]}>
                {currentCategory.chinese} — {currentCategory.nature}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBadge}>
            <Text style={styles.summaryText}>{currentCategory.summary}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>What These Influences Mean</Text>
            <Text style={styles.detailText}>{currentCategory.description}</Text>
          </View>
        </View>

        {/* Examples */}
        <View style={styles.examplesCard}>
          <Text style={styles.examplesTitle}>Common {currentCategory.name}</Text>
          {currentCategory.examples.map((example, index) => (
            <View key={index} style={styles.exampleItem}>
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleName}>{example.name}</Text>
                <Text style={[styles.exampleChinese, { color: currentCategory.color }]}>
                  {example.chinese}
                </Text>
              </View>
              <Text style={styles.exampleMeaning}>{example.meaning}</Text>
            </View>
          ))}
        </View>

        {/* Extended Content */}
        <View style={styles.extendedCard}>
          <Text style={styles.extendedTitle}>Understanding {currentCategory.name}</Text>

          <Text style={styles.extendedSectionTitle}>How to Interpret</Text>
          <Text style={styles.extendedText}>{currentCategory.howToUnderstand}</Text>

          <Text style={styles.extendedSectionTitle}>In Daily Life</Text>
          <Text style={styles.extendedText}>{currentCategory.inPractice}</Text>
        </View>

        {/* Cautions */}
        <View style={styles.cautionCard}>
          <Text style={styles.cautionTitle}>Important Cautions</Text>
          {currentCategory.cautions.map((caution, index) => (
            <View key={index} style={styles.cautionItem}>
              <Text style={styles.cautionBullet}>!</Text>
              <Text style={styles.cautionText}>{caution}</Text>
            </View>
          ))}
        </View>

        {/* General Principles */}
        <View style={styles.principlesCard}>
          <Text style={styles.principlesTitle}>General Principles for Symbolic Influences</Text>

          <View style={styles.principleItem}>
            <Text style={styles.principleNumber}>1</Text>
            <View style={styles.principleContent}>
              <Text style={styles.principleHeader}>Context is Everything</Text>
              <Text style={styles.principleText}>
                A single star means little in isolation. The full chart context — including
                elements, branches, and their interactions — determines how any influence
                actually manifests.
              </Text>
            </View>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleNumber}>2</Text>
            <View style={styles.principleContent}>
              <Text style={styles.principleHeader}>Potential, Not Certainty</Text>
              <Text style={styles.principleText}>
                These influences describe tendencies and potentials, not fixed outcomes.
                Whether a potential manifests depends on personal choices, circumstances,
                and how other chart factors interact.
              </Text>
            </View>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleNumber}>3</Text>
            <View style={styles.principleContent}>
              <Text style={styles.principleHeader}>Neither Good Nor Bad</Text>
              <Text style={styles.principleText}>
                Even "auspicious" stars can manifest problematically if misused, and
                "challenging" stars often drive growth and achievement. The quality of
                manifestation depends on awareness and cultivation.
              </Text>
            </View>
          </View>

          <View style={styles.principleItem}>
            <Text style={styles.principleNumber}>4</Text>
            <View style={styles.principleContent}>
              <Text style={styles.principleHeader}>Timing Matters</Text>
              <Text style={styles.principleText}>
                Symbolic influences are activated or suppressed by timing — annual energies,
                luck periods, and life phases all affect which influences are prominent at
                any given time.
              </Text>
            </View>
          </View>
        </View>

        {/* Why We Include This */}
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why This App Discusses Symbolic Influences</Text>
          <Text style={styles.whyText}>
            Traditional BaZi includes hundreds of symbolic stars, many with dramatic names
            that can cause unnecessary anxiety. We include this educational overview to:
          </Text>
          <View style={styles.whyList}>
            <Text style={styles.whyItem}>• Demystify concepts you may encounter elsewhere</Text>
            <Text style={styles.whyItem}>• Provide balanced, non-alarmist information</Text>
            <Text style={styles.whyItem}>• Explain how these influences inform (but don't determine) readings</Text>
            <Text style={styles.whyItem}>• Emphasize that awareness and choice always matter most</Text>
          </View>
          <Text style={styles.whyNote}>
            We deliberately do not calculate or display individual stars in your chart,
            as this often causes more confusion than clarity. Instead, our readings integrate
            these influences naturally into the overall interpretation.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            BaZi describes patterns and effort. Outcomes depend on personal choices.
            Symbolic influences are interpretive tools, not deterministic predictions.
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
    paddingHorizontal: 8,
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
    fontSize: 9,
    color: '#8B7355',
    marginTop: 4,
    textAlign: 'center',
  },
  selectorNameActive: {
    fontWeight: '600',
    color: '#5D3A1A',
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
    marginBottom: 8,
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
  examplesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  exampleItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  exampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exampleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  exampleChinese: {
    fontSize: 12,
    fontWeight: '500',
  },
  exampleMeaning: {
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
  cautionCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5C9A8',
  },
  cautionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 12,
  },
  cautionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cautionBullet: {
    fontSize: 12,
    color: '#DAA520',
    marginRight: 10,
    fontWeight: 'bold',
    width: 16,
    textAlign: 'center',
  },
  cautionText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
  principlesCard: {
    backgroundColor: '#F0EDE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4C9B8',
  },
  principlesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  principleItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  principleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B4513',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    marginTop: 2,
  },
  principleContent: {
    flex: 1,
  },
  principleHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 4,
  },
  principleText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
  },
  whyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  whyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 10,
  },
  whyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 21,
    marginBottom: 10,
  },
  whyList: {
    marginBottom: 10,
  },
  whyItem: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 22,
    marginLeft: 8,
  },
  whyNote: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 8,
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
