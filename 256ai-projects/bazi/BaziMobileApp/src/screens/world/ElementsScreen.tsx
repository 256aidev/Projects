/**
 * Elements Screen
 * Educational content about the Five Elements (Wu Xing)
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

interface ElementData {
  name: string;
  chinese: string;
  color: string;
  season: string;
  direction: string;
  organs: string;
  emotion: string;
  characteristics: string;
  generates: string;
  controls: string;
}

const ELEMENTS: ElementData[] = [
  {
    name: 'Wood',
    chinese: '木',
    color: '#228B22',
    season: 'Spring',
    direction: 'East',
    organs: 'Liver, Gallbladder',
    emotion: 'Anger (when imbalanced)',
    characteristics: 'Growth, flexibility, creativity, ambition. Like a tree reaching upward, Wood energy is about expansion and new beginnings.',
    generates: 'Fire (Wood fuels Fire)',
    controls: 'Earth (Wood roots break through Earth)',
  },
  {
    name: 'Fire',
    chinese: '火',
    color: '#DC143C',
    season: 'Summer',
    direction: 'South',
    organs: 'Heart, Small Intestine',
    emotion: 'Joy (when balanced)',
    characteristics: 'Warmth, passion, enthusiasm, transformation. Fire energy illuminates and transforms, bringing energy and vitality.',
    generates: 'Earth (Fire creates ash, which becomes Earth)',
    controls: 'Metal (Fire melts Metal)',
  },
  {
    name: 'Earth',
    chinese: '土',
    color: '#DAA520',
    season: 'Late Summer / Transition',
    direction: 'Center',
    organs: 'Spleen, Stomach',
    emotion: 'Worry (when imbalanced)',
    characteristics: 'Stability, nourishment, grounding, trust. Earth energy provides the stable foundation from which all other elements operate.',
    generates: 'Metal (Earth contains and produces Metal)',
    controls: 'Water (Earth contains and channels Water)',
  },
  {
    name: 'Metal',
    chinese: '金',
    color: '#C0C0C0',
    season: 'Autumn',
    direction: 'West',
    organs: 'Lungs, Large Intestine',
    emotion: 'Grief (when imbalanced)',
    characteristics: 'Precision, refinement, letting go, structure. Metal energy brings clarity, boundaries, and the wisdom to release what no longer serves.',
    generates: 'Water (Metal condensation produces Water)',
    controls: 'Wood (Metal cuts Wood)',
  },
  {
    name: 'Water',
    chinese: '水',
    color: '#4169E1',
    season: 'Winter',
    direction: 'North',
    organs: 'Kidneys, Bladder',
    emotion: 'Fear (when imbalanced)',
    characteristics: 'Depth, wisdom, adaptability, stillness. Water energy flows around obstacles and finds the path of least resistance.',
    generates: 'Wood (Water nourishes Wood)',
    controls: 'Fire (Water extinguishes Fire)',
  },
];

export default function ElementsScreen() {
  const [selectedElement, setSelectedElement] = useState<string>('Wood');

  const currentElement = ELEMENTS.find(e => e.name === selectedElement) || ELEMENTS[0];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>The Five Elements</Text>
          <Text style={styles.headerSubtitle}>
            Wu Xing (五行) — the five phases that form the foundation of Chinese metaphysics.
          </Text>
        </View>

        {/* Element Selector */}
        <View style={styles.selector}>
          {ELEMENTS.map((element) => (
            <TouchableOpacity
              key={element.name}
              style={[
                styles.selectorButton,
                selectedElement === element.name && styles.selectorButtonActive,
                { borderColor: element.color },
              ]}
              onPress={() => setSelectedElement(element.name)}
            >
              <Text style={[styles.selectorChinese, { color: element.color }]}>
                {element.chinese}
              </Text>
              <Text style={[
                styles.selectorName,
                selectedElement === element.name && styles.selectorNameActive,
              ]}>
                {element.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Element Detail */}
        <View style={[styles.detailCard, { borderColor: currentElement.color }]}>
          <View style={styles.detailHeader}>
            <Text style={[styles.detailChinese, { color: currentElement.color }]}>
              {currentElement.chinese}
            </Text>
            <Text style={styles.detailName}>{currentElement.name}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Characteristics</Text>
            <Text style={styles.detailText}>{currentElement.characteristics}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailRowItem}>
              <Text style={styles.detailLabel}>Season</Text>
              <Text style={styles.detailValue}>{currentElement.season}</Text>
            </View>
            <View style={styles.detailRowItem}>
              <Text style={styles.detailLabel}>Direction</Text>
              <Text style={styles.detailValue}>{currentElement.direction}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Associated Organs</Text>
            <Text style={styles.detailText}>{currentElement.organs}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Emotional Tendency</Text>
            <Text style={styles.detailText}>{currentElement.emotion}</Text>
          </View>

          <View style={styles.cycleSection}>
            <Text style={styles.cycleTitle}>Element Cycles</Text>
            <View style={styles.cycleRow}>
              <View style={styles.cycleItem}>
                <Text style={styles.cycleLabel}>Generates</Text>
                <Text style={styles.cycleValue}>{currentElement.generates}</Text>
              </View>
              <View style={styles.cycleItem}>
                <Text style={styles.cycleLabel}>Controls</Text>
                <Text style={styles.cycleValue}>{currentElement.controls}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cycle Explanation */}
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>Understanding the Cycles</Text>
          <Text style={styles.explanationText}>
            <Text style={styles.explanationBold}>Generating Cycle: </Text>
            Each element naturally supports and creates the next. Wood feeds Fire, Fire creates Earth (ash), Earth produces Metal, Metal generates Water (condensation), Water nourishes Wood.
          </Text>
          <Text style={styles.explanationText}>
            <Text style={styles.explanationBold}>Controlling Cycle: </Text>
            Each element also has the power to regulate another. Wood parts Earth, Earth contains Water, Water extinguishes Fire, Fire melts Metal, Metal cuts Wood.
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
  selectorChinese: {
    fontSize: 24,
    fontWeight: 'bold',
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
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailChinese: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  detailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5D3A1A',
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 16,
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
  detailText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 14,
    color: '#5D3A1A',
    fontWeight: '500',
  },
  cycleSection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  cycleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  cycleRow: {
    flexDirection: 'row',
  },
  cycleItem: {
    flex: 1,
  },
  cycleLabel: {
    fontSize: 11,
    color: '#8B7355',
    marginBottom: 2,
  },
  cycleValue: {
    fontSize: 13,
    color: '#333333',
  },
  explanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 10,
  },
  explanationBold: {
    fontWeight: '600',
    color: '#5D3A1A',
  },
});
