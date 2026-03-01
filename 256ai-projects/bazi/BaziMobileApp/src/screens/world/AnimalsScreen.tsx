/**
 * Animals Screen
 * Educational content about the Twelve Animals (Earthly Branches)
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

interface AnimalData {
  branch: string;
  animal: string;
  emoji: string;
  element: string;
  hours: string;
  characteristics: string;
  compatible: string[];
  challenging: string[];
}

const ANIMALS: AnimalData[] = [
  {
    branch: '子',
    animal: 'Rat',
    emoji: '🐀',
    element: 'Water',
    hours: '11pm - 1am',
    characteristics: 'Quick-witted, resourceful, and adaptable. The Rat is clever and knows how to find opportunities where others see obstacles.',
    compatible: ['Dragon', 'Monkey', 'Ox'],
    challenging: ['Horse', 'Rooster'],
  },
  {
    branch: '丑',
    animal: 'Ox',
    emoji: '🐂',
    element: 'Earth',
    hours: '1am - 3am',
    characteristics: 'Diligent, dependable, and determined. The Ox approaches tasks with patience and steady persistence.',
    compatible: ['Snake', 'Rooster', 'Rat'],
    challenging: ['Goat', 'Horse'],
  },
  {
    branch: '寅',
    animal: 'Tiger',
    emoji: '🐅',
    element: 'Wood',
    hours: '3am - 5am',
    characteristics: 'Brave, confident, and competitive. The Tiger has natural leadership qualities and isn\'t afraid to take risks.',
    compatible: ['Horse', 'Dog', 'Pig'],
    challenging: ['Monkey', 'Snake'],
  },
  {
    branch: '卯',
    animal: 'Rabbit',
    emoji: '🐇',
    element: 'Wood',
    hours: '5am - 7am',
    characteristics: 'Elegant, kind, and diplomatic. The Rabbit brings grace to situations and prefers harmony over conflict.',
    compatible: ['Goat', 'Dog', 'Pig'],
    challenging: ['Rooster', 'Dragon'],
  },
  {
    branch: '辰',
    animal: 'Dragon',
    emoji: '🐲',
    element: 'Earth',
    hours: '7am - 9am',
    characteristics: 'Ambitious, energetic, and charismatic. The Dragon is a natural leader with big dreams and the drive to achieve them.',
    compatible: ['Monkey', 'Rat', 'Rooster'],
    challenging: ['Dog', 'Rabbit'],
  },
  {
    branch: '巳',
    animal: 'Snake',
    emoji: '🐍',
    element: 'Fire',
    hours: '9am - 11am',
    characteristics: 'Wise, intuitive, and observant. The Snake sees beneath the surface and often knows more than it reveals.',
    compatible: ['Rooster', 'Ox', 'Monkey'],
    challenging: ['Pig', 'Tiger'],
  },
  {
    branch: '午',
    animal: 'Horse',
    emoji: '🐴',
    element: 'Fire',
    hours: '11am - 1pm',
    characteristics: 'Energetic, free-spirited, and independent. The Horse values freedom and brings enthusiasm to everything it does.',
    compatible: ['Tiger', 'Dog', 'Goat'],
    challenging: ['Rat', 'Ox'],
  },
  {
    branch: '未',
    animal: 'Goat',
    emoji: '🐐',
    element: 'Earth',
    hours: '1pm - 3pm',
    characteristics: 'Gentle, creative, and compassionate. The Goat has a rich inner life and appreciates beauty and harmony.',
    compatible: ['Rabbit', 'Horse', 'Pig'],
    challenging: ['Ox', 'Dog'],
  },
  {
    branch: '申',
    animal: 'Monkey',
    emoji: '🐵',
    element: 'Metal',
    hours: '3pm - 5pm',
    characteristics: 'Clever, curious, and versatile. The Monkey is quick to learn and loves solving puzzles and problems.',
    compatible: ['Dragon', 'Rat', 'Snake'],
    challenging: ['Tiger', 'Pig'],
  },
  {
    branch: '酉',
    animal: 'Rooster',
    emoji: '🐓',
    element: 'Metal',
    hours: '5pm - 7pm',
    characteristics: 'Observant, hardworking, and courageous. The Rooster pays attention to details and takes pride in its work.',
    compatible: ['Ox', 'Snake', 'Dragon'],
    challenging: ['Rabbit', 'Rat'],
  },
  {
    branch: '戌',
    animal: 'Dog',
    emoji: '🐕',
    element: 'Earth',
    hours: '7pm - 9pm',
    characteristics: 'Loyal, honest, and protective. The Dog values fairness and will stand up for those it cares about.',
    compatible: ['Tiger', 'Rabbit', 'Horse'],
    challenging: ['Dragon', 'Goat'],
  },
  {
    branch: '亥',
    animal: 'Pig',
    emoji: '🐷',
    element: 'Water',
    hours: '9pm - 11pm',
    characteristics: 'Generous, trusting, and sincere. The Pig approaches life with optimism and genuine warmth.',
    compatible: ['Tiger', 'Rabbit', 'Goat'],
    challenging: ['Snake', 'Monkey'],
  },
];

export default function AnimalsScreen() {
  const [selectedAnimal, setSelectedAnimal] = useState<string>('Rat');

  const currentAnimal = ANIMALS.find(a => a.animal === selectedAnimal) || ANIMALS[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>The Twelve Animals</Text>
          <Text style={styles.headerSubtitle}>
            The Earthly Branches (地支) and their zodiac correspondences.
          </Text>
        </View>

        {/* Animal Selector Grid */}
        <View style={styles.selectorGrid}>
          {ANIMALS.map((animal) => (
            <TouchableOpacity
              key={animal.animal}
              style={[
                styles.selectorButton,
                selectedAnimal === animal.animal && styles.selectorButtonActive,
              ]}
              onPress={() => setSelectedAnimal(animal.animal)}
            >
              <Text style={styles.selectorEmoji}>{animal.emoji}</Text>
              <Text style={[
                styles.selectorName,
                selectedAnimal === animal.animal && styles.selectorNameActive,
              ]}>
                {animal.animal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Animal Detail */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailEmoji}>{currentAnimal.emoji}</Text>
            <View>
              <Text style={styles.detailName}>{currentAnimal.animal}</Text>
              <Text style={styles.detailBranch}>{currentAnimal.branch}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailRowItem}>
              <Text style={styles.detailLabel}>Element</Text>
              <Text style={styles.detailValue}>{currentAnimal.element}</Text>
            </View>
            <View style={styles.detailRowItem}>
              <Text style={styles.detailLabel}>Hours</Text>
              <Text style={styles.detailValue}>{currentAnimal.hours}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Characteristics</Text>
            <Text style={styles.detailText}>{currentAnimal.characteristics}</Text>
          </View>

          <View style={styles.compatibilitySection}>
            <View style={styles.compatibilityItem}>
              <Text style={styles.compatibilityLabel}>Harmonious with</Text>
              <Text style={styles.compatibilityValue}>
                {currentAnimal.compatible.join(', ')}
              </Text>
            </View>
            <View style={styles.compatibilityItem}>
              <Text style={styles.compatibilityLabel}>Requires more effort with</Text>
              <Text style={styles.compatibilityValue}>
                {currentAnimal.challenging.join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Animal compatibility describes general tendencies between energies.
            Every relationship can work with awareness and intention.
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
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectorButton: {
    width: '23%',
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  selectorButtonActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  selectorEmoji: {
    fontSize: 24,
  },
  selectorName: {
    fontSize: 10,
    color: '#8B7355',
    marginTop: 4,
  },
  selectorNameActive: {
    color: '#FDF5E6',
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  detailBranch: {
    fontSize: 18,
    color: '#8B7355',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
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
  detailValue: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  compatibilitySection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 14,
  },
  compatibilityItem: {
    marginBottom: 10,
  },
  compatibilityLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 2,
  },
  compatibilityValue: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
