/**
 * Lucky Hours Chart Component
 * Shows favorable hours extracted from reading content
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { extractLuckyHours } from '../utils/translateChinese';

interface LuckyHoursChartProps {
  content: string;
}

export function LuckyHoursChart({ content }: LuckyHoursChartProps) {
  const luckyHours = extractLuckyHours(content);

  if (luckyHours.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Lucky Hours Today</Text>
      <View style={styles.hoursGrid}>
        {luckyHours.map((hour, index) => (
          <View key={index} style={styles.hourItem}>
            <Text style={styles.animal}>{hour.animal}</Text>
            <Text style={styles.chinese}>{hour.chinese}</Text>
            <Text style={styles.time}>{hour.time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D3A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  hourItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: 75,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  animal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
  },
  chinese: {
    fontSize: 18,
    color: '#5D3A1A',
    marginVertical: 2,
  },
  time: {
    fontSize: 11,
    color: '#8B7355',
  },
});
