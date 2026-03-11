import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface StatItem {
  label: string;
  value: number | string;
  color?: string;
}

interface Props {
  stats: StatItem[];
}

export default function StatsRow({ stats }: Props) {
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <View key={i} style={styles.stat}>
          <Text style={[styles.value, stat.color ? { color: stat.color } : undefined]}>
            {stat.value}
          </Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  value: { fontSize: 24, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, color: colors.textLight, marginTop: 2 },
});
