/**
 * BaZi Intelligence Card Component
 * Displays cognitive style interpretation based on Day Master
 *
 * BaZi Intelligence describes how a person naturally thinks, processes
 * information, reacts under stress, and makes decisions.
 *
 * It is NOT: IQ, personality tests, body type analysis, or ability scoring
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDayMasterIntelligence } from '../data/dayMasterIntelligence';

interface BaZiIntelligenceCardProps {
  dayMaster: string;
}

export default function BaZiIntelligenceCard({ dayMaster }: BaZiIntelligenceCardProps) {
  const intelligence = getDayMasterIntelligence(dayMaster);

  if (!intelligence) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>
          BaZi Intelligence analysis requires your Day Master to be calculated.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Thinking Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thinking Style</Text>
        <Text style={styles.sectionContent}>{intelligence.thinkingStyle}</Text>
      </View>

      {/* Decision Rhythm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Decision Rhythm</Text>
        <Text style={styles.sectionContent}>{intelligence.decisionRhythm}</Text>
      </View>

      {/* Stress Response */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Under Pressure</Text>
        <Text style={styles.sectionContent}>{intelligence.stressResponse}</Text>
      </View>

      {/* Processing Tendencies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How You Process</Text>
        <Text style={styles.sectionContent}>{intelligence.processingTendencies}</Text>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          These patterns describe tendencies, not fixed traits. You always have
          the choice to respond differently based on context and growth.
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
  placeholder: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
