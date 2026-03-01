/**
 * Element Balance Chart Component
 * Displays visual breakdown of user's elemental composition from Four Pillars
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { User } from '../types';

// Element colors
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

const ELEMENT_CHINESE: Record<string, string> = {
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

// Heavenly Stems to Element mapping
const STEM_ELEMENTS: Record<string, string> = {
  '甲': 'Wood', '乙': 'Wood',
  '丙': 'Fire', '丁': 'Fire',
  '戊': 'Earth', '己': 'Earth',
  '庚': 'Metal', '辛': 'Metal',
  '壬': 'Water', '癸': 'Water',
};

// Earthly Branches to Element mapping
const BRANCH_ELEMENTS: Record<string, string> = {
  '子': 'Water',
  '丑': 'Earth',
  '寅': 'Wood',
  '卯': 'Wood',
  '辰': 'Earth',
  '巳': 'Fire',
  '午': 'Fire',
  '未': 'Earth',
  '申': 'Metal',
  '酉': 'Metal',
  '戌': 'Earth',
  '亥': 'Water',
};

interface ElementBalanceChartProps {
  user: User;
}

interface ElementCount {
  element: string;
  count: number;
  percentage: number;
}

function calculateElementBalance(user: User): ElementCount[] {
  const counts: Record<string, number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0,
  };

  // Extract elements from all four pillars
  const pillars = [
    user.year_pillar,
    user.month_pillar,
    user.day_pillar,
    user.hour_pillar,
  ];

  pillars.forEach(pillar => {
    if (pillar && pillar.length >= 2) {
      const stem = pillar[0];
      const branch = pillar[1];

      // Count stem element
      if (STEM_ELEMENTS[stem]) {
        counts[STEM_ELEMENTS[stem]]++;
      }

      // Count branch element
      if (BRANCH_ELEMENTS[branch]) {
        counts[BRANCH_ELEMENTS[branch]]++;
      }
    }
  });

  // Total should be 8 (4 stems + 4 branches)
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;

  // Convert to array with percentages
  return ['Wood', 'Fire', 'Earth', 'Metal', 'Water'].map(element => ({
    element,
    count: counts[element],
    percentage: (counts[element] / total) * 100,
  }));
}

function getBalanceDescription(elements: ElementCount[], dayMasterElement: string | null): string {
  const sorted = [...elements].sort((a, b) => b.count - a.count);
  const strongest = sorted[0];
  const weakest = sorted.filter(e => e.count > 0).pop() || sorted[sorted.length - 1];
  const missing = elements.filter(e => e.count === 0);

  let description = '';

  if (strongest.count >= 3) {
    description = `Strong in ${strongest.element}`;
  } else if (sorted[0].count === sorted[1].count) {
    description = `Balanced between ${sorted[0].element} and ${sorted[1].element}`;
  } else {
    description = `${strongest.element} dominant`;
  }

  if (missing.length > 0) {
    description += ` · Missing ${missing.map(e => e.element).join(', ')}`;
  }

  return description;
}

export default function ElementBalanceChart({ user }: ElementBalanceChartProps) {
  const elements = calculateElementBalance(user);
  const maxCount = Math.max(...elements.map(e => e.count), 1);
  const description = getBalanceDescription(elements, user.day_master_element);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Element Balance</Text>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {elements.map(({ element, count, percentage }) => (
          <View key={element} style={styles.barRow}>
            <View style={styles.labelContainer}>
              <Text style={[styles.chineseLabel, { color: ELEMENT_COLORS[element] }]}>
                {ELEMENT_CHINESE[element]}
              </Text>
              <Text style={styles.elementLabel}>{element}</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: ELEMENT_COLORS[element],
                    opacity: count === 0 ? 0.2 : 1,
                  },
                ]}
              />
              {count === 0 && (
                <View style={[styles.bar, styles.emptyBar]} />
              )}
            </View>
            <Text style={styles.countLabel}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>{description}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>
          Based on 8 elements from your Four Pillars (4 Stems + 4 Branches)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelContainer: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chineseLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 6,
  },
  elementLabel: {
    fontSize: 12,
    color: '#5D3A1A',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 10,
    minWidth: 4,
  },
  emptyBar: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#E0E0E0',
    opacity: 0.3,
  },
  countLabel: {
    width: 20,
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    textAlign: 'right',
  },
  summaryContainer: {
    backgroundColor: '#FDF5E6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#5D3A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  legendContainer: {
    alignItems: 'center',
  },
  legendText: {
    fontSize: 11,
    color: '#8B7355',
    fontStyle: 'italic',
  },
});
