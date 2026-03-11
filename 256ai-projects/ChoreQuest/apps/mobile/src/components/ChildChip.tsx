import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Child } from '../types';
import { colors, spacing } from '../theme';

interface Props {
  child: Child;
  onPress?: () => void;
}

export default function ChildChip({ child, onPress }: Props) {
  const avatarColor = child.avatarColor || colors.primary;
  const initial = child.displayName.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{child.displayName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
});
